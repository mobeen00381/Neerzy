// app/onboarding/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading setup...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'free';
  const [status, setStatus] = useState("Initializing your engine...");

  useEffect(() => {
    const completeOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setStatus("Syncing with Google...");

      // Initialize user profile with plan
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          selected_plan: plan,
          trial_started_at: new Date().toISOString(),
          gbp_connected: false,
          onboarded_at: new Date().toISOString(),
          // Carry over business name if exists in metadata
          business_name: user.user_metadata?.business_name || null,
        }, { onConflict: 'id' });

      if (error) console.error("Onboarding sync failed:", error);

      setStatus("Ready for launch!");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    };

    completeOnboarding();
  }, [router, plan]);

  return (
    <div className="min-h-screen bg-[#0F5C4D] flex flex-col items-center justify-center p-8 text-center overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#25D366]/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-24 h-24 bg-[#25D366] rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-teal-500/20 animate-bounce">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
          Welcome to Neerzy! 🎉
        </h1>
        <p className="text-teal-50 font-medium mb-12 leading-relaxed opacity-80">
          Setting up your <span className="text-[#25D366] font-black capitalize">{plan}</span> infrastructure. Almost ready for your first post!
        </p>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 mb-12">
           <div className="flex items-center gap-4 text-left mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                 <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                 <p className="text-[10px] text-teal-200 font-black uppercase tracking-widest">Current Task</p>
                 <p className="text-white font-bold">{status}</p>
              </div>
           </div>
           <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="bg-[#25D366] h-full animate-progress" style={{ width: '100%' }} />
           </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-teal-200 font-bold text-sm uppercase tracking-tighter opacity-60">
           <Loader2 className="w-4 h-4 animate-spin" />
           Booting Dashboard...
        </div>
      </div>
    </div>
  );
}
