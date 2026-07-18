import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Neerzy | Local Business Marketing Made Simple via WhatsApp',
  description:
    'Learn how Neerzy helps hardworking local traders grow online. We make marketing simple — send a job photo on WhatsApp and we handle your Google posts, website updates, and review requests.',
  alternates: {
    canonical: 'https://www.neerzy.com/about',
  },
  openGraph: {
    title: 'About Neerzy | Built for Local Traders',
    description:
      'Neerzy makes it simple for local tradespeople to stay visible online. Finish a job, send a WhatsApp message, and stay active consistently.',
    url: 'https://www.neerzy.com/about',
    siteName: 'Neerzy',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Neerzy | Marketing for Local Traders',
    description:
      'Neerzy helps local tradespeople grow online via WhatsApp. No marketing skills needed.',
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Us | Neerzy",
  "description": "Built to help hardworking traders grow online. Neerzy makes marketing simple via WhatsApp.",
  "url": "https://www.neerzy.com/about"
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* SECTION 1 — HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <h1>
                Built to help hardworking <span style={{ color: 'var(--color-primary)' }}>traders grow</span> online
              </h1>
              <p>
                Most local traders are great at their work — but get left behind online because marketing tools are too complicated.
              </p>
              <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
                Neerzy makes it simple: finish a job, send a WhatsApp message, and stay active online consistently.
              </p>
              <div className="hero-ctas">
                <Link href="/onboarding">
                  <span className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 'var(--text-body-size)' }}>
                    Start Free
                  </span>
                </Link>
                <Link href="/#how-it-works">
                  <span className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: 'var(--text-body-size)' }}>
                    See How It Works
                  </span>
                </Link>
              </div>
            </div>
            
            {/* Visual Workflow Mockup */}
            <div className="mockup-container">
              <div className="card" style={{ padding: 'var(--space-5)', maxWidth: '400px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {[
                    { text: 'Job photo from the site' },
                    { text: 'Google Business update' },
                    { text: 'Website content updated' },
                    { text: 'Automatic review request' }
                  ].map((item, i) => (
                    <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)' }}>
                      <div className="step-icon" style={{ width: '36px', height: '36px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--text-body-size)' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
              Local traders are underserved online
            </h2>
            <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Many plumbers, electricians, roofers, and HVAC teams work long hours every day. 
              After work, they are expected to be marketing experts. Most never have the time or energy.
            </p>
          </div>
          
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { t: 'No time after work', d: 'The "second shift" of marketing never happens.' },
              { t: 'Complex software', d: 'Dashboards built for agencies, not for traders.' },
              { t: 'Missed reviews', d: 'Happy customers forgotten once the job is done.' },
              { t: 'Inconsistent presence', d: 'Looking "closed" because profiles stay quiet.' }
            ].map((card, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div className="step-icon" style={{ margin: '0 auto var(--space-3)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 'var(--text-h3-size)', lineHeight: 'var(--text-h3-line)', fontWeight: 'var(--text-h3-weight)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>{card.t}</h3>
                <p style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', margin: 0 }}>{card.d}</p>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 'var(--space-7)' }}>
            <p style={{ fontSize: 'var(--text-h3-size)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              So great businesses stay invisible online while larger companies dominate search results.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHY WHATSAPP: Dark Section */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-primary-dark)', color: '#FFFFFF' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-7)', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: '#FFFFFF', marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
                Why Neerzy works through WhatsApp
              </h2>
              <p style={{ fontSize: 'var(--text-h3-size)', color: 'rgba(255,255,255,0.85)', marginBottom: 'var(--space-4)', fontStyle: 'italic' }}>
                Because traders already use it every day.
              </p>
              <p style={{ fontSize: 'var(--text-body-size)', color: 'rgba(255,255,255,0.85)', marginBottom: 'var(--space-5)' }}>
                We did not want traders learning another complicated app or dashboard. 
                WhatsApp is already familiar, fast, and always open. Neerzy fits into 
                the workflow traders already use.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {['Familiar', 'Fast', 'Easy', 'Always Open'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-body-size)', fontWeight: 600 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', padding: 'var(--space-6)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
                {[
                  { t: 'Finish job' },
                  { t: 'Send message' },
                  { t: 'Post prepared' },
                  { t: 'Review request' }
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <div className="step-icon" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 'var(--text-small-size)', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{step.t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 'var(--text-small-size)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  No complicated systems. No marketing experience needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — ON THE SPOT REVIEW */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
            <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
              The best time to ask for a review is right after the job
            </h2>
            <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              When customers are happiest, review response rates are much higher. 
              Local trust grows naturally when it's built on the spot.
            </p>
          </div>
          
          <div className="compare-grid" style={{ maxWidth: '700px' }}>
            <div className="compare-card" style={{ opacity: 0.6 }}>
              <h3 className="compare-card-label without">Without Neerzy</h3>
              <div className="compare-step without">
                <div className="compare-step-icon without">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <span className="compare-step-text">Review forgotten later</span>
              </div>
              <div className="compare-outcome without">Reviews slip through the cracks</div>
            </div>
            <div className="compare-card" style={{ borderColor: 'var(--color-accent)' }}>
              <h3 className="compare-card-label with">With Neerzy</h3>
              <div className="compare-step with">
                <div className="compare-step-icon with">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="compare-step-text">Request sent immediately</span>
              </div>
              <div className="compare-outcome with">Reviews arrive consistently</div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', fontStyle: 'italic', maxWidth: '400px', margin: '0 auto' }}>
              Neerzy helps businesses request reviews responsibly and does not support fake or incentivized reviews.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — OUR MISSION (rebuilt as standard step cards) */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
            Helping local businesses compete fairly
          </h2>
          <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-7)' }}>
            We believe small local businesses should not need expensive agencies or large marketing teams just to stay visible online.
          </p>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { icon: 'check', label: 'Build Trust' },
              { icon: 'check', label: 'Stay Active' },
              { icon: 'check', label: 'Consistent Reviews' },
              { icon: 'check', label: 'Improve Visibility' },
              { icon: 'check', label: 'Save Time' }
            ].map((item, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div className="step-icon" style={{ margin: '0 auto var(--space-3)', width: '48px', height: '48px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 'var(--text-h3-size)', lineHeight: 'var(--text-h3-line)', fontWeight: 'var(--text-h3-weight)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>{item.label}</h3>
                <p style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {i === 0 && 'Build lasting trust with every review.'}
                  {i === 1 && 'Stay active without daily effort.'}
                  {i === 2 && 'Collect reviews consistently.'}
                  {i === 3 && 'Improve your local visibility.'}
                  {i === 4 && 'Save time on marketing tasks.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — FREEDOM & EMPOWERMENT */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-7)', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
                Built to give businesses more independence
              </h2>
              <p style={{ fontSize: 'var(--text-body-size)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
                Many traders spend years working under larger companies before starting their own. 
                But online marketing often becomes another barrier to that freedom.
              </p>
              <p style={{ fontSize: 'var(--text-body-size)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
                Neerzy helps you build your own legacy:
              </p>
              <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { t: 'Own website' },
                  { t: 'Own reviews' },
                  { t: 'Own GMB visibility' },
                  { t: 'Own reputation' }
                ].map((card, i) => (
                  <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)' }}>
                    <div className="step-icon" style={{ width: '36px', height: '36px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 'var(--text-body-size)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{card.t}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <div className="step-icon" style={{ width: '56px', height: '56px', margin: '0 auto var(--space-4)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-h3-size)', lineHeight: 'var(--text-h3-line)', fontWeight: 'var(--text-h3-weight)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>Your business.</h3>
              <p style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 'var(--text-small-size)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your name. Your growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — TRUST & COMPLIANCE */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-h2-size)', lineHeight: 'var(--text-h2-line)', fontWeight: 'var(--text-h2-weight)', color: 'var(--color-primary)', marginBottom: 'var(--space-6)', letterSpacing: '-0.02em' }}>
            Built with trust and compliance in mind
          </h2>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: '700px', margin: '0 auto' }}>
            {[
              'Google-compliant workflows', 'Full publishing control', 'No fake reviews or spam', 'You own your data'
            ].map((t, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div className="step-icon" style={{ width: '40px', height: '40px', margin: '0 auto var(--space-3)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: 'var(--text-small-size)', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', fontStyle: 'italic', maxWidth: '500px', margin: 'var(--space-6) auto 0' }}>
            Neerzy is an independent platform and is not affiliated with Google or WhatsApp. 
            Google Business Profile and WhatsApp are trademarks of their respective owners.
          </p>
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA */}
      <section className="cta-final">
        <div className="container">
          <h2>Your next completed job could bring your next customer</h2>
          <p>Send your next job on WhatsApp. Neerzy helps you stay visible online consistently.</p>
          <Link href="/onboarding" className="btn btn-primary" style={{ fontSize: '18px', padding: '14px 36px' }}>
            Start Free
          </Link>
        </div>
      </section>
    </div>
  );
}
