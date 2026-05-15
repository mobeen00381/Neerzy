'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

const PLANS = [
  {
    name: 'Free',
    price: '0',
    bestFor: 'Trying Neerzy for the first time',
    cta: 'Start Free',
    href: '/signup?plan=free',
    highlight: false,
    features: [
      { text: '5 WhatsApp posts total', included: true },
      { text: '1 post per day limit', included: true },
      { text: 'Google post generation', included: true },
      { text: 'Website update generation', included: true },
      { text: 'Review request generation', included: true },
      { text: 'Publish workflow page', included: true },
      { text: 'No social posting', included: false },
      { text: 'Neerzy branding visible', included: false },
    ]
  },
  {
    name: 'Pro',
    price: '39',
    bestFor: 'Solo traders & small businesses',
    cta: 'Start Pro',
    href: '/signup?plan=pro',
    highlight: true,
    badge: 'Most Popular',
    features: [
      { text: '25 posts per month', included: true },
      { text: '2 posts per day', included: true },
      { text: 'WhatsApp workflow', included: true },
      { text: 'Google post generation', included: true },
      { text: 'Custom domain support', included: true },
      { text: 'AI post content & captions', included: true },
      { text: 'Voice note support', included: true },
      { text: 'Basic analytics', included: true },
    ]
  },
  {
    name: 'Growth',
    price: '79',
    bestFor: 'Growing businesses posting regularly',
    cta: 'Start Growth',
    href: '/signup?plan=growth',
    highlight: false,
    features: [
      { text: '60 posts per month', included: true },
      { text: '4 posts per day', included: true },
      { text: 'Social content generation', included: true },
      { text: 'Facebook + Instagram content', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Multi-location support', included: true },
      { text: 'Review tracking dashboard', included: true },
    ]
  },
  {
    name: 'Agency',
    price: '199',
    bestFor: 'Marketing agencies & multi-client',
    cta: 'Contact Sales',
    href: 'mailto:sales@neerzy.com',
    highlight: false,
    features: [
      { text: '250 posts per month', included: true },
      { text: 'Up to 10 clients', included: true },
      { text: '2 posts/day per client', included: true },
      { text: 'Client management dashboard', included: true },
      { text: 'White-label workflow', included: true },
      { text: 'Bulk workflow tools', included: true },
      { text: 'Shared team access', included: true },
      { text: 'Priority support', included: true },
    ]
  }
];

const COMPARISON = [
  { feature: 'WhatsApp workflow', free: '✅', pro: '✅', growth: '✅', agency: '✅' },
  { feature: 'Google posts', free: '✅', pro: '✅', growth: '✅', agency: '✅' },
  { feature: 'Website updates', free: '✅', pro: '✅', growth: '✅', agency: '✅' },
  { feature: 'Review requests', free: '✅', pro: '✅', growth: '✅', agency: '✅' },
  { feature: 'Voice notes', free: '❌', pro: '✅', growth: '✅', agency: '✅' },
  { feature: 'Social content', free: '❌', pro: '❌', growth: '✅', agency: '✅' },
  { feature: 'Analytics', free: 'Basic', pro: 'Basic', growth: 'Advanced', agency: 'Advanced' },
  { feature: 'Multi-client', free: '❌', pro: '❌', free2: '❌', agency: '✅' },
];

const FAQS = [
  {
    q: 'Why is posting manual?',
    a: 'To keep businesses in control and stay flexible with platform policies. Neerzy prepares the content, but you decide when it goes live.'
  },
  {
    q: 'Does Neerzy post directly to Google?',
    a: 'Neerzy prepares ready-to-publish content and provides a fast publish workflow. This ensures your posts comply with Google Business Profile policies.'
  },
  {
    q: 'Do I need marketing experience?',
    a: 'No. Neerzy is designed specifically for busy, non-technical local businesses. If you can send a WhatsApp message, you can use Neerzy.'
  },
  {
    q: 'Can I connect my existing website?',
    a: 'Yes. We provide easy integration tools and managed website options for all paid plans.'
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No long-term contracts. You can cancel your subscription directly from your dashboard at any time.'
  }
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Simple marketing for <br className="hidden md:block" />
            <span className="text-[#0F5C4D]">busy local businesses</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Send a job photo on <WhatsAppIcon size={24} className="text-[#25D366] mx-1" /> <strong>WhatsApp</strong> → Neerzy helps create your Google posts, 
            website updates, and review requests in minutes.
          </p>
          
          {/* Value Bar */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {['WhatsApp-first workflow', 'Built for traders', 'No dashboards needed', 'Publish in < 60s'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-bold text-[#0F5C4D] uppercase tracking-widest">
                <span className="bg-[#25D366] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px]">✔</span>
                {item.includes('WhatsApp') && <WhatsAppIcon size={14} className="mr-1" />}
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PLANS.map((plan, i) => (
              <div 
                key={i} 
                className={`relative bg-white p-8 rounded-[24px] shadow-sm border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                  plan.highlight ? 'border-[#0F5C4D] ring-4 ring-[#0F5C4D]/5' : 'border-slate-100'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0F5C4D] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                    {plan.price !== '0' && <span className="text-slate-400 font-bold">/mo</span>}
                  </div>
                  <p className="mt-4 text-sm text-slate-500 font-medium leading-relaxed">{plan.bestFor}</p>
                </div>

                <Link 
                  href={plan.href}
                  className={`block w-full py-4 rounded-xl text-center font-black transition-all active:scale-95 mb-10 ${
                    plan.highlight 
                      ? 'bg-[#0F5C4D] text-white shadow-lg shadow-[#0F5C4D]/20 hover:bg-[#073a30]' 
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className={`flex gap-3 text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400 line-through opacity-50'}`}>
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        feature.included ? 'bg-[#F0F7F5] text-[#25D366]' : 'bg-slate-100 text-slate-300'
                      }`}>
                        {feature.included ? '✔' : '✕'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {feature.text.includes('WhatsApp') && <WhatsAppIcon size={14} className="text-[#25D366]" />}
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section (Desktop Only) */}
      <section className="py-24 px-6 bg-white hidden lg:block">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Everything you need to stay active online</h2>
            <div className="w-20 h-1.5 bg-[#25D366] mx-auto rounded-full"></div>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="py-6 text-sm font-black uppercase tracking-widest text-slate-400">Feature</th>
                <th className="py-6 text-center text-sm font-black uppercase tracking-widest text-slate-900">Free</th>
                <th className="py-6 text-center text-sm font-black uppercase tracking-widest text-[#0F5C4D]">Pro</th>
                <th className="py-6 text-center text-sm font-black uppercase tracking-widest text-slate-900">Growth</th>
                <th className="py-6 text-center text-sm font-black uppercase tracking-widest text-slate-900">Agency</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-6 font-bold text-slate-700">{row.feature}</td>
                  <td className="py-6 text-center text-slate-500 font-medium">{row.free}</td>
                  <td className="py-6 text-center text-slate-900 font-bold">{row.pro}</td>
                  <td className="py-6 text-center text-slate-500 font-medium">{row.growth}</td>
                  <td className="py-6 text-center text-slate-500 font-medium">{row.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left flex justify-between items-center transition-colors hover:bg-slate-50"
                >
                  <span className="font-bold text-slate-900">{faq.q}</span>
                  <span className={`text-2xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-[#0F5C4D] rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366] opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight relative z-10">
              Your next completed job could <br className="hidden md:block" />
              bring your next customer
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto relative z-10">
              Send your next job photo on WhatsApp. Neerzy handles the heavy lifting of your marketing work.
            </p>
            <div className="relative z-10">
              <Link 
                href="#plans" 
                className="inline-block bg-[#25D366] text-black px-12 py-5 rounded-full font-black text-xl shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all"
              >
                Choose Your Plan
              </Link>
              <div className="mt-6 text-slate-400 text-sm font-bold uppercase tracking-widest">
                No credit card required
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
