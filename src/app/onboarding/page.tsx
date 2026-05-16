'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Tag, 
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
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // Search GBP via Google Places
  const searchGBP = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a business name to search');
      return;
    }
    
    setLoading(true);
    setError('');
    setSearchResults([]);
    setSelectedPlace(null);

    try {
      const res = await fetch('/api/onboarding/search-gbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      const data = await res.json();
      
      if (res.ok && data.places && data.places.length > 0) {
        setSearchResults(data.places);
      } else {
        setError('No businesses found. Try a different search term.');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit & Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessName || !category) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!selectedPlace) {
      setError('Please select your business from the search results');
      return;
    }

    setLoading(true);
    setError('');

    // Ensure we get the place ID correctly from the response
    const placeId = selectedPlace.placeId || selectedPlace.place_id || selectedPlace.id;

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          businessName,
          address: selectedPlace.formattedAddress || '',
          category,
          google_place_id: placeId || null,
          google_maps_url: selectedPlace.googleMapsUri || '',
          review_link: placeId 
            ? `https://search.google.com/local/writereview?placeid=${placeId}` 
            : null
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F5C4D] via-[#073a30] to-[#041e19] flex items-center justify-center p-6 font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-100/20">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-6 shadow-sm">
              <Building2 className="w-8 h-8 text-[#25D366]" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Complete Your Profile</h1>
            <p className="text-slate-500 font-medium leading-relaxed">Connect your Google Business Profile to start</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Business Name *</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Ali Plumbing"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-[#25D366] focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Category *</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 border-2 border-slate-100 rounded-2xl focus:border-[#25D366] focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900 appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                    <option value="AC Repair">AC Repair</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 ml-1">Search Google Business Profile</label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Business name + city"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-[#25D366] focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={searchGBP}
                  disabled={loading}
                  className="bg-slate-900 text-white px-6 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="border-2 border-slate-100 rounded-2xl max-h-48 overflow-y-auto bg-slate-50/30 p-2 space-y-2">
                {searchResults.map((place: any) => {
                  const placeId = place.placeId || place.place_id || place.id;
                  const isSelected = selectedPlace && (selectedPlace.placeId || selectedPlace.place_id || selectedPlace.id) === placeId;
                  
                  return (
                    <button
                      key={placeId}
                      type="button"
                      onClick={() => setSelectedPlace(place)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                        isSelected
                          ? 'border-[#25D366] bg-emerald-50 shadow-sm' 
                          : 'border-transparent bg-white hover:border-emerald-100'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{place.displayName?.text}</div>
                        <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {place.formattedAddress}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-[#25D366] mt-1 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPlace && (
              <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Connected Profile</p>
                  <p className="text-sm font-bold text-slate-900">{selectedPlace.displayName?.text}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !businessName || !category || !selectedPlace}
              className="w-full bg-[#0F5C4D] hover:bg-[#073a30] text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight className="w-5 h-5" />
                </>
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
