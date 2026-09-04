// src/components/admin/ui.tsx
import { Card, CardContent } from "@/components/ui/Card";
import type { ReactNode } from "react";
import { Loader2, Inbox } from "lucide-react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-7 h-7 animate-spin mb-3" />
      <p className="text-sm font-semibold">{label || "Loading…"}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Inbox className="w-8 h-8 mb-3 text-slate-300" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600 border-slate-200",
  pro: "bg-blue-50 text-blue-700 border-blue-200",
  growth: "bg-purple-50 text-purple-700 border-purple-200",
  agency: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function PlanBadge({ plan }: { plan: string }) {
  const cls = PLAN_COLORS[(plan || "free").toLowerCase()] || PLAN_COLORS.free;
  return (
    <span className={`inline-flex items-center text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cls}`}>
      {(plan || "free").toLowerCase()}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  agency: "bg-teal-100 text-teal-700",
  trial: "bg-amber-100 text-amber-700",
  free: "bg-slate-100 text-slate-600",
};

export function UserStatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] || STATUS_COLORS.free;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

export function SourceBadge({ source }: { source: string | null }) {
  const map: Record<string, string> = {
    facebook: "bg-blue-100 text-blue-700",
    instagram: "bg-pink-100 text-pink-700",
    google_ads: "bg-orange-100 text-orange-700",
    organic: "bg-emerald-100 text-emerald-700",
    referral: "bg-violet-100 text-violet-700",
    direct: "bg-slate-100 text-slate-600",
    landing: "bg-cyan-100 text-cyan-700",
  };
  const s = source || "direct";
  const cls = map[s] || map.direct;
  return (
    <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      {s.replace("_", " ")}
    </span>
  );
}

const LEAD_STATUS: Record<string, { cls: string; label: string }> = {
  new: { cls: "bg-blue-100 text-blue-700", label: "New" },
  contacted: { cls: "bg-amber-100 text-amber-700", label: "Contacted" },
  trial_started: { cls: "bg-violet-100 text-violet-700", label: "Trial" },
  converted: { cls: "bg-emerald-100 text-emerald-700", label: "Converted" },
  lost: { cls: "bg-slate-200 text-slate-500", label: "Lost" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const s = LEAD_STATUS[status] || LEAD_STATUS.new;
  return (
    <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "text-slate-900",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-black tabular-nums ${accent}`}>{value}</p>
            {sub && <p className="text-xs font-semibold text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressBar({ pct, color = "bg-emerald-500" }: { pct: number; color?: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between mt-4 text-xs font-semibold text-slate-500">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white tabular-nums">{page}</span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

