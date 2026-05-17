'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowLeft,
  Crown,
  Smartphone,
  Cpu
} from 'lucide-react';

function AuditResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get('placeId') || '';
  const name = searchParams.get('name') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditData, setAuditData] = useState<any>(null);

  useEffect(() => {
    if (!placeId) {
      setError('Missing place selection. Please try searching again.');
      setLoading(false);
      return;
    }

    const fetchAudit = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/audit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            placeId,
            businessName: name
          })
        });
        
        if (res.ok) {
          const audit = await res.json();
          setAuditData(audit);
        } else {
          setError('Failed to calculate audit metrics. Please try again.');
        }
      } catch (err) {
        console.error('Audit run failed:', err);
        setError('Connection error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [placeId, name]);

  const handleGetStarted = () => {
    router.push('/pricing?utm_source=audit-tool&utm_medium=cta');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] flex items-center justify-center p-6">
        <div className="text-center animate-in fade-in duration-200">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-xl border border-slate-100 mb-6">
            <Loader2 className="animate-spin h-10 w-10 text-[#25D366]" />
          </div>
          <p className="text-slate-900 font-black text-xl tracking-tight">Analyzing Profile...</p>
          <p className="text-slate-500 font-medium text-sm mt-1">Collecting local listing and SEO ranking signals for "{name}"</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] flex items-center justify-center p-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-red-50 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">Analysis Blocked</h2>
          <p className="text-sm font-semibold text-slate-500">{error}</p>
          <button
            onClick={() => router.push('/gmb-audit-tool')}
            className="w-full bg-[#0F5C4D] hover:bg-[#073a30] text-white font-black py-4 rounded-xl shadow-lg transition"
          >
            Go Back & Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] py-16 px-6 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        {/* Back Link */}
        <button
          onClick={() => router.push('/gmb-audit-tool')}
          className="font-bold text-[#0F5C4D] hover:text-[#073a30] transition flex items-center gap-2 outline-none select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Search another business</span>
        </button>

        {auditData && (
          <AuditReport 
            audit={auditData} 
            business={{ name }}
            onGetStarted={handleGetStarted}
          />
        )}

      </div>
    </div>
  );
}

