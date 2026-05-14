'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function GMBAuditTool() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Real-time search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/gmb/search?q=${encodeURIComponent(query)}`);
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
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const selectBusiness = (business: any) => {
    setQuery(business.name);
    setShowDropdown(false);
    // Navigate to audit report
    router.push(`/dashboard/audit-report?placeId=${business.placeId}&name=${encodeURIComponent(business.name)}`);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)]">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F5C4D] mb-4">
            Check Any Business Google Maps &<br />
            <span className="text-[#25D366]">Local SERP Rankings for Free</span>
          </h1>
          <p className="text-[#4F635F] text-lg">
            Find the Business Profile first
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-[24px] shadow-xl border border-[rgba(15,92,77,0.05)] p-8 mb-8" ref={dropdownRef}>
          {/* Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2 bg-[#d4f9e2] text-[#0F5C4D] px-4 py-2 rounded-full font-semibold">
              <span className="bg-[#25D366] text-black w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              <span>Business Profile</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2 text-gray-400 px-4 py-2">
              <span className="bg-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              <span>Keywords</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2 text-gray-400 px-4 py-2">
              <span className="bg-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
              <span>Rankings</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="text-[#0F5C4D] font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Find the Business Profile first
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="John's Plumbing Hub"
                className="w-full p-4 pl-12 border-2 border-gray-100 rounded-xl text-lg text-gray-900 focus:border-[#25D366] focus:outline-none transition"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-6 w-6 border-2 border-[#25D366] border-t-transparent rounded-full"></div>
                </div>
              )}
              {query && (
                <button
                  onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-2 flex items-start gap-2 text-sm text-[#4F635F]">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>A Google Business Profile name is what customers see in the listing on Google Maps.</span>
            </div>

            {/* Autocomplete Results */}
            {showDropdown && results.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                {results.map((business, index) => (
                  <button
                    key={business.placeId}
                    onClick={() => selectBusiness(business)}
                    className={`w-full p-4 text-left hover:bg-[#F0F7F5] transition border-b border-gray-50 last:border-b-0 ${
                      index === selectedIndex ? 'bg-[#d4f9e2] border-l-4 border-l-[#25D366]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-3xl overflow-hidden">
                        {business.photoUrl ? (
                          <img src={business.photoUrl} alt={business.name} className="w-full h-full object-cover" />
                        ) : (
                          "🏪"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-[#0F5C4D]">
                          {business.name}
                        </p>
                        <p className="text-sm text-[#4F635F]">
                          {business.address}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {business.rating && (
                            <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                              ⭐ {business.rating} ({business.reviewCount} reviews)
                            </span>
                          )}
                          {business.phone && (
                            <span className="text-[#4F635F]">📞 {business.phone}</span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-[#4F635F] rounded text-xs capitalize">
                            {business.businessType}
                          </span>
                        </div>
                      </div>
                      <svg
                        className="w-6 h-6 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {showDropdown && query.length >= 3 && results.length === 0 && !loading && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-xl shadow-lg p-6 text-center">
                <p className="text-[#4F635F]">No businesses found. Try a different search term.</p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#25D366] hover:scale-105 text-black px-8 py-4 rounded-full font-bold text-lg transition shadow-lg hover:shadow-xl">
              Start with 5 Free Posts
            </button>
            <button className="text-[#0F5C4D] hover:text-[#167a66] px-8 py-4 font-semibold flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch tutorial
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[#4F635F]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold text-[#0F5C4D]">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold text-[#0F5C4D]">Takes &lt; 60 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold text-[#0F5C4D]">Free instant report</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <div className="text-center py-8 text-[#4F635F]/60 text-sm">
        Neerzy is an independent platform and is not affiliated with Google or WhatsApp.
      </div>
    </div>
  );
}
