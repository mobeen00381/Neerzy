'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Search, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  TrendingUp 
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
        body: JSON.stringify({ query, limit: 15 }) // Get max results
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
    
    // Navigate to audit results page with business data
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] py-20 px-6 font-sans relative overflow-hidden flex items-center justify-center">
      {/* Decorative background vectors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-3xl w-full mx-auto relative z-10 space-y-8">
        
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

        {/* Search Box with Autocomplete */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 border border-emerald-50/10 animate-in fade-in zoom-in-95 duration-300 relative space-y-4" ref={dropdownRef}>
          <label className="block text-sm font-bold text-slate-700 ml-2">
            Search Your Business
          </label>
          <div className="relative group flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-2xl border-2 border-slate-100 focus-within:border-[#25D366] focus-within:bg-white transition-all">
            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-[#25D366] transition-colors shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedBusiness(null);
              }}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className="flex-1 text-lg outline-none text-slate-800 placeholder-slate-400 bg-transparent font-semibold"
              placeholder="Start typing your business name..."
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="animate-spin h-6 w-6 text-[#25D366] shrink-0" />
            )}
          </div>

          {/* 🔽 Dropdown Suggestions */}
          {showDropdown && searchResults.length > 0 && (
            <div 
              className="absolute z-50 w-[calc(100%-3rem)] left-6 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1"
              style={{ top: '100%' }}
            >
              {searchResults.map((place: any, index: number) => {
                const placeId = place.placeId || place.place_id;
                return (
                  <button
                    key={placeId || index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectBusiness(place);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="w-full text-left p-4 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-all flex items-start gap-4 cursor-pointer"
                  >
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {place.displayName?.text || place.name}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 mt-1 truncate">
                        {place.formattedAddress || place.formatted_address}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results message */}
          {searchQuery.trim().length >= 3 && searchResults.length === 0 && !loading && (
            <div className="absolute z-50 w-[calc(100%-3rem)] left-6 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 text-xs font-semibold text-slate-500 text-center" style={{ top: '100%' }}>
              No businesses found. Try a different search term.
            </div>
          )}

          {/* Selected Business Preview */}
          {selectedBusiness && (
            <div className="bg-emerald-50/70 border-2 border-emerald-100 p-6 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 mt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                <span className="font-bold text-emerald-800">Business Selected</span>
              </div>
              <div className="space-y-2 text-sm text-slate-700 font-semibold pl-9">
                <div><strong className="text-slate-900">Name:</strong> {selectedBusiness.displayName?.text || selectedBusiness.name}</div>
                <div><strong className="text-slate-900">Address:</strong> {selectedBusiness.formattedAddress || selectedBusiness.formatted_address}</div>
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            onClick={handleRunAudit}
            disabled={!selectedBusiness || loading}
            className="w-full bg-[#0F5C4D] hover:bg-[#073a30] text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            <span>Analyze Profile</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs font-bold text-slate-400 mt-4 text-center">
            🔒 Free audit — no signup required
          </p>

        </div>

      </div>
    </div>
  );
}
