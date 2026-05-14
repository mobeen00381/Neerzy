'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { 
  Search, Shield, AlertCircle, CheckCircle2, 
  ArrowRight, Loader2, Star, MapPin, Globe, Phone,
  Camera, Gauge, Check
} from 'lucide-react';

export default function CheckerPage() {
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gmb/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Business not found. Try adding a city name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-24 overflow-hidden bg-gradient-to-br from-[#0F5C4D] via-[#073a30] to-black">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#25D366] opacity-[0.05] rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>

        <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
          
          <div className="animate-in fade-in slide-in-from-top-8 duration-1000">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight">
              Audit Any Business on <span className="text-[#25D366]">Google Maps</span>
            </h1>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium">
              Free instant local visibility report. Find gaps in your profile and dominate the Map Pack.
            </p>
          </div>

          {!result ? (
            <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 text-left mb-12 max-w-3xl mx-auto border border-white/10 animate-in zoom-in-95 duration-700">
              <form onSubmit={handleCheck} className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-50 p-2 rounded-xl">
                    <Search className="text-blue-600 h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Find Business Profile</h3>
                </div>

                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Plumbing London"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-6 pr-6 py-5 rounded-3xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/5 outline-none transition-all text-xl font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                    required
                  />
                  {loading && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-6 w-6 text-[#25D366] animate-spin" />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 font-bold bg-red-50 p-4 rounded-2xl animate-in shake duration-500">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                  </div>
                )}

                <Button 
                  type="submit"
                  disabled={loading || !businessName}
                  className="w-full bg-[#25D366] hover:bg-[#1da851] text-slate-900 h-20 rounded-3xl font-black text-2xl shadow-xl shadow-[#25D366]/20 transition-all hover:scale-[1.02] active:scale-95 border-none disabled:opacity-50"
                >
                  {loading ? 'Analyzing Google Data...' : 'Check Visibility Now'}
                </Button>

                <p className="text-center text-slate-400 text-sm font-medium italic">
                  Instant analysis of photos, website, phone, and review health.
                </p>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] shadow-2xl p-10 text-left mb-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-50 pb-8">
                <div>
                  <div className="flex items-center gap-2 text-[#25D366] font-black text-xs uppercase tracking-[0.3em] mb-2">
                    <CheckCircle2 className="h-4 w-4" /> Audit Complete
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                    Health Report Results
                  </h2>
                </div>
                <div className="flex flex-col items-center bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-xl">
                  <span className="text-4xl font-black">{result.healthScore}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Score</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${result.healthScore >= 80 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      <Gauge className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">Visibility Status</h4>
                      <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                        {result.healthScore >= 80 ? 'Excellent Coverage' : 'Critical Gaps Found'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Audit Details</h4>
                    <div className="space-y-4">
                      {['photos', 'website', 'phone', 'reviews', 'address'].map(item => {
                        const isMissing = result.missingItems.includes(item);
                        return (
                          <div key={item} className="flex items-center justify-between">
                            <span className="capitalize font-bold text-slate-700">{item}</span>
                            {isMissing ? (
                              <span className="text-red-500 text-xs font-black uppercase tracking-tighter bg-red-50 px-3 py-1 rounded-full">Missing</span>
                            ) : (
                              <CheckCircle2 className="text-green-500 h-5 w-5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-[#25D366] rounded-3xl p-10 text-slate-900 flex flex-col justify-between shadow-2xl shadow-[#25D366]/20">
                  <div>
                    <h4 className="text-2xl font-black mb-4">Dominating Google Maps?</h4>
                    <p className="font-bold opacity-80 leading-relaxed mb-8">
                      Your score is {result.healthScore}/100. Our AI-driven WhatsApp platform can help you close these gaps and start generating 5-star reviews today.
                    </p>
                  </div>
                  <Link href="/onboarding">
                    <Button className="w-full bg-slate-900 text-white hover:bg-black h-16 rounded-2xl font-black text-lg border-none">
                      Fix This Listing Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <button 
                onClick={() => setResult(null)}
                className="mt-10 w-full text-center text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                ← Audit another business
              </button>
            </div>
          )}

          {/* Value Tags */}
          {!result && (
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
               {['No Credit Card Required', 'Takes < 10 Seconds', 'Free Instant Report'].map((tag, i) => (
                 <div key={i} className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                   <Check className="text-[#25D366] h-4 w-4" /> {tag}
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        {!result && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
             <div className="w-px h-8 bg-white rounded-full"></div>
          </div>
        )}
      </section>

      {/* FOOTER PADDING */}
      <div className="bg-white py-20 text-center">
         <p className="text-slate-400 text-xs italic">
           Neerzy is an independent platform and is not affiliated with Google or WhatsApp.
         </p>
      </div>
    </div>
  );
}
