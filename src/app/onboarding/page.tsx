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
  ArrowLeft, 
  Loader2,
  Globe
} from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // Search GBP via Google Places
  const searchGBP = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/search-gbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setSearchResults(data.places || []);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit & Redirect
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          businessName,
          address: selectedPlace?.formattedAddress || address,
          category,
          google_place_id: selectedPlace?.id || null,
          google_maps_url: selectedPlace?.googleMapsUri || null,
          review_link: selectedPlace?.id 
            ? `https://search.google.com/local/writereview?placeid=${selectedPlace.id}` 
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
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F5C4D] via-[#073a30] to-[#041e19] flex items-center justify-center p-6 font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-100/20">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-6 shadow-sm">
              <Building2 className="w-8 h-8 text-[#25D366]" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Welcome to Neerzy</h1>
            <p className="text-slate-500 font-medium leading-relaxed">Set up your business profile in 2 easy steps</p>
            
            {/* Progress Bar */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step === 1 ? 'bg-[#25D366]' : 'bg-emerald-100'}`} />
              <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step === 2 ? 'bg-[#25D366]' : 'bg-emerald-100'}`} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Business Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Ali Plumbing Services"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-[#25D366] focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Business Category</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
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

              <button
                type="submit"
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                <span>Next: Find Google Profile</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Search your Google Business Profile</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#25D366] transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Business name + city"
                      className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-[#25D366] focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchGBP}
                    disabled={loading || !searchQuery}
                    className="bg-slate-900 text-white px-6 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="border-2 border-slate-100 rounded-2xl max-h-60 overflow-y-auto bg-slate-50/30 p-2 space-y-2 custom-scrollbar">
                  {searchResults.map((place: any) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setSelectedPlace(place)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                        selectedPlace?.id === place.id 
                          ? 'border-[#25D366] bg-emerald-50 shadow-sm' 
                          : 'border-transparent bg-white hover:border-emerald-100'
                      }`}
                    >
                      <div className={`mt-1 p-2 rounded-lg ${selectedPlace?.id === place.id ? 'bg-[#25D366] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{place.displayName?.text}</div>
                        <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {place.formattedAddress}
                        </div>
                      </div>
                      {selectedPlace?.id === place.id && (
                        <CheckCircle2 className="w-5 h-5 text-[#25D366] mt-1 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedPlace && (
                <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Connected Successfully</p>
                    <p className="text-sm font-bold text-slate-900">{selectedPlace.displayName?.text}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white border-2 border-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || !businessName || !category}
                  className="flex-[2] bg-[#0F5C4D] hover:bg-[#073a30] text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Complete Setup</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
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
