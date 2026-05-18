'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');

  // 🔍 Debounced search as user types
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      await searchGBP(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchGBP = async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gbp/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSearchResults(data.places || []);
        setShowDropdown(true);
      } else {
        setError(data.error || 'Failed to fetch search results');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search error. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (place: any) => {
    setSelectedBusiness(place);
    setShowDropdown(false);
    setSearchQuery(place.displayName?.text || place.name || '');
  };

  const handleComplete = async () => {
    if (!selectedBusiness) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/gbp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: selectedBusiness.displayName?.text || selectedBusiness.name,
          address: selectedBusiness.formattedAddress || selectedBusiness.formatted_address,
          category: selectedBusiness.types?.[0] || 'Other',
          googlePlaceId: selectedBusiness.placeId || selectedBusiness.place_id
        })
      });
      
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to complete setup');
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F5C4D] via-[#073a30] to-[#041e19] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-100/20">
          
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-6 shadow-sm">
              <Building2 className="w-8 h-8 text-[#25D366]" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Connect Google Business</h1>
            <p className="text-slate-500 font-medium leading-relaxed font-sans">Search and select your business profile</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            
            {/* 🔍 Search Input with Autocomplete */}
            <div className="relative space-y-2" ref={dropdownRef}>
              <label className="block text-sm font-bold text-slate-700 ml-1">
                Search Your Business *
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedBusiness(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-[#25D366] focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900"
                  placeholder="Start typing your business name..."
                  autoComplete="off"
                  required
                />
              </div>
              
              {/* 🔽 Dropdown Suggestions */}
              {showDropdown && searchResults.length > 0 && (
                <div 
                  className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1"
                  style={{ top: '100%', left: 0, right: 0 }}
                >
                  {searchResults.map((place: any, index: number) => {
                    const placeId = place.placeId || place.place_id;
                    const isSelected = selectedBusiness?.placeId === placeId || selectedBusiness?.place_id === placeId;
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
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                          isSelected ? 'border-emerald-500 bg-emerald-50/60' : 'border-transparent hover:border-emerald-100 hover:bg-emerald-50/30'
                        }`}
                      >
                        <MapPin className="w-5 h-5 text-[#25D366] mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {place.displayName?.text || place.name}
                          </div>
                          <div className="text-xs font-medium text-slate-500 mt-1 truncate">
                            {place.formattedAddress || place.formatted_address}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {place.types?.[0] && (
                              <span className="inline-flex text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {place.types[0].replace(/_/g, ' ')}
                              </span>
                            )}
                            {place.rating && (
                              <span className="inline-flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>{place.rating} ({place.user_ratings_total || 0})</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* 🔍 Searching Indicator */}
              {loading && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 flex items-center justify-center gap-3 text-xs font-semibold text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
                  <span>Searching Google...</span>
                </div>
              )}
            </div>

            {/* ✅ Selected Business Preview */}
            {selectedBusiness && (
              <div className="bg-emerald-50/70 border-2 border-emerald-100 p-6 rounded-[2rem] space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                  <span className="font-bold text-emerald-800">Business Selected</span>
                </div>
                <div className="space-y-2 text-sm text-slate-700 font-semibold pl-9">
                  <div><strong className="text-slate-900">Name:</strong> {selectedBusiness.displayName?.text || selectedBusiness.name}</div>
                  <div><strong className="text-slate-900">Address:</strong> {selectedBusiness.formattedAddress || selectedBusiness.formatted_address}</div>
                  <div><strong className="text-slate-900">Category:</strong> {selectedBusiness.types?.[0]?.replace(/_/g, ' ') || 'Other'}</div>
                </div>
              </div>
            )}

            {/* 🚀 Action Button */}
            <button
              onClick={handleComplete}
              disabled={loading || !selectedBusiness}
              className="w-full bg-[#0F5C4D] hover:bg-[#073a30] text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : selectedBusiness ? (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <span>Select your business to continue</span>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F5C4D] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-white" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
