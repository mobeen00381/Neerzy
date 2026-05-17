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
  Star 
} from 'lucide-react';

export default function GBMAuditTool() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔍 Real-time search as user types (debounced)
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 300); // 300ms debounce

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] py-20 px-6 font-sans relative overflow-hidden flex flex-col justify-center items-center">
      {/* Decorative background vectors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl w-full mx-auto relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl mb-4 border border-emerald-100 shadow-sm">
            <TrendingUp className="w-6 h-6 text-[#25D366]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#0F5C4D] mb-4 tracking-tight leading-tight">
            Free Google Business Profile Audit
          </h1>
          <p className="text-lg font-medium text-[#4F635F] max-w-2xl mx-auto">
            Type your business name — see instant results
          </p>
        </div>

        {/* Search Box with Autocomplete - FIXED Z-INDEX */}
        <div className="relative z-[100] max-w-3xl mx-auto w-full" ref={dropdownRef}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-4 border border-emerald-50/10 animate-in fade-in zoom-in-95 duration-300">
            
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-2xl border-2 border-slate-100 focus-within:border-[#25D366] focus-within:bg-white transition-all">
              <Search className="h-6 w-6 text-slate-400 shrink-0" />
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
                placeholder="Start typing your business name..."
                autoComplete="off"
              />
              {loading && (
                <Loader2 className="animate-spin h-6 w-6 text-[#25D366] shrink-0" />
              )}
            </div>

            {/* 🔽 Autocomplete Dropdown - FIXED POSITIONING */}
            {showDropdown && (
              <div className="absolute left-4 right-4 mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-[380px] overflow-y-auto z-[150] p-2 space-y-1 z-dropdown">
                {searchResults.length > 0 ? (
                  <>
                    <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 bg-slate-50/50 rounded-t-xl sticky top-0 z-10">
                      Select your business:
                    </div>
                    {searchResults.map((place: any, idx: number) => (
                      <button
                        key={place.placeId || idx}
                        onClick={() => handleSelectBusiness(place)}
                        className={`w-full text-left p-4 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-all flex items-start gap-4 cursor-pointer ${
                          selectedBusiness?.placeId === place.placeId ? 'bg-emerald-50 border-l-4 border-l-[#25D366]' : ''
                        }`}
                      >
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
                          <div className="font-bold text-slate-900 text-lg leading-tight truncate">
                            {place.displayName?.text || place.name}
                          </div>
                          <div className="text-sm font-semibold text-slate-500 mt-1 truncate">
                            {place.formattedAddress || place.formatted_address}
                          </div>
                          {place.rating !== undefined && place.rating > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold">
                              <span className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-lg">
                                ⭐ {place.rating} ({place.user_ratings_total || 0} reviews)
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                ) : searchQuery.trim().length >= 3 && !loading ? (
                  <div className="p-8 text-center text-slate-500 font-semibold">
                    <span className="text-4xl mb-2 block">🔍</span>
                    No businesses found. Try a different search term.
                  </div>
                ) : null}
              </div>
            )}

          </div>
        </div>

        {/* ✅ Selected Business Preview + Audit Button */}
        {selectedBusiness && (
          <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-emerald-50/70 border-2 border-emerald-100 p-6 rounded-3xl shadow-lg space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                <h3 className="font-bold text-emerald-800 text-lg">Business Selected</h3>
              </div>
              <div className="space-y-2 text-sm text-slate-700 font-semibold pl-9">
                <div><strong className="text-slate-900">Name:</strong> {selectedBusiness.displayName?.text || selectedBusiness.name}</div>
                <div><strong className="text-slate-900">Address:</strong> {selectedBusiness.formattedAddress || selectedBusiness.formatted_address}</div>
                {selectedBusiness.rating !== undefined && selectedBusiness.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900">Rating:</strong> 
                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-lg text-xs">
                      ⭐ {selectedBusiness.rating} ({selectedBusiness.user_ratings_total || 0} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 🚀 Audit Trigger Button */}
            <button
              onClick={handleRunAudit}
              className="w-full mt-6 bg-[#0F5C4D] hover:bg-[#073a30] text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] outline-none flex items-center justify-center gap-2"
            >
              <span>🚀 Run Free Audit Now →</span>
            </button>

            <p className="text-center font-bold text-slate-400 mt-4 text-xs">
              Takes less than 30 seconds • No signup required
            </p>
          </div>
        )}

        {/* Features Matrix Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto pt-8 pb-12">
          <div className="text-center space-y-3 p-6 bg-white/50 rounded-3xl border border-slate-100 hover:border-emerald-100 hover:bg-white/80 transition-all">
            <div className="text-4xl">⚡</div>
            <h3 className="font-black text-[#0F5C4D] text-lg">Instant Results</h3>
            <p className="text-[#4F635F] text-sm font-medium">Get your comprehensive audit score in seconds</p>
          </div>
          <div className="text-center space-y-3 p-6 bg-white/50 rounded-3xl border border-slate-100 hover:border-emerald-100 hover:bg-white/80 transition-all">
            <div className="text-4xl">🔍</div>
            <h3 className="font-black text-[#0F5C4D] text-lg">Detailed Analysis</h3>
            <p className="text-[#4F635F] text-sm font-medium">5 core categories evaluated dynamically</p>
          </div>
          <div className="text-center space-y-3 p-6 bg-white/50 rounded-3xl border border-slate-100 hover:border-emerald-100 hover:bg-white/80 transition-all">
            <div className="text-4xl">💡</div>
            <h3 className="font-black text-[#0F5C4D] text-lg">Actionable Tips</h3>
            <p className="text-[#4F635F] text-sm font-medium">Learn exactly how to boost your organic reach</p>
          </div>
        </div>

      </div>
    </div>
  );
}
