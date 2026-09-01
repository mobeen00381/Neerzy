'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

import { Suspense } from 'react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'free';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard?plan=${plan}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) throw error;
      // Redirect happens automatically
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard?plan=${plan}`
        }
      });
      
      if (error) throw error;
      // Navigate to dashboard with parameters
      router.push(`/dashboard?plan=${plan}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B3D2E] font-sans relative overflow-hidden text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md flex flex-col items-center z-10 space-y-6">
        {/* Header / Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22C55E] flex items-center justify-center shadow-lg shadow-[#22C55E]/20">
            <Sparkles className="w-4.5 h-4.5 text-white stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">Neerzy</span>
        </div>

        {/* Signup Card */}
        <div className="w-full bg-white/[0.06] border border-white/15 p-8 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Create Your Account</h1>
            <p className="text-white/70 text-xs font-semibold mt-2.5 uppercase tracking-wider bg-white/10 border border-white/15 py-1.5 px-3 rounded-full inline-block">
              {plan === 'free' && '🎁 Start with our Free plan'}
              {plan === 'pro' && '⚡ Get started with Pro - $39/mo'}
              {plan === 'growth' && '🚀 Get started with Growth - $79/mo'}
            </p>
          </div>

          {error && (
            <div className="bg-white/10 border border-white/25 text-white/90 px-4 py-3 rounded-2xl mb-6 text-xs font-bold animate-in fade-in duration-300">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-5 mb-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all font-semibold text-white text-sm placeholder:text-white/40"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all font-semibold text-white text-sm placeholder:text-white/40"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-lg shadow-[#22C55E]/20 active:scale-[0.98] flex items-center justify-center gap-2 group text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Sign up with Email</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0B3D2E] text-white/50 font-bold uppercase tracking-widest">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3.5 bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-xs disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* Terms and Privacy info */}
          <p className="text-center text-[10px] font-semibold text-white/50 mt-6 leading-relaxed">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-[#22C55E] hover:underline">Terms</a>{' '}
            and{' '}
            <a href="/privacy-policy" className="text-[#22C55E] hover:underline">Privacy Policy</a>
          </p>
        </div>

        {/* Secure badge footer */}
        <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>Supabase Enterprise Authenticated Session</span>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B3D2E] flex flex-col items-center justify-center text-white/70 font-bold space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
        <span className="text-xs uppercase tracking-widest font-black text-white/50">Initializing Secure Auth Session...</span>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
