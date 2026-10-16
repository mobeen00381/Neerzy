"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabase";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Phone-OTP sign-in used to live here. It is gone: Neerzy accounts are
// email (magic link) or Google, and a WhatsApp number is optional — added
// later in Account settings when the user wants updates on WhatsApp.
function LoginContent() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const searchParams = useSearchParams();
  // Attribution for the admin dashboard (ad channels: facebook / instagram / google_ads / organic).
  const ssGet = (k: string) => (typeof window !== "undefined" ? sessionStorage.getItem(k) : null);
  const utm_source = searchParams.get("utm_source") || ssGet("utm_source") || undefined;
  const utm_medium = searchParams.get("utm_medium") || ssGet("utm_medium") || undefined;
  const utm_campaign = searchParams.get("utm_campaign") || ssGet("utm_campaign") || undefined;

  // Remember attribution if the user navigates internally before finishing signup.
  useEffect(() => {
    if (utm_source) sessionStorage.setItem("utm_source", utm_source);
    if (utm_medium) sessionStorage.setItem("utm_medium", utm_medium);
    if (utm_campaign) sessionStorage.setItem("utm_campaign", utm_campaign);
  }, [utm_source, utm_medium, utm_campaign]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  return (
    <div className="min-h-screen bg-[#E6F2EA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-[#E1E8E4]">
        <div className="p-10">
          <div className="flex items-center mb-10 justify-center">
            <Logo className="h-16 w-auto object-contain" />
          </div>

          {status === "success" ? (
            <div className="text-center py-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-[#E6F2EA] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-[#16A34A]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0A2E22] mb-3">Check your email!</h2>
              <p className="text-[#5B6B64] mb-8 leading-relaxed">
                We sent a secure magic link to <br/><strong className="text-[#0A2E22]">{email}</strong>.
              </p>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setStatus("idle")}>
                Try a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-[#0A2E22] mb-2">Welcome back</h2>
                <p className="text-[#5B6B64] font-medium">
                  Enter your email and we&apos;ll send you a secure login link.
                </p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#0F5132] ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5B6B64] group-focus-within:text-[#0F5132] transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-12 pr-4 py-4 border-2 border-[#E1E8E4] rounded-2xl focus:border-[#22C55E] focus:bg-white bg-[#F7F9F8] outline-none transition-all font-semibold text-[#0A2E22]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={status === "loading" || !email}
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-black h-14 text-lg rounded-2xl shadow-lg shadow-[#D3E6DA] transition-all active:scale-[0.98]"
                >
                  {status === "loading" ? <Loader2 className="animate-spin" /> : "Get Magic Link"}
                </Button>
              </form>
            </>
          )}

          {status === "error" && (
            <div className="mt-6 bg-[#0B3D2E] text-white text-sm p-4 rounded-xl font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              {errorMessage}
            </div>
          )}

          <p className="text-center text-sm text-[#5B6B64] mt-10">
            New to Neerzy? <Link href="/signup" className="text-[#0F5132] font-black hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E6F2EA] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#22C55E]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