// Audit Report Component
function AuditReport({ audit, business, onGetStarted }: { 
  audit: any; 
  business: any;
  onGetStarted: () => void;
}) {
  const overallScore = Math.round(
    (audit.completeness.score * 0.25 +
     audit.visualContent.score * 0.20 +
     audit.reviews.score * 0.25 +
     audit.engagement.score * 0.15 +
     audit.seo.score * 0.15)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#25D366]';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBgCircle = (score: number) => {
    if (score >= 80) return 'border-[#25D366]';
    if (score >= 60) return 'border-amber-500';
    return 'border-rose-500';
  };

  return (
    <div className="space-y-8">
      {/* Overall Score Card */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-50/10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[80px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
            {business.displayName?.text || business.name}
          </h2>
          
          <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full border-[10px] bg-slate-50/50 shadow-inner mb-6 mt-4 ${getScoreBgCircle(overallScore)} transition-all duration-700`}>
            <div className="text-center">
              <div className={`text-5xl font-black tracking-tighter ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">out of 100</div>
            </div>
          </div>
          
          <div className="text-xl font-bold text-slate-800">
            {overallScore >= 80 ? (
              <span className="flex items-center justify-center gap-2">
                <span>🎉</span>
                <span>Great profile! Strong Local SEO footprint.</span>
              </span>
            ) : overallScore >= 60 ? (
              <span className="flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>Good profile, but can improve details.</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🚨</span>
                <span>Needs attention. Critical local visibility issues found.</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Issues Found ("What's Holding You Back") */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-50/10">
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <Crown className="w-6 h-6 text-yellow-500" />
          <span>What's Holding You Back</span>
        </h3>
        <div className="space-y-4">
          {audit.recommendations && audit.recommendations.length > 0 ? (
            audit.recommendations.slice(0, 4).map((rec: any, idx: number) => (
              <div key={idx} className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-100/50 transition-all">
                <span className="text-3xl shrink-0 p-2 bg-white rounded-xl shadow-sm leading-none">{rec.icon}</span>
                <div>
                  <div className="font-bold text-slate-900 text-lg leading-snug">{rec.title}</div>
                  <div className="text-sm font-medium text-slate-500 mt-1">{rec.description}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500 font-semibold">
              No major issues found! Your business profile is in excellent shape.
            </div>
          )}
        </div>
      </div>

      {/* CTA Upgrade Panel */}
      <div className="bg-gradient-to-br from-[#0F5C4D] via-[#073a30] to-[#041e19] rounded-[2.5rem] shadow-2xl p-12 text-center text-white relative overflow-hidden">
        {/* Visual accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -left-[10%] w-[45%] h-[45%] bg-[#25D366]/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-[30%] -right-[10%] w-[45%] h-[45%] bg-teal-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <div className="space-y-3">
            <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Fix This with Neerzy
            </h3>
            <p className="text-lg font-medium text-slate-200/90 leading-relaxed max-w-xl mx-auto">
              Send a job photo on WhatsApp → Get Google Posts, website updates & review requests in minutes
            </p>
          </div>
          
          {/* Your Pricing Preview Blocks */}
          <div className="grid md:grid-cols-3 gap-6 text-left pt-4">
            
            {/* Free Plan Block */}
            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 backdrop-blur-sm transition-all hover:bg-white/15">
              <div className="font-bold text-slate-300 uppercase tracking-widest text-xs">Free</div>
              <div className="text-3xl font-black mt-2 text-white">$0</div>
              <div className="text-sm font-semibold text-slate-200 mt-3 opacity-90">5 posts to try</div>
            </div>

            {/* Pro Plan Block (Highlighted) */}
            <div className="bg-white/20 border-2 border-[#25D366] rounded-2xl p-6 shadow-xl relative backdrop-blur-md transition-all hover:bg-white/25 transform md:scale-105">
              <div className="absolute -top-3 right-4 bg-[#25D366] text-black font-black uppercase text-[9px] px-2.5 py-1 rounded-full tracking-wider shadow-md">
                Popular ⭐
              </div>
              <div className="font-bold text-[#25D366] uppercase tracking-widest text-xs">Pro</div>
              <div className="text-3xl font-black mt-2 text-white">$39<span className="text-sm font-bold opacity-80">/mo</span></div>
              <div className="text-sm font-bold text-white mt-3">25 posts/month</div>
            </div>

            {/* Growth Plan Block */}
            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 backdrop-blur-sm transition-all hover:bg-white/15">
              <div className="font-bold text-slate-300 uppercase tracking-widest text-xs">Growth</div>
              <div className="text-3xl font-black mt-2 text-white">$79<span className="text-sm font-bold opacity-80">/mo</span></div>
              <div className="text-sm font-semibold text-slate-200 mt-3 opacity-90">60 posts/month</div>
            </div>

          </div>
          
          <div className="pt-4 space-y-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebd59] text-black font-black text-lg px-12 py-5 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] outline-none"
            >
              Start Free Trial →
            </button>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-50/10">
        <h3 className="text-2xl font-black text-slate-900 mb-10 text-center">
          How Neerzy Fixes Your Profile
        </h3>
        <div className="grid md:grid-cols-3 gap-8 text-center relative">
          
          {/* Step 1 */}
          <div className="space-y-4 relative group">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center shadow-sm group-hover:bg-[#25D366]/10 transition-colors">
              <Smartphone className="w-8 h-8 text-[#25D366]" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">1. Send Photo</h4>
            <p className="text-sm font-semibold text-slate-500">WhatsApp a job photo</p>
          </div>

          {/* Step 2 */}
          <div className="space-y-4 relative group">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center shadow-sm group-hover:bg-[#25D366]/10 transition-colors">
              <Cpu className="w-8 h-8 text-[#25D366]" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">2. AI Creates Content</h4>
            <p className="text-sm font-semibold text-slate-500">Google Posts + Website + Reviews</p>
          </div>

          {/* Step 3 */}
          <div className="space-y-4 relative group">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center shadow-sm group-hover:bg-[#25D366]/10 transition-colors">
              <CheckCircle2 className="w-8 h-8 text-[#25D366]" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">3. Publish in 60s</h4>
            <p className="text-sm font-semibold text-slate-500">No complex dashboards needed</p>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function GBMAuditResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#25D366]" />
      </div>
    }>
      <AuditResultsContent />
    </Suspense>
  );
}

// Custom Helper Pin Icon
function MapPinIcon(props: any) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
