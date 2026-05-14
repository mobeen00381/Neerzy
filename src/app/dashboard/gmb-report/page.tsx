'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Shield, AlertCircle, CheckCircle2, 
  ArrowRight, Loader2, Star, MapPin, Globe, Phone,
  Camera, MessageSquare, Gauge, Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const placeId = searchParams.get('placeId');
  const businessName = searchParams.get('name');
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      if (placeId) {
        try {
          const res = await fetch('/api/gmb/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              placeId, 
              businessName,
              userId: user?.id 
            })
          });
          const data = await res.json();
          setResult(data);
        } catch (err) {
          console.error("Report fetch failed:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, [placeId, businessName]);

  const handleWhatsAppAction = async (action: string) => {
    setActionLoading(action);
    try {
      const res = await fetch('/api/whatsapp/send-gmb-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          action,
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-xl font-black text-slate-400 animate-pulse uppercase tracking-widest">Generating Audit...</p>
      </div>
    );
  }

  if (!result || !result.success) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-900 mb-2">Report Failed</h2>
        <p className="text-slate-500 mb-8">We couldn't generate the audit for this business.</p>
        <Button onClick={() => router.push('/dashboard/gmb-checker')}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {result.gmb_business_name || businessName}
          </h1>
          <p className="text-slate-600 font-bold flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4 text-blue-600" /> {result.gmb_address || "Location Analysis"}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/gmb-checker')}
          className="rounded-2xl border-slate-300 text-slate-700 font-black"
        >
          Check another
        </Button>
      </div>

      {/* Score Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Shield size={180} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-2xl">
                <Gauge className="text-blue-600 h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Visibility Health</p>
                <h2 className="text-3xl font-black text-slate-900">Health Score</h2>
              </div>
            </div>

            <div className="flex items-end gap-2 mb-8">
              <span className={`text-8xl font-black tracking-tighter ${result.healthScore >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
                {result.healthScore}
              </span>
              <span className="text-3xl font-bold text-slate-400 mb-4">/100</span>
            </div>

            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${result.healthScore >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${result.healthScore}%` }}
              />
            </div>

            <p className="text-slate-700 font-bold leading-relaxed max-w-md italic">
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
                <div className="text-xs text-slate-300 uppercase font-black tracking-tighter">
                  Rating based on<br/>{result.reviewCount || 0} reviews
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-sm font-medium">
              Higher ratings and review counts trigger the Google Map Pack algorithm.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-lg shadow-slate-100/50">
          <div className="flex items-center gap-3 mb-8">
            <AlertCircle className="text-orange-600 h-6 w-6" />
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
                  <span className="font-black text-orange-800 capitalize">Missing {item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="font-bold text-slate-900">All Core Fields Found!</p>
              <p className="text-slate-600 text-sm font-bold">Your technical setup is solid.</p>
            </div>
          )}
        </div>

        <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Search className="h-6 w-6" />
              <h3 className="text-xl font-black">AI Recommendations</h3>
            </div>
            <p className="text-blue-50 font-bold mb-8 leading-relaxed">
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
              className="w-full bg-blue-700 text-white hover:bg-blue-800 h-14 rounded-2xl font-black text-lg group border-none disabled:opacity-50 shadow-inner"
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

export default function GMBReportPage() {
  return (
    <Suspense fallback={<div>Loading Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}
