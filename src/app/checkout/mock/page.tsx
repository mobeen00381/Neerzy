'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Loader2 } from 'lucide-react';

function MockCheckout() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const [loading, setLoading] = useState(false);

  const handleComplete = () => {
    setLoading(true);
    // Simulate processing time
    setTimeout(() => {
      window.location.href = `/welcome?plan=${plan}`;
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366] opacity-10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        
        <div className="w-16 h-16 bg-[#F0F7F5] text-[#0F5C4D] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>

        <h2 className="text-3xl font-black mb-2 text-slate-900 tracking-tight">Checkout Simulation</h2>
        <p className="text-slate-500 mb-8 font-medium">
          The live Paddle checkout is currently bypassed because the API keys are in development mode.
        </p>
        
        <div className="bg-slate-50 rounded-2xl p-5 text-left mb-8 border border-slate-100">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Selected Plan</div>
          <div className="text-xl font-black text-[#0F5C4D] capitalize">{plan} Plan</div>
          <div className="mt-4 border-t border-slate-200 pt-4 flex justify-between items-center">
            <span className="text-slate-600 font-semibold">Total</span>
            <span className="text-2xl font-black text-slate-900">$0.00 <span className="text-sm text-slate-400 font-medium">/mo (Mock)</span></span>
          </div>
        </div>

        <button 
          onClick={handleComplete}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-black font-black py-4 rounded-xl text-lg hover:bg-[#20bd5a] active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-[#25D366]/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Complete Test Payment'
          )}
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    }>
      <MockCheckout />
    </Suspense>
  );
}
