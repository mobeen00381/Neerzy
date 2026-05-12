'use client';

type PracticeCategory = {
  seo: string[];
  aeo: string[];
  geo: string[];
  compliance: string[];
};

const BEST_PRACTICES: Record<string, PracticeCategory> = {
  plumber: {
    seo: ['Use "emergency plumber [city]" in first 50 chars', 'Include license number for trust'],
    aeo: ['Answer: "How fast do you respond to leaks in [city]?"', 'Use conversational Q&A format'],
    geo: ['Mention neighborhoods you serve', 'Add local landmarks ("near Downtown Austin")'],
    compliance: ['Never promise "guaranteed" results', 'Disclose pricing ranges transparently'],
  },
  electrician: {
    seo: ['Front-load "licensed electrician [city]"', 'Include "EV charger install" if applicable'],
    aeo: ['Answer: "Is my home ready for solar panels?"', 'Explain code compliance simply'],
    geo: ['Reference local permit requirements', 'Mention grid capacity in your area'],
    compliance: ['Never claim "cheapest" — use "transparent pricing"'],
  },
  roofer: {
    seo: ['Mention "emergency roof repair" for high-intent leads', 'List specific materials (e.g., asphalt, metal)'],
    aeo: ['Answer: "How long does a roof inspection take?"', 'Use "Best roofing company for storms"'],
    geo: ['Focus on areas with recent hail or wind damage', 'Mention local building codes'],
    compliance: ['Document all damage before starting work', 'Explicitly state warranty limitations'],
  },
  mechanic: {
    seo: ['Highlight specialized brands (e.g., "BMW specialist [city]")', 'Use "same-day car service"'],
    aeo: ['Answer: "Why is my check engine light on?"', 'Provide clear price estimates for common parts'],
    geo: ['Mention proximity to major roads or transit', 'Target specific business parks or residential hubs'],
    compliance: ['Get written approval before extra work', 'Itemize all labor and parts clearly'],
  },
};

function PracticeCard({ title, items, icon, color }: { title: string; items: string[]; icon: string; color: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border-l-4 ${color} transition-all hover:shadow-md`}>
      <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-xl">{icon}</span> {title}
      </h4>
      <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 leading-relaxed">
            <span className="text-slate-400 mt-1">•</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BestPracticesGuide({ trade }: { trade?: string }) {
  const normalizedTrade = (trade?.toLowerCase() || 'plumber') as keyof typeof BEST_PRACTICES;
  const practices = BEST_PRACTICES[normalizedTrade] || BEST_PRACTICES.plumber;

  return (
    <div className="space-y-8">
      <div className="bg-[#F0F7F5] dark:bg-slate-800/50 p-6 rounded-2xl border border-[#25D366]/20">
        <h3 className="text-xl font-bold text-[#0F5C4D] dark:text-[#25D366] mb-2 flex items-center gap-2">
          🚀 Pro Insights for {trade || 'Traders'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tailored content strategies to help you dominate local search results and AI-driven queries.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PracticeCard 
          title="Search Engine Optimization (SEO)" 
          items={practices.seo} 
          icon="🔍"
          color="border-[#25D366]"
        />
        <PracticeCard 
          title="Answer Engine Optimization (AEO)" 
          items={practices.aeo} 
          icon="🗣️"
          color="border-[#0F5C4D]"
        />
        <PracticeCard 
          title="Geographic Optimization (GEO)" 
          items={practices.geo} 
          icon="📍"
          color="border-blue-500"
        />
        <PracticeCard 
          title="Compliance & Policy" 
          items={practices.compliance} 
          icon="⚖️"
          color="border-amber-500"
        />
      </div>
    </div>
  );
}
