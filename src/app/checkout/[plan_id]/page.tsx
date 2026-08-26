'use client';

import { use, useEffect, useState } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { supabase } from '@/lib/supabase';

const PADDLE_PRICE_IDS: Record<string, string> = {
  pro: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || "pri_01kqw4dy15ptkzs43bm3pqr12w",
  growth: process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID || "pri_01kqw4j2820525t8q9yhk21x7n",
  agency: process.env.NEXT_PUBLIC_PADDLE_AGENCY_PRICE_ID || "pri_01kqw4mmbwxgjvt5pc0cf5b80h",
};

export default function CheckoutPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = use(params);
  const [paddle, setPaddle] = useState<Paddle>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Load the current user id so it can be attached to the Paddle checkout custom data
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
  }, []);

  // Initialize Paddle on mount using Client Token — no server API call needed
  useEffect(() => {
    initializePaddle({
      environment: 'production',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: function (data) {
        if (data.name === 'checkout.completed') {
          window.location.href = `/welcome?plan=${plan_id}`;
        }
      }
    }).then((paddleInstance: Paddle | undefined) => {
      if (paddleInstance) setPaddle(paddleInstance);
    });
  }, [plan_id]);

  const handleCheckout = () => {
    const priceId = PADDLE_PRICE_IDS[plan_id];
    if (!priceId) {
      setError('Invalid plan selected.');
      return;
    }

    if (!paddle) {
      setError('Paddle is still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Open Paddle checkout overlay directly with Price ID — no backend needed!
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: {
          userId: userId || '',
          planId: plan_id,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to open checkout.');
    } finally {
      setLoading(false);
    }
  };

  const planNames: Record<string, string> = {
    pro: 'Pro — $39/mo',
    growth: 'Growth — $79/mo',
    agency: 'Agency — $199/mo',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#25D366] opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="w-16 h-16 bg-[#F0F7F5] rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">🔒</span>
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-1">Complete Your Subscription</h1>
        <p className="text-slate-500 mb-2 font-medium">
          Plan: <span className="font-black text-[#0F5C4D] uppercase">{plan_id}</span>
        </p>
        <p className="text-[#25D366] font-bold text-lg mb-8">{planNames[plan_id]}</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading || !paddle}
          className="w-full bg-[#25D366] text-black font-black py-4 rounded-xl text-lg hover:bg-[#20bd5a] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#25D366]/20"
        >
          {loading ? 'Opening checkout...' : !paddle ? 'Loading...' : 'Pay Now'}
        </button>

        <p className="mt-5 text-xs text-slate-400">
          Secure payments powered by Paddle. By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
