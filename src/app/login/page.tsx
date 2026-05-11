"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowRight, CheckCircle2, Loader2, Zap, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [method, setMethod] = useState<"email" | "whatsapp">("whatsapp");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

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
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.success) {
        setIsOtpSent(true);
        setStatus("idle");
      } else {
        throw new Error(data.error);
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
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp })
      });
      const data = await res.json();
      if (data.success) {
        // In this MVP, we redirect to dashboard. 
        // Real production apps would set a cookie or JWT here.
        router.push("/dashboard");
      } else {
        throw new Error(data.error);
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
          <div className="flex items-center gap-2 mb-10 justify-center">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">NEERZY</span>
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
                        <button 
                          type="button" 
                          onClick={() => setIsOtpSent(false)}
                          className="w-full text-sm font-bold text-slate-400 hover:text-slate-600"
                        >
                          Change phone number
                        </button>
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
                New to Neerzy? <Link href="/#pricing" className="text-blue-600 font-black hover:underline">Get started free</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
