'use client';

import { useState, useEffect, use } from 'react';

// Strip everything except digits and a leading "+", and normalize a "00"
// international dialing prefix to "+" for reliable sms: links.
function normalizePhone(raw: string): string {
  let cleaned = (raw || '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  return cleaned;
}

export default function SmsFallbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [smsText, setSmsText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSmsFallback() {
      try {
        console.log(`Fetching SMS fallback data for ID: ${id}`);
        const res = await fetch(`/api/sms-fallback/${id}`);
        if (!res.ok) {
          throw new Error('Request not found');
        }
        const data = await res.json();
        setSmsText(data.smsText || '');
        setCustomerName(data.customerName || '');
        setCustomerPhone(data.customerPhone || '');
      } catch (err) {
        console.error('Error loading SMS fallback:', err);
        setError('Could not load this request');
      } finally {
        setLoading(false);
      }
    }
    loadSmsFallback();
  }, [id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(smsText);
    } catch {
      // Fallback for browsers / in-app webviews without clipboard API access.
      const textarea = document.createElement('textarea');
      textarea.value = smsText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading...</p>
      </div>
    );
  }

  if (error || !smsText) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 18 }}>❌ {error || 'Could not load this request'}</p>
      </div>
    );
  }

  const phone = normalizePhone(customerPhone);
  const encodedText = encodeURIComponent(smsText);
  // iOS uses "&" as the sms: separator; Android and others use "?".
  const isApple = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const smsHref = phone ? `sms:${phone}${isApple ? '&' : '?'}body=${encodedText}` : '';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📱</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Send Review Request by SMS</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, margin: '4px 0 0' }}>
            {customerName ? `For ${customerName}` : 'Tap a button below'}
          </p>
        </div>

        {/* SMS text preview */}
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
          {smsText}
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
            marginBottom: 12,
            display: 'block'
          }}
        >
          {copied ? '✅ Copied! Now paste it in your SMS app' : '📋 Copy text'}
        </button>

        {/* Send via SMS Button */}
        {smsHref ? (
          <a
            href={smsHref}
            style={{
              width: '100%',
              padding: '18px 0',
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#22c55e',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              boxSizing: 'border-box'
            }}
          >
            💬 Send via SMS
          </a>
        ) : null}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 16 }}>
          Powered by Neerzy
        </p>
      </div>
    </div>
  );
}