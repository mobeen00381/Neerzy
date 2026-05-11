import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Globe, Mic, Phone, Camera, CheckCircle2, Shield, CreditCard, UserX, Sparkles, Star, TrendingUp, Zap, HelpCircle, ChevronRight, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ━━━ HERO SECTION ━━━ */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 -z-20" />
        <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" /> Trusted by 200+ local businesses
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 max-w-5xl mx-auto">
            Get more local customers from Google — <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">without doing any work</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            We build your website, optimize your Google profile, and keep it updated. You just send updates from your phone.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding">
              <Button size="lg" className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 h-14 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all font-bold rounded-xl">
                Start 30-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl">
                See Pricing
              </Button>
            </Link>
          </div>

          {/* Trust badges under CTA */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400" /> 30-day free trial</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-400" /> Domain is yours</span>
            <span className="flex items-center gap-1.5"><UserX className="w-4 h-4 text-amber-400" /> No tech skills needed</span>
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS — 4 STEPS ━━━ */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">How it works</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">From zero to live website in under 24 hours. No coding, no hassle.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", icon: Globe, title: "Buy your domain", desc: "Pick your perfect .com — we register and set it up instantly.", color: "blue" },
              { step: "2", icon: Zap, title: "We build your website", desc: "AI generates a professional, SEO-optimized site for your business.", color: "emerald" },
              { step: "3", icon: Camera, title: "Send updates", desc: "Snap a photo, record a voice note, or type a message from your phone.", color: "amber" },
              { step: "4", icon: Phone, title: "Get more calls", desc: "Your site climbs Google rankings and brings in new local customers.", color: "violet" },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className={`relative mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-1 shadow-lg ${
                  item.color === 'blue' ? 'bg-blue-50 text-blue-600 shadow-blue-100' :
                  item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' :
                  item.color === 'amber' ? 'bg-amber-50 text-amber-600 shadow-amber-100' :
                  'bg-violet-50 text-violet-600 shadow-violet-100'
                }`}>
                  <item.icon className="w-8 h-8" />
                  <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center ${
                    item.color === 'blue' ? 'bg-blue-500' :
                    item.color === 'emerald' ? 'bg-emerald-500' :
                    item.color === 'amber' ? 'bg-amber-500' :
                    'bg-violet-500'
                  }`}>{item.step}</div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Connector line (desktop only) */}
          <div className="hidden md:block max-w-4xl mx-auto mt-[-88px] mb-8 px-16 -z-10 relative">
            <div className="border-t-2 border-dashed border-slate-200" />
          </div>
        </div>
      </section>

      {/* ━━━ BEFORE / AFTER PROOF SECTION ━━━ */}
      {/* ━━━ DEMO BUSINESSES SHOWCASE ━━━ */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">See how businesses grow with Neerzy</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Real local businesses getting more calls using our AI.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Demo 1: Plumber */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-all group">
               <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-800 p-6 flex flex-col justify-end relative overflow-hidden">
                 <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold font-mono">
                   LIVE DEMO
                 </div>
                 <h3 className="text-2xl font-bold text-white relative z-10">Elite Plumbing Pro</h3>
                 <p className="text-blue-200 text-sm relative z-10">Austin, TX</p>
                 <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               </div>
               <div className="p-6">
                  <div className="bg-emerald-50 rounded-2xl p-4 mb-6 flex justify-between items-center text-emerald-700">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70 mb-1">Results (90 Days)</p>
                      <p className="text-2xl font-black">+35% calls</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
                  </div>
                  <ul className="space-y-3 mb-6 text-sm text-slate-600">
                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Page 1 for "Emergency Plumber"</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500" /> 14 AI-generated repair posts/mo</li>
                  </ul>
                  <Link href="/demo">
                    <Button variant="outline" className="w-full font-bold">View Plumber Demo</Button>
                  </Link>
               </div>
            </div>

            {/* Demo 2: Electrician */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-all group md:-translate-y-4">
               <div className="h-48 bg-gradient-to-br from-amber-500 to-amber-700 p-6 flex flex-col justify-end relative overflow-hidden">
                 <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold font-mono">
                   LIVE DEMO
                 </div>
                 <h3 className="text-2xl font-bold text-white relative z-10">Spark Electrical</h3>
                 <p className="text-amber-200 text-sm relative z-10">Denver, CO</p>
                 <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
               </div>
               <div className="p-6">
                  <div className="bg-emerald-50 rounded-2xl p-4 mb-6 flex justify-between items-center text-emerald-700">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70 mb-1">Results (60 Days)</p>
                      <p className="text-2xl font-black">+20 inquiries/wk</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
                  </div>
                  <ul className="space-y-3 mb-6 text-sm text-slate-600">
                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Top 3 Local Map Pack</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Voice-note updates from job sites</li>
                  </ul>
                  <Link href="/demo">
                    <Button variant="outline" className="w-full font-bold">View Electrician Demo</Button>
                  </Link>
               </div>
            </div>

            {/* Demo 3: Dentist */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-all group">
               <div className="h-48 bg-gradient-to-br from-teal-500 to-teal-700 p-6 flex flex-col justify-end relative overflow-hidden">
                 <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold font-mono">
                   LIVE DEMO
                 </div>
                 <h3 className="text-2xl font-bold text-white relative z-10">Bright Smiles Dental</h3>
                 <p className="text-teal-100 text-sm relative z-10">Miami, FL</p>
                 <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/microbial-mat.png')] opacity-10"></div>
               </div>
               <div className="p-6">
                  <div className="bg-emerald-50 rounded-2xl p-4 mb-6 flex justify-between items-center text-emerald-700">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70 mb-1">Results (120 Days)</p>
                      <p className="text-2xl font-black">42 new reviews</p>
                    </div>
                    <Star className="w-8 h-8 text-emerald-500 opacity-50 fill-emerald-500" />
                  </div>
                  <ul className="space-y-3 mb-6 text-sm text-slate-600">
                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Page 1 for "Teeth Whitening"</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Automated patient before/after posts</li>
                  </ul>
                  <Link href="/demo">
                    <Button variant="outline" className="w-full font-bold">View Dentist Demo</Button>
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ SIMPLE PRICING SECTION ━━━ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Simple, honest pricing</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">No hidden fees. No contracts. Cancel anytime.</p>
          </div>

          {/* Domain + Plans */}
          <div className="max-w-4xl mx-auto">
            {/* Domain card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 p-3 rounded-xl text-white">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Your custom .com domain</h3>
                  <p className="text-slate-400 text-sm">Registered in your name — you own it forever</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">$19.99</p>
                <p className="text-slate-500 text-xs font-medium">one-time setup</p>
              </div>
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Starter */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Starter</h3>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  <Clock className="w-3 h-3" /> 30-day free trial
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-slate-900">$19</span>
                  <span className="text-slate-500 font-medium">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Done-for-you website", "10 AI posts / month", "Google Business updates", "Photo & voice uploads", "Cancel anytime"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/onboarding">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 font-bold rounded-xl">Start Free Trial</Button>
                </Link>
              </div>

              {/* Pro */}
              <div className="bg-white rounded-2xl border-2 border-blue-500 p-8 relative shadow-lg shadow-blue-100">
                <div className="absolute -top-3 left-6 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Pro</h3>
                <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  <Clock className="w-3 h-3" /> 30-day free trial
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-slate-900">$39</span>
                  <span className="text-slate-500 font-medium">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Everything in Starter", "30 AI posts / month", "Priority AI responses", "Google Business management", "Dedicated support", "Free domain transfer"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/onboarding">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 font-bold rounded-xl shadow-md shadow-blue-200">Start Free Trial</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ TRUST SECTION ━━━ */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Cancel anytime</h3>
              <p className="text-slate-500 text-sm">No contracts. No commitments. One-click cancel from your dashboard.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Globe className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Domain is yours</h3>
              <p className="text-slate-500 text-sm">Registered in your name. Transfer it out anytime — zero restrictions.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                <UserX className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">No technical skills needed</h3>
              <p className="text-slate-500 text-sm">Just send a photo or voice note. Our AI does the rest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FAQ PREVIEW SECTION ━━━ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Frequently asked questions</h2>
            <p className="text-slate-500 text-lg">Got questions? We&apos;ve got answers.</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4 mb-10">
            {/* FAQ 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">What happens after my 30-day free trial?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">You&apos;ll be automatically charged your plan price. You can cancel anytime before the trial ends and you won&apos;t be charged a single penny.</p>
                </div>
              </div>
            </div>

            {/* FAQ 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Do I own my domain?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Yes, 100%. The domain is registered in your name. You can transfer it out anytime with zero restrictions — no questions asked.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/pricing#faq" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold text-sm transition-colors">
              View all FAQs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 to-slate-900 -z-10" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400" />
        <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Ready to get more customers from Google?</h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
            Join hundreds of local businesses growing with Neerzy. Start your 30-day free trial today.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-10 h-14 shadow-xl shadow-blue-500/20 hover:shadow-2xl font-bold rounded-xl">
              Start 30-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400" /> 30-day free trial</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-400" /> Domain is yours</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> 4.9★ rated</span>
          </div>
        </div>
      </section>

    </div>
  );
}
