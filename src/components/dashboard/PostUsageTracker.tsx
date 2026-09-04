// components/dashboard/PostUsageTracker.tsx
import { PlanType, PLAN_LIMITS } from '@/lib/plans';

interface PostUsageTrackerProps {
  usage: any;
  plan: PlanType;
  onLimitReached: () => void;
}

export function PostUsageTracker({ usage, plan, onLimitReached }: PostUsageTrackerProps) {
  const planConfig = PLAN_LIMITS[plan];
  
  if (!usage) return null;

  const dailyPercent = planConfig.dailyPosts > 0
    ? Math.min(100, (usage.dailyPostsUsed / planConfig.dailyPosts) * 100)
    : 0;
  const totalPercent = planConfig.totalPosts === -1 
    ? 0 
    : Math.min(100, (usage.totalPostsUsed / planConfig.totalPosts) * 100);
  const dailyLimited = planConfig.dailyPosts > 0 && usage.remainingToday <= 0;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-full flex flex-col">
      <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Post Usage</h3>
      
      <div className="space-y-8 flex-1">
        {/* Daily Limit */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Today's Posts</span>
            <span className="text-sm font-black text-slate-900">
              {planConfig.dailyPosts === -1
                ? `${usage.dailyPostsUsed} used / Unlimited`
                : `${usage.dailyPostsUsed} / ${planConfig.dailyPosts}`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                usage.remainingToday <= 0 ? 'bg-rose-500' : 'bg-blue-600'
              }`}
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
          {dailyLimited && (
            <p className="mt-3 text-[10px] font-black text-rose-500 uppercase tracking-widest">
              Daily limit reached. Resets at midnight UTC.
            </p>
          )}
        </div>

        {/* Total Limit */}
        {planConfig.totalPosts !== -1 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Posts</span>
              <span className="text-sm font-black text-slate-900">
                {usage.totalPostsUsed} / {planConfig.totalPosts}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  usage.remainingTotal <= 0 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${totalPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-8">
        {usage.isLimited ? (
          <button
            onClick={onLimitReached}
            className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl cursor-not-allowed text-sm font-black uppercase tracking-widest border-2 border-dashed border-slate-200"
            disabled
          >
            Limit Reached • Upgrade to Post More
          </button>
        ) : (
          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all text-sm font-black active:scale-95 shadow-xl shadow-slate-200">
            Create New Post →
          </button>
        )}
      </div>
    </div>
  );
}
