// components/dashboard/PlanStatusCard.tsx
import { Zap, ShieldCheck } from "lucide-react";
import { getPlan, PlanType } from "@/lib/plans";
import { UsageStats } from "@/lib/usage";

interface PlanStatusCardProps {
  plan: PlanType;
  usage: UsageStats | null;
  trialStart?: string;
}

export function PlanStatusCard({ plan: tier, usage, trialStart }: PlanStatusCardProps) {
  const planDetails = getPlan(tier);
  const isUnlimited = planDetails.totalPosts === -1;
  const used = usage?.totalPostsUsed || 0;
  const percentage = isUnlimited ? 0 : Math.min(Math.round((used / planDetails.totalPosts) * 100), 100);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${planDetails.color}10`, color: planDetails.color }}
          >
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{planDetails.name} Plan</h3>
            <p className="text-xs text-slate-500 font-medium capitalize">{tier} Tier</p>
          </div>
        </div>
        <div className="bg-green-50 text-green-600 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> ACTIVE
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-sm font-bold text-slate-600">Total Posts</span>
          <span className="text-sm font-black text-slate-900">
            {used} / {isUnlimited ? "∞" : planDetails.totalPosts}
          </span>
        </div>
        
        {!isUnlimited && (
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${percentage}%`, backgroundColor: planDetails.color }}
            />
          </div>
        )}

        <div className="pt-2">
          {tier === 'free' && usage && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs font-bold flex items-center justify-between">
               <span>Trial Ends In:</span>
               <span>{usage.daysLeft} Days</span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {isUnlimited 
            ? "You have unlimited lifetime posts on this plan."
            : `Your plan allows for ${planDetails.totalPosts} lifetime posts. ${planDetails.totalPosts - used} remaining.`}
        </p>
      </div>
    </div>
  );
}
