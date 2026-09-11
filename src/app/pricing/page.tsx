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
      { text: '5 posts per month', included: true },
      { text: '5 review requests per month', included: true },
      { text: 'Google posts + review asks', included: true },
      { text: 'Send jobs by WhatsApp or the app link', included: true },
      { text: 'Your own domain ($19 once)', included: false },
      { text: 'Website builder', included: false },
      { text: 'Social posting', included: false },
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
      { text: '25 posts + 25 review requests per month', included: true },
      { text: 'Send jobs by WhatsApp or the app link', included: true },
      { text: 'Your own domain — $19 once', included: true },
      { text: 'Website builder — $99 setup FREE for early adopters', included: true },
      { text: 'Website hosting — $10/month, first 90 days free', included: true },
      { text: 'AI post content, captions & voice notes', included: true },
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
      { text: '60 posts + 60 review requests per month', included: true },
      { text: 'Your own domain — $19 once', included: true },
      { text: 'Website builder — $99 setup FREE for early adopters', included: true },
      { text: 'Website hosting — $10/month, first 90 days free', included: true },
      { text: 'Facebook + Instagram content', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Advanced analytics + review tracking', included: true },
    ]
  },
  {
    name: 'Agency',
    price: '199',
    bestFor: 'Marketing agencies managing up to 10 traders',
    cta: 'Contact Sales',
    href: 'mailto:sales@neerzy.com',
    highlight: false,
    features: [
      { text: 'Up to 10 traders — each connects their own WhatsApp', included: true },
      { text: '300 posts + 300 review requests per month (30 per trader)', included: true },
      { text: 'One domain per client — $19 each', included: true },
      { text: 'Website builder per client — $99 setup FREE for early adopters', included: true },
      { text: 'Hosting $10/month per site, first 90 days free', included: true },
      { text: 'Google + Facebook + Instagram posts for every trader', included: true },
      { text: 'Agency overview dashboard + priority support', included: true },
    ]
  }
];

const COMPARISON = [
  { feature: 'Send by WhatsApp or the app link', free: '✓', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Google posts', free: '✓', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Review asks (WhatsApp, SMS or link)', free: '✓', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Your own domain ($19 once)', free: '—', pro: '✓', growth: '✓', agency: '✓ up to 10' },
  { feature: 'Website builder (setup $99 — FREE for early adopters)', free: '—', pro: '✓', growth: '✓', agency: '✓ up to 10' },
  { feature: 'Website hosting ($10/month)', free: '—', pro: '90 days free', growth: '90 days free', agency: '90 days free' },
  { feature: 'Voice notes', free: '—', pro: '✓', growth: '✓', agency: '✓' },
  { feature: 'Social content', free: '—', pro: '—', growth: '✓', agency: '✓' },
  { feature: 'Analytics', free: 'Basic', pro: 'Basic', growth: 'Advanced', agency: 'Advanced' },
  { feature: 'Manage 10 traders', free: '—', pro: '—', growth: '—', agency: '✓' },
];

/** Add-ons sold on top of any paid plan. */
const ADD_ONS = [
  {
    icon: '🌐',
    name: 'Your own domain',
    price: '$19',
    note: 'one-time',
    bullets: [
      'Registered in your name',
      'Connected and live for you',
      'Padlock (SSL) included',
      'Renews at the same price',
    ],
    cta: 'Claim Your Name',
    href: '/onboarding',
  },
  {
    icon: '🖥️',
    name: 'Your website',
    price: 'FREE',
    strike: '$99',
    note: 'setup — early adopters',
    bullets: [
      'Built from your Google listing',
      'Live in about one minute',
      'Every job updates it by itself',
      'Google-ready and AI-ready',
    ],
    cta: 'Build My Website — Free',
    href: '/onboarding',
    highlight: true,
  },
  {
    icon: '🚀',
    name: 'Hosting',
    price: '$10',
    note: 'per month — first 90 days free',
    bullets: [
      'Fast and always on',
      'Padlock (SSL) handled',
      'Cancel anytime',
      'No setup fees, no surprises',
    ],
    cta: 'Start Free — 5 Posts',
    href: '/signup?plan=free',
  },
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
    q: 'Do I need WhatsApp?',
    a: 'No. Send every job from WhatsApp or from the Neerzy link. Both work the same way. Save the link to your home screen and it works like an app. Nothing to download.'
  },
  {
    q: 'What if my customer does not use WhatsApp?',
    a: 'One tap sends the review request by text, or copies your link. It is ready — you just press send.'
  },
  {
    q: 'Is the website extra?',
    a: 'Your own domain is $19 once. The website build is $99 — free for early adopters. Hosting is $10/month, with the first 90 days free. The Free plan gives you Google posts and review asks, without a domain or website.'
  },
  {
    q: 'Can I keep my existing website?',
    a: 'Yes. Your old site can stay online. Neerzy builds your own site on your own domain, and every job keeps it fresh.'
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No long-term contracts. You can cancel your subscription directly from your dashboard at any time.'
  }
];

