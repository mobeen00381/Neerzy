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
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#0F5C4D] leading-tight max-w-4xl mx-auto">
              Your workflow stays the same. Improving your visibility is now easier.
            </h2>
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
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-lg font-black text-[#0F5C4D] mb-2">{step.title}</h3>
                <p className="text-slate-500 font-semibold text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Automation Section */}
      <section className="section-padding bg-[#0F5C4D] text-white">
        <div className="container hero-grid">
          <div className="text-left space-y-6">
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
              Get reviews while the customer is still happy
            </h2>
            <p className="text-lg md:text-xl text-emerald-50/90 font-medium max-w-xl">
              Neerzy sends review requests immediately after the job is finished.
            </p>
            <div className="space-y-4 pt-4">
              {[
                "Higher response rates",
                "Professional feedback loop",
                "Improved local visibility"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-base md:text-lg font-bold">
                  <span className="text-[#25D366] text-xl">★</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center items-center">
            <div className="sms-mockup shadow-2xl border border-emerald-800/10">
              <div className="text-[10px] text-slate-400 text-center mb-2 font-bold uppercase tracking-wider">Today 4:32 PM</div>
              <div className="sms-bubble text-slate-700 font-semibold leading-relaxed">
                Hi John, Thanks for choosing ABC Plumbing. Would you mind leaving a quick review?
              </div>
              <div className="sms-btn bg-[#25D366] hover:bg-[#1da851] text-black shadow-md cursor-pointer transition-all">
                Leave a Google Review
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visibility Section */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#0F5C4D] leading-tight">
              Every job updates your Google profile and website
            </h2>
          </div>
          <div className="vis-grid">
            <div className="vis-card bg-[#F0F7F5] border border-emerald-100/30">
              <div className="text-4xl mb-5">📍</div>
              <h3 className="text-xl font-black text-[#0F5C4D] mb-3">Google visibility</h3>
              <p className="text-slate-600 font-semibold text-sm leading-relaxed">Appear in local searches when customers need you most.</p>
            </div>
            <div className="vis-card bg-[#F0F7F5] border border-emerald-100/30">
              <div className="text-4xl mb-5">🌐</div>
              <h3 className="text-xl font-black text-[#0F5C4D] mb-3">Website SEO</h3>
              <p className="text-slate-600 font-semibold text-sm leading-relaxed">Fresh content improves rankings and keeps your site alive.</p>
            </div>
            <div className="vis-card bg-[#F0F7F5] border border-emerald-100/30">
              <div className="text-4xl mb-5">📈</div>
              <h3 className="text-xl font-black text-[#0F5C4D] mb-3">More trust</h3>
              <p className="text-slate-600 font-semibold text-sm leading-relaxed">More activity + more reviews = more customers choosing you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Busy Traders Section */}
      <section className="section-padding bg-[#F0F7F5]">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-black text-[#0F5C4D]">Built for busy traders</h2>
          </div>
          <div className="flex flex-wrap lg:flex-nowrap gap-3 md:gap-4 justify-center">
            {[
              "No marketing skills needed",
              "No complicated dashboards",
              "No wasting time after work",
              "Just use WhatsApp like normal"
            ].map((text, i) => (
              <div key={i} className="btn bg-white text-[#0F5C4D] border border-emerald-100 font-bold px-4 py-2 md:px-6 md:py-3 text-sm lg:text-base rounded-full cursor-default shadow-sm whitespace-nowrap">
                <span className="text-[#25D366] mr-2">✔</span> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Preview Section */}
      <section className="section-padding bg-white">
        <div className="container hero-grid">
          <div className="space-y-6 text-left">
            <h2 className="text-3xl md:text-5xl font-black text-[#0F5C4D] leading-tight">
              A professional website — owned by you
            </h2>
            <ul className="space-y-4">
              {[
                "We build your site",
                "You own the domain",
                "No lock-in"
              ].map((item, idx) => (
                <li key={idx} className="text-lg font-bold text-slate-700 flex items-center gap-3">
                  <span className="bg-emerald-50 text-[#25D366] w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm">✔</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center items-center">
            <img src="/images/trader_website_preview.png" alt="Website Preview" className="w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 object-contain" />
          </div>
        </div>
      </section>

      {/* Feature Icon Grid */}
      <section className="section-padding bg-[#F0F7F5]">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#0F5C4D]">
              One WhatsApp message creates everything
            </h2>
          </div>
          <div className="vis-grid-4">
            {[
              { t: "Review requests", i: "⭐" },
              { t: "Google posts", i: "📍" },
              { t: "Website updates", i: "🌐" },
              { t: "Social content", i: "📱" }
            ].map((f, i) => (
              <div key={i} className="vis-card bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="text-5xl mb-4">{f.i}</div>
                <h4 className="text-xl font-black text-[#0F5C4D]">{f.t}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark Strip */}
      <div className="bg-[#0F5C4D] text-white py-12">
        <div className="container flex flex-wrap justify-around items-center gap-6 text-center">
          <div className="text-lg md:text-2xl font-extrabold">10 jobs = 10 posts + 10 review opportunities</div>
          <div className="hidden md:block w-0.5 h-10 bg-white/20"></div>
          <div className="text-lg md:text-2xl font-extrabold">More activity = improved local visibility</div>
        </div>
      </div>

      {/* Final CTA */}
      <section className="section-padding bg-gradient-to-br from-[#0F5C4D] to-[#073a30] text-white text-center">
        <div className="container max-w-4xl space-y-8">
          <h2 className="text-3xl md:text-6xl font-black leading-tight">
            Your next job could bring your next customer
          </h2>
          <p className="text-lg md:text-2xl text-emerald-50/90 max-w-2xl mx-auto font-medium">
            Send your next job on WhatsApp. Neerzy handles the marketing work.
          </p>
          <div>
            <Link 
              href="/signup" 
              className="inline-block bg-[#25D366] hover:bg-[#1da851] text-black font-black py-5 px-12 rounded-full text-xl shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Start with 5 Free Posts
            </Link>
          </div>
        </div>
      </section>


    </div>
  );
}
