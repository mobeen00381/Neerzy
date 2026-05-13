// components/dashboard/PostUsageTracker.tsx
import { BarChart3, TrendingUp, History } from "lucide-react";

interface PostUsageTrackerProps {
  total: number;
  monthly: number;
}

export function PostUsageTracker({ total, monthly }: PostUsageTrackerProps) {
  const stats = [
    { label: "Total Posts", value: total, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "This Month", value: monthly, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Engagement", value: "84%", icon: History, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
