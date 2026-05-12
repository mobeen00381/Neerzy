"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    trackEvent("signup_completed");
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
        <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100/50">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">You're officially live! 🚀</h1>
        <p className="text-slate-500 text-lg mb-10">We've received your payment. Your domain is registered and your SEO-optimized website is ready.</p>

        <div className="space-y-4 mb-10">
           <div className="bg-white p-6 rounded-2xl border-2 border-green-500 shadow-sm flex items-center gap-4 text-left transition-colors">
              <div className="bg-green-100 p-3 rounded-xl text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Your website is live</h3>
                <p className="text-sm text-slate-500">Fast, mobile-ready, and SEO optimized.</p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border-2 border-green-500 shadow-sm flex items-center gap-4 text-left transition-colors">
              <div className="bg-green-100 p-3 rounded-xl text-green-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Your business is ready</h3>
                <p className="text-sm text-slate-500">Google Business profile connected.</p>
              </div>
           </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
           <h3 className="font-bold text-blue-900 mb-2">Next Step: Climb Google Rankings</h3>
           <p className="text-sm text-blue-700 mb-4">Send an update to your website and Google profile to start climbing the search results.</p>
           
           <Link href="/dashboard?firstUpdate=true">
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all">
              👉 Send your first update
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-medium pb-8">
          <TrendingUp className="w-4 h-4 text-blue-500" /> More updates = more visibility
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessPageContent />
    </Suspense>
  );
}
