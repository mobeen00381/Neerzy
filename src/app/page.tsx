import type { Metadata } from "next";
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import WhatsAppMockup from '@/components/landing/WhatsAppMockup';
import WebsiteBuildMockup from '@/components/landing/WebsiteBuildMockup';
import OfferSlides from '@/components/landing/OfferSlides';
import { CheckIcon, CameraIcon, FileTextIcon, StarIcon, ZapIcon, MessageSquareIcon, SearchIcon, SendIcon, GlobeIcon, SmartphoneIcon, MapPinIcon, EyeIcon, ClipboardListIcon, TrendingUpIcon } from '@/components/ui/Icons';
import { WEBSITE_EARLY_ADOPTER_ENDS, WEBSITE_SETUP_PRICE_USD, HOSTING_PRICE_USD, HOSTING_FREE_DAYS, isEarlyAdopterWindowOpen } from '@/lib/website';

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
              Finish the job. Send one photo on <WhatsAppIcon size={16} className="inline-block align-middle text-[#0F5132]" /> WhatsApp or the Neerzy link. Neerzy does the rest — a Google post, a website update, and a review ask. About one minute.
            </p>
            <p style={{
              fontSize: 'var(--text-small-size)',
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              marginTop: 'var(--space-2)'
            }}>
              Works like an app — no download. Just save the Neerzy link once.
            </p>
            <div className="hero-ctas">
              <Link href="/pricing" className="btn btn-primary">
                Start Free — 5 Posts
              </Link>
              <Link href="/#how-it-works" className="btn btn-secondary">
                See How It Works
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
                <WhatsAppIcon size={14} className="text-[#0F5132]" /> WhatsApp or the Neerzy link
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
                <div className="floating-badge-text">Post ready</div>
                <div className="floating-badge-sub">Google + Facebook + Instagram</div>
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
                <div className="floating-badge-sub">After you reply DONE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 1b: Founding-member offer slider (countdown)
          — $99 setup waived + 90 days free hosting for early adopters,
            driven by the same deadline the billing code uses.
            Sits on the hero's mint background (--color-bg-soft) so the dark
            band inside it is the break before the white section below.
            Server-side gate: if the window is already closed at build time we
            never ship the banner; the component also hides itself on the
            client once the countdown hits zero (covers long-lived tabs and
            cached HTML).
          ============================================ */}
      {isEarlyAdopterWindowOpen() && (
        <OfferSlides
          deadline={WEBSITE_EARLY_ADOPTER_ENDS}
          setupPrice={WEBSITE_SETUP_PRICE_USD}
          hostingPrice={HOSTING_PRICE_USD}
          freeDays={HOSTING_FREE_DAYS}
        />
      )}

      {/* ============================================
          Section 2: Why We Exist (problem only — no solution preview)
          ============================================ */}
      <section className="section-padding" style={{
        backgroundColor: 'var(--color-bg)'
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
            Busy businesses shouldn&apos;t have to become marketers.
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
            The job is done and the van is packed — but Google, your website and your reviews wait. Big companies post every day while you have real work to do.
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
            Here&apos;s how Neerzy closes that gap:
          </p>
        </div>
      </section>

      {/* ============================================
          Section 3: How It Works
          ============================================ */}
      <section id="how-it-works" className="section-padding" style={{
        backgroundColor: 'var(--color-bg-soft)',
        borderTop: '1px solid var(--color-divider)'
      }}>
        <div className="container">
          <div className="steps-header">
            <h2>How it works</h2>
            <p>One photo is all it takes. Five steps. About one minute.</p>
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
              <p>Snap one photo of the finished work on your phone. That&apos;s the only input you need.</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <SendIcon size={22} />
              </div>
              <h3>Send it — WhatsApp or the Neerzy link</h3>
              <p>Whichever is easier for you.</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <FileTextIcon size={22} />
              </div>
              <h3>Neerzy prepares everything</h3>
              <p>Ready-to-copy posts for Google, Facebook and Instagram, plus a review request, are drafted from the job photo and details.</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <GlobeIcon size={22} />
              </div>
              <h3>Tap, post, done</h3>
              <p>Tap the link, paste your post, add the photo. Then reply DONE — the review ask goes out.</p>
            </div>
          </div>

          <div className="steps-total">
            Total time: <strong>about one minute</strong> from photo to published.
          </div>
        </div>
      </section>

      {/* ============================================
          Section 3b: Connect (set up once)
          ============================================ */}
      <section id="features" className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container">
          <div className="steps-header">
            <h2>Set up once. Then forget it.</h2>
            <p>Three taps. That&apos;s the whole setup.</p>
          </div>

          <div className="connect-grid">
            <div className="connect-card">
              <div className="step-icon"><MapPinIcon size={22} /></div>
              <h3>Connect Google</h3>
              <p>Tap Connect. Neerzy reads your name, hours and photos. You type nothing.</p>
            </div>

            <div className="connect-card">
              <div className="step-icon"><WhatsAppIcon size={22} /></div>
              <h3>Connect WhatsApp</h3>
              <p>Tap one link. Send a photo. That&apos;s how every job goes in.</p>
            </div>

            <div className="connect-card">
              <div className="step-icon"><GlobeIcon size={22} /></div>
              <h3>The Neerzy link</h3>
              <p>Not an app from a store. It&apos;s one link that works like an app. Save it once. Tap it forever.</p>
            </div>
          </div>

          <div className="tip-strip">
            iPhone and Android · Nothing to download · You never start from a blank page
          </div>
        </div>
      </section>

      {/* ============================================
          Section 4: Free Visibility Check
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container audit-section">
          <h2>See how your business looks online today.</h2>
          <p>Enter your business name for a quick visibility check. See what&apos;s working and what could bring you more customers.</p>

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
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container fix-section">
          <h2>How Neerzy fixes it</h2>
          <p>Every problem the audit finds has a fix built into Neerzy&apos;s workflow. No extra tools, no separate logins.</p>

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
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container assets-section">
          <h2>One photo becomes five things.</h2>
          <p>Same photo. Same minute. Five places your customers look.</p>

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
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
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

          {/* No-WhatsApp customers: SMS or copy link */}
          <div className="fallback-block">
            <h3>Customer has no WhatsApp?</h3>
            <p>One tap sends a text, or copies your link. Either way it&apos;s ready to go.</p>
            <div className="fallback-buttons">
              <span className="fallback-btn primary">Send by SMS</span>
              <span className="fallback-btn">Copy Link</span>
            </div>
            <p className="fallback-note">Message ready — just press send.</p>
            <p className="fallback-note">New 5-star reviews show up on your website by themselves.</p>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 7b: Show up higher on Google Maps
          ============================================ */}
      <section id="reviews" className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container">
          <div className="steps-header">
            <h2>Show up higher on Google Maps.</h2>
            <p>Google shows the businesses that keep posting and keep collecting reviews. Neerzy does both — automatically.</p>
          </div>

          {/* Story: one real business, before and after */}
          <p className="map-story">
            <b>Meet Smith Plumbing &amp; Heating</b> — great plumbers, quiet phone. On Google Maps they were invisible:
            6 reviews, and their last post was 8 months old. Customers searched &ldquo;plumber near me&rdquo; and scrolled
            straight past them.
          </p>

          <div className="map-compare">
            {/* ---------- Before: the same business, invisible ---------- */}
            <div className="map-panel">
              <div className="map-panel-label without">Without Neerzy</div>

              <div className="gmaps">
                <div className="gmaps-bar">
                  <SearchIcon size={13} className="gmaps-bar-icon" />
                  <span className="gmaps-bar-text">plumber near me</span>
                </div>

                <div className="gmaps-map is-dull">
                  <span className="gmaps-road h" style={{ top: '26%' }} />
                  <span className="gmaps-road h" style={{ top: '64%' }} />
                  <span className="gmaps-road v" style={{ left: '28%' }} />
                  <span className="gmaps-road v" style={{ left: '66%' }} />
                  <span className="gmaps-block is-park" style={{ top: '8%', left: '5%', width: '20%', height: '18%' }} />
                  <span className="gmaps-block" style={{ top: '70%', left: '72%', width: '24%', height: '24%' }} />
                  <span className="gmaps-pin is-ghost" style={{ top: '44%', left: '34%' }} />
                  <span className="gmaps-pin is-ghost" style={{ top: '30%', left: '58%' }} />
                  <span className="gmaps-pin is-ghost" style={{ top: '72%', left: '46%' }} />
                  <span className="gmaps-pin is-mine is-dull" style={{ top: '78%', left: '20%' }} />
                  <span className="gmaps-badge">No new posts</span>
                </div>

                <div className="gmaps-list">
                  <div className="gmaps-row is-dim">
                    <span className="gmaps-row-rank">4</span>
                    <span className="gmaps-row-body">
                      <span className="gmaps-row-name">Smith Plumbing &amp; Heating</span>
                      <span className="gmaps-row-meta">
                        <span className="gmaps-stars">&#9733;&#9733;&#9733;&#9734;&#9734;</span>
                        <span className="gmaps-score is-dull">3.6</span>
                        <span className="gmaps-count">(6)</span>
                      </span>
                      <span className="gmaps-row-note">Last post 8 months ago</span>
                    </span>
                  </div>
                </div>
              </div>

              <p className="map-caption">Customers tap the top 3. Smith never gets the call.</p>
            </div>

            {/* ---------- After: same business, books full ---------- */}
            <div className="map-panel">
              <div className="map-panel-label with">With Neerzy</div>

              <div className="gmaps is-live">
                <div className="gmaps-bar">
                  <SearchIcon size={13} className="gmaps-bar-icon" />
                  <span className="gmaps-bar-text">plumber near me</span>
                </div>

                <div className="gmaps-map">
                  <span className="gmaps-road h" style={{ top: '26%' }} />
                  <span className="gmaps-road h" style={{ top: '64%' }} />
                  <span className="gmaps-road v" style={{ left: '28%' }} />
                  <span className="gmaps-road v" style={{ left: '66%' }} />
                  <span className="gmaps-block is-park" style={{ top: '8%', left: '5%', width: '20%', height: '18%' }} />
                  <span className="gmaps-block" style={{ top: '70%', left: '72%', width: '24%', height: '24%' }} />
                  <span className="gmaps-pin is-ghost" style={{ top: '70%', left: '60%' }} />
                  <span className="gmaps-pin is-ghost" style={{ top: '84%', left: '40%' }} />

                  <span className="gmaps-marker" style={{ top: '34%', left: '22%' }}>
                    <span className="gmaps-marker-pin" />
                    <span className="gmaps-marker-label">
                      <span className="gmaps-marker-name">Smith Plumbing &amp; Heating</span>
                      <span className="gmaps-marker-meta">
                        <span className="gmaps-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                        <span className="gmaps-score">4.9</span>
                        <span className="gmaps-count">(47)</span>
                      </span>
                    </span>
                  </span>

                  <span className="gmaps-badge is-live">Posted today</span>
                </div>

                <div className="gmaps-list">
                  <div className="gmaps-row is-top">
                    <span className="gmaps-row-rank is-top">1</span>
                    <span className="gmaps-row-body">
                      <span className="gmaps-row-name">Smith Plumbing &amp; Heating</span>
                      <span className="gmaps-row-meta">
                        <span className="gmaps-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                        <span className="gmaps-score">4.9</span>
                        <span className="gmaps-count">(47)</span>
                        <span className="gmaps-open">Open now</span>
                      </span>
                      <span className="gmaps-row-note is-live">New post today &middot; 12 job photos</span>
                    </span>
                  </div>

                  <div className="gmaps-reviews">
                    <div className="gmaps-review">
                      <span className="gmaps-avatar a1">D</span>
                      <span className="gmaps-review-body">
                        <span className="gmaps-review-head">
                          <b>David R.</b>
                          <span className="gmaps-review-time">3 days ago</span>
                        </span>
                        <span className="gmaps-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                        <span className="gmaps-review-text">Arrived in 40 minutes and fixed it first time.</span>
                      </span>
                    </div>

                    <div className="gmaps-review">
                      <span className="gmaps-avatar a2">P</span>
                      <span className="gmaps-review-body">
                        <span className="gmaps-review-head">
                          <b>Priya N.</b>
                          <span className="gmaps-review-time">2 weeks ago</span>
                        </span>
                        <span className="gmaps-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                        <span className="gmaps-review-text">Sent a photo of the finished job before leaving. Very tidy.</span>
                      </span>
                    </div>

                    <div className="gmaps-review">
                      <span className="gmaps-avatar a3">M</span>
                      <span className="gmaps-review-body">
                        <span className="gmaps-review-head">
                          <b>Marcus T.</b>
                          <span className="gmaps-review-time">1 month ago</span>
                        </span>
                        <span className="gmaps-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                        <span className="gmaps-review-text">If this keeps up they&apos;re my plumbers for good.</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="map-caption">Same street, same work. Now Smith is the first name customers see.</p>
            </div>
          </div>

          {/* What the business actually gets when they onboard */}
          <h3 className="map-benefits-title">What you get with Neerzy</h3>

          <div className="map-benefits">
            <div className="map-benefit">
              <span className="map-benefit-icon">
                <CameraIcon size={18} />
              </span>
              <h4>Fresh Google posts every week</h4>
              <p>Every job photo you send becomes a Google post. No writing, no logging in, nothing to remember.</p>
            </div>

            <div className="map-benefit">
              <span className="map-benefit-icon">
                <StarIcon size={18} />
              </span>
              <h4>5-star reviews after every job</h4>
              <p>The review ask goes out while the customer is still happy — so more of them actually say yes.</p>
            </div>

            <div className="map-benefit">
              <span className="map-benefit-icon">
                <TrendingUpIcon size={18} />
              </span>
              <h4>Higher up on Maps, month after month</h4>
              <p>Google trusts businesses that stay active. Staying active is the part Neerzy does for you.</p>
            </div>

            <div className="map-benefit">
              <span className="map-benefit-icon">
                <SmartphoneIcon size={18} />
              </span>
              <h4>More calls, more jobs</h4>
              <p>Customers pick the business that looks alive and well reviewed. From now on, that&apos;s you.</p>
            </div>
          </div>

          <div className="tip-strip">Example. Results depend on your area and your work.</div>
        </div>
      </section>

      {/* ============================================
          Section 7c: Your own domain
          ============================================ */}
      <section id="domain" className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container">
          <div className="steps-header">
            <h2>Your own name on the internet.</h2>
            <p>Type your business name. If it&apos;s free, tap Buy. We do the rest.</p>
          </div>

          <div className="domain-mock">
            <div className="domain-search">
              <span className="domain-search-text">smithplumbingandheating.com</span>
              <span className="domain-search-badge">Available</span>
            </div>
            <div className="domain-ticks">
              <span>Registered for you</span>
              <span>Connected to your site</span>
              <span>Padlock on</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 7d: Build your website (animated story)
          ============================================ */}
      <section id="build-website" className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container">
          <div className="steps-header">
            <h2>Tap one button. Get a real website.</h2>
            <p>Pick your business, connect WhatsApp, choose your name. Neerzy does the rest — your site goes live on your own name, written from the Google profile you already have.</p>
          </div>

          <div className="build-grid">
            <WebsiteBuildMockup />

            <ul className="build-list">
              <li>Pick your business — Neerzy reads it straight from Google.</li>
              <li>Connect WhatsApp once. One link, no app to download.</li>
              <li>See what&apos;s free and take the name Neerzy picks for you.</li>
              <li>Words, photos and reviews are already in — ten looks to choose from.</li>
              <li>Live in under a minute. Every new job updates the site by itself.</li>
            </ul>
          </div>

          <div className="price-card">
            <div className="price-card-main">
              <span className="price-card-strike">$99</span>
              <span className="price-card-amount">FREE</span>
              <span className="price-card-once">for early adopters</span>
            </div>
            <ul className="price-card-list">
              <li>Setup fee waived — yours to keep.</li>
              <li>Hosting $10/month.</li>
              <li>First 90 days of hosting free.</li>
            </ul>
            {/* Starts the real journey: account → find your business → connect
                WhatsApp → name → build. /onboarding needs a session, so the
                marketing CTA begins at signup. */}
            <Link href="/signup" className="btn btn-primary">Build My Website — Free</Link>
            {/* Secondary path for visitors who want the detail page first — the
                conversion CTA above stays pointed at /signup. */}
            <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)' }}>
              <Link href="/website-builder" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                See how the website builder works →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 7e: Protected (Google + AI ready)
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container">
          <div className="connect-grid">
            <div className="connect-card">
              <div className="step-icon"><MapPinIcon size={22} /></div>
              <h3>Shows up on Google</h3>
              <p>Set up for you.</p>
            </div>
            <div className="connect-card">
              <div className="step-icon"><MessageSquareIcon size={22} /></div>
              <h3>AI helpers can find you</h3>
              <p>They can recommend your business too.</p>
            </div>
            <div className="connect-card">
              <div className="step-icon"><CheckIcon size={22} /></div>
              <h3>Protected</h3>
              <p>Handled automatically. You can&apos;t break it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 7f: What marketing costs
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container">
          <div className="steps-header">
            <h2>What marketing costs.</h2>
            <p>Agencies do it for you and charge a lot. Tools make you do it yourself. Neerzy just does it.</p>
          </div>

          <div className="price-table-wrap">
            <table className="price-table">
              <thead>
                <tr>
                  <th>The old way</th>
                  <th>Price</th>
                  <th>What happens</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Marketing agency</td>
                  <td>$500–$3,000 / month</td>
                  <td>They do it. You wait.</td>
                </tr>
                <tr>
                  <td>Marketing tools</td>
                  <td>$97–$497 / month</td>
                  <td>You do it all yourself.</td>
                </tr>
                <tr className="highlight">
                  <td><strong>Neerzy</strong></td>
                  <td><strong>Free to start</strong></td>
                  <td><strong>One photo. We do the rest.</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="tip-strip">Typical prices. Pro plan $39/month when you grow.</div>
        </div>
      </section>

      {/* ============================================
          Section 8: Why This Matters (Flow Diagram)
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container flow-section">
          <h2>Why this matters</h2>
          <p>One job makes more trust. More trust brings more calls.</p>

          <div className="flow-grid">
            {/* Row 1 */}
            <div className="flow-node">
              <div className="flow-node-icon">
                <ZapIcon size={18} />
              </div>
              <span className="flow-node-text">Job done</span>
            </div>

            <div className="flow-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <FileTextIcon size={18} />
              </div>
              <span className="flow-node-text">Google post</span>
            </div>

            <div className="flow-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <StarIcon size={18} />
              </div>
              <span className="flow-node-text">Ask for review</span>
            </div>

            <div className="flow-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <CheckIcon size={18} />
              </div>
              <span className="flow-node-text">5-star review</span>
            </div>

            {/* Downward connector between rows */}
            <div className="flow-down">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Row 2 */}
            <div className="flow-node">
              <div className="flow-node-icon">
                <TrendingUpIcon size={18} />
              </div>
              <span className="flow-node-text">More trust</span>
            </div>

            <div className="flow-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <MapPinIcon size={18} />
              </div>
              <span className="flow-node-text">Higher on Maps</span>
            </div>

            <div className="flow-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <EyeIcon size={18} />
              </div>
              <span className="flow-node-text">More people see you</span>
            </div>

            <div className="flow-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="flow-node">
              <div className="flow-node-icon">
                <MessageSquareIcon size={18} />
              </div>
              <span className="flow-node-text">More calls</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 9: Own Your Online Presence
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-divider)' }}>
        <div className="container own-section">
          <h2>Build something that belongs to your business.</h2>
          <p>Every job you complete with Neerzy adds to your own online presence — not someone else&apos;s platform.</p>

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
            <div className="own-card">
              <div className="own-check">
                <CheckIcon size={16} />
              </div>
              <span className="own-card-text">Your search ranking — handled</span>
            </div>
            <div className="own-card">
              <div className="own-check">
                <CheckIcon size={16} />
              </div>
              <span className="own-card-text">Your growth</span>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <Link href="/onboarding" className="btn btn-primary">
              Claim Your Name
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Section 10: Trust Row
          ============================================ */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}>
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
          <div className="cta-chips">
            <span>✓ No fake reviews</span>
            <span>✓ Google-friendly</span>
            <span>✓ You own everything</span>
          </div>
          <h2>Every job can bring the next one.</h2>
          <p>Keep doing great work. Neerzy helps make sure people see it.</p>
          <Link href="/pricing" className="btn btn-primary">
            Start Free — 5 Posts
          </Link>
          <Link href="/gmb-audit-tool" className="cta-final-link">
            Check My Google Score
          </Link>
        </div>
      </section>
    </>
  );
}


