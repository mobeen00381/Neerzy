'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Search, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  TrendingUp, 
  MapPin, 
  Star,
  ChevronDown,
  ChevronUp,
  Zap,
  Camera,
  MessageSquare,
  Sparkles,
  Lock,
  ArrowUpRight
} from 'lucide-react';

export default function GBMAuditTool() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔍 Real-time search with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 15 })
      });
      const data = await res.json();
      if (data.places && data.places.length > 0) {
        setSearchResults(data.places);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (business: any) => {
    setSelectedBusiness(business);
    setShowDropdown(false);
    setSearchQuery(business.displayName?.text || business.name);
  };

  const handleRunAudit = () => {
    if (!selectedBusiness) return;
    router.push(`/gmb-audit-tool/results?placeId=${selectedBusiness.placeId}&name=${encodeURIComponent(selectedBusiness.displayName?.text || selectedBusiness.name)}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Schema.org structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Free Google Business Profile Audit Tool",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Free GBP audit tool to check your Google Business Profile SEO. Get instant analysis of your GMB listing with actionable recommendations to improve local search rankings.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "127"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is a Google Business Profile audit?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A Google Business Profile (GBP) audit analyzes your GMB listing to identify optimization opportunities. It checks completeness, photos, reviews, SEO factors, and engagement to help you rank higher in local search results."
        }
      },
      {
        "@type": "Question",
        "name": "How much does a GBP audit cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our Google Business Profile audit tool is 100% free. You can audit unlimited businesses at no cost. We also offer paid plans starting at $39/month if you want us to automatically fix the issues we find."
        }
      },
      {
        "@type": "Question",
        "name": "How long does a GBP audit take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The audit takes less than 30 seconds. Simply search for your business, select it from the results, and click 'Run Audit' to get your instant score and recommendations."
        }
      },
      {
        "@type": "Question",
        "name": "What does the audit check?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our audit evaluates 5 key areas: Profile Completeness (25%), Visual Content & Photos (20%), Reviews & Reputation (25%), Engagement & Activity (15%), and SEO Optimization (15%). You'll get a score out of 100 plus specific action items."
        }
      }
    ]
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] py-20 px-4 md:px-8 font-sans relative overflow-hidden">
        {/* Background Visual Enhancers */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
          <div className="absolute top-[60%] -right-[10%] w-[35%] h-[35%] bg-teal-500/5 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-16">
          
          {/* 🏷️ Header with Keywords */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Free Local SEO Optimizer</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#0F5C4D] leading-tight tracking-tight max-w-3xl mx-auto">
              Free Google Business Profile Audit Tool
            </h1>
            <p className="text-xl md:text-2xl font-extrabold text-slate-700">
              Check Your GBP/GMB Listing SEO Score in 30 Seconds
            </p>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Get a comprehensive analysis of your Google Business Profile with actionable recommendations to improve local search rankings — 100% free, no signup required.
            </p>
          </div>

          {/* 🔍 Search Box with Autocomplete Dropdown */}
          <div className="relative z-[100] max-w-3xl mx-auto w-full" ref={dropdownRef}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-3 border border-emerald-50/10">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-2xl border-2 border-slate-100 focus-within:border-[#25D366] focus-within:bg-white transition-all">
                <Search className="w-6 h-6 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedBusiness(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  className="flex-1 text-lg outline-none text-slate-800 placeholder-slate-400 bg-transparent font-semibold min-w-0"
                  placeholder="Search your business name (e.g., Starbucks)..."
                  autoComplete="off"
                  aria-label="Search for your business"
                />
                {loading && (
                  <Loader2 className="animate-spin h-6 w-6 text-[#25D366] shrink-0" />
                )}
              </div>

              {/* Dropdown displaying real storefront image thumbnails */}
              {showDropdown && (
                <div className="absolute left-4 right-4 mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-[380px] overflow-y-auto z-[150] p-2 space-y-1">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 bg-slate-50/50 rounded-t-xl sticky top-0 z-10">
                        Select your business:
                      </div>
                      {searchResults.map((place: any, idx: number) => (
                        <button
                          key={place.placeId || idx}
                          onClick={() => handleSelectBusiness(place)}
                          className={`w-full text-left p-3.5 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-all flex items-start gap-4 cursor-pointer ${
                            selectedBusiness?.placeId === place.placeId ? 'bg-emerald-50 border-l-4 border-l-[#25D366]' : ''
                          }`}
                        >
                          {/* Storefront thumbnail display */}
                          {place.photoUrl ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 mt-0.5 border border-slate-100 shadow-sm">
                              <img 
                                src={place.photoUrl} 
                                alt={place.displayName?.text || place.name}
                                className="w-full h-full object-cover"
                                onError={(e: any) => {
                                  e.target.parentElement.innerHTML = '<div class="w-full h-full bg-emerald-50 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F5C4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0 mt-0.5">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-slate-800 text-base leading-tight truncate">
                              {place.displayName?.text || place.name}
                            </div>
                            <div className="text-xs font-semibold text-slate-400 mt-1 truncate">
                              {place.formattedAddress || place.formatted_address}
                            </div>
                            {place.rating !== undefined && place.rating > 0 && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-lg w-max">
                                <span>⭐ {place.rating}</span>
                                <span className="opacity-60">({place.user_ratings_total || 0} reviews)</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : searchQuery.trim().length >= 3 && !loading ? (
                    <div className="p-8 text-center text-slate-400 font-bold">
                      <span className="text-4xl mb-2 block">🔍</span>
                      No businesses found. Try a different search term.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* 🏆 Selected Business Card & Audit Trigger */}
          {selectedBusiness && (
            <div className="mt-8 max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#0F5C4D]">Business Selected</h3>
                </div>
                
                <div className="flex items-start gap-4">
                  {selectedBusiness.photoUrl ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-sm shrink-0">
                      <img 
                        src={selectedBusiness.photoUrl} 
                        alt={selectedBusiness.displayName?.text || selectedBusiness.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-8 h-8 text-[#0F5C4D]" />
                    </div>
                  )}

                  <div className="space-y-1.5 text-slate-700 min-w-0">
                    <div className="font-extrabold text-slate-900 text-lg truncate">
                      {selectedBusiness.displayName?.text || selectedBusiness.name}
                    </div>
                    <div className="text-sm font-semibold text-slate-500 leading-relaxed truncate">
                      {selectedBusiness.formattedAddress || selectedBusiness.formatted_address}
                    </div>
                    {selectedBusiness.rating && (
                      <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                        <span>⭐ {selectedBusiness.rating}</span>
                        <span className="text-slate-400">({selectedBusiness.user_ratings_total} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleRunAudit}
                className="w-full bg-[#0F5C4D] hover:bg-[#073a30] text-white py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 group"
              >
                <span>🚀 Run Free GBP Audit Now</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <p className="text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                ⚡ Takes less than 30 seconds • No signup required • 100% free
              </p>
            </div>
          )}

          {/* ⚡ Features Grid - SEO Optimized */}
          <div className="pt-8">
            <h2 className="text-3xl md:text-4xl font-black text-center text-slate-800 mb-12">
              Why Use Our Free Google Business Profile Audit Tool?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon="⚡"
                title="Instant GBP Analysis"
                description="Get your Google Business Profile SEO score in under 30 seconds. No waiting, no signup required."
              />
              <FeatureCard 
                icon="📊"
                title="Comprehensive GMB Audit"
                description="We check 5 critical areas: completeness, photos, reviews, engagement, and local SEO optimization."
              />
              <FeatureCard 
                icon="💡"
                title="Actionable Recommendations"
                description="Get specific, prioritized action items to improve your local search rankings and attract more customers."
              />
              <FeatureCard 
                icon="🔍"
                title="Local SEO Checker"
                description="Identify what's holding your business back from ranking #1 in Google Maps and local search results."
              />
              <FeatureCard 
                icon="📱"
                title="Mobile-Friendly Audit"
                description="Access your GBP audit report on any device. Perfect for busy business owners on the go."
              />
              <FeatureCard 
                icon="🎯"
                title="Free Forever"
                description="Audit unlimited businesses at no cost. We believe every local business deserves great SEO."
              />
            </div>
          </div>

          {/* 📋 How It Works Section */}
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-100">
            <h2 className="text-3xl md:text-4xl font-black text-center text-slate-800 mb-12">
              How to Audit Your Google Business Profile
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
              <StepCard 
                number="1"
                title="Search Your Business"
                description="Type your business name in the search box above"
              />
              <StepCard 
                number="2"
                title="Select Your Listing"
                description="Choose your Google Business Profile from the results"
              />
              <StepCard 
                number="3"
                title="Get Instant Score"
                description="Receive your comprehensive GBP audit in seconds"
              />
              <StepCard 
                number="4"
                title="Fix & Improve"
                description="Follow recommendations or let Neerzy handle it for you"
              />
            </div>
          </div>

          {/* 🔍 What We Check Section */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black text-center text-slate-800">
              What Our GBP Audit Tool Checks
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <AuditCheckCard 
                category="Profile Completeness"
                weight="25%"
                icon={<Building2 className="w-5 h-5 text-indigo-500" />}
                checks={[
                  "Business name, address, phone (NAP)",
                  "Website link and business hours",
                  "Primary and secondary categories",
                  "Business description (750 characters)",
                  "Attributes and services offered"
                ]}
              />
              <AuditCheckCard 
                category="Visual Content & Photos"
                weight="20%"
                icon={<Camera className="w-5 h-5 text-emerald-500" />}
                checks={[
                  "Total photo count (target: 100+)",
                  "Recent uploads (last 30 days)",
                  "Logo and cover photo quality",
                  "Photo diversity (interior, exterior, team)",
                  "Video content presence"
                ]}
              />
              <AuditCheckCard 
                category="Reviews & Reputation"
                weight="25%"
                icon={<MessageSquare className="w-5 h-5 text-amber-500" />}
                checks={[
                  "Total review count and average rating",
                  "Review velocity (new reviews/month)",
                  "Review response rate and time",
                  "Review keywords and sentiment",
                  "Star rating distribution"
                ]}
              />
              <AuditCheckCard 
                category="Engagement & Activity"
                weight="15%"
                icon={<Sparkles className="w-5 h-5 text-purple-500" />}
                checks={[
                  "Google Posts frequency and recency",
                  "Post types (offers, events, updates)",
                  "Q&A section activity",
                  "Product/service listings",
                  "Booking links and CTAs"
                ]}
              />
              <AuditCheckCard 
                category="Local SEO Optimization"
                weight="15%"
                icon={<TrendingUp className="w-5 h-5 text-teal-500" />}
                checks={[
                  "Keywords in business name & description",
                  "Category optimization",
                  "Service area coverage",
                  "NAP consistency across web",
                  "Backlinks from website to GBP"
                ]}
                className="md:col-span-2"
              />
            </div>
          </div>

          {/* ❓ FAQ Section - Great for SEO */}
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-100">
            <h2 className="text-3xl md:text-4xl font-black text-center text-slate-800 mb-12">
              Frequently Asked Questions About GBP Audits
            </h2>
            <div className="space-y-6">
              <FAQItem 
                question="What is a Google Business Profile audit?"
                answer="A Google Business Profile (GBP) audit is a comprehensive analysis of your GMB listing that identifies optimization opportunities and issues. It checks your profile completeness, photos, reviews, engagement, and SEO factors to help you rank higher in Google Maps and local search results. Our free audit tool evaluates 5 key areas and provides actionable recommendations."
              />
              <FAQItem 
                question="How much does a GBP audit cost?"
                answer="Our Google Business Profile audit tool is 100% free to use. You can audit unlimited businesses at no cost and receive detailed reports with scores and recommendations. We also offer paid plans starting at $39/month if you want Neerzy to automatically fix the issues we find through WhatsApp-based management."
              />
              <FAQItem 
                question="How long does a Google Business Profile audit take?"
                answer="The audit takes less than 30 seconds from start to finish. Simply search for your business name, select it from the dropdown results, and click 'Run Free Audit Now.' You'll instantly receive your overall score out of 100 plus detailed breakdowns for each category."
              />
              <FAQItem 
                question="What does the audit check exactly?"
                answer="Our audit evaluates 5 critical areas: Profile Completeness (25% weight) checks if all your business information is filled out; Visual Content (20%) analyzes your photo count and quality; Reviews & Reputation (25%) examines your rating and review count; Engagement (15%) looks at Google Posts and Q&A activity; and SEO Optimization (15%) checks keyword usage and local SEO factors."
              />
              <FAQItem 
                question="Can I audit my competitor's Google Business Profile?"
                answer="Yes! You can audit any business's Google Business Profile using our free tool. This is great for competitive analysis — see what your competitors are doing well and where they're weak. Use these insights to improve your own GBP and outrank them in local search results."
              />
              <FAQItem 
                question="How often should I audit my Google Business Profile?"
                answer="We recommend auditing your GBP at least once per month to track improvements and catch new issues. If you're actively optimizing your profile, audit weekly to measure progress. After making major changes (new photos, posts, or business info), run an audit to see the impact on your score."
              />
            </div>
          </div>

          {/* 🚀 Dynamic Premium CTA Section */}
          <div className="bg-gradient-to-r from-[#0F5C4D] to-[#12705e] rounded-[2.5rem] p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 blur-[50px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-[250px] h-[250px] bg-[#25D366]/10 blur-[60px] rounded-full pointer-events-none" />

            <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
              Ready to Improve Your Local SEO?
            </h2>
            <p className="mb-8 text-white/80 max-w-xl mx-auto font-medium text-base md:text-lg">
              Get your free Google Business Profile audit now and discover what's holding you back from ranking #1. Let Neerzy help you automate the fix.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-white hover:bg-slate-50 text-[#0F5C4D] px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
              >
                Start Free Audit Now
              </button>
              <a 
                href="/pricing"
                className="border-2 border-white/80 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-black text-lg transition-all w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
              >
                <span>View Neerzy Plans</span>
                <ArrowUpRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Component: Feature Card
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-50 hover:shadow-lg hover:border-emerald-100 transition-all">
      <div className="text-4xl mb-4 bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">{icon}</div>
      <h3 className="text-xl font-extrabold text-slate-800 mb-2 leading-tight">{title}</h3>
      <p className="text-slate-500 font-semibold text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Component: Step Card
function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center space-y-3">
      <div className="w-16 h-16 bg-[#0F5C4D] text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto shadow-md">
        {number}
      </div>
      <h3 className="text-lg font-extrabold text-slate-800">{title}</h3>
      <p className="text-slate-400 font-semibold text-xs leading-relaxed">{description}</p>
    </div>
  );
}

// Component: Audit Check Card
function AuditCheckCard({ category, weight, icon, checks, className = '' }: { category: string; weight: string; icon: React.ReactNode; checks: string[]; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
            {icon}
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{category}</h3>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-full">{weight} Weight</span>
      </div>
      <ul className="space-y-3 pt-2">
        {checks.map((check, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm font-semibold text-slate-500">
            <span className="text-[#25D366] text-base leading-none">✓</span>
            <span className="leading-snug">{check}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: FAQ Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 bg-slate-50/50 hover:bg-slate-50 transition-all flex justify-between items-center"
      >
        <span className="font-extrabold text-slate-800 text-base leading-tight">{question}</span>
        <span className="shrink-0 p-1 bg-white border border-slate-100 rounded-lg text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {isOpen && (
        <div className="p-6 text-slate-500 font-semibold text-sm bg-white leading-relaxed border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
          {answer}
        </div>
      )}
    </div>
  );
}
