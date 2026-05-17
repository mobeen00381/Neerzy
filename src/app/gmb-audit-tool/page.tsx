'use client';

import { useState } from 'react';
import { 
  Building2, 
  Search, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Star, 
  Image as ImageIcon, 
  Zap, 
  Compass, 
  ArrowLeft,
  Crown
} from 'lucide-react';

export default function GBMAuditTool() {
  const [step, setStep] = useState<'search' | 'results' | 'audit'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Search businesses
  const searchBusinesses = async (query: string) => {
    if (query.trim().length < 3) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/audit/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setSearchResults(data.places || []);
      setStep('results');
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run audit on selected business
  const runAudit = async (business: any) => {
    setSelectedBusiness(business);
    setLoading(true);
    
    try {
      const res = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          placeId: business.placeId,
          businessName: business.displayName?.text || business.name
        })
      });
      const audit = await res.json();
      setAuditData(audit);
      setStep('audit');
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] py-16 px-6 font-sans relative overflow-hidden">
      {/* Decorative background vectors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl mb-4 border border-emerald-100 shadow-sm">
            <TrendingUp className="w-6 h-6 text-[#25D366]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#0F5C4D] mb-4 tracking-tight leading-tight">
            Free Google Business Profile Audit
          </h1>
          <p className="text-lg font-medium text-[#4F635F] max-w-2xl mx-auto">
            Discover how to improve your local SEO, fix ranking drop-offs, and attract more customers automatically.
          </p>
        </div>

        {/* Step 1: Search */}
        {step === 'search' && !loading && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-2xl mx-auto border border-emerald-50/10 animate-in fade-in zoom-in-95 duration-300">
            <label className="block text-sm font-bold text-slate-700 ml-1 mb-3">
              Enter your business name & city
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchBusinesses(searchQuery)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-[#25D366] focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900"
                  placeholder="e.g. Starbucks New York"
                />
              </div>
              <button
                onClick={() => searchBusinesses(searchQuery)}
                disabled={loading || searchQuery.trim().length < 3}
                className="bg-[#0F5C4D] hover:bg-[#073a30] text-white px-8 py-4 rounded-2xl font-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>Search</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-3 ml-1 uppercase tracking-wider">Requires minimum 3 characters</p>
          </div>
        )}

        {/* Step 2: Results */}
        {step === 'results' && !loading && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-2xl mx-auto border border-emerald-50/10 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Building2 className="text-[#25D366] w-6 h-6" />
              <span>Select Your Business</span>
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((place, idx) => (
                  <button
                    key={idx}
                    onClick={() => runAudit(place)}
                    className="w-full text-left p-5 border-2 border-slate-100 rounded-2xl hover:border-emerald-100 hover:bg-emerald-50/50 transition-all flex items-start gap-4 active:scale-[0.99]"
                  >
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-lg leading-tight truncate">
                        {place.displayName?.text || place.name}
                      </div>
                      <div className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPinIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{place.formattedAddress || place.formatted_address}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 font-semibold">
                  No businesses found. Try a different query.
                </div>
              )}
            </div>
            
            <button
              onClick={() => setStep('search')}
              className="mt-6 font-bold text-[#0F5C4D] hover:text-[#073a30] transition flex items-center gap-2 outline-none select-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Search again</span>
            </button>
          </div>
        )}

        {/* Step 3: Audit Report */}
        {step === 'audit' && auditData && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <AuditReport audit={auditData} business={selectedBusiness} />
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-20 animate-in fade-in duration-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-xl border border-slate-100 mb-6">
              <Loader2 className="animate-spin h-10 w-10 text-[#25D366]" />
            </div>
            <p className="text-slate-900 font-black text-xl tracking-tight">Analyzing Business Profile...</p>
            <p className="text-slate-500 font-medium text-sm mt-1">Collecting local listing and SEO ranking signals</p>
          </div>
        )}

      </div>
    </div>
  );
}

