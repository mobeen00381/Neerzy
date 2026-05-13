// components/dashboard/PlanStatusCard.tsx
import { Zap, ShieldCheck } from "lucide-react";
import { getPlan } from "@/lib/plans";

interface PlanStatusCardProps {
  tier: string;
  used: number;
}

export function PlanStatusCard({ tier, used }: PlanStatusCardProps) {
  const plan = getPlan(tier);
  const percentage = Math.min(Math.round((used / plan.postLimit) * 100), 100);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{plan.name}</h3>
            <p className="text-xs text-slate-500 font-medium capitalize">{tier} Plan</p>
          </div>
        </div>
        <div className="bg-green-50 text-green-600 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> ACTIVE
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-sm font-bold text-slate-600">Post Usage</span>
          <span className="text-sm font-black text-slate-900">{used} / {plan.postLimit}</span>
        </div>
        
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Your plan resets on the 1st of every month. {plan.postLimit - used} posts remaining.
        </p>
      </div>
    </div>
  );
}
