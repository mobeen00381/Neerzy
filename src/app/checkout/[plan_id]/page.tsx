export default function CheckoutPage({ params }: { params: { plan_id: string } }) {
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
        
        <button className="w-full bg-[#25D366] text-black font-bold py-4 rounded-xl text-lg hover:scale-[1.02] transition-all">
          Pay Now
        </button>
        
        <p className="mt-6 text-xs text-slate-400">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
