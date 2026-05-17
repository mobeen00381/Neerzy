import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

// Mockup Page Components

export default function Page() {
  return (
    <div className="mockup-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1>Turn every job into more calls using <span className="text-[#25D366]"><WhatsAppIcon size={40} className="mr-2" />WhatsApp</span></h1>
            <p>Send a job photo → we help you create Google posts, update your website, and send review requests faster.</p>
            <div className="hero-ctas">
              <Link href="/pricing" className="btn btn-primary">Start with 5 Free Posts</Link>
              <Link href="#demo" className="btn btn-secondary">Watch Demo</Link>
            </div>
            
            {/* Trust Bar */}
            <div className="trust-bar">
              <div className="trust-item">✔ Built for local businesses</div>
              <div className="trust-item">✔ Google-compliant content</div>
              <div className="trust-item">✔ Secure <WhatsAppIcon size={16} className="text-[#25D366] mr-1" /> WhatsApp integration</div>
            </div>

            <div className="trust-badges">
              <div className="badge"><span className="badge-check">✔</span> No apps</div>
              <div className="badge"><span className="badge-check">✔</span> No dashboards</div>
              <div className="badge"><span className="badge-check">✔</span> No tech skills</div>
            </div>
          </div>

          <div className="mockup-container">
            <div className="wa-card">
              <div className="wa-header">
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc' }}></div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Neerzy</div>
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>Online</div>
                </div>
              </div>
              <div className="wa-body">
                <div className="wa-bubble wa-sent">
                  <img src="/images/plumber_job_photo.png" alt="Job photo" className="wa-image-preview" />
                  Kitchen sink fixed for Mrs Smith. Clean finish.
                </div>
                <div className="wa-bubble wa-received">
                  ✅ Job received! Processing...
                </div>
                <div className="ai-card">
                  <div className="ai-status">✨ NEERZY MAGIC</div>
                  <div style={{ fontSize: '11px', color: '#444' }}>
                    <div style={{ marginBottom: '4px' }}>✅ Google post ready</div>
                    <div style={{ marginBottom: '4px' }}>✅ Website updated</div>
                    <div style={{ marginBottom: '4px' }}>✅ Review request prepared</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <div style={{ background: '#25D366', color: 'black', fontSize: '10px', padding: '6px 10px', borderRadius: '4px', fontWeight: 700 }}>COPY POST</div>
                    <div style={{ background: '#0F5C4D', color: 'white', fontSize: '10px', padding: '6px 10px', borderRadius: '4px', fontWeight: 700 }}>OPEN GOOGLE</div>
                  </div>
                </div>
              </div>
              <div className="wa-footer">
                <div className="wa-input"></div>
              </div>
            </div>

            {/* Floating Notification Cards */}
            <div className="floating-card" style={{ top: '10%', right: '-10%' }}>
              <div style={{ background: '#FFF8E1', padding: '8px', borderRadius: '50%' }}>⭐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>Review request sent</div>
                <div style={{ fontSize: '10px', color: '#666' }}>To John Smith</div>
              </div>
            </div>
            <div className="floating-card" style={{ bottom: '20%', left: '-15%' }}>
              <div style={{ background: '#E8F5E9', padding: '8px', borderRadius: '50%' }}>📈</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>Visibility improved</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Google Profile optimized</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="section-padding" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '42px', color: '#0F5C4D' }}>Your workflow stays the same. Improving your visibility is now easier.</h2>
          </div>
          <div className="workflow-grid">
            {[
              { title: "Finish the job", desc: "Take a photo on-site", icon: "📸" },
              { title: "Send on WhatsApp", desc: "Just send it like a normal message", icon: "📲" },
              { title: "Neerzy prepares content", desc: "Ready-to-post drafts in under 60 seconds", icon: "✍️" },
              { title: "Send review requests", desc: "Help customers leave feedback faster", icon: "⭐" }
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{i + 1}</div>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{step.icon}</div>
                <h3 style={{ marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ color: '#666' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Automation Section */}
      <section className="section-padding bg-dark">
        <div className="container hero-grid">
          <div>
            <h2 style={{ fontSize: '48px', marginBottom: '24px' }}>Get reviews while the customer is still happy</h2>
            <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '40px' }}>Neerzy sends review requests immediately after the job is finished.</p>
            <div style={{ display: 'grid', gap: '20px' }}>
              {[
                "Higher response rates",
                "Professional feedback loop",
                "Improved local visibility"
              ].map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 600 }}>
                  <span style={{ color: '#25D366' }}>★</span> {benefit}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="sms-mockup">
              <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', marginBottom: '8px' }}>Today 4:32 PM</div>
              <div className="sms-bubble">
                Hi John, Thanks for choosing ABC Plumbing. Would you mind leaving a quick review?
              </div>
              <div className="sms-btn">
                Leave a Google Review
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visibility Section */}
      <section className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '42px', color: '#0F5C4D' }}>Every job updates your Google profile and website</h2>
          </div>
          <div className="vis-grid">
            <div className="vis-card">
              <div style={{ fontSize: '32px', marginBottom: '20px' }}>📍</div>
              <h3>Google visibility</h3>
              <p>Appear in local searches when customers need you most.</p>
            </div>
            <div className="vis-card" style={{ background: '#E3F2FD' }}>
              <div style={{ fontSize: '32px', marginBottom: '20px' }}>🌐</div>
              <h3>Website SEO</h3>
              <p>Fresh content improves rankings and keeps your site alive.</p>
            </div>
            <div className="vis-card" style={{ background: '#F3E5F5' }}>
              <div style={{ fontSize: '32px', marginBottom: '20px' }}>📈</div>
              <h3>More trust</h3>
              <p>More activity + more reviews = more customers choosing you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Busy Traders Section */}
      <section className="section-padding bg-soft">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '36px' }}>Built for busy traders</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            {[
              "No marketing skills needed",
              "No complicated dashboards",
              "No wasting time after work",
              "Just use WhatsApp like normal"
            ].map((text, i) => (
              <div key={i} className="btn btn-secondary" style={{ cursor: 'default' }}>
                <span style={{ color: '#25D366', marginRight: '8px' }}>✔</span> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Preview Section */}
      <section className="section-padding">
        <div className="container hero-grid">
          <div>
            <h2 style={{ fontSize: '42px', marginBottom: '24px' }}>A professional website — owned by you</h2>
            <ul style={{ listStyle: 'none', display: 'grid', gap: '16px' }}>
              <li style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#25D366' }}>✔</span> We build your site
              </li>
              <li style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#25D366' }}>✔</span> You own the domain
              </li>
              <li style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#25D366' }}>✔</span> No lock-in
              </li>
            </ul>
          </div>
          <div>
            <img src="/images/trader_website_preview.png" alt="Website Preview" style={{ width: '100%', borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }} />
          </div>
        </div>
      </section>

      {/* Feature Icon Grid */}
      <section className="section-padding bg-soft">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '42px' }}>One WhatsApp message creates everything</h2>
          </div>
          <div className="vis-grid">
            {[
              { t: "Review requests", i: "⭐" },
              { t: "Google posts", i: "📍" },
              { t: "Website updates", i: "🌐" },
              { t: "Social content", i: "📱" }
            ].map((f, i) => (
              <div key={i} className="vis-card" style={{ background: '#fff', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{f.i}</div>
                <h4 style={{ fontSize: '20px' }}>{f.t}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark Strip */}
      <div className="bg-dark" style={{ padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>10 jobs = 10 posts + 10 review opportunities</div>
          <div style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.2)' }} className="hide-mobile"></div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>More activity = improved local visibility</div>
        </div>
      </div>

      {/* GMB Checker */}
      <section className="section-padding bg-soft" id="gmb-checker">
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '42px', marginBottom: '24px' }}>Check how visible your business is on Google</h2>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '32px', boxShadow: 'var(--shadow-md)', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input type="text" placeholder="Enter your business name..." style={{ flex: 1, padding: '16px 24px', borderRadius: '50px', border: '1px solid #eee', fontSize: '16px' }} />
            <Link href="/gmb-audit-tool" className="btn btn-primary" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>Check Score</Link>
          </div>
          <p style={{ marginTop: '20px', color: '#666' }}>Free instant visibility report</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding" style={{ background: 'linear-gradient(135deg, #0F5C4D 0%, #073a30 100%)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '56px', marginBottom: '24px' }}>Your next job could bring your next customer</h2>
          <p style={{ fontSize: '24px', opacity: 0.9, marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px' }}>Send your next job on WhatsApp. Neerzy handles the marketing work.</p>
          <a href="/onboarding" className="btn btn-primary" style={{ padding: '20px 48px', fontSize: '20px' }}>Start with 5 Free Posts</a>
        </div>
      </section>

      {/* Footer Copy */}
      <footer style={{ background: '#073a30', color: 'rgba(255,255,255,0.6)', padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start text-left">
            <div>
              <img src="/images/logo.png" alt="Neerzy Logo" className="h-10 w-auto object-contain mb-4" />
              <p className="text-sm max-w-sm leading-relaxed">
                The content workflow and marketing assistance platform designed for local traders. Improve your local visibility without leaving WhatsApp.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h5 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Product</h5>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Legal</h5>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs">© {new Date().getFullYear()} Neerzy.com. All rights reserved.</p>
            <p className="text-[10px] max-w-md text-center md:text-right leading-tight italic">
              Neerzy is an independent platform and is not affiliated with, endorsed by, or a partner of Google or WhatsApp. Google Business Profile and WhatsApp are trademarks of their respective owners.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
