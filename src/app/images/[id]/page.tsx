'use client';

import { useState, useEffect, use } from 'react';

export default function DownloadImagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch(`/api/post-data/${id}`);
        if (!res.ok) throw new Error('Post not found');
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        setError('Images not found');
      } finally {
        setLoading(false);
      }
    }
    loadImages();
  }, [id]);


  const handleDownload = async (url: string, index: number) => {
    try {
      const res = await fetch(`/api/download-image?url=${encodeURIComponent(url)}&name=neerzy-photo-${index + 1}.jpg`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `neerzy-photo-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setDownloaded(prev => new Set(prev).add(index));
    } catch {
      // Fallback: open in new tab
      window.open(`/api/download-image?url=${encodeURIComponent(url)}&name=neerzy-photo-${index + 1}.jpg`, '_blank');
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < images.length; i++) {
      await handleDownload(images[i], i);
      // Small delay between downloads for mobile
      await new Promise(r => setTimeout(r, 500));
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading...</p>
      </div>
    );
  }

  if (error || images.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 18 }}>❌ {error || 'No images found'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🖼️</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Download Photos</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, margin: '4px 0 0' }}>{images.length} photo{images.length > 1 ? 's' : ''} ready</p>
        </div>

        {/* Download All Button */}
        {images.length > 1 && (
          <button
            onClick={handleDownloadAll}
            style={{
              width: '100%',
              padding: '16px 0',
              border: 'none',
              borderRadius: 16,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              background: '#2563eb',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              marginBottom: 16,
            }}
          >
            💾 Download All {images.length} Photos
          </button>
        )}

        {/* Image cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {images.map((url, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              {/* Image preview */}
              <div style={{ width: '100%', height: 200, background: '#f1f5f9', position: 'relative' }}>
                <img 
                  src={url.includes('graph.facebook.com') ? `/api/download-image?url=${encodeURIComponent(url)}&name=neerzy-photo-${i + 1}.jpg` : url} 
                  alt={`Photo ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  crossOrigin="anonymous"
                />
              </div>
              
              {/* Download button */}
              <button
                onClick={() => handleDownload(url, i)}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  border: 'none',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: downloaded.has(i) ? '#dcfce7' : '#fff',
                  color: downloaded.has(i) ? '#16a34a' : '#2563eb',
                }}
              >
                {downloaded.has(i) ? '✅ Saved!' : `💾 Save Photo ${i + 1}`}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 16 }}>
          Powered by Neerzy
        </p>
      </div>
    </div>
  );
}
