// components/dashboard/PostUsageTracker.tsx
import { BarChart3, TrendingUp, History } from "lucide-react";
import { UsageStats } from "@/lib/usage";
import { PlanType } from "@/lib/plans";

interface PostUsageTrackerProps {
  usage: UsageStats | null;
  plan: PlanType;
  onLimitReached?: () => void;
}

export function PostUsageTracker({ usage, plan, onLimitReached }: PostUsageTrackerProps) {
  const stats = [
    { 
      label: "Today's Posts", 
      value: usage?.dailyPostsUsed || 0, 
      icon: TrendingUp, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { 
      label: "Remaining Today", 
      value: usage?.remainingToday || 0, 
      icon: BarChart3, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Trial Left", 
      value: `${usage?.daysLeft || 0}d`, 
      icon: History, 
      color: "text-orange-600", 
      bg: "bg-orange-50" 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
