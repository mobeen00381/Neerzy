import type { Metadata } from "next";
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { CheckIcon, CameraIcon, FileTextIcon, StarIcon, ZapIcon, MessageSquareIcon, SearchIcon, SendIcon, GlobeIcon, SmartphoneIcon, MapPinIcon, EyeIcon, ClipboardListIcon, TrendingUpIcon } from '@/components/ui/Icons';
import WhatsAppMockup from '@/components/landing/WhatsAppMockup';

export const metadata: Metadata = {
  title: "Neerzy | Turn Every Job into More Calls via WhatsApp",
  description: "Take a photo after every job, send via WhatsApp or the web app. Neerzy prepares a Google post, website update, and review request — ready to publish in a few taps.",
  alternates: {
    canonical: 'https://www.neerzy.com',
  },
  openGraph: {
    title: "Neerzy | Local Business Marketing",
    description: "Take a photo after every job, send via WhatsApp or the web app. Neerzy prepares a Google post, website update, and review request — ready to publish in a few taps.",
    url: "https://www.neerzy.com",
    siteName: "Neerzy",
    locale: "en_US",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Neerzy",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Take a photo after every job, send via WhatsApp or the web app. Neerzy prepares a Google post, website update, and review request — ready to publish in a few taps.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ============================================
          Section 1: Hero
          ============================================ */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1>
              You finish the job. Neerzy helps the next customer find you.
            </h1>
            <p>
              Take a photo after every job. Send it via <WhatsAppIcon size={16} className="inline-block align-middle text-[#22C55E]" /> WhatsApp or the web app. Neerzy prepares a Google Business Profile post, website update, and review request — all in about a minute. You review and publish with a few taps.
            </p>
            <div className="hero-ctas">
              <Link href="/pricing" className="btn btn-primary">
                Start Free
              </Link>
              <Link href="/gmb-audit-tool" className="btn btn-secondary">
                Check Your Visibility Score
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="hero-trust">
              <div className="hero-trust-item">
                <CheckIcon size={16} />
                Built for local businesses
              </div>
              <div className="hero-trust-item">
                <CheckIcon size={16} />
                Google-compliant content
              </div>
              <div className="hero-trust-item">
                <CheckIcon size={16} />
                <WhatsAppIcon size={14} className="text-[#22C55E]" /> WhatsApp + web app
              </div>
            </div>
          </div>

          <div className="mockup-container">
            <WhatsAppMockup />

            {/* Floating Badge: Content Prepared */}
            <div
              className="floating-badge"
              style={{ top: '8%', right: '-8%' }}
            >
              <div className="floating-badge-icon accent-bg">
                <FileTextIcon size={16} />
              </div>
              <div>
                <div className="floating-badge-text">Content prepared</div>
                <div className="floating-badge-sub">Google post + website</div>
              </div>
            </div>

            {/* Floating Badge: Review Sent */}
            <div
              className="floating-badge"
              style={{ bottom: '22%', left: '-12%' }}
            >
              <div className="floating-badge-icon accent-bg">
                <StarIcon size={16} />
              </div>
              <div>
                <div className="floating-badge-text">Review request sent</div>
                <div className="floating-badge-sub">To your customer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 2: Why We Exist (problem only — no solution preview)
          ============================================ */}
      <section style={{
        backgroundColor: 'var(--color-bg)',
        paddingTop: 'var(--space-8)',
        paddingBottom: 'var(--space-5)'
      }}>
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'var(--text-h2-size)',
            lineHeight: 'var(--text-h2-line)',
            fontWeight: 'var(--text-h2-weight)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-4)',
            letterSpacing: '-0.02em',
            textAlign: 'center'
          }}>
            Busy businesses shouldn't have to become marketers.
          </h2>
          <p style={{
            fontSize: 'var(--text-body-size)',
            lineHeight: 'var(--text-body-line)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-4)',
            textAlign: 'center',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            You do excellent work. You finish the job, clean up, and move on to the next customer. But at the end of the day, there's no Google update, no website update, no review request, and no online record of the work you just completed.
          </p>
          <p style={{
            fontSize: 'var(--text-body-size)',
            lineHeight: 'var(--text-body-line)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Meanwhile, larger competitors with marketing teams keep showing up in local searches — not because they do better work, but because they consistently post, collect reviews, and stay visible.
          </p>
          <p style={{
            fontSize: 'var(--text-body-size)',
            lineHeight: 'var(--text-body-line)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: 'var(--space-5)',
            fontWeight: 600
          }}>
            Here's how Neerzy closes that gap:
          </p>
        </div>
      </section>

      {/* ============================================
          Section 3: How It Works
          ============================================ */}
      <section style={{
        backgroundColor: 'var(--color-bg)',
        paddingTop: 'var(--space-3)',
        paddingBottom: 'var(--space-8)'
      }}>
        <div className="container">
          <div className="steps-header">
            <h2>How it works</h2>
            <p>Five simple steps. About one minute total. No marketing skills required.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">
                <ZapIcon size={22} />
              </div>
              <h3>Finish the job</h3>
              <p>Complete the work for your customer. Clean up, pack up — just like you always do.</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <CameraIcon size={22} />
              </div>
              <h3>Take a photo</h3>
              <p>Snap one photo of the finished work on your phone. That's the only input you need.</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <SendIcon size={22} />
              </div>
              <h3>Send via WhatsApp or web app</h3>
              <p>Message the photo to Neerzy on WhatsApp or upload it through the web app — whichever is faster for you.</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <FileTextIcon size={22} />
              </div>
              <h3>Neerzy prepares everything</h3>
              <p>A Google post, a website update, and a review request are drafted based on the job photo and details.</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <GlobeIcon size={22} />
              </div>
              <h3>Publish in a few taps</h3>
              <p>Review the draft, tap publish, and your visibility is updated. A review request goes to your customer automatically.</p>
            </div>
          </div>

          <div className="steps-total">
            Total time: <strong>about one minute</strong> from photo to published.
          </div>
        </div>
      </section>

      {/* ============================================
          Section 4: Free Visibility Check
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)' }}>
        <div className="container audit-section">
          <h2>See how your business looks online today.</h2>
          <p>Enter your business name for a quick visibility check. See what's working and what could bring you more customers.</p>

          <div className="audit-search">
            <input
              type="text"
              className="audit-input"
              placeholder="Your business name..."
              readOnly
            />
            <Link href="/gmb-audit-tool" className="btn btn-secondary">
              Check Your Visibility Score
            </Link>
          </div>

          {/* Preview result — brand colors only, no orange/red */}
          <div className="audit-preview">
            <div className="audit-preview-header">
              <div className="audit-preview-business">
                <h3>Smith Plumbing & Heating</h3>
                <span>Austin, TX</span>
              </div>
              <div className="audit-preview-score">
                {/* Score circle always uses brand green on the homepage preview.
                    This is intentional — do NOT add orange/red threshold logic here.
                    Status colors (warn/fail) are reserved for the full GMB Audit Tool
                    page only, per design.md section 1. */}
                <div className="audit-score-circle">72</div>
                <div className="audit-score-label">
                  Visibility<br />
                  <strong>Score</strong>
                </div>
              </div>
            </div>

            <div className="audit-checks">
              <div className="audit-check-item pass">
                <div className="audit-check-icon pass">
                  <CheckIcon size={14} />
                </div>
                <div className="audit-check-text">
                  <strong>Google Business Profile</strong>
                  <span>Verified and active — good foundation</span>
                </div>
              </div>
              <div className="audit-check-item neutral">
                <div className="audit-check-icon neutral">
                  <EyeIcon size={14} />
                </div>
                <div className="audit-check-text">
                  <strong>Recent posts</strong>
                  <span>No posts in the last 30 days — posting regularly helps you show up more</span>
                </div>
              </div>
              <div className="audit-check-item pass">
                <div className="audit-check-icon pass">
                  <CheckIcon size={14} />
                </div>
                <div className="audit-check-text">
                  <strong>Customer reviews</strong>
                  <span>4.7 stars from 23 reviews — strong social proof</span>
                </div>
              </div>
              <div className="audit-check-item neutral">
                <div className="audit-check-icon neutral">
                  <ClipboardListIcon size={14} />
                </div>
                <div className="audit-check-text">
                  <strong>Website updates</strong>
                  <span>No recent updates — fresh content helps with local search rankings</span>
                </div>
              </div>
            </div>

            <div className="audit-cta">
              <p>Get the full breakdown with actionable steps to improve your score.</p>
              <Link href="/gmb-audit-tool" className="btn btn-primary">
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 5: How Neerzy Fixes It
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container fix-section">
          <h2>How Neerzy fixes it</h2>
          <p>Every problem the audit finds has a fix built into Neerzy's workflow. No extra tools, no separate logins.</p>

          <div className="fix-grid">
            <div className="fix-card">
              <div className="fix-card-header">
                <div className="fix-problem-icon">
                  <EyeIcon size={16} />
                </div>
                <div>
                  <div className="fix-problem-label">Problem</div>
                  <p className="fix-problem-text">Low activity on Google</p>
                </div>
              </div>
              <div className="fix-card-body">
                <div className="fix-arrow">
                  <TrendingUpIcon size={14} />
                </div>
                <div className="fix-solution">
                  <div className="fix-solution-label">Neerzy Fix</div>
                  <p className="fix-solution-text">Google post prepared from every job photo</p>
                </div>
              </div>
            </div>

            <div className="fix-card">
              <div className="fix-card-header">
                <div className="fix-problem-icon">
                  <StarIcon size={16} />
                </div>
                <div>
                  <div className="fix-problem-label">Problem</div>
                  <p className="fix-problem-text">Weak review profile</p>
                </div>
              </div>
              <div className="fix-card-body">
                <div className="fix-arrow">
                  <TrendingUpIcon size={14} />
                </div>
                <div className="fix-solution">
                  <div className="fix-solution-label">Neerzy Fix</div>
                  <p className="fix-solution-text">Review request sent to every customer after each job</p>
                </div>
              </div>
            </div>

            <div className="fix-card">
              <div className="fix-card-header">
                <div className="fix-problem-icon">
                  <GlobeIcon size={16} />
                </div>
                <div>
                  <div className="fix-problem-label">Problem</div>
                  <p className="fix-problem-text">Outdated website content</p>
                </div>
              </div>
              <div className="fix-card-body">
                <div className="fix-arrow">
                  <TrendingUpIcon size={14} />
                </div>
                <div className="fix-solution">
                  <div className="fix-solution-label">Neerzy Fix</div>
                  <p className="fix-solution-text">Website update prepared from every completed job</p>
                </div>
              </div>
            </div>

            <div className="fix-card">
              <div className="fix-card-header">
                <div className="fix-problem-icon">
                  <CameraIcon size={16} />
                </div>
                <div>
                  <div className="fix-problem-label">Problem</div>
                  <p className="fix-problem-text">Missing portfolio photos</p>
                </div>
              </div>
              <div className="fix-card-body">
                <div className="fix-arrow">
                  <TrendingUpIcon size={14} />
                </div>
                <div className="fix-solution">
                  <div className="fix-solution-label">Neerzy Fix</div>
                  <p className="fix-solution-text">Portfolio built from every job photo you send</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 6: One Photo, Multiple Results
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)' }}>
        <div className="container assets-section">
          <h2>One completed job creates multiple marketing assets.</h2>
          <p>From a single photo, Neerzy prepares everything your business needs to stay visible and attract the next customer.</p>

          <div className="assets-grid">
            <div className="asset-card">
              <div className="asset-icon">
                <MapPinIcon size={24} />
              </div>
              <h3>Google post</h3>
              <p>A ready-to-publish update for your Business Profile showing your latest work.</p>
            </div>

            <div className="asset-card">
              <div className="asset-icon">
                <GlobeIcon size={24} />
              </div>
              <h3>Website update</h3>
              <p>Fresh content for your site that search engines notice and customers appreciate.</p>
            </div>

            <div className="asset-card">
              <div className="asset-icon">
                <StarIcon size={24} />
              </div>
              <h3>Review request</h3>
              <p>A polite ask sent to your customer — timed right after the job is done.</p>
            </div>

            <div className="asset-card">
              <div className="asset-icon">
                <CameraIcon size={24} />
              </div>
              <h3>Project portfolio</h3>
              <p>Every job photo builds a growing gallery of your best work for future customers to see.</p>
            </div>

            <div className="asset-card">
              <div className="asset-icon">
                <MessageSquareIcon size={24} />
              </div>
              <h3>Social content</h3>
              <p>Shareable posts ready for your social channels — no extra editing needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 7: Review Request Comparison
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container compare-section">
          <h2>Ask for the review while the customer is still happy.</h2>
          <p>The difference between a review collected and a review opportunity lost is just a few minutes — and one photo.</p>

          <div className="compare-grid">
            {/* Without Neerzy */}
            <div className="compare-card">
              <h3 className="compare-card-label without">Without Neerzy</h3>

              <div className="compare-steps">
                <div className="compare-step without">
                  <div className="compare-step-icon without">
                    <ZapIcon size={16} />
                  </div>
                  <span className="compare-step-text">Finish the job</span>
                  <div className="compare-step-arrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                <div className="compare-step without">
                  <div className="compare-step-icon without">
                    <SendIcon size={16} />
                  </div>
                  <span className="compare-step-text">Leave the site</span>
                  <div className="compare-step-arrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                <div className="compare-step without">
                  <div className="compare-step-icon without">
                    <SearchIcon size={16} />
                  </div>
                  <span className="compare-step-text">Forget to ask later</span>
                  <div className="compare-step-arrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="compare-outcome without">
                Review opportunity lost — customer moves on, no review left.
              </div>
            </div>

            {/* With Neerzy */}
            <div className="compare-card">
              <h3 className="compare-card-label with">With Neerzy</h3>

              <div className="compare-steps">
                <div className="compare-step with">
                  <div className="compare-step-icon with">
                    <ZapIcon size={16} />
                  </div>
                  <span className="compare-step-text">Finish the job</span>
                  <div className="compare-step-arrow with">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                <div className="compare-step with">
                  <div className="compare-step-icon with">
                    <CameraIcon size={16} />
                  </div>
                  <span className="compare-step-text">Take one photo</span>
                  <div className="compare-step-arrow with">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                <div className="compare-step with">
                  <div className="compare-step-icon with">
                    <FileTextIcon size={16} />
                  </div>
                  <span className="compare-step-text">Review request prepared instantly</span>
                  <div className="compare-step-arrow with">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                <div className="compare-step with">
                  <div className="compare-step-icon with">
                    <SendIcon size={16} />
                  </div>
                  <span className="compare-step-text">Sent before you leave</span>
                </div>
              </div>

              <div className="compare-outcome with">
                Review request sent while satisfaction is fresh — higher chance of a 5-star review.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 8: Why This Matters (Flow Diagram)
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)' }}>
        <div className="container flow-section">
          <h2>Why this matters</h2>
          <p>Every completed job feeds a chain that makes your business more visible and attracts the next customer.</p>

          <div className="flow-chain">
            <div className="flow-node">
              <div className="flow-node-icon">
                <ZapIcon size={18} />
              </div>
              <span className="flow-node-text">Completed job</span>
            </div>

            <div className="flow-connector">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <FileTextIcon size={18} />
              </div>
              <span className="flow-node-text">Fresh content</span>
            </div>

            <div className="flow-connector">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <StarIcon size={18} />
              </div>
              <span className="flow-node-text">Review request</span>
            </div>

            <div className="flow-connector">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <CheckIcon size={18} />
              </div>
              <span className="flow-node-text">Customer review</span>
            </div>

            <div className="flow-connector">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <TrendingUpIcon size={18} />
              </div>
              <span className="flow-node-text">Better credibility</span>
            </div>

            <div className="flow-connector">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <MapPinIcon size={18} />
              </div>
              <span className="flow-node-text">Stronger Google Profile</span>
            </div>

            <div className="flow-connector">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <EyeIcon size={18} />
              </div>
              <span className="flow-node-text">More visibility</span>
            </div>

            <div className="flow-connector">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <MessageSquareIcon size={18} />
              </div>
              <span className="flow-node-text">More enquiries</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 9: Own Your Online Presence
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container own-section">
          <h2>Build something that belongs to your business.</h2>
          <p>Every job you complete with Neerzy adds to your own online presence — not someone else's platform.</p>

          <div className="own-grid">
            <div className="own-card">
              <div className="own-check">
                <CheckIcon size={16} />
              </div>
              <span className="own-card-text">Your website</span>
            </div>
            <div className="own-card">
              <div className="own-check">
                <CheckIcon size={16} />
              </div>
              <span className="own-card-text">Your domain</span>
            </div>
            <div className="own-card">
              <div className="own-check">
                <CheckIcon size={16} />
              </div>
              <span className="own-card-text">Your reviews</span>
            </div>
            <div className="own-card">
              <div className="own-check">
                <CheckIcon size={16} />
              </div>
              <span className="own-card-text">Your reputation</span>
            </div>
            <div className="own-card">
              <div className="own-check">
                <CheckIcon size={16} />
              </div>
              <span className="own-card-text">Your online history</span>
            </div>
            <div className="own-card">
              <div className="own-check">
                <CheckIcon size={16} />
              </div>
              <span className="own-card-text">Your customer relationships</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 10: Trust Row
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)' }}>
        <div className="container trust-section">
          <h2>Built for real businesses, not marketing teams.</h2>
          <p>Neerzy works the way you work — no dashboards to learn, no strategies to manage.</p>

          <div className="trust-row">
            <div className="trust-point">
              <CheckIcon size={18} />
              Google-compliant workflow
            </div>
            <div className="trust-point">
              <CheckIcon size={18} />
              No fake reviews
            </div>
            <div className="trust-point">
              <CheckIcon size={18} />
              You own your website
            </div>
            <div className="trust-point">
              <CheckIcon size={18} />
              Works with WhatsApp or the web app
            </div>
            <div className="trust-point">
              <CheckIcon size={18} />
              Simple enough for non-technical businesses
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 11: Final CTA (Dark Gradient Band)
          ============================================ */}
      <section className="cta-final">
        <div className="container">
          <h2>Every completed job deserves the chance to bring another one.</h2>
          <p>Keep doing great work. Neerzy helps make sure people see it.</p>
          <Link href="/pricing" className="btn btn-primary">
            Start Free
          </Link>
          <Link href="/gmb-audit-tool" className="cta-final-link">
            Not ready? Check your Visibility Score
          </Link>
        </div>
      </section>
    </>
  );
}
