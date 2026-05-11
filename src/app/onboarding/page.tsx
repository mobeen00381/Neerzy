"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle2, ChevronRight, Globe, CreditCard, Building2, PaintBucket, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import WebsitePreview from "./WebsitePreview";

const THEMES = [
  { name: "Ocean Blue", color: "#3B82F6" },
  { name: "Forest Green", color: "#10B981" },
  { name: "Vibrant Orange", color: "#F97316" },
  { name: "Slate Dark", color: "#334155" },
  { name: "Royal Purple", color: "#8B5CF6" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro">("basic");
  
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
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const router = useRouter();
  
  const steps = [
    { id: 1, name: "Plan", icon: CheckCircle2 },
    { id: 2, name: "Business", icon: Building2 },
    { id: 3, name: "Domain", icon: Globe },
    { id: 4, name: "Payment", icon: CreditCard },
  ];

  const handleNext = () => {
    if (step === 2) {
      setIsGenerating(true);
      // Pre-fill domain search based on business name
      setDomainSearch(businessName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      setTimeout(() => {
        setIsGenerating(false);
        setStep(3);
        // Auto-search domain when entering step 3
        handleDomainSearch(businessName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      }, 2500);
    } else if (step === 4) {
      handlePayment();
    } else if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePayment = async () => {
    if (!selectedDomain) return alert("Please select a domain first");

    setIsProcessingPayment(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          domainName: selectedDomain,
          domainPrice: domainResults.find((d) => d.domain === selectedDomain)?.price || 20,
          businessName,
          serviceType,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      alert("Payment Error: " + error.message);
      setIsProcessingPayment(false);
    }
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
         // Auto-select the .com if it's available
         const comDomain = data.results.find((d: any) => d.domain.endsWith(".com") && d.available);
         if (comDomain) setSelectedDomain(comDomain.domain);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingDomain(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex">
      
      {/* Left Column: Flow */}
      <div className="flex-1 overflow-y-auto py-12 px-4 shadow-2xl relative z-10 bg-white">
        <div className="max-w-xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Build Your Presence</h1>
            <p className="text-slate-500">Fast, local, and SEO optimized.</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded" />
              <div 
                className="absolute left-0 top-1/2 h-1 bg-blue-500 -z-10 -translate-y-1/2 rounded transition-all duration-300" 
                style={{ width: `${((step - 1) / 3) * 100}%` }} 
              />
              
              {steps.map((s) => (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow transition-colors ${
                    step >= s.id ? "bg-blue-500 text-white" : "bg-white border border-slate-200 text-slate-400"
                  }`}>
                    {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                  </div>
                  <span className={`text-[10px] uppercase font-bold mt-2 tracking-wider ${step >= s.id ? "text-blue-600" : "text-slate-400"}`}>
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Forms */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Select your Plan</h2>
              <div className="space-y-4">
                 <div 
                   onClick={() => { setSelectedPlan("basic"); handleNext(); }}
                   className={`p-5 border-2 rounded-xl cursor-pointer relative shadow-sm ${selectedPlan === 'basic' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 bg-white hover:border-blue-500'}`}
                 >
                   <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border ${selectedPlan === 'basic' ? 'border-[6px] border-blue-500 bg-white' : 'border-slate-300'}`} />
                   <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600">Basic Plan</h3>
                   <div className="text-2xl font-extrabold my-2">$19.99<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                   <p className="text-sm text-slate-600">10 auto-generated website & GMB posts per month.</p>
                 </div>

                 <div 
                   onClick={() => { setSelectedPlan("pro"); handleNext(); }}
                   className={`p-5 border-2 rounded-xl cursor-pointer relative shadow-sm ${selectedPlan === 'pro' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 bg-white hover:border-blue-500'}`}
                 >
                   <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border ${selectedPlan === 'pro' ? 'border-[6px] border-blue-500 bg-white' : 'border-slate-300'}`} />
                   <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white mb-2">Best Value</div>
                   <h3 className="text-xl font-bold text-blue-900">Pro Plan</h3>
                   <div className="text-2xl font-extrabold my-2 text-blue-900">$39.99<span className="text-sm text-blue-500 font-normal">/mo</span></div>
                   <p className="text-sm text-blue-700">30 AI updates per month for maximum local SEO.</p>
                 </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Your Business Profile</h2>
              <p className="text-slate-500 mb-8 text-sm">Watch your website generate in real-time on the right.</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name</label>
                  <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-3.5 focus:border-blue-500 focus:ring-0 outline-none text-slate-900 font-medium transition-all" 
                    placeholder="e.g. Action Plumbers" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Service</label>
                  <input 
                    type="text" 
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-3.5 focus:border-blue-500 focus:ring-0 outline-none text-slate-900 font-medium transition-all" 
                    placeholder="e.g. Plumbing, HVAC, Cleaning" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">City / Service Area</label>
                  <input 
                    type="text" 
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-3.5 focus:border-blue-500 focus:ring-0 outline-none text-slate-900 font-medium transition-all" 
                    placeholder="e.g. Austin, TX" 
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                     <PaintBucket className="w-4 h-4" /> Pick a Theme Color
                   </label>
                   <div className="flex gap-3">
                      {THEMES.map((theme) => (
                        <button
                          key={theme.color}
                          onClick={() => setThemeColor(theme.color)}
                          className={`w-10 h-10 rounded-full shadow-sm transition-transform hover:scale-110 flex items-center justify-center ${themeColor === theme.color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''}`}
                          style={{ backgroundColor: theme.color }}
                          title={theme.name}
                        />
                      ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Choose Your Domain</h2>
              <p className="text-slate-500 mb-8 text-sm">Every great business needs an address. Search across multiple extensions.</p>
              
              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDomainSearch(domainSearch)}
                  className="flex-1 border-2 border-slate-200 rounded-lg p-3.5 focus:border-blue-500 outline-none text-slate-900 font-medium transition-all" 
                  placeholder="e.g. actionplumbers" 
                />
                <Button 
                  onClick={() => handleDomainSearch(domainSearch)} 
                  disabled={isSearchingDomain}
                  className="h-auto px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-md font-semibold"
                >
                  {isSearchingDomain ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search TLDs"}
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                 {domainResults.length > 0 ? domainResults.map((result) => (
                   <div 
                     key={result.domain}
                     onClick={() => result.available && setSelectedDomain(result.domain)}
                     className={`p-4 border-2 rounded-xl flex items-center justify-between transition-all ${
                       !result.available 
                         ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed' 
                         : selectedDomain === result.domain
                           ? 'border-blue-500 bg-blue-50/50 cursor-pointer shadow-sm'
                           : 'border-slate-200 bg-white hover:border-blue-300 cursor-pointer'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                         selectedDomain === result.domain ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                       }`}>
                         {selectedDomain === result.domain && <div className="h-2 w-2 rounded-full bg-white" />}
                       </div>
                       <span className={`text-lg font-bold ${!result.available ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                         {result.domain}
                       </span>
                     </div>
                     
                     <div className="text-right">
                       {!result.available ? (
                         <span className="text-sm font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Taken</span>
                       ) : (
                         <div className="flex flex-col items-end">
                           <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wide mb-1">Available</span>
                           <span className="font-bold text-slate-900">${result.price}<span className="text-xs text-slate-500 font-normal">/yr</span></span>
                         </div>
                       )}
                     </div>
                   </div>
                 )) : (
                   <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                      Search for a domain above to see availability.
                   </div>
                 )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Final Step: Payment</h2>
              <p className="text-slate-500 mb-8 text-sm">
                Pay for your domain today. Your <span className="capitalize">{selectedPlan}</span> Plan trial is free for 30 days.
              </p>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                  <div className="flex justify-between text-slate-600 mb-3 text-sm font-medium">
                    <span>Domain Registration ({selectedDomain ? selectedDomain.split('.')[1] : '.com'})</span>
                    <span className="text-slate-900">${domainResults.find(d => d.domain === selectedDomain)?.price || 25}.00</span>
                  </div>
                  
                  <div className="flex justify-between text-slate-600 mb-4 text-sm font-medium">
                    <span className="capitalize">{selectedPlan} Plan (30-Day Trial)</span>
                    <span className="text-green-600 font-bold">Free</span>
                  </div>

                  <div className="h-px bg-slate-200 my-4" />
                  <div className="flex justify-between items-center font-black text-xl text-slate-900">
                    <span>Total Due Today</span>
                    <span>
                       ${domainResults.find(d => d.domain === selectedDomain)?.price || 25}.00
                    </span>
                  </div>
              </div>
              
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                 <div className="bg-blue-50 p-6 rounded-full text-blue-600 animate-pulse">
                    <CreditCard className="w-12 h-12" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">Secure Stripe Checkout</h3>
                    <p className="text-slate-500 max-w-sm">You will be redirected to Stripe to safely complete your purchase. We do not store your card details.</p>
                 </div>
                 <div className="flex items-center gap-4 pt-4">
                    <div className="h-6 w-auto grayscale opacity-40"><img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-full" /></div>
                 </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button 
               variant="ghost" 
               className="text-slate-500 hover:text-slate-900" 
               onClick={() => setStep(step - 1)} 
               disabled={step === 1 || isGenerating}
            >
              Back
            </Button>
            
            <Button 
               size="lg" 
               onClick={handleNext} 
               disabled={isGenerating || isProcessingPayment}
               className="bg-slate-900 hover:bg-slate-800 text-white min-w-[160px] shadow-lg hover:shadow-xl transition-all h-12 text-lg rounded-full"
            >
                {isGenerating || isProcessingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> {isProcessingPayment ? "Redirecting..." : "Generating..."}
                  </>
                ) : step === 4 ? (
                  "Complete Payment"
                ) : (
                  <>
                    Continue <ChevronRight className="h-5 w-5 ml-1" />
                  </>
                )}
            </Button>
          </div>

        </div>
      </div>

      {/* Right Column: Live Website Preview */}
      <div className="hidden lg:flex flex-1 bg-slate-200/50 p-8 xl:p-12 items-center justify-center relative overflow-hidden">
         {/* Decorative Background */}
         <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${themeColor}, transparent 50%)` }} />
         
         <div className="w-full max-w-3xl aspect-[16/10] xl:aspect-[16/11]">
            <WebsitePreview 
              businessName={businessName}
              serviceType={serviceType}
              serviceArea={serviceArea}
              themeColor={themeColor}
            />
         </div>
         
         {!businessName && step <= 2 && (
            <div className="absolute bottom-12 right-12 bg-white/90 backdrop-blur px-6 py-4 rounded-xl shadow-xl border border-slate-200 transform rotate-2 animate-in slide-in-from-right duration-700 max-w-xs">
              <p className="font-semibold text-slate-800 text-sm">✨ Start typing your business details to see the magic happen!</p>
            </div>
         )}
      </div>

    </div>
  );
}
