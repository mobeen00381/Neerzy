'use client';

import { useEffect, useState } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

export default function CheckoutPage({ params }: { params: { plan_id: string } }) {
  const [paddle, setPaddle] = useState<Paddle>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize Paddle on mount
  useEffect(() => {
    initializePaddle({ 
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_token',
      eventCallback: function(data) {
        console.log('Paddle Event:', data.name);
        if (data.name === 'checkout.completed') {
          window.location.href = '/dashboard?success=true';
        }
      }
    }).then(
      (paddleInstance: Paddle | undefined) => {
        if (paddleInstance) setPaddle(paddleInstance);
      }
    );
  }, []);

  const handleCheckout = async () => {
    if (!paddle) {
      setError('Paddle is still initializing. Please try again in a moment.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Create the transaction on the backend
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: params.plan_id,
          // You can pass other user details here like businessName, domainName if needed
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      // 2. Open the Paddle checkout overlay using the securely generated transaction ID
      paddle.Checkout.open({
        transactionId: data.transactionId
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-20 max-w-4xl text-center">
      <h1 className="text-4xl font-bold mb-4 text-[#0F5C4D]">Complete Your Subscription</h1>
      <p className="text-xl text-slate-600 mb-12">Plan: <span className="font-bold text-[#25D366] uppercase">{params.plan_id}</span></p>
      
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-16 h-16 bg-[#F0F7F5] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold">Secure Checkout</h2>
          <p className="text-slate-500">Payments powered by Paddle</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-semibold">
            {error}
          </div>
        )}

        <button 
          onClick={handleCheckout}
          disabled={loading || !paddle}
          className="w-full bg-[#25D366] text-black font-bold py-4 rounded-xl text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        
        <p className="mt-6 text-xs text-slate-400">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
