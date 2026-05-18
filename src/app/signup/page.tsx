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
          redirectTo: `${window.location.origin}/onboarding?plan=${plan}`,
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
          emailRedirectTo: `${window.location.origin}/onboarding?plan=${plan}`
        }
      });
      
      if (error) throw error;
      // Navigate to onboarding with parameters
      router.push(`/onboarding?plan=${plan}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans relative overflow-hidden text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Background radial glow blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#0F5C4D]/25 blur-[140px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/15 blur-[140px] rounded-full" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center z-10 space-y-6">
        {/* Header / Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">Neerzy</span>
        </div>

        {/* Signup Glassmorphic Container */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 p-8 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Create Your Account</h1>
            <p className="text-slate-400 text-xs font-semibold mt-2.5 uppercase tracking-wider bg-slate-950/40 border border-slate-800/50 py-1.5 px-3 rounded-full inline-block">
              {plan === 'free' && '🎁 Start with our Free plan'}
              {plan === 'pro' && '⚡ Get started with Pro - $39/mo'}
              {plan === 'growth' && '🚀 Get started with Growth - $79/mo'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 px-4 py-3 rounded-2xl mb-6 text-xs font-bold animate-in fade-in duration-300">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-5 mb-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-semibold text-white text-sm placeholder:text-slate-600"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-semibold text-white text-sm placeholder:text-slate-600"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center gap-2 group text-sm cursor-pointer"
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
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0a111f] text-slate-500 font-bold uppercase tracking-widest">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-xs disabled:opacity-50 cursor-pointer"
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
          <p className="text-center text-[10px] font-semibold text-slate-500 mt-6 leading-relaxed">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-emerald-500 hover:underline">Terms</a>{' '}
            and{' '}
            <a href="/privacy" className="text-emerald-500 hover:underline">Privacy Policy</a>
          </p>
        </div>

        {/* Secure badge footer */}
        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Supabase Enterprise Authenticated Session</span>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-bold space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs uppercase tracking-widest font-black text-slate-500">Initializing Secure Auth Session...</span>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
