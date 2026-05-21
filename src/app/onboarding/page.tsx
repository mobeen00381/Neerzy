'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

  // Check if already onboarded
  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.gbp_connected) {
        router.push('/dashboard');
      } else if (user) {
        // Fallback check: look up in business_profiles directly
        const phone = user.phone || user.user_metadata?.phone_number || user.user_metadata?.phone;
        if (phone) {
          const { data } = await supabase
            .from('business_profiles')
            .select('google_place_id')
            .eq('user_phone', phone)
            .maybeSingle();
            
          if (data?.google_place_id) {
            // Update metadata so we don't have to check DB next time
            await supabase.auth.updateUser({
              data: { gbp_connected: true }
            });
            router.push('/dashboard');
          }
        }
      }
    };
    checkStatus();
  }, [router]);

  // Real-time search as user types
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
      // ✅ Uses the EXACT same endpoint that works in Audit Tool
      const res = await fetch('/api/gbp/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Search failed');
      
      // ✅ Map API response to UI format
      const mapped = data.places?.map((p: any) => ({
        placeId: p.id || p.placeId,
        name: p.displayName?.text || p.name,
        formattedAddress: p.formattedAddress || p.formatted_address,
        primaryType: p.primaryType || p.types?.[0] || 'Business',
        rating: p.rating,
        photoUrl: p.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.displayName?.text || p.name)}&background=059669&color=fff&size=128`
      })) || [];

      if (mapped.length > 0) {
        setSearchResults(mapped);
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

  const handleSelect = (business: any) => {
    setSelectedBusiness(business);
    setShowDropdown(false);
    setSearchQuery(business.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await fetch('/api/gbp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          phone: user?.phone || user?.user_metadata?.phone_number,
          businessName: selectedBusiness.name,
          address: selectedBusiness.formattedAddress,
          category: selectedBusiness.primaryType,
          googlePlaceId: selectedBusiness.placeId,
          googleMapsUrl: selectedBusiness.googleMapsUri, // Direct GBP Link for merchant posts
          plan
        })
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to connect business');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Connect Your Business</h1>
        <p className="text-center text-gray-600 mb-6">Search and select your Google Business Profile</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Input */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Business Profile *</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedBusiness(null);
                setShowDropdown(true);
              }}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g. blacksmith door handles"
              autoComplete="off"
              required
            />
            
            {loading && (
              <div className="absolute right-3 top-9">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              </div>
            )}

            {/* ✅ Results Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {searchResults.map((place, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(place)}
                    className={`w-full text-left p-3 border-b border-gray-100 last:border-b-0 hover:bg-green-50 transition flex items-start gap-3 ${
                      selectedBusiness?.placeId === place.placeId ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img src={place.photoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{place.name}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{place.formattedAddress}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{place.primaryType}</span>
                        {place.rating && <span className="text-xs text-yellow-600">⭐ {place.rating}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          {/* Selected Preview */}
          {selectedBusiness && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
              ✅ <strong>Selected:</strong> {selectedBusiness.name}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedBusiness}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Complete Setup →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-semibold">
        Loading onboarding...
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
