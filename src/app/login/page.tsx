"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowRight, CheckCircle2, Loader2, Zap, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const [method, setMethod] = useState<"email" | "whatsapp">("whatsapp");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
   const router = useRouter();
   const searchParams = useSearchParams();
   const plan = searchParams.get("plan");

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        setCountdown(60);
        setStatus("idle");
        setErrorMessage("");
      } else {
        throw new Error(data.error || "Failed to send OTP");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus("error");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setStatus("loading");
    try {
      console.log('📤 Sending to API:', {
        phoneNumber: phone,
        otpCode: otp,
        plan: plan,
      });

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, otpCode: otp, plan })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // ✅ CRITICAL: Redirect to dashboard or onboarding
        const targetUrl = data.redirect || "/dashboard";
        
        if (plan || data.isNewUser) {
          router.push(`/onboarding?plan=${plan || 'free'}`);
        } else {
          router.push(targetUrl);
        }
      } else {
        throw new Error(data.error || "Failed to verify OTP");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-10">
          <div className="flex items-center mb-10 justify-center">
            <img src="/images/logo.png" alt="Neerzy Logo" className="h-20 w-auto object-contain" />
          </div>

          {status === "success" ? (
            <div className="text-center py-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Check your email!</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We sent a secure magic link to <br/><strong className="text-slate-900">{email}</strong>.
              </p>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setStatus("idle")}>
                Try a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome back</h2>
                <p className="text-slate-500 font-medium">Choose your preferred login method.</p>
              </div>

              {/* Login Method Toggle */}
              <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8 relative">
                 <div 
                   className="absolute h-[calc(100%-12px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out"
                   style={{ 
                     width: "calc(50% - 6px)", 
                     left: method === "whatsapp" ? "6px" : "calc(50%)" 
                   }}
                 />
                 <button 
                   onClick={() => { setMethod("whatsapp"); setIsOtpSent(false); }}
                   className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${method === "whatsapp" ? "text-blue-600" : "text-slate-500"}`}
                 >
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                 </button>
                 <button 
                   onClick={() => { setMethod("email"); setIsOtpSent(false); }}
                   className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${method === "email" ? "text-blue-600" : "text-slate-500"}`}
                 >
                    <Mail className="w-4 h-4" /> Email
                 </button>
              </div>

              {method === "email" ? (
                <form onSubmit={handleEmailLogin} className="space-y-6 animate-in fade-in duration-500">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={status === "loading" || !email}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-14 text-lg rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                  >
                    {status === "loading" ? <Loader2 className="animate-spin" /> : "Get Magic Link"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                   {!isOtpSent ? (
                     <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-slate-700 ml-1">WhatsApp Number</label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 234 567 8900"
                              className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white bg-slate-50/50 outline-none transition-all font-semibold text-slate-900"
                            />
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          disabled={status === "loading" || !phone}
                          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black h-14 text-lg rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-[0.98]"
                        >
                          {status === "loading" ? <Loader2 className="animate-spin" /> : "Send WhatsApp OTP"}
                        </Button>
                     </form>
                   ) : (
                     <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="text-center mb-4">
                           <p className="text-sm text-slate-500">We sent a 6-digit code to <br/><span className="font-bold text-slate-900">{phone}</span></p>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="0 0 0 0 0 0"
                            className="w-full text-center text-3xl tracking-[1rem] py-5 border-2 border-blue-100 rounded-2xl focus:border-blue-500 bg-blue-50/30 outline-none transition-all font-black text-slate-900"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={status === "loading" || otp.length < 6}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-14 text-lg rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                        >
                          {status === "loading" ? <Loader2 className="animate-spin" /> : "Verify & Log In"}
                        </Button>

                        {/* Countdown & Resend */}
                        <div className="flex items-center justify-center gap-3 pt-2">
                          {countdown > 0 ? (
                            <span className="text-sm text-slate-400 font-semibold tabular-nums">
                              Resend in <span className="text-blue-600 font-black">{countdown}s</span>
                            </span>
                          ) : (
                            <button 
                              type="button" 
                              onClick={(e) => { setOtp(""); setErrorMessage(""); handleSendOtp(e as any); }}
                              disabled={status === "loading"}
                              className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors disabled:opacity-50"
                            >
                              {status === "loading" ? "Sending..." : "Resend Code"}
                            </button>
                          )}
                          <span className="text-slate-200">|</span>
                          <button 
                            type="button" 
                            onClick={() => { setIsOtpSent(false); setCountdown(0); setOtp(""); setErrorMessage(""); }}
                            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Change number
                          </button>
                        </div>
                     </form>
                   )}
                </div>
              )}

              {status === "error" && (
                <div className="mt-6 bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 font-bold flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {errorMessage}
                </div>
              )}

              <p className="text-center text-sm text-slate-500 mt-10">
                New to Neerzy? <Link href="/signup" className="text-blue-600 font-black hover:underline">Create an account</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
