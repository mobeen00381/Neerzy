'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Us | Neerzy",
  "description": "Built to help hardworking traders grow online. Neerzy makes marketing simple via WhatsApp.",
  "url": "https://www.neerzy.com/about"
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#25D366]/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* SECTION 1 — HERO: Emotional & Human */}
      <section className="relative pt-24 pb-16 overflow-hidden border-b border-slate-50">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#25D366] opacity-[0.03] rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0F7F5] text-[#0F5C4D] text-[11px] font-black uppercase tracking-[0.2em] rounded-full mb-8">
                Mission-Driven Marketing
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[0.95] mb-6 tracking-tighter">
                Built to help hardworking <span className="text-[#0F5C4D]">traders grow</span> online
              </h1>
              <p className="text-xl text-slate-500 mb-8 leading-relaxed font-medium">
                Most local traders are great at their work — but get left behind online because marketing tools are too complicated. 
              </p>
              <p className="text-lg text-slate-600 mb-12 leading-relaxed">
                Neerzy makes it simple: finish a job, send a WhatsApp message, and stay active online consistently.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/onboarding">
                  <Button className="bg-[#0F5C4D] hover:bg-[#073a30] text-white px-8 py-5 rounded-full font-black text-lg shadow-xl shadow-[#0F5C4D]/20 border-none h-auto">
                    Start Free
                  </Button>
                </Link>
                <Link href="/#how-it-works">
                  <Button variant="ghost" className="px-8 py-5 rounded-full font-black text-lg text-slate-900 hover:bg-slate-50 border-2 border-slate-100 h-auto">
                    See How It Works
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Visual Workflow Mockup */}
            <div className="relative">
              <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-sm relative z-10">
                <div className="space-y-6">
                  {[
                    { icon: '📸', text: 'Job photo from the site', color: 'bg-white' },
                    { icon: '📍', text: 'Google Business update', color: 'bg-white' },
                    { icon: '🌐', text: 'Website content updated', color: 'bg-white' },
                    { icon: '⭐', text: 'Automatic review request', color: 'bg-white' }
                  ].map((item, i) => (
                    <div key={i} className={`${item.color} p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 transform hover:scale-105 transition-all cursor-default`}>
                      <span className="text-3xl">{item.icon}</span>
                      <span className="font-bold text-slate-800">{item.text}</span>
                      <span className="ml-auto text-[#25D366] font-black text-[10px] tracking-widest">LIVE</span>
                    </div>
                  ))}
                </div>
                {/* Floating WhatsApp Bubble */}
                <div className="absolute -bottom-10 -right-10 bg-[#25D366] text-white p-8 rounded-[40px] shadow-2xl rotate-3 flex items-center gap-4 animate-float">
                  <span className="text-4xl">📲</span>
                  <div className="h-2 w-16 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM: Underserved Traders */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">Local traders are underserved online</h2>
            <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
              Many plumbers, electricians, roofers, and HVAC teams work long hours every day. 
              After work, they are expected to be marketing experts. Most never have the time or energy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '❌', t: 'No time after work', d: 'The "second shift" of marketing never happens.' },
              { icon: '❌', t: 'Complex software', d: 'Dashboards built for agencies, not for traders.' },
              { icon: '❌', t: 'Missed reviews', d: 'Happy customers forgotten once the job is done.' },
              { icon: '❌', t: 'Inconsistent presence', d: 'Looking "closed" because profiles stay quiet.' }
            ].map((card, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center group hover:shadow-xl transition-all">
                <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">{card.icon}</div>
                <h4 className="text-lg font-black mb-3 text-slate-900">{card.t}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{card.d}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-20 text-center">
            <p className="text-2xl font-bold text-slate-400">
              So great businesses stay invisible online <br className="hidden md:block" />
              while larger companies dominate search results.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHY WHATSAPP: Premium Dark Section */}
      <section className="py-32 px-6 bg-[#0F5C4D] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-black mb-8 tracking-tight">Why Neerzy works through WhatsApp</h2>
              <p className="text-2xl text-green-200 mb-10 font-medium italic">Because traders already use it every day.</p>
              <p className="text-lg text-slate-300 mb-12 leading-relaxed">
                We did not want traders learning another complicated app or dashboard. 
                WhatsApp is already familiar, fast, and always open. Neerzy fits into 
                the workflow traders already use.
              </p>
              <div className="space-y-6">
                {['Familiar', 'Fast', 'Easy', 'Always Open'].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-xl font-bold">
                    <span className="w-8 h-8 rounded-full bg-[#25D366] text-black flex items-center justify-center text-xs">✔</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/5 p-12 rounded-[48px] border border-white/10 text-center">
               <div className="grid grid-cols-2 gap-8">
                 {[
                   { i: '📸', t: 'Finish job' },
                   { i: '📲', t: 'Send message' },
                   { i: '✍️', t: 'Post prepared' },
                   { i: '⭐', t: 'Review request' }
                 ].map((step, i) => (
                   <div key={i} className="space-y-4">
                      <div className="text-5xl">{step.i}</div>
                      <div className="text-sm font-black uppercase tracking-widest text-slate-400">{step.t}</div>
                   </div>
                 ))}
               </div>
               <div className="mt-12 pt-12 border-t border-white/5">
                 <p className="text-green-400 font-black tracking-[0.2em] text-[10px] uppercase">
                    No complicated systems. No marketing experience needed.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — ON THE SPOT REVIEW: Human Logic */}
      <section className="py-32 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">The best time to ask for a review <br /> is right after the job</h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              When customers are happiest, review response rates are much higher. 
              Local trust grows naturally when it's built on the spot.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-slate-50 p-12 rounded-[40px] border border-slate-100 relative opacity-60">
               <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Without Neerzy</div>
               <div className="flex items-center gap-6 text-2xl font-black text-slate-400">
                 <span className="text-red-500 text-3xl">✕</span> Review forgotten later
               </div>
            </div>
            <div className="bg-[#F0F7F5] p-12 rounded-[40px] border border-[#25D366]/20 relative">
               <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F5C4D] mb-8">With Neerzy</div>
               <div className="flex items-center gap-6 text-2xl font-black text-slate-900">
                 <span className="text-[#25D366] text-3xl">✓</span> Request sent immediately
               </div>
               {/* Visual Indicator */}
               <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                  <span className="text-2xl animate-bounce">⭐</span>
                  <div className="space-y-1">
                    <div className="h-1 w-12 bg-slate-100 rounded-full"></div>
                    <div className="h-1 w-8 bg-slate-100 rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <p className="text-[11px] text-slate-400 italic max-w-md mx-auto">
              Neerzy helps businesses request reviews responsibly and does not support fake or incentivized reviews.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — OUR MISSION: Emotional Commitment */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-black text-slate-900 mb-12 tracking-tight">Helping local businesses compete fairly</h2>
          <p className="text-2xl text-slate-500 font-medium leading-relaxed mb-16">
            We believe small local businesses should not need expensive agencies or large marketing teams just to stay visible online.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {['Build Trust', 'Stay Active', 'Consistent Reviews', 'Improve Visibility', 'Save Time'].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#25D366] font-black text-xl italic">
                   {i + 1}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — FREEDOM & EMPOWERMENT: Personal Growth */}
      <section className="py-32 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">Built to give businesses more independence</h2>
              <p className="text-xl text-slate-500 font-medium mb-10 leading-relaxed">
                Many traders spend years working under larger companies before starting their own. 
                But online marketing often becomes another barrier to that freedom.
              </p>
              <div className="space-y-4">
                <p className="text-lg font-bold text-slate-700">Neerzy helps you build your own legacy:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { t: 'Own website', i: '🌐' },
                    { t: 'Own reviews', i: '⭐' },
                    { t: 'Own GMB visibility', i: '📍' },
                    { t: 'Own reputation', i: '📈' }
                  ].map((card, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-[#F0F7F5] hover:border-[#25D366]/20 transition-all cursor-default">
                       <span className="text-2xl">{card.i}</span>
                       <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">{card.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-slate-50 rounded-[64px] flex items-center justify-center relative overflow-hidden group">
                 <div className="text-[120px] filter grayscale group-hover:grayscale-0 transition-all duration-700">🏗️</div>
                 <div className="absolute inset-x-0 bottom-12 text-center">
                    <h5 className="text-2xl font-black text-slate-900 mb-2">Your business.</h5>
                    <p className="text-[#25D366] font-black uppercase tracking-[0.3em] text-xs">Your name. Your growth.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — TRUST & COMPLIANCE */}
      <section className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-12 tracking-tight">Built with trust and compliance in mind</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              'Google-compliant workflows', 'Full publishing control', 'No fake reviews or spam', 'You own your data'
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 justify-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <span className="text-[#25D366]">✔</span> {t}
              </div>
            ))}
          </div>
          <p className="mt-16 text-[10px] text-slate-400 italic max-w-lg mx-auto leading-relaxed">
            Neerzy is an independent platform and is not affiliated with Google or WhatsApp. 
            Google Business Profile and WhatsApp are trademarks of their respective owners.
          </p>
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-[#0F5C4D] via-[#073a30] to-black rounded-[64px] p-20 md:p-32 text-center text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-full h-full bg-[#25D366]/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl -mr-64 -mt-64 animate-pulse"></div>
             
             <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] relative z-10 tracking-tighter">
               Your next completed job <br className="hidden md:block" /> could bring your next customer
             </h2>
             
             <p className="text-2xl text-slate-400 mb-16 max-w-2xl mx-auto relative z-10 font-medium">
               Send your next job on WhatsApp. Neerzy helps you stay visible online consistently.
             </p>
             
             <div className="relative z-10 space-y-8">
               <Link href="/onboarding">
                 <Button className="bg-[#25D366] hover:bg-[#1da851] text-black px-16 py-8 rounded-full font-black text-3xl shadow-2xl transition-all hover:scale-105 active:scale-95 border-none h-auto">
                    Start with 5 Free Posts
                 </Button>
               </Link>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
