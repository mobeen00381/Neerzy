'use client';

import { useState, useEffect, use } from 'react';

export default function CopyPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/post-data/${id}`);
        if (!res.ok) throw new Error('Post not found');
        const data = await res.json();
        setPostText(data.text);
      } catch (err) {
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for mobile browsers
      const textarea = document.createElement('textarea');
      textarea.value = postText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 18 }}>❌ {error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📋</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Your Google Post</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, margin: '4px 0 0' }}>Tap the button below to copy</p>
        </div>

        {/* Post text preview */}
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e2e8f0', 
          borderRadius: 16, 
          padding: 20, 
          marginBottom: 16,
          whiteSpace: 'pre-wrap',
          fontSize: 14,
          lineHeight: 1.6,
          color: '#334155',
          fontWeight: 500
        }}>
          {postText}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '18px 0',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: copied ? '#16a34a' : '#0f766e',
            color: '#fff',
            boxShadow: copied ? '0 4px 14px rgba(22,163,74,0.3)' : '0 4px 14px rgba(15,118,110,0.3)',
          }}
        >
          {copied ? '✅ Copied! Paste it in Google Business Profile' : '📋 Copy Post'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 16 }}>
          Powered by Neerzy
        </p>
      </div>
    </div>
  );
}
