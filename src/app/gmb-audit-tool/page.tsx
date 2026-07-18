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
      <div className="min-h-screen" style={{ background: 'var(--color-bg-soft)', padding: 'var(--space-7) var(--space-4)', fontFamily: 'var(--font-family)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* 🏷️ Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', padding: '6px 12px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', color: 'var(--color-primary)', fontWeight: 700, fontSize: 'var(--text-small-size)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-3)' }}>
              <Zap size={14} style={{ color: 'var(--color-accent)' }} />
              <span>Free Local SEO Optimizer</span>
            </div>
            <h1 style={{ fontSize: 'var(--text-hero-size)', lineHeight: 'var(--text-hero-line)', fontWeight: 'var(--text-hero-weight)', color: 'var(--color-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
              Free Google Business Profile Audit Tool
            </h1>
            <p style={{ fontSize: 'var(--text-h3-size)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
              Check Your GBP/GMB Listing SEO Score in 30 Seconds
            </p>
            <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Get a comprehensive analysis of your Google Business Profile with actionable recommendations to improve local search rankings — 100% free, no signup required.
            </p>
          </div>

          {/* 🔍 Search Box */}
          <div className="card" style={{ padding: 'var(--space-4)', position: 'relative', zIndex: 100 }} ref={dropdownRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: 'var(--color-bg)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
              <Search size={20} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedBusiness(null);
                  setShowDropdown(true);
                }}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                style={{ flex: 1, fontSize: 'var(--text-body-size)', outline: 'none', border: 'none', background: 'transparent', color: 'var(--color-text-primary)', fontFamily: 'var(--font-family)', fontWeight: 600, minWidth: 0 }}
                placeholder="Search your business name..."
                autoComplete="off"
                aria-label="Search for your business"
              />
              {loading && (
                <Loader2 size={20} style={{ color: 'var(--color-accent)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div style={{ position: 'absolute', left: 'var(--space-4)', right: 'var(--space-4)', marginTop: 'var(--space-2)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', boxShadow: '0 8px 24px rgba(11,61,46,0.1)', maxHeight: '380px', overflowY: 'auto', zIndex: 150, padding: 'var(--space-2)' }}>
                {searchResults.length > 0 ? (
                  <>
                    <div style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-small-size)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-border)' }}>
                      Select your business:
                    </div>
                    {searchResults.map((place: any, idx: number) => (
                      <button
                        key={place.placeId || idx}
                        onClick={() => handleSelectBusiness(place)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: 'var(--space-3)',
                          borderRadius: '12px',
                          border: 'none',
                          background: selectedBusiness?.placeId === place.placeId ? 'var(--color-bg-soft)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--space-3)',
                          fontFamily: 'var(--font-family)',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => { if (selectedBusiness?.placeId !== place.placeId) e.currentTarget.style.background = 'var(--color-bg-muted)'; }}
                        onMouseLeave={(e) => { if (selectedBusiness?.placeId !== place.placeId) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {place.photoUrl ? (
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                            <img 
                              src={place.photoUrl} 
                              alt={place.displayName?.text || place.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e: any) => {
                                e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;background:var(--color-bg-soft);display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>';
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ padding: '10px', backgroundColor: 'var(--color-bg-soft)', borderRadius: '12px', color: 'var(--color-primary)', flexShrink: 0 }}>
                            <Building2 size={20} />
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-body-size)', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {place.displayName?.text || place.name}
                          </div>
                          <div style={{ fontSize: 'var(--text-small-size)', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {place.formattedAddress || place.formatted_address}
                          </div>
                          {place.rating !== undefined && place.rating > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: 'var(--text-small-size)', fontWeight: 700, color: 'var(--color-status-warn)' }}>
                              <Star size={14} style={{ color: 'var(--color-status-warn)' }} />
                              <span>{place.rating}</span>
                              <span style={{ opacity: 0.6, color: 'var(--color-text-secondary)' }}>({place.user_ratings_total || 0} reviews)</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                ) : searchQuery.trim().length >= 3 && !loading ? (
                  <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                    No businesses found. Try a different search term.
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 🏆 Selected Business Card & Audit Trigger */}
          {selectedBusiness && (
            <div style={{ marginTop: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="card" style={{ border: '2px solid var(--color-accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div style={{ padding: '8px', backgroundColor: 'var(--color-accent)', color: '#FFFFFF', borderRadius: '12px' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 style={{ fontSize: 'var(--text-h3-size)', fontWeight: 'var(--text-h3-weight)', color: 'var(--color-primary)', margin: 0 }}>Business Selected</h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  {selectedBusiness.photoUrl ? (
                    <div style={{ width: '72px', height: '72px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--color-border)', flexShrink: 0 }}>
                      <img 
                        src={selectedBusiness.photoUrl} 
                        alt={selectedBusiness.displayName?.text || selectedBusiness.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '72px', height: '72px', borderRadius: '16px', backgroundColor: 'var(--color-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={28} style={{ color: 'var(--color-primary)' }} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-body-size)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedBusiness.displayName?.text || selectedBusiness.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedBusiness.formattedAddress || selectedBusiness.formatted_address}
                    </div>
                    {selectedBusiness.rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: 'var(--text-small-size)', fontWeight: 700, color: 'var(--color-status-warn)' }}>
                        <Star size={14} style={{ color: 'var(--color-status-warn)' }} />
                        <span>{selectedBusiness.rating}</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>({selectedBusiness.user_ratings_total} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleRunAudit}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: 'var(--text-body-size)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              >
                <span>Run Free GBP Audit Now</span>
                <ArrowRight size={20} />
              </button>

              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: 'var(--text-small-size)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Takes less than 30 seconds • No signup required • 100% free
              </p>
            </div>
          )}

          {/* ⚡ Features Grid */}
          <div style={{ marginTop: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', textAlign: 'center', marginBottom: 'var(--space-7)', letterSpacing: '-0.02em' }}>
              Why Use Our Free Google Business Profile Audit Tool?
            </h2>
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <FeatureCard 
                title="Instant GBP Analysis"
                description="Get your Google Business Profile SEO score in under 30 seconds. No waiting, no signup required."
              />
              <FeatureCard 
                title="Comprehensive GMB Audit"
                description="We check 5 critical areas: completeness, photos, reviews, engagement, and local SEO optimization."
              />
              <FeatureCard 
                title="Actionable Recommendations"
                description="Get specific, prioritized action items to improve your local search rankings and attract more customers."
              />
              <FeatureCard 
                title="Local SEO Checker"
                description="Identify what's holding your business back from ranking #1 in Google Maps and local search results."
              />
              <FeatureCard 
                title="Mobile-Friendly Audit"
                description="Access your GBP audit report on any device. Perfect for busy business owners on the go."
              />
              <FeatureCard 
                title="Free Forever"
                description="Audit unlimited businesses at no cost. We believe every local business deserves great SEO."
              />
            </div>
          </div>

          {/* 📋 How It Works Section */}
          <div className="card" style={{ marginTop: 'var(--space-8)', padding: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', textAlign: 'center', marginBottom: 'var(--space-7)', letterSpacing: '-0.02em' }}>
              How to Audit Your Google Business Profile
            </h2>
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
          <div style={{ marginTop: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', textAlign: 'center', marginBottom: 'var(--space-7)', letterSpacing: '-0.02em' }}>
              What Our GBP Audit Tool Checks
            </h2>
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <AuditCheckCard 
                category="Profile Completeness"
                weight="25%"
                icon={<Building2 size={20} />}
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
                icon={<Camera size={20} />}
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
                icon={<MessageSquare size={20} />}
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
                icon={<Sparkles size={20} />}
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
                icon={<TrendingUp size={20} />}
                checks={[
                  "Keywords in business name & description",
                  "Category optimization",
                  "Service area coverage",
                  "NAP consistency across web",
                  "Backlinks from website to GBP"
                ]}
                style={{ gridColumn: '1 / -1', maxWidth: '500px', margin: '0 auto' }}
              />
            </div>
          </div>

          {/* ❓ FAQ Section */}
          <div className="card" style={{ marginTop: 'var(--space-8)', padding: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', textAlign: 'center', marginBottom: 'var(--space-7)', letterSpacing: '-0.02em' }}>
              Frequently Asked Questions About GBP Audits
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
          <div style={{ 
            marginTop: 'var(--space-8)', 
            background: 'var(--gradient-cta-dark)', 
            borderRadius: 'var(--radius-card)', 
            padding: 'var(--space-6)', 
            textAlign: 'center', 
            color: '#FFFFFF'
          }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: '#FFFFFF', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
              Ready to Improve Your Local SEO?
            </h2>
            <p style={{ fontSize: 'var(--text-body-size)', color: 'rgba(255,255,255,0.85)', maxWidth: '500px', margin: '0 auto var(--space-5)' }}>
              Get your free Google Business Profile audit now and discover what's holding you back from ranking #1. Let Neerzy help you automate the fix.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="btn btn-primary"
                style={{ fontSize: 'var(--text-body-size)', padding: '14px 28px' }}
              >
                Start Free Audit Now
              </button>
              <a 
                href="/pricing"
                className="btn btn-secondary"
                style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#FFFFFF' }}
              >
                <span>View Neerzy Plans</span>
                <ArrowUpRight size={16} style={{ marginLeft: '4px' }} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Component: Feature Card
function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: 'var(--text-h3-size)', lineHeight: 'var(--text-h3-line)', fontWeight: 'var(--text-h3-weight)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', lineHeight: 'var(--text-small-line)', margin: 0 }}>{description}</p>
    </div>
  );
}

// Component: Step Card
function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="step-icon" style={{ margin: '0 auto var(--space-3)', width: '48px', height: '48px' }}>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 'var(--text-h3-size)' }}>{number}</span>
      </div>
      <h3 style={{ fontSize: 'var(--text-h3-size)', lineHeight: 'var(--text-h3-line)', fontWeight: 'var(--text-h3-weight)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', lineHeight: 'var(--text-small-line)', margin: 0 }}>{description}</p>
    </div>
  );
}

// Component: Audit Check Card
function AuditCheckCard({ category, weight, icon, checks, style: customStyle = {} }: { category: string; weight: string; icon: React.ReactNode; checks: string[]; style?: React.CSSProperties }) {
  return (
    <div className="card" style={customStyle as React.CSSProperties}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="step-icon" style={{ width: '36px', height: '36px' }}>
            {icon}
          </div>
          <h3 style={{ fontSize: 'var(--text-h3-size)', lineHeight: 'var(--text-h3-line)', fontWeight: 'var(--text-h3-weight)', color: 'var(--color-text-primary)', margin: 0 }}>{category}</h3>
        </div>
        <span style={{ fontSize: 'var(--text-small-size)', fontWeight: 700, color: 'var(--color-accent)', backgroundColor: 'var(--color-bg-soft)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>{weight} Weight</span>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none', padding: 0, margin: 0 }}>
        {checks.map((check, idx) => (
          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', fontSize: 'var(--text-small-size)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span style={{ lineHeight: '1.4' }}>{check}</span>
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
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          textAlign: 'left', 
          padding: 'var(--space-4)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--text-body-size)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--text-body-line)'
        }}
      >
        <span>{question}</span>
        <span style={{ 
          flexShrink: 0, 
          padding: '4px', 
          backgroundColor: 'var(--color-bg)', 
          border: '1px solid var(--color-border)', 
          borderRadius: '8px',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          marginLeft: 'var(--space-3)'
        }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {isOpen && (
        <div style={{ 
          padding: '0 var(--space-4) var(--space-4)', 
          color: 'var(--color-text-secondary)', 
          fontSize: 'var(--text-body-size)',
          lineHeight: 'var(--text-body-line)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--space-3)'
        }}>
          {answer}
        </div>
      )}
    </div>
  );
}
