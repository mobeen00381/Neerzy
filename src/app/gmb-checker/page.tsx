'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { 
  Search, Shield, MapPin, Loader2, ArrowRight, Star,
  AlertCircle, LayoutGrid, Zap, CheckCircle2, Gauge, Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CheckerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  const searchBusinesses = useRef(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
          setResults(data.results);
          setShowDropdown(true);
          setSelectedIndex(-1);
        } else {
          setResults([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    searchBusinesses(query);
    return () => searchBusinesses.cancel();
  }, [query, searchBusinesses]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectBusiness = async (business: any) => {
    setQuery(business.name);
    setShowDropdown(false);
    setAuditLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gmb/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: business.name })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to audit listing.");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectBusiness(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
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
            <div className="relative z-50 max-w-3xl mx-auto" ref={dropdownRef}>
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-3 border border-white/10 relative group transition-all focus-within:ring-8 focus-within:ring-[#25D366]/10 animate-in zoom-in-95 duration-700">
                <div className="relative flex items-center">
                  <Search className="absolute left-6 h-7 w-7 text-slate-300 group-focus-within:text-[#25D366] transition-colors" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && setShowDropdown(true)}
                    placeholder="e.g. blacksmith door handles"
                    className="w-full pl-16 pr-24 py-6 bg-transparent border-none outline-none font-bold text-2xl text-slate-900 placeholder:text-slate-300"
                    autoComplete="off"
                    disabled={auditLoading}
                  />
                  {loading || auditLoading ? (
                    <div className="absolute right-8">
                      <Loader2 className="animate-spin h-7 w-7 text-[#25D366]" />
                    </div>
                  ) : (
                    <div className="absolute right-8 opacity-20">
                      <ArrowRight className="h-7 w-7" />
                    </div>
                  )}
                </div>
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && results.length > 0 && (
                <div className="absolute w-full mt-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden animate-in slide-in-from-top-2 duration-300 text-left">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Search Results</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Esc to close</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {results.map((business, index) => (
                      <button
                        key={business.placeId}
                        onClick={() => selectBusiness(business)}
                        className={`w-full p-6 text-left transition-all border-b border-slate-50 last:border-b-0 flex items-start gap-6 group ${
                          index === selectedIndex ? 'bg-green-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${
                          index === selectedIndex ? 'bg-white shadow-sm' : 'bg-white border border-slate-100'
                        }`}>
                          {business.types?.includes('restaurant') ? '🍽️' : 
                           business.types?.includes('store') ? '🛍️' : 
                           business.types?.includes('health') ? '🏥' : '🏢'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-black text-xl text-slate-900 truncate">
                              {business.name}
                            </p>
                            {business.rating && (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-black">
                                <Star className="h-3 w-3 fill-current" /> {business.rating}
                              </div>
                            )}
                          </div>
                          <p className="text-slate-500 font-medium flex items-center gap-1.5 text-sm mb-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-300" /> {business.address}
                          </p>
                        </div>

                        <div className="flex items-center self-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="h-5 w-5 text-[#25D366]" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-500 font-bold bg-red-50 p-4 rounded-2xl animate-in shake duration-500">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-8 opacity-60">
                 {['No Credit Card Required', 'Takes < 10 Seconds', 'Free Instant Report'].map((tag, i) => (
                   <div key={i} className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                     <Check className="text-[#25D366] h-4 w-4" /> {tag}
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] shadow-2xl p-10 text-left mb-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-50 pb-8">
                <div>
                  <div className="flex items-center gap-2 text-[#25D366] font-black text-xs uppercase tracking-[0.3em] mb-2">
                    <CheckCircle2 className="h-4 w-4" /> Audit Complete
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                    {result.gmb_business_name || query}
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
                    <h4 className="text-2xl font-black mb-4">Fix This Profile Free?</h4>
                    <p className="font-bold opacity-80 leading-relaxed mb-8">
                      Your score is {result.healthScore}/100. Connect your profile to start generating AI-powered posts and reviews today.
                    </p>
                  </div>
                  <Link href="/onboarding">
                    <Button className="w-full bg-slate-900 text-white hover:bg-black h-16 rounded-2xl font-black text-lg border-none">
                      Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setResult(null);
                  setQuery('');
                }}
                className="mt-10 w-full text-center text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                ← Audit another business
              </button>
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
