"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { CheckCircle2, ChevronRight, Globe, Building2, PaintBucket, Loader2, Sparkles, Clock, ArrowRight, ExternalLink, Mic, Send, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import WebsitePreview from "@/app/onboarding/WebsitePreview";
import { Inbox } from "@/components/dashboard/Inbox";
import { supabase } from "@/lib/supabase";

const THEMES = [
  { name: "Ocean Blue", color: "#3B82F6" },
  { name: "Forest Green", color: "#10B981" },
  { name: "Vibrant Orange", color: "#F97316" },
  { name: "Slate Dark", color: "#334155" },
  { name: "Royal Purple", color: "#8B5CF6" },
];

export default function DemoPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const code = resolvedParams.code;

  // Auth state
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  // Flow state — 4 steps: Plan → Business → Domain → Dashboard
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro">("basic");
  const [businessName, setBusinessName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [themeColor, setThemeColor] = useState(THEMES[0].color);
  const [isGenerating, setIsGenerating] = useState(false);
  const [domainSearch, setDomainSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainResults, setDomainResults] = useState<{domain: string; available: boolean}[]>([]);
  const [isSearchingDomain, setIsSearchingDomain] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(7);

  useEffect(() => {
    async function validateCode() {
      if (!code) return setIsValidating(false);
      
      const { data, error } = await supabase
        .from("demo_links")
        .select("*")
        .eq("code", code)
        .single();

      if (!error && data && data.used === false && new Date(data.expires_at) > new Date()) {
        setIsValid(true);
        const diff = new Date(data.expires_at).getTime() - Date.now();
        setDaysRemaining(Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24))));
      } else {
        setIsValid(false);
      }
      setIsValidating(false);
    }
    
    validateCode();
  }, [code]);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setIsGenerating(true);
      setDomainSearch(businessName.toLowerCase().replace(/[^a-z0-9]/g, ""));
      setTimeout(() => {
        setIsGenerating(false);
        setStep(3);
        simulateDomainSearch(businessName.toLowerCase().replace(/[^a-z0-9]/g, ""));
      }, 2500);
    } else if (step === 3) {
      setStep(4); // Go to dashboard
    }
  };

  const simulateDomainSearch = (query: string) => {
    setIsSearchingDomain(true);
    setTimeout(() => {
      const results = [
        { domain: `${query}.com`, available: true },
        { domain: `${query}.net`, available: true },
        { domain: `${query}.co`, available: false },
        { domain: `${query}pro.com`, available: true },
      ];
      setDomainResults(results);
      setSelectedDomain(`${query}.com`);
      setIsSearchingDomain(false);
    }, 1000);
  };

  const steps = [
    { id: 1, name: "Plan" },
    { id: 2, name: "Business" },
    { id: 3, name: "Domain" },
    { id: 4, name: "Dashboard" },
  ];

  // ── Loading ──
  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Validating your early access link...</p>
      </div>
    );
  }

  // ── Invalid ──
  if (!isValid) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full text-red-500 mb-4">
          <Clock className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired or Invalid</h1>
        <p className="text-slate-600 mb-8 max-w-md">This early access demo link is no longer valid. Contact us to get a new one.</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </div>
    );
  }

  // ── Step 4: Demo Dashboard ──
  if (step === 4) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 text-center text-sm font-bold flex items-center justify-center gap-3 shadow-lg">
          <Sparkles className="h-4 w-4" />
          <span>🎉 Demo Mode — {daysRemaining} days remaining</span>
          <Link href="/onboarding">
            <button className="bg-white text-blue-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-blue-50 transition-colors ml-2">
              Upgrade to Full Plan <ArrowRight className="inline h-3 w-3 ml-1" />
            </button>
          </Link>
        </div>

        <div className="container mx-auto px-4 max-w-6xl py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome, {businessName || "Demo User"}</h1>
              <p className="text-slate-600 mt-1">Your {selectedDomain} website is live. Start posting updates!</p>
            </div>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
              Early Access — {selectedPlan === "pro" ? "Pro" : "Basic"} Plan
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-slate-500">Demo Posts Used</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-slate-900">0 / 5</div>
                    <p className="text-xs text-blue-500 font-medium mt-1">5 posts remaining</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-slate-500">Website Status</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-green-600">Live</div>
                    <p className="text-xs text-green-500 font-medium mt-1">{selectedDomain}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-slate-500">Time Left</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-slate-900">{daysRemaining} Days</div>
                    <p className="text-xs text-purple-500 font-medium mt-1">Full access</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Assistant */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">AI SEO Assistant</h2>
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mt-2" />
                    <span className="text-xs text-slate-500 font-medium">AI Agent Online</span>
                  </div>
                </div>
                <Inbox />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-purple-200 bg-gradient-to-b from-purple-50 to-white">
                <CardHeader>
                  <CardTitle className="text-lg">Your Demo Website</CardTitle>
                  <CardDescription>{selectedDomain}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium text-sm">
                    <Globe className="h-5 w-5" /> Live Preview Active
                  </div>
                  <Button className="w-full" variant="outline" size="sm">
                    Visit Demo Site <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Try These Steps</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm">
                    <li className="flex gap-3 text-slate-500 line-through">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span>Select a plan</span>
                    </li>
                    <li className="flex gap-3 text-slate-500 line-through">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span>Enter business info & preview site</span>
                    </li>
                    <li className="flex gap-3 text-slate-500 line-through">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span>Register a domain</span>
                    </li>
                    <li className="flex gap-3 text-slate-800 font-medium">
                      <div className="h-5 w-5 rounded-full border-2 border-blue-500 shrink-0 mt-0.5" />
                      <span>Send a message to the AI</span>
                    </li>
                    <li className="flex gap-3 text-slate-800 font-medium">
                      <div className="h-5 w-5 rounded-full border-2 border-blue-500 shrink-0 mt-0.5" />
                      <span>Record a voice note about a job</span>
                    </li>
                    <li className="flex gap-3 text-slate-500">
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                      <span>Approve an AI-generated post</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold mb-2">Ready to go live?</h3>
                  <p className="text-blue-100 text-sm mb-4">Get your own real domain and start ranking on Google.</p>
                  <Link href="/onboarding">
                    <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-md">
                      Upgrade Now — From $19.99/mo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Steps 1-3: Guided Onboarding ──
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex">
      {/* Left Column: Flow */}
      <div className="flex-1 overflow-y-auto py-12 px-4 shadow-2xl relative z-10 bg-white">
        <div className="max-w-xl mx-auto">

          {/* Demo Tag */}
          <div className="mb-6 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Early Access Demo
            </span>
            <span className="text-xs text-slate-400">No payment required</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Experience SEO Junction</h1>
            <p className="text-slate-500">Walk through the full setup — just like a real customer.</p>
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

          {/* Step 1: Plan */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Select your Plan</h2>
              <div className="space-y-4">
                <div
                  onClick={() => setSelectedPlan("basic")}
                  className={`p-5 border-2 rounded-xl cursor-pointer relative shadow-sm transition-all ${selectedPlan === "basic" ? "border-blue-500 bg-blue-50/20" : "border-slate-200 bg-white hover:border-blue-300"}`}
                >
                  <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border ${selectedPlan === "basic" ? "border-[6px] border-blue-500 bg-white" : "border-slate-300"}`} />
                  <h3 className="text-xl font-bold text-slate-900">Basic Plan</h3>
                  <div className="text-2xl font-extrabold my-2">$19.99<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                  <p className="text-sm text-slate-600">10 auto-generated website & GMB posts per month.</p>
                </div>

                <div
                  onClick={() => setSelectedPlan("pro")}
                  className={`p-5 border-2 rounded-xl cursor-pointer relative shadow-sm transition-all ${selectedPlan === "pro" ? "border-blue-500 bg-blue-50/20" : "border-slate-200 bg-white hover:border-blue-300"}`}
                >
                  <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border ${selectedPlan === "pro" ? "border-[6px] border-blue-500 bg-white" : "border-slate-300"}`} />
                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white mb-2">Best Value</div>
                  <h3 className="text-xl font-bold text-blue-900">Pro Plan</h3>
                  <div className="text-2xl font-extrabold my-2 text-blue-900">$39.99<span className="text-sm text-blue-500 font-normal">/mo</span></div>
                  <p className="text-sm text-blue-700">30 AI updates per month for maximum local SEO.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Your Business Profile</h2>
              <p className="text-slate-500 mb-8 text-sm">Watch your website generate in real-time on the right →</p>

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
                        className={`w-10 h-10 rounded-full shadow-sm transition-transform hover:scale-110 ${themeColor === theme.color ? "ring-2 ring-offset-2 ring-slate-800 scale-110" : ""}`}
                        style={{ backgroundColor: theme.color }}
                        title={theme.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Domain */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Choose Your Domain</h2>
              <p className="text-slate-500 mb-8 text-sm">Pick a domain for your demo website. This is simulated — no real charge.</p>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && simulateDomainSearch(domainSearch)}
                  className="flex-1 border-2 border-slate-200 rounded-lg p-3.5 focus:border-blue-500 outline-none text-slate-900 font-medium transition-all"
                  placeholder="e.g. actionplumbers"
                />
                <Button
                  onClick={() => simulateDomainSearch(domainSearch)}
                  disabled={isSearchingDomain}
                  className="h-auto px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-md font-semibold"
                >
                  {isSearchingDomain ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
                </Button>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
                {domainResults.length > 0 ? domainResults.map((result) => (
                  <div
                    key={result.domain}
                    onClick={() => result.available && setSelectedDomain(result.domain)}
                    className={`p-4 border-2 rounded-xl flex items-center justify-between transition-all ${
                      !result.available
                        ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                        : selectedDomain === result.domain
                          ? "border-blue-500 bg-blue-50/50 cursor-pointer shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                        selectedDomain === result.domain ? "border-blue-500 bg-blue-500" : "border-slate-300"
                      }`}>
                        {selectedDomain === result.domain && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-lg font-bold ${!result.available ? "text-slate-500 line-through" : "text-slate-900"}`}>
                        {result.domain}
                      </span>
                    </div>
                    <div>
                      {!result.available ? (
                        <span className="text-sm font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Taken</span>
                      ) : (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wide">Available</span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                    Search for a domain above to see availability.
                  </div>
                )}
              </div>

              {selectedDomain && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Demo domain selected: {selectedDomain}</p>
                    <p className="text-xs text-green-600 mt-1">No payment needed — this is a free demo experience.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
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
              disabled={isGenerating || (step === 2 && !businessName) || (step === 3 && !selectedDomain)}
              className="bg-slate-900 hover:bg-slate-800 text-white min-w-[180px] shadow-lg hover:shadow-xl transition-all h-12 text-lg rounded-full"
            >
              {isGenerating ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating...</>
              ) : step === 3 ? (
                <>Launch Dashboard <ArrowRight className="h-5 w-5 ml-1" /></>
              ) : (
                <>Continue <ChevronRight className="h-5 w-5 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Live Website Preview */}
      <div className="hidden lg:flex flex-1 bg-slate-200/50 p-8 xl:p-12 items-center justify-center relative overflow-hidden">
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
