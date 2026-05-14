'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Shield, AlertCircle, CheckCircle2, 
  ArrowRight, Loader2, Star, MapPin, Globe, Phone,
  Camera, MessageSquare, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GMBChecker() {
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Please log in to use this feature.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/gmb/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          address,
          userId
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      alert(err.message || "Failed to check GMB listing");
    } finally {
      setLoading(false);
    }
  };

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleWhatsAppAction = async (action: string) => {
    setActionLoading(action);
    try {
      const res = await fetch('/api/whatsapp/send-gmb-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: result.placeId,
          action,
          // For demo, we use the business phone if available, or a placeholder
          phoneNumber: result.phone || "+1234567890" 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Success! WhatsApp message sent to ${data.sentTo}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert(err.message || "Failed to send WhatsApp message");
    } finally {
      setActionLoading(null);
    }
  };

  if (result?.success) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">GMB Health Report</h1>
            <p className="text-slate-500 font-medium">Real-time visibility analysis for your Google Business Profile.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setResult(null)}
            className="rounded-2xl border-slate-200"
          >
            Check another business
          </Button>
        </div>

        {/* Score Hero Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Shield size={180} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <Gauge className="text-blue-600 h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Visibility Health</p>
                  <h2 className="text-3xl font-black text-slate-900">Health Score</h2>
                </div>
              </div>

              <div className="flex items-end gap-2 mb-8">
                <span className={`text-8xl font-black tracking-tighter ${result.healthScore >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
                  {result.healthScore}
                </span>
                <span className="text-3xl font-bold text-slate-300 mb-4">/100</span>
              </div>

              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${result.healthScore >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${result.healthScore}%` }}
                />
              </div>

              <p className="text-slate-600 font-medium leading-relaxed max-w-md italic">
                {result.healthScore >= 80 
                  ? "Your profile is in excellent shape! Regular posting will maintain this visibility." 
                  : "Your profile has critical gaps. Fixing these missing items will significantly improve your local ranking."}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/10 h-full flex flex-col justify-between">
              <div>
                <Star className="text-yellow-400 h-10 w-10 mb-6" fill="currentColor" />
                <h3 className="text-2xl font-bold mb-2">Customer Trust</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-4xl font-black">{result.rating || 'N/A'}</span>
                  <div className="text-xs text-slate-400 uppercase font-black tracking-tighter">
                    Rating based on<br/>{result.reviewCount || 0} reviews
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium">
                Higher ratings and review counts trigger the Google Map Pack algorithm.
              </p>
            </div>
          </div>
        </div>

        {/* Audit Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Missing Items */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-lg shadow-slate-100/50">
            <div className="flex items-center gap-3 mb-8">
              <AlertCircle className="text-orange-500 h-6 w-6" />
              <h3 className="text-xl font-black text-slate-900">Optimization Required</h3>
            </div>

            {result.missingItems.length > 0 ? (
              <div className="space-y-4">
                {result.missingItems.map((item: string) => (
                  <div key={item} className="flex items-center gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <div className="bg-orange-100 p-2 rounded-xl">
                      {item === 'photos' && <Camera className="h-4 w-4 text-orange-600" />}
                      {item === 'website' && <Globe className="h-4 w-4 text-orange-600" />}
                      {item === 'phone' && <Phone className="h-4 w-4 text-orange-600" />}
                      {item === 'reviews' && <Star className="h-4 w-4 text-orange-600" />}
                      {item === 'address' && <MapPin className="h-4 w-4 text-orange-600" />}
                    </div>
                    <span className="font-bold text-orange-700 capitalize">Missing {item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="font-bold text-slate-900">All Core Fields Found!</p>
                <p className="text-slate-500 text-sm">Your technical setup is solid.</p>
              </div>
            )}
          </div>

          {/* Action Hub */}
          <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Search className="h-6 w-6" />
                <h3 className="text-xl font-black">AI Recommendations</h3>
              </div>
              <p className="text-blue-100 font-medium mb-8">
                {result.nextSteps === 'generate_post' 
                  ? "Your profile is ready for scaling. Start generating AI-powered local posts to dominate your neighborhood."
                  : "We recommend optimizing your basic info first. However, starting with reviews can jumpstart your trust score."}
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => handleWhatsAppAction('generate_post')}
                disabled={!!actionLoading}
                className="w-full bg-white text-blue-600 hover:bg-blue-50 h-14 rounded-2xl font-black text-lg group shadow-lg disabled:opacity-50"
              >
                {actionLoading === 'generate_post' ? <Loader2 className="animate-spin" /> : (
                  <>Generate AI Post <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
              <Button 
                onClick={() => handleWhatsAppAction('send_review')}
                disabled={!!actionLoading}
                className="w-full bg-blue-700 text-white hover:bg-blue-800 h-14 rounded-2xl font-black text-lg group border-none disabled:opacity-50"
              >
                {actionLoading === 'send_review' ? <Loader2 className="animate-spin" /> : (
                  <>Send Review Request <MessageSquare className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex p-4 bg-blue-100 rounded-3xl mb-6">
          <Shield className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">GBP Health Audit</h1>
        <p className="text-xl text-slate-500 font-medium">Instantly analyze any Google Business Profile in seconds.</p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-10 md:p-16 border border-slate-100 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
        
        <form onSubmit={handleCheck} className="relative z-10 space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="e.g. Acme Plumbing London"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-xl text-slate-900 placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Location Address (Optional)</label>
            <div className="relative group">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Street name or city to improve accuracy"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-lg text-slate-900 placeholder:text-slate-300"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !businessName}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-20 text-2xl rounded-3xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin h-8 w-8" />
                <span>Auditing Google...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span>Run Health Check</span>
                <ArrowRight />
              </div>
            )}
          </Button>
          
          <div className="pt-4 flex items-center justify-center gap-8 opacity-40">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <Shield size={12} /> Secure Audit
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <Star size={12} fill="currentColor" /> Real-time Data
            </div>
          </div>
        </form>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Review Count", desc: "Checks for minimum trust threshold of 5 reviews." },
          { title: "Media Audit", desc: "Analyzes photo presence for listing engagement." },
          { title: "Contact Data", desc: "Ensures website and phone are clickable and active." }
        ].map((item, i) => (
          <div key={i} className="text-center space-y-2 opacity-50">
            <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">{item.title}</h4>
            <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
