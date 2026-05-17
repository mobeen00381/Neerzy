'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  MessageSquare, 
  Camera, 
  FileText, 
  Search,
  Zap,
  Loader2,
  ChevronRight,
  MapPin,
  Star
} from 'lucide-react';

export default function AuditResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)]">
        <Loader2 className="w-16 h-16 text-[#25D366] animate-spin mb-4" />
        <div className="text-xl font-bold text-[#0F5C4D] animate-pulse">Loading your audit...</div>
      </div>
    }>
      <AuditContent />
    </Suspense>
  );
}

function AuditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get('placeId');
  const businessName = searchParams.get('name');

  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingPhase, setLoadingPhase] = useState(0);

  const phases = [
    'Connecting to Google Business Profile API...',
    'Scanning profile completeness & meta info...',
    'Analyzing visual content and photo counts...',
    'Parsing customer reviews & sentiment ratios...',
    'Evaluating organic SEO and local search rankings...'
  ];

  // Dynamic phase animator for premium UX
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingPhase((prev) => (prev + 1) % phases.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!placeId) {
      router.push('/gmb-audit-tool');
      return;
    }

    const runAudit = async () => {
      try {
        const res = await fetch('/api/audit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            placeId, 
            businessName: businessName || 'Business' 
          })
        });
        
        if (!res.ok) throw new Error('Audit failed');
        
        const data = await res.json();
        setAuditData(data);
      } catch (err) {
        setError('Failed to generate your audit. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    runAudit();
  }, [placeId, businessName, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-emerald-100 border-t-[#25D366] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#0F5C4D] animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[#0F5C4D] mb-3">
          Analyzing {businessName || 'your business'}...
        </h2>
        <div className="bg-white px-6 py-3 rounded-full border border-emerald-100 shadow-sm max-w-md">
          <p className="text-[#4F635F] font-semibold text-sm animate-pulse">
            ⚡ {phases[loadingPhase]}
          </p>
        </div>
        <p className="text-slate-400 font-bold text-xs mt-6 uppercase tracking-wider">
          Retrieving real-time Google Maps insights
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-2xl max-w-md border border-red-50">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 text-3xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Audit Failed</h2>
          <p className="text-slate-500 font-semibold mb-6">{error}</p>
          <button 
            onClick={() => router.push('/gmb-audit-tool')} 
            className="w-full bg-[#0F5C4D] hover:bg-[#073a30] text-white py-4 rounded-xl font-bold transition-all shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <AuditReportView data={auditData} businessName={businessName} />;
}

function AuditReportView({ data, businessName }: any) {
  const router = useRouter();

  // Robust score aggregator: Summing the category actual scores to match 100 points maximum
  const completenessScore = data?.completeness?.actualScore || 0;
  const visualContentScore = data?.visualContent?.actualScore || 0;
  const reviewsScore = data?.reviews?.actualScore || 0;
  const engagementScore = data?.engagement?.actualScore || 0;
  const seoScore = data?.seo?.actualScore || 0;

  const score = data?.overallScore || (completenessScore + visualContentScore + reviewsScore + engagementScore + seoScore) || 0;
  
  const getScoreTheme = (val: number) => {
    if (val >= 80) return {
      text: '🎉 Excellent! Your profile is strong.',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-100',
      ringColor: 'border-emerald-500 bg-emerald-50 text-emerald-600',
      gradient: 'from-emerald-500 to-teal-500'
    };
    if (val >= 50) return {
      text: '⚠️ Good start, but needs optimization.',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-100',
      ringColor: 'border-amber-500 bg-amber-50 text-amber-600',
      gradient: 'from-amber-500 to-orange-500'
    };
    return {
      text: "🚨 Critical issues found. Let's fix them.",
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50 border-rose-100',
      ringColor: 'border-rose-500 bg-rose-50 text-rose-600',
      gradient: 'from-rose-500 to-red-500'
    };
  };

  const theme = getScoreTheme(score);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] py-16 px-4 md:px-8 relative overflow-hidden font-sans">
      {/* Background visual helpers */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[50%] -right-[10%] w-[35%] h-[35%] bg-teal-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation / Back Button */}
        <button 
          onClick={() => router.push('/gmb-audit-tool')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-[#0F5C4D] transition-all font-bold text-sm bg-white/80 border border-slate-100 px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </button>

        {/* 🏆 Header Score Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="bg-slate-50 border border-slate-100 text-slate-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              GBP Audit Live
            </span>
          </div>

          {/* Business Profile Photo */}
          {data?.photoUrl ? (
            <div className="mx-auto mb-6 w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-emerald-100 shadow-lg">
              <img 
                src={data.photoUrl} 
                alt={businessName || 'Business'}
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full bg-emerald-50 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0F5C4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>';
                }}
              />
            </div>
          ) : (
            <div className="mx-auto mb-6 w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-emerald-50 border-4 border-emerald-100 shadow-lg flex items-center justify-center">
              <Building2 className="w-12 h-12 md:w-16 md:h-16 text-[#0F5C4D]" />
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-black text-[#0F5C4D] mb-2 leading-tight">
            {businessName}
          </h1>

          {/* Address & Rating Meta */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
            {data?.businessAddress && (
              <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold text-sm">
                <MapPin className="w-3.5 h-3.5" />
                {data.businessAddress}
              </span>
            )}
            {data?.businessRating > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-sm bg-amber-50 border border-amber-100/50 px-2.5 py-0.5 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {data.businessRating} ({data.businessReviewCount || 0} reviews)
              </span>
            )}
          </div>

          <p className="text-slate-400 font-semibold text-sm mb-8 uppercase tracking-widest">
            Google Business Profile Audit Report
          </p>
          
          <div className="flex justify-center mb-6">
            <div className={`relative w-44 h-44 rounded-full flex items-center justify-center border-8 p-3 shadow-inner ${theme.ringColor}`}>
              <div className="text-center">
                <span className="text-6xl font-black block tracking-tighter">{score}</span>
                <span className="text-xs font-black uppercase tracking-wider opacity-60">/ 100 Score</span>
              </div>
            </div>
          </div>
          
          <div className={`inline-block px-6 py-2.5 rounded-full border text-lg font-black ${theme.bgColor} ${theme.textColor}`}>
            {theme.text}
          </div>
        </div>

        {/* 📊 Detailed Category Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <ScoreCard 
            title="Completeness" 
            score={completenessScore} 
            max={25} 
            icon={<Building2 className="w-5 h-5 text-indigo-500" />} 
            checks={data?.completeness?.checks} 
          />
          <ScoreCard 
            title="Visual Content" 
            score={visualContentScore} 
            max={20} 
            icon={<Camera className="w-5 h-5 text-emerald-500" />} 
            checks={data?.visualContent?.checks} 
          />
          <ScoreCard 
            title="Reviews & Trust" 
            score={reviewsScore} 
            max={25} 
            icon={<MessageSquare className="w-5 h-5 text-amber-500" />} 
            checks={data?.reviews?.checks} 
          />
          <ScoreCard 
            title="Engagement Rate" 
            score={engagementScore} 
            max={15} 
            icon={<Sparkles className="w-5 h-5 text-purple-500" />} 
            checks={data?.engagement?.checks} 
          />
          <ScoreCard 
            title="Local SEO Strategy" 
            score={seoScore} 
            max={15} 
            icon={<TrendingUp className="w-5 h-5 text-teal-500" />} 
            checks={data?.seo?.checks}
            className="md:col-span-2" 
          />
        </div>

        {/* 🔧 Action Items / Recommendations */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">Recommended Improvements</h3>
              <p className="text-slate-400 font-semibold text-sm">Follow these actionable steps to boost organic search presence</p>
            </div>
          </div>

          <div className="space-y-4">
            {data?.recommendations && data.recommendations.length > 0 ? (
              data.recommendations.map((rec: any, i: number) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/10 transition-all">
                  <span className="text-3xl p-2 bg-white rounded-xl shadow-sm shrink-0 border border-slate-50">{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-800 text-base">{rec.title}</h4>
                    <p className="text-slate-500 text-sm mt-1 font-medium leading-relaxed">{rec.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider ${
                        rec.impact?.toLowerCase() === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        rec.impact?.toLowerCase() === 'high' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {rec.impact} Impact
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 font-bold">
                🎉 No critical improvements recommended. Your profile is in fantastic shape!
              </div>
            )}
          </div>
        </div>

        {/* 🚀 Premium CTA to Pricing */}
        <div className="bg-gradient-to-r from-[#0F5C4D] to-[#12705e] rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          {/* Decorative shapes inside CTA */}
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 blur-[50px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-[250px] h-[250px] bg-[#25D366]/10 blur-[60px] rounded-full pointer-events-none" />

          <span className="bg-white/10 text-[#25D366] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
            WhatsApp-First Autopilot
          </span>
          <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            Want Neerzy to Automatically Fix These Issues?
          </h3>
          <p className="mb-8 text-white/80 max-w-xl mx-auto font-medium text-base md:text-lg">
            We automatically manage your posts, reviews, and visual content directly through simple WhatsApp messages. Let us handle your local SEO while you run your business.
          </p>
          <button 
            onClick={() => router.push('/pricing')}
            className="bg-white hover:bg-slate-100 text-[#0F5C4D] font-black py-4 px-10 rounded-2xl transition-all shadow-xl hover:scale-[1.03] active:scale-[0.97] inline-flex items-center gap-2"
          >
            <span>View Plans & Pricing</span>
            <ChevronRight className="w-5 h-5 text-[#0F5C4D]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, score, max, icon, checks, className }: any) {
  const percentage = Math.round((score / max) * 100);
  
  return (
    <div className={`bg-white rounded-3xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-all ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
            {icon}
          </div>
          <h4 className="font-extrabold text-slate-800 text-lg leading-tight">{title}</h4>
        </div>
        <span className="text-sm font-black text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
          {score}/{max}
        </span>
      </div>
      
      <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            percentage >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 
            percentage >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
            'bg-gradient-to-r from-rose-400 to-rose-500'
          }`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Checklist details from API checks */}
      {checks && checks.length > 0 && (
        <div className="space-y-3.5 border-t border-slate-50 pt-5">
          {checks.map((check: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-semibold">{check.label}</span>
              {check.passed ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-100/50 px-2 py-0.5 rounded-lg text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Passed
                </span>
              ) : (
                <span className="text-rose-500 font-bold flex items-center gap-1.5 bg-rose-50/50 border border-rose-100/50 px-2 py-0.5 rounded-lg text-xs">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  Missing
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
