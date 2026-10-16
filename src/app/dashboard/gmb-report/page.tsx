'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Shield, AlertCircle, CheckCircle2, 
  ArrowRight, Loader2, Star, MapPin, Globe, Phone,
  Camera, MessageSquare, Gauge, Search, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const placeId = searchParams.get('placeId');
  const businessName = searchParams.get('name');
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // null = still checking the session; false = logged out, so the actions stay locked.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [generated, setGenerated] = useState<{ action: string; text: string } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (placeId) {
        try {
          const res = await fetch('/api/gmb/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              placeId, 
              businessName,
              userId: session?.user?.id 
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

  const handleAction = async (action: 'generate_post' | 'send_review') => {
    setActionLoading(action);
    setNotice(null);
    setGenerated(null);
    setCopied(false);
    try {
      // The route authenticates on this Supabase session token; without one the
      // request is a 401 (and the buttons below are already locked).
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoggedIn(false);
        setNotice({ kind: 'info', text: 'Log in to use this.' });
        return;
      }

      const res = await fetch('/api/whatsapp/send-gmb-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        // No phoneNumber: the recipient is the number saved on the account, and
        // WhatsApp delivery is an optional extra.
        body: JSON.stringify({ placeId, action })
      });
      const data = await res.json().catch(() => null);

      // The generated text is always returned — show it even when WhatsApp is
      // not set up, so accounts with no phone number still get the feature.
      if (data?.generatedMessage) {
        setGenerated({ action, text: data.generatedMessage });
      }

      if (!res.ok) {
        setNotice({
          kind: res.status === 400 ? 'info' : 'error',
          text: data?.message || data?.error || 'Could not generate that right now — please try again.'
        });
        return;
      }

      setNotice({ kind: 'success', text: data?.message || 'Done.' });
    } catch {
      setNotice({ kind: 'error', text: 'Could not generate that right now — please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice({ kind: 'error', text: 'Copy failed — select the text and copy it manually.' });
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
        <p className="text-slate-500 mb-8">{"We couldn't generate the audit for this business."}</p>
        <Button onClick={() => router.push('/gmb-audit-tool')}>Try again</Button>
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
          onClick={() => router.push('/gmb-audit-tool')}
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
            {isLoggedIn === false ? (
              <div className="bg-blue-50/10 border border-white/20 rounded-2xl p-5 text-center space-y-4">
                <p className="text-blue-50 font-bold text-sm leading-relaxed">
                  Log in to use this — generating posts and review requests is saved to your account.
                </p>
                <Link href="/login" className="block">
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 h-12 rounded-2xl font-black text-base">
                    Log in
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Button 
                  onClick={() => handleAction('generate_post')}
                  disabled={!!actionLoading || isLoggedIn === null}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 h-14 rounded-2xl font-black text-lg group shadow-lg disabled:opacity-50"
                >
                  {actionLoading === 'generate_post' ? <Loader2 className="animate-spin" /> : (
                    <>Generate AI Post <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
                <Button 
                  onClick={() => handleAction('send_review')}
                  disabled={!!actionLoading || isLoggedIn === null}
                  className="w-full bg-blue-700 text-white hover:bg-blue-800 h-14 rounded-2xl font-black text-lg group border-none disabled:opacity-50 shadow-inner"
                >
                  {actionLoading === 'send_review' ? <Loader2 className="animate-spin" /> : (
                    <>Send Review Request <MessageSquare className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </>
            )}

            {notice && (
              <div className={`text-sm font-bold p-4 rounded-2xl flex items-center gap-2 ${
                notice.kind === 'error'
                  ? 'bg-red-500/20 text-red-50'
                  : notice.kind === 'success'
                    ? 'bg-green-500/20 text-green-50'
                    : 'bg-white/10 text-blue-50'
              }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                {notice.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {generated && (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-lg shadow-slate-100/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {generated.action === 'generate_post'
                ? <Search className="h-6 w-6 text-blue-600" />
                : <MessageSquare className="h-6 w-6 text-blue-600" />}
              <h3 className="text-xl font-black text-slate-900">
                {generated.action === 'generate_post' ? 'Your Google Post' : 'Your Review Request'}
              </h3>
            </div>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="rounded-2xl border-slate-300 text-slate-700 font-black"
            >
              {copied ? 'Copied!' : (<><Copy className="mr-2 h-4 w-4" /> Copy</>)}
            </Button>
          </div>
          <p className="text-sm font-bold text-slate-500 mb-4">
            Copy this into Google, or add your WhatsApp number in Account settings to have it sent to you.
          </p>
          <pre className="whitespace-pre-wrap font-sans text-slate-700 font-semibold leading-relaxed bg-slate-50 rounded-2xl p-6 border border-slate-100">
            {generated.text}
          </pre>
        </div>
      )}
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
