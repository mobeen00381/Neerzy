"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Activity, Globe, MessageSquare, AlertCircle, ExternalLink, CheckCircle2, LayoutDashboard, Share2, ArrowRightLeft, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Inbox } from "@/components/dashboard/Inbox";
import { QuickPostQR } from "@/components/dashboard/QuickPostQR";
import { ActivationStats } from "@/components/dashboard/ActivationStats";
import { trackEvent } from "@/lib/analytics";
import { Camera, Mic, Type } from "lucide-react";

function DomainTransferModal({ onClose }: { onClose: () => void }) {
  const [authCode, setAuthCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = () => {
    if (!authCode.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDone(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Transfer Domain</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isDone ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 leading-relaxed">
                <span className="font-bold">Your domain is yours.</span> Transfer it to any registrar at any time — no restrictions, no fees, no questions asked.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Domain</label>
                <div className="w-full border-2 border-slate-100 bg-slate-50 rounded-lg p-3.5 text-slate-900 font-medium">
                  acmeplumbing.com
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Transfer To (New Registrar)</label>
                <input
                  type="text"
                  placeholder="e.g. GoDaddy, Namecheap, Cloudflare..."
                  className="w-full border-2 border-slate-200 rounded-lg p-3.5 focus:border-blue-500 focus:ring-0 outline-none text-slate-900 font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Auth / EPP Code</label>
                <input
                  type="text"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Enter your authorization code"
                  className="w-full border-2 border-slate-200 rounded-lg p-3.5 focus:border-blue-500 focus:ring-0 outline-none text-slate-900 font-medium transition-all"
                />
                <p className="text-xs text-slate-400 mt-1.5">We&apos;ll generate and email you the EPP code if you don&apos;t have one yet.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isSubmitting ? "Processing..." : "Start Transfer"}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="bg-green-100 p-4 rounded-full text-green-600 inline-flex mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Transfer Initiated!</h3>
            <p className="text-slate-600 mb-6">We&apos;ve unlocked your domain. You&apos;ll receive an email with the EPP code and transfer instructions within 5 minutes.</p>
            <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white">Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const isGmbConnected = searchParams.get("gmb") === "connected" || (profile && profile.gmb_refresh_token);
  const isFirstUpdate = searchParams.get("firstUpdate") === "true";
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showFirstUpdateModal, setShowFirstUpdateModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
        fetchProfile(session.user.email);
      }
    });
  }, [router]);

  const fetchProfile = async (email: string | undefined) => {
    if (!email) return;
    const { data } = await supabase.from("users").select("*").eq("email", email).single();
    if (data) {
      setProfile(data);
      if (isFirstUpdate) setShowFirstUpdateModal(true);
    }
    setIsInitializing(false);
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleFirstUpdateSimulate = (type: "photo" | "voice" | "text") => {
    trackEvent("first_update_sent", { type });
    setShowFirstUpdateModal(false);
    setShowCelebration(true);
    
    // Simulate updating analytics logic locally
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 4000);
  };

  if (isInitializing || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate generic trial days logic based on generated created_at
  const trialDaysLeft = profile ? Math.max(0, 30 - Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 30;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profile?.business_name || session?.user?.email}</h1>
            <p className="text-slate-600 mt-1">Manage your Neerzy services here.</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
               Trial Active ({trialDaysLeft} days left)
             </span>
             <Button variant="outline" onClick={handleSignOut}><AlertCircle className="h-4 w-4 mr-2" /> Sign Out</Button>
          </div>
        </div>

        {/* Action Required Banner */}
        {!isGmbConnected ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex flex-col sm:flex-row gap-4 justify-between sm:items-center shadow-sm">
             <div className="flex items-start gap-3">
               <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                 <AlertCircle className="h-6 w-6" />
               </div>
               <div>
                 <h3 className="font-semibold text-blue-900">Step 1: Connect your Google Business Profile</h3>
                 <p className="text-blue-700 text-sm mt-1">To start automated SEO posting, we need permission to manage your profile.</p>
               </div>
             </div>
             <Link href={`/api/auth/google?userId=${profile?.id}`}>
               <Button className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-full">
                 Connect Google Business
               </Button>
             </Link>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 flex items-center gap-4 shadow-sm animate-in fade-in zoom-in duration-500">
             <div className="bg-green-100 p-2 rounded-lg text-green-600">
               <CheckCircle2 className="h-6 w-6" />
             </div>
             <div>
               <h3 className="font-semibold text-green-900">Google Business Profile Connected!</h3>
               <p className="text-green-700 text-sm">Our AI is now monitoring your profile and will post updates automatically.</p>
             </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Dynamic Activation Stats */}
            <ActivationStats />

            {/* AI Assistant Inbox */}
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

          {/* Sidebar Area */}
          <div className="space-y-8">
            <QuickPostQR />
            
            <Card>
              <CardHeader>
                <CardTitle>Your Website</CardTitle>
                <CardDescription>acmeplumbing.com</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium">
                    <Globe className="h-5 w-5" /> Online & Active
                 </div>
                 <Button className="w-full" variant="outline">
                   Visit Website <ExternalLink className="h-4 w-4 ml-2" />
                 </Button>
                 <Button className="w-full" variant="outline">
                   Request Website Change
                 </Button>
                 <Button 
                   className="w-full border-blue-200 text-blue-700 hover:bg-blue-50" 
                   variant="outline"
                   onClick={() => setShowTransferModal(true)}
                 >
                   <ArrowRightLeft className="h-4 w-4 mr-2" /> Transfer Domain
                 </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What to do next</CardTitle>
              </CardHeader>
              <CardContent>
                 <ul className="space-y-4 text-sm">
                   <li className="flex gap-3 text-slate-500 line-through">
                     <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                     <span>Register domain and select plan</span>
                   </li>
                   <li className="flex gap-3 text-slate-500 line-through">
                     <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                     <span>Website initial generation</span>
                   </li>
                   <li className="flex gap-3 text-slate-800 font-medium">
                     <div className="h-5 w-5 rounded-full border-2 border-blue-500 shrink-0 mt-0.5" />
                     <span>Verify Google Business Profile</span>
                   </li>
                    <li className="flex gap-3 text-slate-800 font-medium">
                      <div className="h-5 w-5 rounded-full border-2 border-blue-500 shrink-0 mt-0.5" />
                      <span>Create your first AI project update</span>
                    </li>
                    <li className="flex gap-3 text-slate-500">
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                      <span>Upload 3 before/after project photos</span>
                    </li>
                 </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Domain Transfer Modal */}
      {showTransferModal && <DomainTransferModal onClose={() => setShowTransferModal(false)} />}

      {/* First Update Guided Modal */}
      {showFirstUpdateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Activity className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Send your first update</h2>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto">
              Choose an option below. Our AI will automatically write a post and update your website and Google Profile.
            </p>

            <div className="grid gap-4">
              <button onClick={() => handleFirstUpdateSimulate('photo')} className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-4 rounded-2xl transition-colors text-left group">
                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Upload a photo</h4>
                  <p className="text-sm text-slate-500">Snap a picture of your recent work</p>
                </div>
              </button>

              <button onClick={() => handleFirstUpdateSimulate('voice')} className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-4 rounded-2xl transition-colors text-left group">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Record a voice note</h4>
                  <p className="text-sm text-slate-500">Just talk about what you did today</p>
                </div>
              </button>
            </div>
            
            <button onClick={() => setShowFirstUpdateModal(false)} className="mt-8 text-sm text-slate-400 hover:text-slate-600 font-medium">
              I'll do this later
            </button>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-emerald-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="text-center animate-in zoom-in-50 fade-in duration-500">
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Your update is live on your website!</h2>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 inline-block">
              <p className="text-emerald-100 text-xl font-medium mb-2">This helps you rank higher on Google.</p>
              <p className="text-white/60">More updates = more visibility.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
