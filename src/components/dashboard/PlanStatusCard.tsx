// components/dashboard/PlanStatusCard.tsx
import { Zap, ShieldCheck } from "lucide-react";
import { getPlan } from "@/lib/plans";

interface PlanStatusCardProps {
  tier: string;
  used: number;
}

export function PlanStatusCard({ tier, used }: PlanStatusCardProps) {
  const plan = getPlan(tier);
  const isUnlimited = plan.totalPosts === -1;
  const percentage = isUnlimited ? 0 : Math.min(Math.round((used / plan.totalPosts) * 100), 100);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${plan.color}10`, color: plan.color }}
          >
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
          <span className="text-sm font-black text-slate-900">
            {used} / {isUnlimited ? "∞" : plan.totalPosts}
          </span>
        </div>
        
        {!isUnlimited && (
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${percentage}%`, backgroundColor: plan.color }}
            />
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed">
          {isUnlimited 
            ? "You have unlimited lifetime posts on this plan."
            : `Your plan allows for ${plan.totalPosts} lifetime posts. ${plan.totalPosts - used} remaining.`}
        </p>
      </div>
    </div>
  );
}
