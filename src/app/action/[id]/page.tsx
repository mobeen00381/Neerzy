'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Image as ImageIcon,
  ArrowRight,
  Smartphone,
  CheckCircle,
  Loader2
} from "lucide-react";

export default function ActionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [gbpLink, setGbpLink] = useState('https://business.google.com/');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // First try pending_posts
      const { data: postData, error: postErr } = await supabase
        .from('pending_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (postData && !postErr) {
        setData({
          ...postData,
          google_post: postData.google_post || '',
          images: postData.images || []
        });

        if (postData.user_phone) {
          const { data: business } = await supabase
            .from('business_profiles')
            .select('business_name, google_place_id')
            .eq('user_phone', postData.user_phone)
            .maybeSingle();

          if (business) {
            if (business.business_name) {
              setGbpLink(`https://www.google.com/search?q=${encodeURIComponent(business.business_name)}`);
            } else if (business.google_place_id) {
              setGbpLink(`https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`);
            }
          }
        }
        return;
      }

      // Try jobs table
      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select('*, users(*)')
        .eq('id', id)
        .maybeSingle();

      if (jobData && !jobErr) {
        setData({
          ...jobData,
          customer_name: jobData.customer_name,
          google_post: [jobData.title, '', jobData.content, '', Array.isArray(jobData.hashtags) ? jobData.hashtags.join(' ') : ''].filter(Boolean).join('\n'),
          images: jobData.media_urls || []
        });

        const userPhone = jobData.users?.whatsapp_phone;
        if (userPhone) {
          const { data: business } = await supabase
            .from('business_profiles')
            .select('business_name, google_place_id')
            .eq('user_phone', userPhone)
            .maybeSingle();

          if (business) {
            if (business.business_name) {
              setGbpLink(`https://www.google.com/search?q=${encodeURIComponent(business.business_name)}`);
            } else if (business.google_place_id) {
              setGbpLink(`https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load post data:', err);
    }
  };

  const handleCopy = () => {
    if (!data?.google_post) return;
    navigator.clipboard.writeText(data.google_post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      setDownloading(url);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `neerzy_image_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
    } finally {
      setDownloading(null);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
        <p className="font-bold text-slate-500 animate-pulse">Loading campaign details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Background blobs for premium glassmorphic effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#25D366] to-[#0F5C4D] text-white shadow-md shadow-[#25D366]/20 mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Publish Google Post</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            Campaign for {data.customer_name || 'Customer'}
          </p>
        </div>

        {/* Step 1: Copy Post Text */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
            <span>1️⃣ Copy Post Content</span>
            {copied && <span className="text-[#25D366] font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied!</span>}
          </div>
          <div className="relative group">
            <div className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium text-slate-600 border border-slate-100/80 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {data.google_post || 'Post content is being prepared...'}
            </div>
            <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-emerald-500/10 pointer-events-none transition-colors" />
          </div>
          <button 
            onClick={handleCopy} 
            className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide shadow-sm flex items-center justify-center gap-2 transition-all duration-300 ${
              copied 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.01]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 animate-bounce" />
                <span>COPIED TO CLIPBOARD</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>COPY TEXT</span>
              </>
            )}
          </button>
        </div>

        {/* Step 2: Save Images */}
        {data.images && Array.isArray(data.images) && data.images.length > 0 && (
          <div className="space-y-2.5 mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              2️⃣ Save Job Images ({data.images.length})
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {data.images.map((url: string, i: number) => (
                <div key={i} className="relative flex-shrink-0 group w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                  <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={`Job ${i + 1}`} />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button 
                    onClick={() => handleDownload(url, i)}
                    disabled={downloading === url}
                    className="absolute bottom-1.5 right-1.5 bg-white/95 text-slate-800 p-1.5 rounded-xl border border-slate-100 hover:scale-115 active:scale-95 shadow-lg transition-all flex items-center justify-center"
                    title="Download image"
                  >
                    {downloading === url ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#25D366]" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Open Google Business Profile */}
        <div className="space-y-3.5">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            3️⃣ Publish on Google
          </p>
          <a 
            href={gbpLink} 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.01] transition-all"
          >
            <span>OPEN GOOGLE BUSINESS</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-slate-700 leading-snug">What to do next:</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-relaxed">
                Paste the copied text, upload the saved images on Google, and click "Post". 
                Once published, return to WhatsApp and reply <strong className="text-slate-900 font-extrabold">"DONE"</strong> to send Mike his review request!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
