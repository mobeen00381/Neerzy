// components/dashboard/UpgradePrompt.tsx
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function UpgradePrompt() {
  return (
    <div className="bg-white rounded-[2rem] p-8 border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to scale your visibility?</h3>
      <p className="text-slate-500 text-sm mb-8 max-w-sm">
        Unlock unlimited Google posts, AI-powered review responses, and advanced local SEO automation.
      </p>
      <Link href="/pricing" className="w-full">
        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all">
          View Upgrade Options <ArrowRight className="w-5 h-5" />
        </button>
      </Link>
    </div>
  );
}
