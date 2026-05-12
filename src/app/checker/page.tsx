'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function CheckerPage() {
  const [businessName, setBusinessName] = useState('');
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen font-sans">
      {/* HERO SECTION - ALL STORY ABOVE THE FOLD */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-24 overflow-hidden bg-gradient-to-br from-[#0F5C4D] via-[#073a30] to-black">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#25D366] opacity-[0.05] rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>

        <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
          
          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
            Check Any Business Google Maps & <br className="hidden md:block" /> Local Visibility for Free
          </h1>

          {/* MAIN CHECKER CARD - Minimal & Clean */}
          <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden text-left mb-12">
            
            {/* Step Indicator */}
            <div className="flex border-b border-slate-100">
              {[
                { num: 1, label: 'Business Profile' },
                { num: 2, label: 'Keywords' },
                { num: 3, label: 'Visibility Score' }
              ].map((s, i) => (
                <div 
                  key={i} 
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 text-xs md:text-[13px] font-black uppercase tracking-widest border-b-4 transition-all ${
                    step === s.num ? 'border-[#25D366] text-[#0F5C4D]' : 'border-transparent text-slate-300'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    step === s.num ? 'bg-[#0F5C4D] text-white' : 'bg-slate-100 text-slate-300'
                  }`}>
                    {s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Card Body */}
            <div className="p-6 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">⌨️</span>
                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Find the Business Profile first</h3>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-300 group-focus-within:text-[#0F5C4D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search by Google Business Profile name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-full border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#0F5C4D] focus:ring-4 focus:ring-[#0F5C4D]/5 outline-none transition-all text-base font-medium placeholder:text-slate-300"
                />
              </div>

              <div className="mt-6 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">i</div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                  A Google Business Profile name is what customers see in the listing on Google Maps.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding">
              <Button className="bg-[#25D366] hover:bg-[#1da851] text-black px-10 py-5 rounded-full font-black text-base shadow-xl shadow-[#25D366]/20 transition-all hover:scale-105 active:scale-95 border-none h-auto min-w-[220px]">
                 Start with 5 Free Posts
              </Button>
            </Link>
            <button className="px-8 py-3 text-white font-bold hover:bg-white/10 rounded-full transition-all text-sm">
              Watch tutorial
            </button>
          </div>

          {/* Value Tags */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-60">
             {['No Credit Card Required', 'Takes < 60 Seconds', 'Free Instant Report'].map((tag, i) => (
               <div key={i} className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                 <span className="text-[#25D366]">✔</span> {tag}
               </div>
             ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
           <div className="w-px h-8 bg-white rounded-full"></div>
        </div>
      </section>

      {/* FOOTER PADDING */}
      <div className="bg-white py-20 text-center">
         <p className="text-slate-400 text-xs italic">
           Neerzy is an independent platform and is not affiliated with Google or WhatsApp.
         </p>
      </div>
    </div>
  );
}
