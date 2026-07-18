'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Pricing | Neerzy",
  "description": "Pricing plans for Neerzy marketing automation.",
  "url": "https://www.neerzy.com/pricing"
};

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
    href: '/checkout/pro',
    highlight: true,
    badge: 'Most Popular',
    features: [
      { text: '25 posts per month + review requests', included: true },
      { text: '25 review requests-extra', included: true },
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
    href: '/checkout/growth',
    highlight: false,
    features: [
      { text: '60 posts per month + review requests', included: true },
      { text: '60 review requests-extra', included: true },
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
      { text: '250 posts per month + review requests', included: true },
      { text: '250 review requests-extra', included: true },
      { text: 'Up to 10 clients', included: true },
      { text: 'Client management dashboard', included: true },
      { text: 'White-label workflow', included: true },
      { text: 'Bulk workflow tools', included: true },
      { text: 'Shared team access', included: true },
      { text: 'Priority support', included: true },
    ]
  }
];

const COMPARISON = [
  { feature: 'WhatsApp workflow', free: '✓', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Google posts', free: '✓', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Website updates', free: '✓', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Review requests', free: '✓', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Voice notes', free: '—', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Social content', free: '—', pro: '—', growth: '✓', agency: '✓' },
  { feature: 'Analytics', free: 'Basic', pro: 'Basic', growth: 'Advanced', agency: 'Advanced' },
  { feature: 'Multi-client', free: '—', pro: '—', growth: '—', agency: '✓' },
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
    <div className="min-h-screen bg-white font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: 'auto', padding: 'var(--space-7) 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-hero-size)', lineHeight: 'var(--text-hero-line)', fontWeight: 'var(--text-hero-weight)', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
            Simple marketing for <br />
            <span style={{ color: 'var(--color-primary)' }}>busy local businesses</span>
          </h1>
          <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-5)' }}>
            Send a job photo on <WhatsAppIcon size={24} className="text-[#25D366] mx-1" /> <strong>WhatsApp</strong> → Neerzy helps create your Google posts, 
            website updates, and review requests in minutes.
          </p>
          
          {/* Value Bar */}
          <div className="hero-trust" style={{ justifyContent: 'center' }}>
            {['WhatsApp-first workflow', 'Built for traders', 'No dashboards needed', 'Publish in < 60s'].map((item, i) => (
              <div key={i} className="hero-trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {item.includes('WhatsApp') && <WhatsAppIcon size={14} className="mr-1" />}
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {PLANS.map((plan, i) => (
              <div 
                key={i} 
                className="card"
                style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: plan.highlight ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  boxShadow: plan.highlight ? '0 4px 16px rgba(15,81,50,0.12)' : 'var(--shadow-card)'
                }}
              >
                {plan.badge && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-14px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    fontSize: 'var(--text-small-size)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    whiteSpace: 'nowrap'
                  }}>
                    {plan.badge}
                  </div>
                )}
                
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--text-small-size)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-1)' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: 'var(--text-h2-size)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-text-primary)' }}>${plan.price}</span>
                    {plan.price !== '0' && <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 'var(--text-small-size)' }}>/mo</span>}
                  </div>
                  <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', lineHeight: 'var(--text-small-line)' }}>{plan.bestFor}</p>
                </div>

                <Link 
                  href={plan.href}
                  className={plan.highlight ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ width: '100%', textAlign: 'center', marginBottom: 'var(--space-4)' }}
                >
                  {plan.cta}
                </Link>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none', padding: 0, margin: 0 }}>
                  {plan.features.map((feature, j) => (
                    <li key={j} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-small-size)', color: feature.included ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', opacity: feature.included ? 1 : 0.5 }}>
                      <span style={{ 
                        flexShrink: 0, 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '10px',
                        marginTop: '2px',
                        backgroundColor: feature.included ? 'var(--color-bg-soft)' : 'var(--color-border)',
                        color: feature.included ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                      }}>
                        {feature.included ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </span>
                      <span style={{ lineHeight: '1.4' }}>
                        {feature.text.includes('WhatsApp') && <WhatsAppIcon size={12} className="text-[#25D366] mt-0.5 shrink-0" />}
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

      {/* Comparison Table Section */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
              Everything you need to stay active online
            </h2>
          </div>
          
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: 'var(--text-small-size)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>Feature</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-small-size)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-primary)' }}>Free</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-small-size)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-primary)' }}>Pro</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-small-size)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-primary)' }}>Growth</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-small-size)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-primary)' }}>Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--text-body-size)' }}>{row.feature}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{row.free}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', color: 'var(--color-text-primary)', fontWeight: 700 }}>{row.pro}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{row.growth}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{row.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', textAlign: 'center', marginBottom: 'var(--space-7)', letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ 
                    width: '100%', 
                    padding: 'var(--space-4)', 
                    textAlign: 'left', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--text-body-size)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    lineHeight: 'var(--text-body-line)'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ 
                    fontSize: '20px', 
                    transition: 'transform 0.2s ease',
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                    color: 'var(--color-accent)',
                    flexShrink: 0,
                    marginLeft: 'var(--space-3)'
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ 
                    padding: '0 var(--space-4) var(--space-4)', 
                    color: 'var(--color-text-secondary)', 
                    fontSize: 'var(--text-body-size)',
                    lineHeight: 'var(--text-body-line)',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--space-3)'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-final">
        <div className="container">
          <h2>Your next completed job could bring your next customer</h2>
          <p>Send your next job photo on WhatsApp. Neerzy handles the heavy lifting of your marketing work.</p>
          <Link href="#plans" className="btn btn-primary" style={{ fontSize: '18px', padding: '14px 36px' }}>
            Choose Your Plan
          </Link>
          <div style={{ marginTop: 'var(--space-3)', color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-small-size)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            No credit card required
          </div>
        </div>
      </section>
    </div>
  );
}
