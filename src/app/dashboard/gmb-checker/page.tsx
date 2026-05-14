'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { 
  Search, Shield, MapPin, Loader2, ArrowRight, Star,
  AlertCircle, LayoutGrid, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GMBChecker() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search (wait 300ms after user stops typing)
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

  // Trigger search when query changes
  useEffect(() => {
    searchBusinesses(query);
    return () => searchBusinesses.cancel();
  }, [query, searchBusinesses]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
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

  const selectBusiness = (business: any) => {
    setQuery(business.name);
    setShowDropdown(false);
    router.push(`/dashboard/gmb-report?placeId=${business.placeId}&name=${encodeURIComponent(business.name)}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-blue-100 rounded-3xl mb-2">
          <Shield className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
          Check Any Business <span className="text-blue-600">Google Maps</span> Visibility
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
          Start typing a business name to run an instant AI-powered health audit.
        </p>
      </div>

      <div className="relative z-50 max-w-3xl mx-auto" ref={dropdownRef}>
        {/* Search Input Box */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-3 border border-slate-100 relative group transition-all focus-within:ring-8 focus-within:ring-blue-50">
          <div className="relative flex items-center">
            <Search className="absolute left-6 h-7 w-7 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && setShowDropdown(true)}
              placeholder="e.g. Acme Plumbing London"
              className="w-full pl-16 pr-24 py-6 bg-transparent border-none outline-none font-bold text-2xl text-slate-900 placeholder:text-slate-300"
              autoComplete="off"
            />
            {loading ? (
              <div className="absolute right-8">
                <Loader2 className="animate-spin h-7 w-7 text-blue-600" />
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
          <div className="absolute w-full mt-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Search Results</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Esc to close</span>
            </div>
            <div className="max-h-[450px] overflow-y-auto">
              {results.map((business, index) => (
                <button
                  key={business.placeId}
                  onClick={() => selectBusiness(business)}
                  className={`w-full p-6 text-left transition-all border-b border-slate-50 last:border-b-0 flex items-start gap-6 group ${
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${
                    index === selectedIndex ? 'bg-white shadow-sm' : 'bg-white border border-slate-100'
                  }`}>
                    {business.types?.includes('restaurant') ? '🍽️' : 
                     business.types?.includes('store') ? '🛍️' : 
                     business.types?.includes('health') ? '🏥' : 
                     business.types?.includes('home_improvement') ? '🛠️' : '🏢'}
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
                    <div className="flex flex-wrap gap-2">
                      {(business.types || []).slice(0, 2).map((type: string) => (
                        <span key={type} className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 px-2.5 py-1 rounded-md">
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center self-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results Fallback */}
        {showDropdown && query.length >= 2 && results.length === 0 && !loading && (
          <div className="absolute w-full mt-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl p-12 text-center animate-in zoom-in-95 duration-300">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No businesses found</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">
              We couldn't find any listings matching "{query}". Try a different name or add a city.
            </p>
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
        {[
          { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50', title: 'Instant Audit', desc: 'Get a full visibility score in under 3 seconds.' },
          { icon: LayoutGrid, color: 'text-purple-500', bg: 'bg-purple-50', title: 'Grid Analysis', desc: 'See how you rank across your local neighborhood.' },
          { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Actionable Gaps', desc: 'Identify exactly what is missing from your profile.' }
        ].map((feature, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <feature.icon className={`h-7 w-7 ${feature.color}`} />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{feature.title}</h4>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
