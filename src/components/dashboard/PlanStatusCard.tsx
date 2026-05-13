// components/dashboard/PlanStatusCard.tsx
import { PlanType, PLAN_LIMITS, getRemainingDays } from '@/lib/plans';

interface PlanStatusCardProps {
  plan: PlanType;
  usage: any;
  trialStart?: string;
}

export function PlanStatusCard({ plan, usage, trialStart }: PlanStatusCardProps) {
  const planConfig = PLAN_LIMITS[plan];
  // Calculate days left: either from usage object or calculated fresh from trialStart
  const daysLeft = usage?.daysLeft || (planConfig.trialDays > 0 ? getRemainingDays(trialStart || new Date().toISOString(), planConfig.trialDays) : Infinity);
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Your Plan</h3>
          <p className="text-sm text-slate-500 font-medium">{planConfig.name} Tier</p>
        </div>
        <div 
          className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest"
          style={{ 
            backgroundColor: `${planConfig.color}15`,
            color: planConfig.color 
          }}
        >
          {planConfig.price}
        </div>
      </div>

      {/* Trial Countdown */}
      {planConfig.trialDays > 0 && (
        <div className="mb-8 p-6 bg-blue-50/50 rounded-[1.5rem] border border-blue-100/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Trial Period</span>
            <span className="text-xl font-black text-blue-600">
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </span>
          </div>
          <div className="w-full bg-blue-200/50 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (daysLeft / planConfig.trialDays) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Features List */}
      <div className="space-y-4 flex-1">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Included Features</p>
        <ul className="space-y-3">
          {planConfig.features.slice(0, 4).map((feature, i) => (
            <li key={i} className="flex items-center text-sm text-slate-600 font-medium">
              <div className="w-5 h-5 bg-green-50 rounded-lg flex items-center justify-center mr-3 shrink-0">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              {feature}
            </li>
          ))}
          {planConfig.features.length > 4 && (
            <li className="text-xs text-slate-400 font-bold ml-8">
              + {planConfig.features.length - 4} more features
            </li>
          )}
        </ul>
      </div>

      {/* Upgrade Button */}
      {plan === 'free' && (
        <button className="mt-8 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl hover:shadow-blue-100 transition-all text-sm font-black active:scale-95">
          Upgrade to Pro Tier →
        </button>
      )}
    </div>
  );
}
