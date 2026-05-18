'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  const plan = searchParams.get('plan') || 'free';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/signup?plan=${plan}`);
      }
    };
    checkUser();
  }, [router, plan]);

  // Real-time search with 400ms debounce
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/gbp/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      // ✅ Map API response to robust UI-friendly format
      const mappedPlaces = data.places?.map((place: any) => ({
        placeId: place.id || place.placeId,
        name: place.displayName?.text || place.name,
        displayName: place.displayName,
        formattedAddress: place.formattedAddress || place.formatted_address,
        formatted_address: place.formattedAddress,
        primaryType: place.primaryType || place.types?.[0],
        types: place.types || [place.primaryType],
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        // ✅ Generate placeholder image if no photoUrl
        photoUrl: place.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(place.displayName?.text || place.name)}&background=0D8ABC&color=fff&size=128`
      })) || [];
      
      console.log('📊 Mapped places:', mappedPlaces.length);
      
      if (mappedPlaces.length > 0) {
        setSearchResults(mappedPlaces);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setError('No businesses found. Try a different search term.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (business: any) => {
    console.log('✅ Selected:', business);
    setSelectedBusiness(business);
    setShowDropdown(false);
    setSearchQuery(business.name || business.displayName?.text || '');
  };

  const handleComplete = async () => {
    if (!selectedBusiness) {
      setError('Please select your business from the search results');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const res = await fetch('/api/gbp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          businessName: selectedBusiness.name,
          address: selectedBusiness.formattedAddress,
          category: selectedBusiness.primaryType || 'Other',
          googlePlaceId: selectedBusiness.placeId,
          plan
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Connect error:', err);
      setError(err.message || 'Failed to connect business');
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 font-sans relative overflow-hidden text-slate-100 flex flex-col justify-center items-center p-6">
      {/* Decorative ambient glowing blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-[#0F5C4D]/25 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] bg-emerald-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center space-y-6">
        {/* Logo / Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Building2 className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">Neerzy</span>
        </div>

        {/* Premium Glassmorphic Card */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 p-8 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Connect Your Business</h1>
            <p className="text-slate-400 text-xs font-semibold mt-2.5">Search and select your Google Business Profile</p>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 px-4 py-3.5 rounded-2xl mb-6 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Input Autocomplete */}
          <div className="relative mb-6" ref={dropdownRef}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Search Business Profile *</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedBusiness(null);
                  setShowDropdown(true);
                }}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-semibold text-white text-sm placeholder:text-slate-600"
                placeholder="Search your business name..."
                autoComplete="off"
              />
            </div>
            
            {loading && (
              <div className="absolute right-4 top-[38px] z-10">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              </div>
            )}

            {/* ✅ Search Results Dropdown - Fixed Display */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl max-h-80 overflow-y-auto p-2 space-y-1 backdrop-blur-md">
                {searchResults.map((place, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectBusiness(place)}
                    className={`w-full text-left p-3.5 rounded-xl hover:bg-slate-900 border transition-all flex items-start gap-3 cursor-pointer ${
                      selectedBusiness?.placeId === place.placeId 
                        ? 'bg-slate-900 border-emerald-500/40 text-emerald-400' 
                        : 'border-transparent text-slate-200'
                    }`}
                  >
                    {/* ✅ Profile Picture / Placeholder */}
                    <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
                      {place.photoUrl ? (
                        <img 
                          src={place.photoUrl} 
                          alt={place.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(place.name)}&background=0D8ABC&color=fff&size=128`;
                          }}
                        />
                      ) : (
                        <span className="text-lg">🏪</span>
                      )}
                    </div>
                    
                    {/* ✅ Business Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate group-hover:text-emerald-400">
                        {place.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">
                        {place.formattedAddress}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wide bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                          {place.primaryType || 'Business'}
                        </span>
                        {place.rating && (
                          <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{place.rating} ({place.user_ratings_total || 0})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {showDropdown && searchQuery.trim().length >= 3 && searchResults.length === 0 && !loading && !error && (
              <div className="absolute z-50 w-full mt-2 bg-slate-950/95 border border-slate-800 rounded-2xl p-4 text-center text-slate-500 text-xs font-semibold backdrop-blur-md">
                No businesses found. Try a different search term.
              </div>
            )}
          </div>

          {/* ✅ Selected Business Preview */}
          {selectedBusiness && (
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 mb-6 space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Listing Selected Successfully</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 font-semibold pl-7">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mr-1.5">Name:</span> {selectedBusiness.name}</div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mr-1.5">Address:</span> {selectedBusiness.formattedAddress}</div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mr-1.5">Category:</span> {selectedBusiness.primaryType}</div>
              </div>
            </div>
          )}

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={loading || !selectedBusiness}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center gap-2 group text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting Listing...</span>
              </>
            ) : (
              <>
                <span>Complete Setup</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-500 font-bold mt-5">
            We will synchronize your Google Profile and activate your WhatsApp thread instantly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-bold space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs uppercase tracking-widest font-black text-slate-500">Loading Onboarding Session...</span>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
