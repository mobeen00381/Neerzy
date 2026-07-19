import React from 'react';

interface SeoDiagramProps {
  children: React.ReactNode;
  caption?: string;
  className?: string;
}

/**
 * SeoDiagram — Standard container for buildable diagrams/graphics
 * Uses the design system card style from design.md section 4.
 * Wraps content in the standard image container (border, radius, shadow).
 */
export function SeoDiagram({ children, caption, className = '' }: SeoDiagramProps) {
  return (
    <figure className={`my-10 w-full rounded-xl overflow-hidden border border-[#E1E8E4] shadow-sm bg-[#F7F9F8] flex flex-col items-center ${className}`}>
      <div className="w-full relative flex items-center justify-center p-6">
        <div className="relative w-full rounded-lg overflow-hidden">
          {children}
        </div>
      </div>
      {caption && (
        <figcaption className="p-4 text-center text-sm text-[#5B6B64] border-t border-[#E1E8E4] bg-white w-full">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * PillarDiagram — 5-pillar icon grid for #1 (5 pillars of plumbing SEO)
 */
export function FivePillarDiagram() {
  const pillars = [
    { label: 'Local SEO Priority', icon: '📍', desc: 'Google Maps & GBP' },
    { label: 'GBP Importance', icon: '🏪', desc: 'Profile optimization' },
    { label: 'Reviews', icon: '⭐', desc: 'Reputation management' },
    { label: 'Consistency', icon: '🔄', desc: 'NAP & citations' },
    { label: 'AI Search', icon: '🤖', desc: 'AI-generated answers' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4">
      {pillars.map((p, i) => (
        <div key={i} className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-[#E1E8E4] shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#E6F2EA] flex items-center justify-center text-xl mb-2">
            {p.icon}
          </div>
          <div className="font-semibold text-sm text-[#0F5132]">{p.label}</div>
          <div className="text-xs text-[#5B6B64] mt-1">{p.desc}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * AuditResultDiagram — For #10 (low score 34/100 with missed opportunities)
 * Uses "Smith Plumbing & Heating" as the example business.
 */
export function AuditResultDiagram() {
  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-[#E1E8E4] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B3D2E] text-white p-4">
          <div className="text-xs opacity-80">Smith Plumbing & Heating</div>
          <div className="text-2xl font-bold mt-1">34<span className="text-sm font-normal opacity-80">/100</span></div>
          <div className="text-xs mt-1 text-[#EF4444] font-semibold">⚠ Needs Attention</div>
        </div>
        {/* Missed opportunities */}
        <div className="p-4 space-y-3">
          <div className="text-sm font-semibold text-[#0A2E22]">Missed Opportunities</div>
          {[
            { label: 'Photos', detail: 'Only 12 photos — add 40+ more' },
            { label: 'Reviews', detail: '22 reviews — need 4-8 new per month' },
            { label: 'Google Posts', detail: 'No posts in 6 months' },
            { label: 'Website', detail: 'No dedicated service pages' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-[#F7F9F8] rounded-lg border border-[#E1E8E4]">
              <div className="w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">!</div>
              <div>
                <div className="text-sm font-semibold text-[#0A2E22]">{item.label}</div>
                <div className="text-xs text-[#5B6B64]">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * CategoryScoreDiagram — For #13 (category score breakdown with gauges)
 * Shows audit categories with individual scores. Accepts props for custom data.
 * Defaults to the pillar page's 5-category breakdown if no props provided.
 */
interface CategoryScoreItem {
  label: string;
  score: number;
  maxScore: number;
  color: string;
}

export function CategoryScoreDiagram({ categories, businessName, overallScore }: { categories?: CategoryScoreItem[]; businessName?: string; overallScore?: number }) {
  const defaultCategories: CategoryScoreItem[] = [
    { label: 'Completeness', score: 85, maxScore: 25, color: '#22C55E' },
    { label: 'Reviews', score: 60, maxScore: 25, color: '#F59E0B' },
    { label: 'Visual Content', score: 40, maxScore: 20, color: '#EF4444' },
    { label: 'Engagement', score: 30, maxScore: 15, color: '#EF4444' },
    { label: 'Local SEO', score: 70, maxScore: 15, color: '#22C55E' },
  ];

  const cats = categories || defaultCategories;
  const bizName = businessName || 'Smith Plumbing & Heating';
  const totalScore = overallScore !== undefined ? overallScore : Math.round(cats.reduce((sum, c) => sum + c.score, 0));

  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-[#E1E8E4] shadow-sm p-4">
        <div className="text-sm font-bold text-[#0A2E22] mb-4 text-center">{bizName} — Score Breakdown</div>
        <div className="space-y-4">
          {cats.map((cat, i) => {
            const pct = Math.round((cat.score / cat.maxScore) * 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 text-right text-xs font-semibold text-[#0F5132] shrink-0">{cat.label}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-[#E6F2EA] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                    <div className="text-xs font-bold text-[#0A2E22] w-8 text-right">{cat.score}/{cat.maxScore}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-[#E1E8E4] text-center">
          <div className="text-xs text-[#5B6B64]">Overall Score: <span className="font-bold text-[#0A2E22]">{totalScore}/100</span></div>
        </div>
      </div>
    </div>
  );
}

/**
 * AuditOverviewDiagram — For #16 (high score 92/100 with all-green indicators)
 */
export function AuditOverviewDiagram() {
  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-[#E1E8E4] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B3D2E] text-white p-4">
          <div className="text-xs opacity-80">Smith Plumbing & Heating</div>
          <div className="text-2xl font-bold mt-1">92<span className="text-sm font-normal opacity-80">/100</span></div>
          <div className="text-xs mt-1 text-[#22C55E] font-semibold">✓ Excellent — Well Maintained</div>
        </div>
        {/* All-green indicators */}
        <div className="p-4 space-y-2">
          {[
            { label: 'Completeness', status: 'Complete' },
            { label: 'Reviews', status: 'Strong (210 reviews)' },
            { label: 'Visual Content', status: '130+ photos' },
            { label: 'Engagement', status: 'Weekly posts' },
            { label: 'Local SEO', status: 'Optimized' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-[#F7F9F8] rounded-lg border border-[#E1E8E4]">
              <div className="text-sm text-[#0A2E22]">{item.label}</div>
              <div className="flex items-center gap-1">
                <span className="text-[#22C55E] text-xs font-semibold">{item.status}</span>
                <span className="text-[#22C55E]">✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * RecommendationsDiagram — For #17 (prioritized to-do list)
 */
export function RecommendationsDiagram() {
  const items = [
    { priority: 'High', label: 'Add 3 new photos this week', done: false },
    { priority: 'High', label: 'Respond to 2 unanswered reviews', done: false },
    { priority: 'Medium', label: 'Publish a Google Post this week', done: false },
    { priority: 'Medium', label: 'Update holiday hours', done: true },
    { priority: 'Low', label: 'Add drain cleaning to services', done: true },
  ];

  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-[#E1E8E4] shadow-sm p-4">
        <div className="text-sm font-bold text-[#0A2E22] mb-3">Recommended Actions</div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border ${item.done ? 'bg-[#E6F2EA] border-[#22C55E]' : 'bg-[#F7F9F8] border-[#E1E8E4]'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.done ? 'bg-[#22C55E] text-white' : 'border-2 border-[#E1E8E4]'}`}>
                {item.done ? '✓' : ''}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${item.done ? 'text-[#5B6B64] line-through' : 'text-[#0A2E22]'}`}>{item.label}</div>
              </div>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded ${item.priority === 'High' ? 'bg-[#EF4444] text-white' : item.priority === 'Medium' ? 'bg-[#F59E0B] text-white' : 'bg-[#E6F2EA] text-[#0F5132]'}`}>
                {item.priority}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * BeforeAfterDiagram — For #26 (split-screen before/after comparison)
 * Accepts props for custom before/after data. Defaults to pillar page values.
 */
interface BeforeAfterItem {
  label: string;
  before: string;
  after: string;
}

export function BeforeAfterDiagram({ beforeScore, afterScore, items, beforeColor, afterColor }: { beforeScore?: number; afterScore?: number; items?: BeforeAfterItem[]; beforeColor?: string; afterColor?: string }) {
  const defaultItems: BeforeAfterItem[] = [
    { label: 'Photos', before: '12 photos', after: '130+ photos' },
    { label: 'Reviews', before: '22 reviews', after: '210 reviews' },
    { label: 'Posts', before: 'No posts', after: 'Weekly posts' },
  ];

  const befScore = beforeScore ?? 34;
  const aftScore = afterScore ?? 89;
  const befColor = beforeColor ?? '#EF4444';
  const aftColor = afterColor ?? '#22C55E';
  const data = items || defaultItems;

  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="grid grid-cols-2 gap-3">
        {/* Before */}
        <div className="bg-white rounded-xl border border-[#E1E8E4] shadow-sm overflow-hidden">
          <div className="text-white p-3 text-center" style={{ backgroundColor: befColor }}>
            <div className="text-xs opacity-80">Before</div>
            <div className="text-xl font-bold">{befScore}</div>
          </div>
          <div className="p-3 space-y-1.5">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: befColor }} />
                <span className="text-xs text-[#5B6B64]">{item.before}</span>
              </div>
            ))}
          </div>
        </div>
        {/* After */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: aftColor }}>
          <div className="text-white p-3 text-center" style={{ backgroundColor: aftColor }}>
            <div className="text-xs opacity-80">After</div>
            <div className="text-xl font-bold">{aftScore}</div>
          </div>
          <div className="p-3 space-y-1.5">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: aftColor }} />
                <span className="text-xs text-[#5B6B64]">{item.after}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProgressGraphDiagram — For #27 (score climbing over time)
 * Accepts props for custom data points. Defaults to pillar page values.
 */
interface ProgressDataPoint {
  label: string;
  score: number;
}

export function ProgressGraphDiagram({ data, businessName, trendLabel }: { data?: ProgressDataPoint[]; businessName?: string; trendLabel?: string }) {
  const defaultData: ProgressDataPoint[] = [
    { label: 'Month 1', score: 34 },
    { label: 'Month 2', score: 62 },
    { label: 'Month 3', score: 89 },
  ];

  const points = data || defaultData;
  const bizName = businessName || 'Smith Plumbing & Heating';
  const firstScore = points[0]?.score ?? 0;
  const lastScore = points[points.length - 1]?.score ?? 0;
  const diff = lastScore - firstScore;
  const trend = trendLabel || `↑ +${diff} points in ${points.length} ${points.length === 1 ? 'period' : 'periods'}`;

  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-[#E1E8E4] shadow-sm p-4">
        <div className="text-sm font-bold text-[#0A2E22] mb-4 text-center">{bizName} — Score Progress</div>
        {/* Bar chart */}
        <div className="flex items-end justify-center gap-6 h-32">
          {points.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-[#0F5132]">{m.score}</div>
              <div
                className="w-12 rounded-t-lg"
                style={{
                  height: `${m.score}%`,
                  backgroundColor: m.score >= 80 ? '#22C55E' : m.score >= 50 ? '#F59E0B' : '#EF4444',
                }}
              />
              <div className="text-xs text-[#5B6B64]">{m.label}</div>
            </div>
          ))}
        </div>
        {/* Trend line */}
        <div className="mt-4 pt-3 border-t border-[#E1E8E4] text-center">
          <div className="text-xs text-[#22C55E] font-semibold">{trend}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * FlowDiagram — Simple step flow for #2 (audit journey) and #5 (customer journey)
 */
export function FlowDiagram({ steps, direction = 'horizontal' }: { steps: { label: string; desc?: string }[]; direction?: 'horizontal' | 'vertical' }) {
  return (
    <div className={`flex ${direction === 'horizontal' ? 'flex-row flex-wrap justify-center' : 'flex-col'} gap-4 p-4`}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center text-center min-w-[120px] flex-1">
            <div className="w-10 h-10 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-sm mb-2">
              {i + 1}
            </div>
            <div className="font-semibold text-sm text-[#0F5132]">{step.label}</div>
            {step.desc && <div className="text-xs text-[#5B6B64] mt-1">{step.desc}</div>}
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center text-[#22C55E] font-bold text-lg self-center">
              →
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * HubAndSpokeDiagram — For #3 (content ecosystem) and #4 (6 systems of plumbing SEO)
 */
export function HubAndSpokeDiagram({ nodes, centerLabel }: { nodes: { label: string; desc?: string }[]; centerLabel: string }) {
  return (
    <div className="flex flex-col items-center p-4">
      {/* Center hub */}
      <div className="w-24 h-24 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-sm text-center p-2 mb-6 shadow-md">
        {centerLabel}
      </div>
      {/* Spoke nodes */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#E1E8E4] shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0" />
            <div>
              <div className="font-semibold text-xs text-[#0F5132]">{node.label}</div>
              {node.desc && <div className="text-xs text-[#5B6B64]">{node.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ComparisonCard — Side-by-side comparison for #7 (Business A vs Business B)
 */
export function ComparisonCard({ left, right }: { left: { label: string; items: { label: string; value: string }[]; winner?: boolean }; right: { label: string; items: { label: string; value: string }[]; winner?: boolean } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div className={`rounded-xl border ${left.winner ? 'border-[#22C55E] bg-[#E6F2EA]' : 'border-[#E1E8E4] bg-white'} p-4 shadow-sm`}>
        <h4 className="font-bold text-[#0F5132] text-center mb-3">{left.label}</h4>
        {left.items.map((item, i) => (
          <div key={i} className="flex justify-between py-1.5 border-b border-[#E1E8E4] last:border-0">
            <span className="text-sm text-[#5B6B64]">{item.label}</span>
            <span className="text-sm font-semibold text-[#0A2E22]">{item.value}</span>
          </div>
        ))}
        {left.winner && <div className="mt-2 text-center text-xs font-bold text-[#22C55E]">✓ Local Pack Winner</div>}
      </div>
      <div className={`rounded-xl border ${right.winner ? 'border-[#22C55E] bg-[#E6F2EA]' : 'border-[#E1E8E4] bg-white'} p-4 shadow-sm`}>
        <h4 className="font-bold text-[#0F5132] text-center mb-3">{right.label}</h4>
        {right.items.map((item, i) => (
          <div key={i} className="flex justify-between py-1.5 border-b border-[#E1E8E4] last:border-0">
            <span className="text-sm text-[#5B6B64]">{item.label}</span>
            <span className="text-sm font-semibold text-[#0A2E22]">{item.value}</span>
          </div>
        ))}
        {right.winner && <div className="mt-2 text-center text-xs font-bold text-[#22C55E]">✓ Local Pack Winner</div>}
      </div>
    </div>
  );
}

/**
 * GridDiagram — Generic grid of items for #9 (7 failure points)
 */
export function GridDiagram({ items, columns = 3 }: { items: { label: string; desc?: string }[]; columns?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-3 p-4`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E1E8E4] shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#E6F2EA] flex items-center justify-center text-[#0F5132] font-bold text-xs shrink-0">
            {i + 1}
          </div>
          <div>
            <div className="font-semibold text-sm text-[#0F5132]">{item.label}</div>
            {item.desc && <div className="text-xs text-[#5B6B64] mt-0.5">{item.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ThreePillarDiagram — For #12 (Google's 3 ranking factors)
 */
export function ThreePillarDiagram() {
  const pillars = [
    { label: 'Relevance', desc: 'How well your profile matches the search query', icon: '🎯' },
    { label: 'Distance', desc: 'Proximity of your business to the searcher', icon: '📏' },
    { label: 'Prominence', desc: 'How well-known and established your business is', icon: '🏆', highlighted: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {pillars.map((p, i) => (
        <div key={i} className={`flex flex-col items-center text-center p-4 rounded-xl border shadow-sm ${p.highlighted ? 'border-[#22C55E] bg-[#E6F2EA]' : 'border-[#E1E8E4] bg-white'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 ${p.highlighted ? 'bg-[#0F5132] text-white' : 'bg-[#E6F2EA]'}`}>
            {p.icon}
          </div>
          <div className="font-bold text-[#0F5132] mb-1">{p.label}</div>
          <div className="text-xs text-[#5B6B64]">{p.desc}</div>
          {p.highlighted && <div className="mt-2 text-xs font-bold text-[#22C55E]">Most Controllable</div>}
        </div>
      ))}
    </div>
  );
}

/**
 * WeightChart — For #14 (audit category weightings)
 */
export function WeightChart() {
  const categories = [
    { label: 'Completeness', weight: 25, color: '#0F5132' },
    { label: 'Reviews', weight: 25, color: '#22C55E' },
    { label: 'Visual Content', weight: 20, color: '#5B6B64' },
    { label: 'Engagement', weight: 15, color: '#E1E8E4' },
    { label: 'Local SEO', weight: 15, color: '#D3E6DA' },
  ];

  return (
    <div className="p-4 space-y-3">
      {categories.map((cat, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 text-right text-sm font-semibold text-[#0F5132] shrink-0">{cat.label}</div>
          <div className="flex-1 h-7 bg-[#E6F2EA] rounded-full overflow-hidden">
            <div className="h-full rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white" style={{ width: `${cat.weight}%`, backgroundColor: cat.color }}>
              {cat.weight}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * TimelineDiagram — For #21 (4-step rollout plan)
 */
export function TimelineDiagram({ steps }: { steps: { label: string; desc: string }[] }) {
  return (
    <div className="p-4">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#D3E6DA]" />
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-4 mb-6 last:mb-0 relative">
            <div className="w-10 h-10 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-sm shrink-0 z-10">
              {i + 1}
            </div>
            <div className="flex-1 p-3 bg-white rounded-lg border border-[#E1E8E4] shadow-sm">
              <div className="font-semibold text-sm text-[#0F5132]">{step.label}</div>
              <div className="text-xs text-[#5B6B64] mt-1">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * WireframeDiagram — For #22 (page anatomy with callouts)
 */
export function WireframeDiagram({ elements }: { elements: { label: string; x: number; y: number }[] }) {
  return (
    <div className="p-4">
      <div className="relative bg-white border-2 border-[#E1E8E4] rounded-lg p-6 min-h-[300px]">
        {/* Simulated page layout */}
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-[#E6F2EA] rounded" />
          <div className="h-8 w-1/2 bg-[#D3E6DA] rounded" />
          <div className="h-3 w-full bg-[#E6F2EA] rounded" />
          <div className="h-3 w-5/6 bg-[#E6F2EA] rounded" />
          <div className="h-3 w-4/6 bg-[#E6F2EA] rounded" />
          <div className="h-20 w-full bg-[#F7F9F8] rounded border border-[#E1E8E4]" />
          <div className="h-3 w-full bg-[#E6F2EA] rounded" />
          <div className="h-3 w-3/4 bg-[#E6F2EA] rounded" />
        </div>
        {/* Callout annotations */}
        {elements.map((el, i) => (
          <div key={i} className="absolute" style={{ left: `${el.x}%`, top: `${el.y}%` }}>
            <div className="bg-[#0F5132] text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
              {el.label}
            </div>
            <div className="w-0.5 h-4 bg-[#22C55E] mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GaugeDiagram — For #23 (Core Web Vitals gauges)
 */
export function GaugeDiagram() {
  const vitals = [
    { label: 'Loading Speed', value: '0.8s', status: 'good' as const },
    { label: 'Interactivity', value: '150ms', status: 'good' as const },
    { label: 'Visual Stability', value: '0.05', status: 'good' as const },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {vitals.map((v, i) => (
        <div key={i} className="flex flex-col items-center p-4 bg-white rounded-xl border border-[#E1E8E4] shadow-sm">
          <div className="relative w-20 h-20 mb-3">
            {/* Semi-circle gauge */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M 10 80 A 40 40 0 0 1 90 80" fill="none" stroke="#E6F2EA" strokeWidth="12" strokeLinecap="round" />
              <path d="M 10 80 A 40 40 0 0 1 90 80" fill="none" stroke="#22C55E" strokeWidth="12" strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset="30" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-[#22C55E]">✓</span>
            </div>
          </div>
          <div className="font-semibold text-sm text-[#0F5132]">{v.label}</div>
          <div className="text-xs text-[#5B6B64] mt-1">{v.value}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * SchemaDiagram — For #25 (schema markup conversion)
 */
export function SchemaDiagram() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 items-center">
      <div className="p-4 bg-white rounded-lg border border-[#E1E8E4] shadow-sm">
        <div className="text-xs font-bold text-[#0F5132] mb-2">Unstructured Text</div>
        <div className="text-xs text-[#5B6B64] leading-relaxed">
          "We offer 24/7 emergency plumbing services in Austin, TX. Call us for fast, reliable service."
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-sm">
          →
        </div>
      </div>
      <div className="p-4 bg-[#E6F2EA] rounded-lg border border-[#22C55E] shadow-sm">
        <div className="text-xs font-bold text-[#0F5132] mb-2">Structured Data (Schema)</div>
        <pre className="text-xs text-[#5B6B64] leading-relaxed overflow-x-auto">
{`{
  "@type": "Plumber",
  "name": "Smith Plumbing",
  "areaServed": "Austin, TX",
  "openingHours": "24/7"
}`}
        </pre>
      </div>
    </div>
  );
}

/**
 * GeoGridDiagram — For #19 (geo-grid map)
 */
export function GeoGridDiagram() {
  const rows = [
    ['rank-1', 'rank-2', 'rank-3', 'rank-5'],
    ['rank-2', 'rank-1', 'rank-4', 'rank-8'],
    ['rank-3', 'rank-5', 'rank-10+', 'rank-10+'],
    ['rank-5', 'rank-8', 'rank-10+', 'rank-10+'],
  ];

  const getColor = (rank: string) => {
    if (rank === 'rank-1') return 'bg-[#22C55E] text-white';
    if (rank === 'rank-2' || rank === 'rank-3') return 'bg-[#F59E0B] text-white';
    return 'bg-[#EF4444] text-white';
  };

  const getLabel = (rank: string) => {
    if (rank === 'rank-1') return '#1';
    if (rank === 'rank-2') return '#2';
    if (rank === 'rank-3') return '#3';
    if (rank === 'rank-4') return '#4';
    if (rank === 'rank-5') return '#5';
    if (rank === 'rank-8') return '#8';
    return '10+';
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-4 gap-1 max-w-[300px] mx-auto">
        {rows.flat().map((rank, i) => (
          <div key={i} className={`w-full aspect-square rounded flex items-center justify-center text-xs font-bold ${getColor(rank)}`}>
            {getLabel(rank)}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-3 text-xs text-[#5B6B64]">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#22C55E]" /> Rank 1-3</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#F59E0B]" /> Rank 4-5</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#EF4444]" /> Rank 8+</div>
      </div>
    </div>
  );
}

/**
 * SiteArchitectureDiagram — For #20 (internal linking structure)
 */
export function SiteArchitectureDiagram() {
  return (
    <div className="p-4">
      <div className="flex flex-col items-center">
        {/* Homepage */}
        <div className="px-6 py-3 bg-[#0F5132] text-white rounded-lg font-bold text-sm mb-4 shadow-md">
          Homepage
        </div>
        {/* Arrows down */}
        <div className="text-[#22C55E] font-bold mb-4">↓</div>
        {/* Two columns */}
        <div className="grid grid-cols-2 gap-6 w-full">
          <div className="flex flex-col items-center">
            <div className="px-4 py-2 bg-[#E6F2EA] border border-[#E1E8E4] rounded-lg font-semibold text-xs text-[#0F5132] mb-2">
              Services
            </div>
            <div className="text-[#22C55E] text-xs mb-1">↓</div>
            <div className="px-3 py-1.5 bg-white border border-[#E1E8E4] rounded text-xs text-[#5B6B64] mb-1">
              Emergency Plumbing
            </div>
            <div className="px-3 py-1.5 bg-white border border-[#E1E8E4] rounded text-xs text-[#5B6B64] mb-1">
              Drain Cleaning
            </div>
            <div className="px-3 py-1.5 bg-white border border-[#E1E8E4] rounded text-xs text-[#5B6B64]">
              Water Heater Repair
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="px-4 py-2 bg-[#E6F2EA] border border-[#E1E8E4] rounded-lg font-semibold text-xs text-[#0F5132] mb-2">
              Locations
            </div>
            <div className="text-[#22C55E] text-xs mb-1">↓</div>
            <div className="px-3 py-1.5 bg-white border border-[#E1E8E4] rounded text-xs text-[#5B6B64] mb-1">
              Austin, TX
            </div>
            <div className="px-3 py-1.5 bg-white border border-[#E1E8E4] rounded text-xs text-[#5B6B64] mb-1">
              Round Rock, TX
            </div>
            <div className="px-3 py-1.5 bg-white border border-[#E1E8E4] rounded text-xs text-[#5B6B64]">
              Cedar Park, TX
            </div>
          </div>
        </div>
        {/* Cross-links */}
        <div className="mt-4 text-xs text-[#22C55E] font-semibold">
          ← Cross-links between service + location pages →
        </div>
      </div>
    </div>
  );
}

export function LocalPackDiagram() {

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Search bar */}
      <div className="flex items-center gap-2 p-3 bg-white border border-[#E1E8E4] rounded-lg mb-3 shadow-sm">
        <div className="w-4 h-4 rounded-full bg-[#E6F2EA]" />
        <div className="h-3 flex-1 bg-[#E6F2EA] rounded" />
      </div>
      {/* Map block */}
      <div className="h-24 bg-[#E6F2EA] rounded-lg mb-3 flex items-center justify-center border border-[#E1E8E4]">
        <div className="text-xs text-[#5B6B64]">Map Area</div>
      </div>
      {/* Results */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-[#E1E8E4] rounded-lg mb-2 shadow-sm">
          <div className="w-6 h-6 rounded-full bg-[#0F5132] text-white flex items-center justify-center text-xs font-bold">
            {i}
          </div>
          <div className="flex-1">
            <div className="h-3 w-32 bg-[#E6F2EA] rounded mb-1" />
            <div className="h-2 w-24 bg-[#E6F2EA] rounded" />
          </div>
          <div className="text-[#F59E0B] text-xs">★★★★</div>
        </div>
      ))}
    </div>
  );
}

/**
 * PriorityFlowDiagram — For page 2 (Improve Your Audit Score)
 * Shows recommended fix order: Completeness → Visual Content → Engagement → Local SEO → Reviews
 */
export function PriorityFlowDiagram() {
  const steps = [
    { label: 'Completeness', desc: 'Fill in every field', time: 'Same day' },
    { label: 'Visual Content', desc: 'Upload photos & video', time: 'Within a week' },
    { label: 'Engagement', desc: 'Post & respond', time: '2-3 weeks' },
    { label: 'Local SEO', desc: 'Fix NAP & categories', time: '2-4 weeks' },
    { label: 'Reviews', desc: 'Build review velocity', time: '4-8 weeks' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 bg-white rounded-lg border border-[#E1E8E4] shadow-sm p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-[#0F5132]">{step.label}</span>
                  <span className="text-xs text-[#5B6B64] ml-2">— {step.desc}</span>
                </div>
                <div className="text-xs font-semibold text-[#22C55E] bg-[#E6F2EA] px-2 py-0.5 rounded">
                  {step.time}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="text-[#22C55E] font-bold text-lg shrink-0">↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * UrgencyTimelineDiagram — For page 4 (Reviews Score Guide)
 * Shows review request response rates peaking immediately and dropping after 24-48 hours.
 */
export function UrgencyTimelineDiagram() {
  const points = [
    { label: 'Immediate', score: 85, desc: 'Peak satisfaction — ask now' },
    { label: '24 hours', score: 55, desc: 'Memory starts fading' },
    { label: '48 hours', score: 30, desc: 'Sharp drop-off' },
    { label: '1 week', score: 10, desc: 'Too late — unlikely' },
  ];

  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-[#E1E8E4] shadow-sm p-4">
        <div className="text-sm font-bold text-[#0A2E22] mb-4 text-center">Review Request Response Rate</div>
        {/* Bar chart */}
        <div className="flex items-end justify-center gap-4 h-40">
          {points.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-[#0F5132]">{p.score}%</div>
              <div
                className="w-10 rounded-t-lg"
                style={{
                  height: `${p.score}%`,
                  backgroundColor: p.score >= 70 ? '#22C55E' : p.score >= 40 ? '#F59E0B' : '#EF4444',
                }}
              />
              <div className="text-xs text-[#5B6B64] text-center">{p.label}</div>
              <div className="text-[10px] text-[#5B6B64] text-center leading-tight max-w-[80px]">{p.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-[#E1E8E4] text-center">
          <div className="text-xs text-[#EF4444] font-semibold">Ask immediately — response rate drops sharply after 24-48 hours</div>
        </div>
      </div>
    </div>
  );
}

/**
 * ImprovementTimelineDiagram — For page 2 (Improve Your Audit Score)
 * Shows what moves at each timeframe: same-day, within a week, 2-4 weeks, 4-8 weeks.
 */
export function ImprovementTimelineDiagram() {
  const stages = [
    { label: 'Same Day', items: ['Fill in missing fields', 'Seed Q&A section', 'Add GBP website link'], color: '#22C55E' },
    { label: 'Within a Week', items: ['Upload photo backlog', 'Publish first Google Post', 'Respond to all reviews'], color: '#F59E0B' },
    { label: '2-4 Weeks', items: ['Fix NAP across directories', 'Establish posting pattern', 'Define service areas'], color: '#F59E0B' },
    { label: '4-8 Weeks', items: ['Build review velocity', 'Re-run audit to track progress'], color: '#EF4444' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#D3E6DA]" />
        {stages.map((stage, i) => (
          <div key={i} className="flex items-start gap-4 mb-6 last:mb-0 relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 text-white" style={{ backgroundColor: stage.color }}>
              {i + 1}
            </div>
            <div className="flex-1 bg-white rounded-lg border border-[#E1E8E4] shadow-sm p-3">
              <div className="font-semibold text-sm text-[#0F5132] mb-2">{stage.label}</div>
              <ul className="space-y-1">
                {stage.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-[#5B6B64]">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
