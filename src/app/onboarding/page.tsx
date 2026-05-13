// src/app/onboarding/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Globe, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  Zap, 
  PaintBucket,
  Sparkles,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WebsitePreview } from "@/components/chat/WebsitePreview";

const THEMES = [
  { name: "Ocean", color: "#3b82f6" },
  { name: "Forest", color: "#10b981" },
  { name: "Midnight", color: "#1e1b4b" },
  { name: "Sunset", color: "#f59e0b" },
  { name: "Berry", color: "#8b5cf6" },
];

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading onboarding...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'free';
  
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan);
  
  // Live Preview State
  const [businessName, setBusinessName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [themeColor, setThemeColor] = useState(THEMES[0].color);
  
  // Domain State
  const [domainSearch, setDomainSearch] = useState("");
  const [isSearchingDomain, setIsSearchingDomain] = useState(false);
  const [domainResults, setDomainResults] = useState<{domain: string, available: boolean, price: number}[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  
  const [isLaunching, setIsLaunching] = useState(false);
  const router = useRouter();
  
  const steps = [
    { id: 1, name: "Business", icon: Building2 },
    { id: 2, name: "Domain", icon: Globe },
    { id: 3, name: "Ready", icon: CheckCircle2 },
  ];

  const handleNext = () => {
    if (step === 1) {
      setIsGenerating(true);
      setDomainSearch(businessName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      setTimeout(() => {
        setIsGenerating(false);
        setStep(2);
        handleDomainSearch(businessName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      }, 2000);
    } else if (step === 2) {
      setStep(3);
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    setIsLaunching(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 2500);
  };

  const handleDomainSearch = async (query: string) => {
    if (!query) return;
    setIsSearchingDomain(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: query, action: "check" })
      });
      const data = await res.json();
      if (data.results) {
         setDomainResults(data.results);
         const comDomain = data.results.find((d: any) => d.domain.endsWith(".com") && d.available);
         if (comDomain) setSelectedDomain(comDomain.domain);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingDomain(false);
    }
  };

  if (isLaunching) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce shadow-2xl shadow-blue-500/20">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Setting up your engine...</h1>
        <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">
          We're connecting your WhatsApp line to the Google Business Profile API. Almost ready for your first post!
        </p>
        <div className="mt-12 w-64 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-progress" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Column: Flow */}
      <div className="w-full lg:w-[500px] xl:w-[600px] shrink-0 overflow-y-auto py-12 px-6 lg:px-12 bg-white shadow-2xl relative z-10">
        <div className="max-w-xl mx-auto h-full flex flex-col">
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
               <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                  <Zap className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
               </div>
               <span className="font-black text-slate-900 tracking-tighter">NEERZY</span>
            </Link>
            <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Build Your Presence</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">Fast, local, and SEO optimized automation for your business.</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative px-4">
              <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded" />
              <div 
                className="absolute left-0 top-1/2 h-1 bg-blue-600 -z-10 -translate-y-1/2 rounded transition-all duration-700 ease-in-out" 
                style={{ width: `${((step - 1) / 2) * 100}%` }} 
              />
              
              {steps.map((s) => (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all duration-500 ${
                    step >= s.id ? "bg-blue-600 text-white scale-110" : "bg-white border-2 border-slate-100 text-slate-400"
                  }`}>
                    {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : s.id}
                  </div>
                  <span className={`text-[10px] uppercase font-black mt-3 tracking-widest ${step >= s.id ? "text-blue-600" : "text-slate-400"}`}>
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Forms */}
          <div className="flex-1">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Business Profile</h2>
                <p className="text-slate-500 mb-8 font-medium">Watch your website generate in real-time as you type.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Business Name</label>
                    <input 
                      type="text" 
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 focus:bg-white bg-slate-50 outline-none text-slate-900 font-bold transition-all text-lg shadow-sm" 
                      placeholder="e.g. Action Plumbers" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Service</label>
                      <input 
                        type="text" 
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 focus:bg-white bg-slate-50 outline-none text-slate-900 font-bold transition-all text-lg shadow-sm" 
                        placeholder="e.g. Plumbing" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Location</label>
                      <input 
                        type="text" 
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 focus:bg-white bg-slate-50 outline-none text-slate-900 font-bold transition-all text-lg shadow-sm" 
                        placeholder="e.g. Austin, TX" 
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-4 uppercase tracking-wider">
                      <PaintBucket className="w-4 h-4 text-blue-600" /> Theme Palette
                    </label>
                    <div className="flex gap-4">
                        {THEMES.map((theme) => (
                          <button
                            key={theme.color}
                            onClick={() => setThemeColor(theme.color)}
                            className={`w-12 h-12 rounded-2xl shadow-sm transition-all hover:scale-110 flex items-center justify-center group ${themeColor === theme.color ? 'ring-4 ring-blue-100 scale-110' : ''}`}
                            style={{ backgroundColor: theme.color }}
                          >
                             {themeColor === theme.color && <Check className="w-5 h-5 text-white" />}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Claim Your Address</h2>
                <p className="text-slate-500 mb-8 font-medium">Your business needs a home on the web. Search availability below.</p>
                
                <div className="flex gap-3 mb-8">
                  <div className="relative flex-1 group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="text" 
                      value={domainSearch}
                      onChange={(e) => setDomainSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDomainSearch(domainSearch)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white bg-slate-50 outline-none text-slate-900 font-bold transition-all text-lg shadow-sm" 
                      placeholder="e.g. actionplumbers" 
                    />
                  </div>
                  <Button 
                    onClick={() => handleDomainSearch(domainSearch)} 
                    disabled={isSearchingDomain}
                    className="px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-xl rounded-2xl font-black h-auto"
                  >
                    {isSearchingDomain ? <Loader2 className="h-6 w-6 animate-spin" /> : "Search"}
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   {domainResults.length > 0 ? domainResults.map((result) => (
                     <div 
                       key={result.domain}
                       onClick={() => result.available && setSelectedDomain(result.domain)}
                       className={`p-5 border-2 rounded-[1.5rem] flex items-center justify-between transition-all ${
                         !result.available 
                           ? 'border-slate-50 bg-slate-50/50 opacity-60 cursor-not-allowed' 
                           : selectedDomain === result.domain
                             ? 'border-blue-500 bg-blue-50/30 cursor-pointer shadow-lg shadow-blue-100'
                             : 'border-slate-100 bg-white hover:border-blue-200 cursor-pointer'
                       }`}
                     >
                       <div className="flex items-center gap-4">
                         <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                           selectedDomain === result.domain ? 'border-blue-600 bg-blue-600' : 'border-slate-200'
                         }`}>
                           {selectedDomain === result.domain && <Check className="h-3 w-3 text-white font-black" />}
                         </div>
                         <span className={`text-xl font-black ${!result.available ? 'text-slate-400' : 'text-slate-900'}`}>
                           {result.domain}
                         </span>
                       </div>
                       
                       <div className="text-right">
                         {!result.available ? (
                           <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-lg uppercase tracking-widest">Taken</span>
                         ) : (
                           <div className="flex flex-col items-end">
                             <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-lg uppercase tracking-widest mb-1">Available</span>
                             <span className="font-black text-slate-900 text-lg">${result.price}<span className="text-xs text-slate-400 font-bold ml-1">/yr</span></span>
                           </div>
                         )}
                       </div>
                     </div>
                   )) : (
                     <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem] gap-4">
                        <Globe className="w-10 h-10 opacity-20" />
                        <p className="font-bold text-sm">Search for a domain above</p>
                     </div>
                   )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-center py-8">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-100">
                   <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">You're All Set!</h2>
                <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto leading-relaxed mb-10">
                  Your business <span className="text-blue-600 font-black">"{businessName}"</span> is ready to launch. Your first 5 posts are on us!
                </p>
                
                <div className="bg-slate-50 rounded-[2rem] p-8 border-2 border-slate-100 flex items-center gap-6 text-left max-w-sm mx-auto">
                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 shrink-0 text-2xl">
                      🚀
                   </div>
                   <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Current Plan</p>
                      <p className="text-lg font-black text-slate-900 capitalize">{selectedPlan} Trial</p>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <button 
               onClick={() => setStep(step - 1)} 
               disabled={step === 1 || isGenerating}
               className="px-8 py-4 font-black text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-0"
            >
              Back
            </button>
            
            <Button 
               size="lg" 
               onClick={handleNext} 
               disabled={isGenerating || (step === 1 && !businessName) || (step === 2 && !selectedDomain)}
               className="bg-slate-900 hover:bg-slate-800 text-white min-w-[200px] shadow-2xl shadow-slate-200 transition-all h-16 text-xl rounded-2xl font-black active:scale-95"
            >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" /> 
                    <span>Analyzing...</span>
                  </div>
                ) : step === 3 ? (
                  <div className="flex items-center gap-2">
                    Launch Dashboard <ChevronRight className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Continue <ChevronRight className="h-6 w-6" />
                  </div>
                )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Live Website Preview */}
      <div className="hidden lg:flex flex-1 bg-slate-900 p-12 items-center justify-center relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${themeColor}, transparent 50%)` }} />
         
         <div className="w-full max-w-5xl aspect-[16/10] animate-in zoom-in duration-1000">
            <WebsitePreview 
              businessName={businessName}
              serviceType={serviceType}
              serviceArea={serviceArea}
              themeColor={themeColor}
            />
         </div>
         
         {!businessName && (
            <div className="absolute bottom-12 right-12 bg-white/10 backdrop-blur-xl border border-white/10 px-8 py-6 rounded-[2rem] shadow-2xl transform rotate-2 animate-pulse max-w-xs">
              <p className="font-black text-white text-lg leading-tight tracking-tight italic">✨ Type your business name to watch the engine build your presence...</p>
            </div>
         )}
      </div>
    </div>
  );
}
