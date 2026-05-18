'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Loader2, 
  Shield, 
  Sparkles, 
  Building, 
  Search, 
  Check, 
  Plus, 
  Star, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  Mail, 
  Lock, 
  MapPin, 
  Globe, 
  Smartphone,
  CheckCircle2,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Send
} from 'lucide-react';

type Step = 'intro' | 'signup' | 'pricing' | 'connect-gbp' | 'search-business' | 'dashboard';

export default function CompleteUserFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [isConnectingGbp, setIsConnectingGbp] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Simulated live WhatsApp notification state on Dashboard
  const [simulatedPostText, setSimulatedPostText] = useState('Boiler repair completed for Apex Traders. Quick turnaround and fully certified service!');
  const [simulatedHeadline, setSimulatedHeadline] = useState('Expert Boiler Repair');
  const [simulatedBody, setSimulatedBody] = useState('Fast, fully certified boiler repairs by Neerzy Heating & Plumbing. Restoring warmth and safety to your home in no time.');
  const [isSimulatingMessage, setIsSimulatingMessage] = useState(false);

  // Mock list of local businesses
  const mockBusinesses = [
    { id: 1, name: 'Neerzy Plumbing & Heating Services', address: '12 Baker Street, London NW1 6XE', rating: 4.9, reviews: 142, category: 'Plumber' },
    { id: 2, name: 'Apex Trade Roofing Ltd', address: '45 Broad Street, Birmingham B1 2HP', rating: 4.8, reviews: 67, category: 'Roofing Contractor' },
    { id: 3, name: 'Vanguard Electrical & Security', address: '88 Deansgate, Manchester M3 2ER', rating: 5.0, reviews: 89, category: 'Electrician' },
    { id: 4, name: 'Elite Landscaping & Gardens', address: '20 Princes Street, Edinburgh EH2 2AN', rating: 4.7, reviews: 54, category: 'Landscape Gardener' },
  ];

  const filteredBusinesses = mockBusinesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('pricing');
  };

  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
    setCurrentStep('connect-gbp');
  };

  const handleConnectGbp = () => {
    setIsConnectingGbp(true);
    setTimeout(() => {
      setIsConnectingGbp(false);
      setCurrentStep('search-business');
    }, 2000);
  };

  const handleSelectBusiness = (business: any) => {
    setSelectedBusiness(business);
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setCurrentStep('dashboard');
      // Show welcome toast
      showNotification(`🎉 Setup complete! ${business.name} successfully connected.`);
    }, 1500);
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleSimulateWhatsAppMessage = () => {
    setIsSimulatingMessage(true);
    // 1. Show notification of incoming WhatsApp
    setTimeout(() => {
      showNotification("📥 Inbound WhatsApp received from +923056500917: 'Just finished a kitchen sink replacement!'");
    }, 1000);

    // 2. Transition post content
    setTimeout(() => {
      setSimulatedPostText("Sink replacement finished! Kitchen is back in top shape with brand new fittings.");
      setSimulatedHeadline("Premium Sink Replacement");
      setSimulatedBody("A professional kitchen sink replacement featuring high-grade leakproof fittings and custom scaling. Completed in under 2 hours by Neerzy.");
      setIsSimulatingMessage(false);
      showNotification("🤖 AI Draft updated! Ready to publish.");
    }, 3000);
  };

  // Step Indicator Array
  const stepsList = [
    { key: 'signup', label: 'Account' },
    { key: 'pricing', label: 'Plan' },
    { key: 'connect-gbp', label: 'Google Connect' },
    { key: 'search-business', label: 'Select Shop' },
    { key: 'dashboard', label: 'Dashboard' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans relative overflow-hidden text-slate-100 flex flex-col justify-between">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#0F5C4D]/20 blur-[140px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Banner / Notification */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] bg-emerald-950/90 border border-emerald-500/30 text-emerald-200 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full flex-grow flex flex-col justify-center items-center py-12 px-4 z-10">
        {currentStep !== 'dashboard' && (
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">Neerzy</span>
            </div>

            {/* Stepper Progress Indicator */}
            {currentStep !== 'intro' && (
              <div className="w-full max-w-xl mb-8 px-4">
                <div className="flex justify-between items-center relative">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 z-0" />
                  {stepsList.map((s, index) => {
                    const stepIndex = stepsList.findIndex(x => x.key === currentStep);
                    const isCompleted = index < stepIndex;
                    const isActive = s.key === currentStep;

                    return (
                      <div key={s.key} className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isActive 
                            ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 scale-110'
                            : isCompleted 
                              ? 'bg-[#0F5C4D] text-white' 
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                        <span className={`text-[10px] font-bold mt-2 tracking-wide uppercase transition-colors ${
                          isActive ? 'text-emerald-400' : isCompleted ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: INTRO / HERO */}
        {currentStep === 'intro' && (
          <div className="w-full max-w-4xl text-center space-y-8 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WhatsApp-First Local Search Marketing</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight max-w-3xl mx-auto">
                Transform Completed Jobs into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Google Posts</span> Instantly.
              </h1>
              <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto font-medium leading-relaxed">
                Just text photos and job details to our AI WhatsApp assistant. We generate beautiful Google Updates and auto-request reviews from your customers instantly.
              </p>
            </div>

            {/* Visual Preview */}
            <div className="relative max-w-xl mx-auto bg-slate-900/60 rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-sm">
              <div className="absolute -top-3 -right-3 bg-emerald-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Demo active
              </div>
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-white">Neerzy Assistant</div>
                  <div className="text-[10px] text-emerald-400 font-bold">Online</div>
                </div>
              </div>
              <div className="space-y-3 text-left">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl max-w-[85%] text-xs text-slate-300 ml-auto rounded-tr-none">
                  📸 *Sends kitchen renovation picture* + "Fitted beautiful granite countertops for John!"
                </div>
                <div className="bg-emerald-950/40 border border-emerald-900/30 p-3 rounded-2xl max-w-[85%] text-xs text-emerald-200 rounded-tl-none">
                  🤖 *Saved!* Generating Google Post...
                </div>
                <div className="bg-emerald-950/60 border border-emerald-500/20 p-3.5 rounded-2xl max-w-[90%] text-xs text-slate-200 rounded-tl-none space-y-2">
                  <div className="font-bold text-emerald-400">✨ Google Post Ready:</div>
                  <div className="italic">"Looking for premium kitchen upgrades? Expert custom granite countertop installations completed beautifully in under 24 hours. Get a quote today!"</div>
                  <div className="text-[10px] text-emerald-500/80 font-bold">💬 Reply POST to publish on Google Maps.</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setCurrentStep('signup')}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 group text-base"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setCurrentStep('signup')}
                className="px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-800 transition-colors text-base"
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SIGN UP */}
        {currentStep === 'signup' && (
          <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Create Your Account</h2>
              <p className="text-slate-400 text-sm font-medium">Join Neerzy to connect your Google profile & start posting</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-semibold text-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-semibold text-white text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center gap-2 group mt-2"
              >
                <span>Continue to Plans</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#0c1424] text-slate-500 font-bold uppercase tracking-wider">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep('pricing')}
                className="w-full py-3.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign up with Google</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: PLAN SELECTOR */}
        {currentStep === 'pricing' && (
          <div className="w-full max-w-4xl text-center space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Select Your Plan</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">Flexible plans tailored to power businesses of all shapes and sizes.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
              {/* Card: Free */}
              <div 
                onClick={() => setSelectedPlan('free')}
                className={`p-6 bg-slate-900/50 border-2 rounded-3xl cursor-pointer transition-all hover:scale-[1.02] relative flex flex-col justify-between h-[360px] ${
                  selectedPlan === 'free' ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sandbox</span>
                    {selectedPlan === 'free' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <h3 className="text-2xl font-black text-white">Free Trial</h3>
                  <p className="text-slate-400 text-xs mt-1">Perfect for trying out our WhatsApp flow</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">$0</span>
                    <span className="text-xs text-slate-500 font-bold">/ forever</span>
                  </div>
                  <ul className="mt-6 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ <span className="font-semibold">5 AI Google Posts</span></li>
                    <li className="flex items-center gap-2">✓ <span>Basic WhatsApp Chatbot</span></li>
                  </ul>
                </div>
                <button className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-colors ${
                  selectedPlan === 'free' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>
                  Select Free Plan
                </button>
              </div>

              {/* Card: Pro */}
              <div 
                onClick={() => setSelectedPlan('pro')}
                className={`p-6 bg-slate-900/80 border-2 rounded-3xl cursor-pointer transition-all hover:scale-[1.02] relative flex flex-col justify-between h-[380px] -translate-y-2 ${
                  selectedPlan === 'pro' ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20' : 'border-slate-800'
                }`}
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Growth Pro</span>
                    {selectedPlan === 'pro' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <h3 className="text-2xl font-black text-white">Professional</h3>
                  <p className="text-slate-400 text-xs mt-1">For active traders growing Google visibility</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">$39</span>
                    <span className="text-xs text-slate-500 font-bold">/ month</span>
                  </div>
                  <ul className="mt-6 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ <span className="font-semibold">25 AI Google Posts/mo</span></li>
                    <li className="flex items-center gap-2">✓ <span>Automated Customer Reviews</span></li>
                    <li className="flex items-center gap-2">✓ <span className="text-emerald-400 font-bold">Advanced Analytics Dashboard</span></li>
                  </ul>
                </div>
                <button className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-colors ${
                  selectedPlan === 'pro' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>
                  Select Pro Plan
                </button>
              </div>

              {/* Card: Growth */}
              <div 
                onClick={() => setSelectedPlan('growth')}
                className={`p-6 bg-slate-900/50 border-2 rounded-3xl cursor-pointer transition-all hover:scale-[1.02] relative flex flex-col justify-between h-[360px] ${
                  selectedPlan === 'growth' ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enterprise</span>
                    {selectedPlan === 'growth' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <h3 className="text-2xl font-black text-white">Growth Multi</h3>
                  <p className="text-slate-400 text-xs mt-1">Ideal for service brands with multiple shops</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">$79</span>
                    <span className="text-xs text-slate-500 font-bold">/ month</span>
                  </div>
                  <ul className="mt-6 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ <span className="font-semibold">60 AI Google Posts/mo</span></li>
                    <li className="flex items-center gap-2">✓ <span>Multi-Business Profile syncing</span></li>
                    <li className="flex items-center gap-2">✓ <span>24/7 Priority Support Callouts</span></li>
                  </ul>
                </div>
                <button className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-colors ${
                  selectedPlan === 'growth' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>
                  Select Growth Plan
                </button>
              </div>
            </div>

            <button
              onClick={handleConnectGbp}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 text-sm"
            >
              <span>Continue to Connect Google</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: CONNECT GBP */}
        {currentStep === 'connect-gbp' && (
          <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center relative">
              <Building className="w-8 h-8 text-emerald-400" />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Connect Google Business Profile</h2>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">Authorize Neerzy to generate and sync posts directly to Google Maps.</p>
            </div>

            {/* Simulated permission cards */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 text-left space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Publish Posts & Offers</h4>
                  <p className="text-[10px] text-slate-500">Auto-publishes drafted posts sent via WhatsApp.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Sync Images & Galleries</h4>
                  <p className="text-[10px] text-slate-500">Uploads completed project photos directly to your business photo stream.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Review Request Syncing</h4>
                  <p className="text-[10px] text-slate-500">Links review links directly to request premium organic star ratings.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnectGbp}
              disabled={isConnectingGbp}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-3 relative"
            >
              {isConnectingGbp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting Securely...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.6 0 11-4.606 11-11.24 0-.756-.08-1.34-.18-1.955H12.24z"/>
                  </svg>
                  <span>Connect with Google Account</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 5: SEARCH & SELECT BUSINESS */}
        {currentStep === 'search-business' && (
          <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-2">Search Your Business</h2>
              <p className="text-slate-400 text-sm">Select the Google listing to connect with Neerzy AI</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type your business name (e.g. Plumbing, Electric)..."
                className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-semibold text-white text-sm"
              />
            </div>

            {/* Results List */}
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {isSearching ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold">Importing business profile details...</p>
                </div>
              ) : filteredBusinesses.length > 0 ? (
                filteredBusinesses.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleSelectBusiness(b)}
                    className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl hover:border-emerald-500/60 cursor-pointer transition-all hover:bg-slate-900/50 flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">{b.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span>{b.address}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full">{b.category}</span>
                        <div className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{b.rating}</span>
                          <span className="text-slate-500">({b.reviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No matching business profiles found. Please try another search term!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP 6: CLEAN & PREMIUM DASHBOARD */}
      {currentStep === 'dashboard' && selectedBusiness && (
        <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row animate-in fade-in duration-500 z-10">
          
          {/* Dashboard Sidebar */}
          <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800">
            <div>
              {/* Sidebar Header */}
              <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">Neerzy AI</span>
              </div>

              {/* Sidebar Nav */}
              <nav className="p-4 space-y-1">
                <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#0F5C4D] text-white font-bold rounded-xl text-sm transition-all shadow-inner">
                  <Building className="w-4 h-4" />
                  <span>Overview</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl text-sm transition-all">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Post Center</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl text-sm transition-all">
                  <MessageSquare className="w-4 h-4" />
                  <span>Reviews Hub</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl text-sm transition-all">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </a>
              </nav>
            </div>

            {/* Sidebar Footer User Details */}
            <div className="p-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/20">
                  {email ? email.substring(0, 2).toUpperCase() : 'ME'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{email || 'trader@neerzy.com'}</div>
                  <div className="text-[10px] text-emerald-400 font-bold capitalize">{selectedPlan} Plan</div>
                </div>
              </div>
              <button 
                onClick={() => setCurrentStep('intro')}
                className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-red-950/20 hover:border-red-900/30 hover:text-red-300 text-slate-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reset Demo Flow</span>
              </button>
            </div>
          </aside>

          {/* Main Dashboard Panel */}
          <main className="flex-grow bg-slate-50 flex flex-col min-h-screen">
            
            {/* Top Bar Header */}
            <header className="px-8 py-5 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-black text-slate-900">{selectedBusiness.name}</h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Active Sync</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{selectedBusiness.address}</p>
              </div>

              {/* Action Simulation Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSimulateWhatsAppMessage}
                  disabled={isSimulatingMessage}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  {isSimulatingMessage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Simulating WhatsApp Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                      <span>Simulate Inbound WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* Dashboard Content Container */}
            <div className="p-8 space-y-8 flex-grow">
              
              {/* Analytics Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Stats 1 */}
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Google Posts</span>
                    <div className="text-3xl font-black text-slate-900">18</div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+4 this week</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>

                {/* Stats 2 */}
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Requests</span>
                    <div className="text-3xl font-black text-slate-900">62</div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>91% conversion rate</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>

                {/* Stats 3 */}
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Rating</span>
                    <div className="text-3xl font-black text-slate-900">{selectedBusiness.rating} ⭐</div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span>Top 5% in {selectedBusiness.category}s</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Star className="w-5 h-5 stroke-[2.5] fill-current" />
                  </div>
                </div>

                {/* Stats 4 */}
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Twilio Sender</span>
                    <div className="text-sm font-black text-slate-900 truncate">+92 305 6500917</div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Online & Connected</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>

              </div>

              {/* Main Content Layout Grid */}
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                
                {/* Column 1: Live Interactive Google Post Simulator */}
                <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Live Google Maps Post Preview</h3>
                    <p className="text-xs text-slate-400 mt-1">This is how your updates look live on Google Maps and Local Search Results.</p>
                  </div>

                  {/* Simulated Google Post Layout Card */}
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-md max-w-xl mx-auto bg-white">
                    {/* Simulated Business Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        G
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-xs">{selectedBusiness.name}</div>
                        <div className="text-[10px] text-slate-400">Post updated just now • Google Business Update</div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4 space-y-4">
                      {/* Image Preview Container */}
                      <div className="w-full h-56 rounded-xl bg-slate-100 relative overflow-hidden flex items-center justify-center border border-slate-200/50">
                        {isSimulatingMessage ? (
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-white space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                            <p className="text-xs font-bold uppercase tracking-wider">Drafting AI Image Content...</p>
                          </div>
                        ) : null}
                        <img 
                          src="/images/gmb-placeholder.png" 
                          alt="Job Completed" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image not found
                            e.currentTarget.src = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-slate-700/50">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Synced via WhatsApp</span>
                        </div>
                      </div>

                      {/* Text Preview */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                          <span>{simulatedHeadline}</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {simulatedBody}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-2">
                        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2">
                          <span>Call Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Simulated WhatsApp Live Logs */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Assistant Preview Widget */}
                  <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">WhatsApp Assistant</h4>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>

                    <div className="space-y-3.5">
                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2.5">
                        <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-200">Connected Phone</div>
                          <div className="font-semibold mt-0.5 text-emerald-400">+92 305 6500917</div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-emerald-950/50 rounded-xl space-y-2 relative overflow-hidden">
                        <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide">Last WhatsApp Inbound</div>
                        <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                          "{simulatedPostText}"
                        </p>
                        <div className="text-[10px] text-slate-500 font-bold">Received from +923006291617</div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-[10px] text-slate-500 text-center font-semibold leading-relaxed">
                        To test, type a job description on WhatsApp to your number, and it will appear here in real time.
                      </div>
                    </div>
                  </div>

                  {/* Pricing Plan Widget */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subscription</h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {selectedPlan} Plan
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>AI Posts Remaining</span>
                        <span className="text-slate-900">18 / 25</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <footer className="px-8 py-5 border-t border-slate-200 bg-white text-center text-slate-400 text-xs font-semibold">
              &copy; {new Date().getFullYear()} Neerzy AI. All rights reserved. Powered by Google Business API.
            </footer>
          </main>
        </div>
      )}

      {/* Intro Page Footer */}
      {currentStep !== 'dashboard' && (
        <footer className="w-full text-center py-6 text-slate-500 text-xs border-t border-slate-900/50 z-10">
          &copy; {new Date().getFullYear()} Neerzy AI • Instantly Post to Google Maps via WhatsApp
        </footer>
      )}
    </div>
  );
}