const pricingMobileStyles = `
  @media (max-width: 768px) {
    .pricing-grid-4 { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }
    .pricing-grid-3 { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }
    .pricing-grid-2 { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }
    .pricing-compare-grid { grid-template-columns: 1fr !important; max-width: 400px !important; }
  }
`;

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white font-sans">
      <style>{pricingMobileStyles}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: 'auto', padding: 'var(--space-7) 0', borderBottom: 'none' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-hero-size)', lineHeight: 'var(--text-hero-line)', fontWeight: 'var(--text-hero-weight)', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
            Simple marketing for <br />
            <span style={{ color: 'var(--color-primary)' }}>busy local businesses</span>
          </h1>
          <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-5)' }}>
            Send a job photo on <WhatsAppIcon size={24} className="text-[#22C55E] mx-1" /> <strong>WhatsApp</strong> — or from the Neerzy link. 
            Neerzy writes your Google post, asks for reviews, and keeps your website fresh. Minutes, not hours.
          </p>
          
          {/* Value Bar */}
          <div className="hero-trust" style={{ justifyContent: 'center' }}>
            {['Send by WhatsApp or the app link', 'Built for traders', 'No jargon, no dashboards', 'Your own domain — $19'].map((item, i) => (
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
      <section id="plans" className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
              Pick your plan. Cancel anytime.
            </h2>
            <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', maxWidth: '560px', margin: 'var(--space-3) auto 0' }}>
              Start free. Upgrade when the work keeps coming.
            </p>
          </div>
          <div className="card-grid pricing-grid-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
                        {feature.text.includes('WhatsApp') && <WhatsAppIcon size={12} className="text-[#22C55E] mt-0.5 shrink-0" />}
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

      {/* Add-ons Section */}
      <section id="add-ons" className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
              Your name online — and your own website
            </h2>
            <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', maxWidth: '560px', margin: 'var(--space-3) auto 0' }}>
              Add these when you are ready. No hidden fees.
            </p>
          </div>
          <div className="card-grid pricing-grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {ADD_ONS.map((addon, i) => (
              <div
                key={i}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: addon.highlight ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  boxShadow: addon.highlight ? '0 4px 16px rgba(15,81,50,0.12)' : 'var(--shadow-card)'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: 'var(--space-2)' }} aria-hidden="true">{addon.icon}</div>
                <h3 style={{ fontSize: 'var(--text-h3-size)', lineHeight: 'var(--text-h3-line)', fontWeight: 'var(--text-h3-weight)', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-3)' }}>
                  {addon.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                  {addon.strike && (
                    <span style={{ textDecoration: 'line-through', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-size)' }}>{addon.strike}</span>
                  )}
                  <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{addon.price}</span>
                  <span style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{addon.note}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                  {addon.bullets.map((b, j) => (
                    <li key={j} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 800 }}>✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={addon.href}
                  className={addon.highlight ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {addon.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)' }}>
            $19 is paid once per domain. Hosting is $10/month after 90 free days. The website build is $99 — free for early adopters.
          </p>
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
                    lineHeight: 'var(--text-body-line)',
                    minHeight: '44px'
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
          <p>Send your next job photo on WhatsApp — or from the Neerzy link. Neerzy does the rest.</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup?plan=free" className="btn btn-primary" style={{ fontSize: '18px', padding: '14px 36px' }}>
              Start Free — 5 Posts
            </Link>
            <Link
              href="#plans"
              className="btn"
              style={{ fontSize: '18px', padding: '14px 36px', color: '#FFFFFF', border: '2px solid rgba(255,255,255,0.6)', background: 'transparent' }}
            >
              See Plans
            </Link>
          </div>
          <div style={{ marginTop: 'var(--space-3)', color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-small-size)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            No credit card required
          </div>
        </div>
      </section>
    </div>
  );
}