// Audit Report Component
function AuditReport({ audit, business }: { audit: any; business: any }) {
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
          <p className="text-slate-500 font-semibold text-sm mb-8 flex items-center justify-center gap-1.5">
            <MapPinIcon className="w-4 h-4 text-[#25D366] shrink-0" />
            <span>{business.formattedAddress || business.formatted_address}</span>
          </p>
          
          <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full border-[10px] bg-slate-50/50 shadow-inner mb-6 ${getScoreBgCircle(overallScore)} transition-all duration-700`}>
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
                <span>Excellent profile! Strong Local SEO footprint.</span>
              </span>
            ) : overallScore >= 60 ? (
              <span className="flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>Good profile, but crucial opportunities are being missed.</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🚨</span>
                <span>Critical local visibility issues found. Action required.</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Scores Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <AuditSection 
          title="Profile Completeness"
          icon={<CheckCircle2 className="w-5 h-5" />}
          score={audit.completeness.score}
          maxScore={25}
          actualScore={audit.completeness.actualScore}
          checks={audit.completeness.checks}
        />
        
        <AuditSection 
          title="Visual Content"
          icon={<ImageIcon className="w-5 h-5" />}
          score={audit.visualContent.score}
          maxScore={20}
          actualScore={audit.visualContent.actualScore}
          checks={audit.visualContent.checks}
        />
        
        <AuditSection 
          title="Reviews & Reputation"
          icon={<Star className="w-5 h-5" />}
          score={audit.reviews.score}
          maxScore={25}
          actualScore={audit.reviews.actualScore}
          checks={audit.reviews.checks}
        />
        
        <AuditSection 
          title="Engagement & Activity"
          icon={<Zap className="w-5 h-5" />}
          score={audit.engagement.score}
          maxScore={15}
          actualScore={audit.engagement.actualScore}
          checks={audit.engagement.checks}
        />
        
        <AuditSection 
          title="SEO Optimization"
          icon={<Compass className="w-5 h-5" />}
          score={audit.seo.score}
          maxScore={15}
          actualScore={audit.seo.actualScore}
          checks={audit.seo.checks}
          className="md:col-span-2"
        />
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-50/10">
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <Crown className="w-6 h-6 text-yellow-500" />
          <span>Priority Improvements</span>
        </h3>
        <div className="space-y-4">
          {audit.recommendations.map((rec: any, idx: number) => (
            <div key={idx} className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-100/50 transition-all">
              <span className="text-3xl shrink-0 p-2 bg-white rounded-xl shadow-sm leading-none">{rec.icon}</span>
              <div>
                <div className="font-bold text-slate-900 text-lg leading-snug">{rec.title}</div>
                <div className="text-sm font-medium text-slate-500 mt-1">{rec.description}</div>
                <div className="inline-flex mt-3 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-[#0F5C4D] px-2.5 py-1 rounded-full">
                  Impact: {rec.impact}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Upgrade Panel */}
      <div className="bg-gradient-to-br from-[#0F5C4D] via-[#073a30] to-[#041e19] rounded-[2.5rem] shadow-2xl p-12 text-center text-white relative overflow-hidden">
        {/* Visual accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -left-[10%] w-[45%] h-[45%] bg-[#25D366]/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-[30%] -right-[10%] w-[45%] h-[45%] bg-teal-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Ready to Dominate Local Search?
          </h3>
          <p className="text-lg font-medium text-slate-200/90 leading-relaxed">
            Dominate local organic maps traffic, fix structural visibility drop-offs, and manage your WhatsApp funnels easily.
          </p>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebd59] text-black font-black text-lg px-10 py-5 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] outline-none"
          >
            Boost Your Score Instantly →
          </button>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            Fixed monthly plans starting from $99/month
          </p>
        </div>
      </div>
    </div>
  );
}

// Individual Audit Section Component
function AuditSection({ title, icon, score, maxScore, actualScore, checks, className = '' }: any) {
  const isGood = score >= 80;
  const isWarning = score >= 60;
  
  const getThemeColor = () => {
    if (isGood) return 'text-[#25D366] bg-[#25D366]/10';
    if (isWarning) return 'text-amber-500 bg-amber-500/10';
    return 'text-rose-500 bg-rose-500/10';
  };

  const getTextColor = () => {
    if (isGood) return 'text-[#25D366]';
    if (isWarning) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getBgBarColor = () => {
    if (isGood) return 'bg-[#25D366]';
    if (isWarning) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className={`bg-white rounded-3xl shadow-xl p-8 border-2 border-slate-100 flex flex-col justify-between transition-all hover:shadow-2xl ${className}`}>
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${getThemeColor()} shrink-0`}>
              {icon}
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-snug">{title}</h3>
          </div>
          
          <div className="text-right">
            <div className={`text-3xl font-black leading-none ${getTextColor()}`}>
              {score}%
            </div>
            <div className="text-xs font-bold text-slate-400 mt-1">{actualScore}/{maxScore} pts</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ${getBgBarColor()}`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
      
      {/* Checks Checklist */}
      <div className="space-y-3.5 mt-auto">
        {checks.map((check: any, idx: number) => (
          <div key={idx} className="flex items-start gap-3 text-sm">
            <span className="shrink-0 mt-0.5">
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-500" />
              )}
            </span>
            <span className={`font-semibold ${check.passed ? 'text-slate-800' : 'text-slate-400'}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
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
