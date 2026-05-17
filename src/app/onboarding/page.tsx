'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  
  // Auto-filled form state
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    category: '',
    google_place_id: '',
    google_maps_url: '',
    review_link: ''
  });

  // 🔍 Debounced search as user types
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      const res = await fetch('/api/onboarding/search-gbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await res.json();
      
      if (res.ok && data.places?.length > 0) {
        setSearchResults(data.places);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
  };

  // 🎯 Handle place selection - auto-fill form
  const handleSelectPlace = (place: any) => {
    setSelectedPlace(place);
    setShowDropdown(false);
    
    // Auto-fill form with Google data
    setFormData({
      businessName: place.displayName?.text || place.name || '',
      address: place.formattedAddress || place.formatted_address || '',
      category: place.types?.[0] || 'Other', // Google returns types like "restaurant", "plumber"
      google_place_id: place.placeId || place.place_id || '',
      google_maps_url: place.googleMapsUri || place.google_maps_url || '',
      review_link: place.placeId 
        ? `https://search.google.com/local/writereview?placeid=${place.placeId}` 
        : ''
    });
    
    setSearchQuery(place.displayName?.text || place.name || '');
  };

  // Submit & Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlace) {
      setError('Please select your business from the suggestions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          ...formData
        })
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Connect Your Business</h1>
            <p className="text-slate-500 font-medium leading-relaxed">Search and select your Google Business Profile</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 🔍 Search Input with Autocomplete */}
            <div className="search-container relative space-y-2">
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
                    setSelectedPlace(null);
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
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1">
                  {searchResults.map((place: any) => {
                    const placeId = place.placeId || place.place_id;
                    return (
                      <button
                        key={placeId}
                        type="button"
                        onClick={() => handleSelectPlace(place)}
                        className="w-full text-left p-4 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-all flex items-start gap-4"
                      >
                        <MapPin className="w-5 h-5 text-[#25D366] mt-1 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">
                            {place.displayName?.text || place.name}
                          </div>
                          <div className="text-xs font-medium text-slate-500 mt-1">
                            {place.formattedAddress || place.formatted_address}
                          </div>
                          {place.types?.[0] && (
                            <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                              {place.types[0].replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* 🔍 Autocomplete Guidance Info */}
              {searchQuery.trim().length >= 3 && searchResults.length === 0 && !loading && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 text-xs font-semibold text-slate-500">
                  Type more to see suggestions...
                </div>
              )}
            </div>

            {/* ✅ Selected Business Preview */}
            {selectedPlace && (
              <div className="bg-emerald-50/70 border-2 border-emerald-100 p-6 rounded-[2rem] space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                  <span className="font-bold text-emerald-800">Connected Profile</span>
                </div>
                <div className="space-y-2 text-sm text-slate-700 font-semibold pl-9">
                  <div><strong className="text-slate-900">Name:</strong> {formData.businessName}</div>
                  <div><strong className="text-slate-900">Address:</strong> {formData.address}</div>
                  <div><strong className="text-slate-900">Category:</strong> {formData.category}</div>
                </div>
              </div>
            )}

            {/* 📝 Editable Fields (Optional Details) */}
            {selectedPlace && (
              <details className="border-2 border-slate-100 rounded-[2.5rem] p-4 bg-slate-50/50 transition-all select-none">
                <summary className="cursor-pointer text-sm font-bold text-slate-700 hover:text-slate-950 flex items-center gap-2 outline-none">
                  <span>✏️</span> Edit details (optional)
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 ml-1">Business Name</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-[#25D366] focus:bg-white bg-white outline-none transition-all font-semibold text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 ml-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-[#25D366] focus:bg-white bg-white outline-none transition-all font-semibold text-slate-900"
                      placeholder="e.g. Plumber, Restaurant, Salon"
                    />
                  </div>
                </div>
              </details>
            )}

            {/* 🚀 Submission Button */}
            <button
              type="submit"
              disabled={loading || !selectedPlace}
              className="w-full bg-[#0F5C4D] hover:bg-[#073a30] text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : selectedPlace ? (
                <>
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <span>Select your business to continue</span>
              )}
            </button>

          </form>
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
