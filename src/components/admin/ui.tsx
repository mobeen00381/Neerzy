// src/components/admin/ui.tsx
import { Card, CardContent } from "@/components/ui/Card";
import type { ReactNode } from "react";
import { Loader2, Inbox } from "lucide-react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#5B6B64]">
      <Loader2 className="w-7 h-7 animate-spin mb-3" />
      <p className="text-sm font-normal">{label || "Loading…"}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#5B6B64]">
      <Inbox className="w-8 h-8 mb-3 text-[#9DB4A9]" />
      <p className="text-sm font-normal">{message}</p>
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-[#F7F9F8] text-[#5B6B64] border-[#E1E8E4]",
  pro: "bg-[#E6F2EA] text-[#0F5132] border-[#D3E6DA]",
  growth: "bg-white text-[#0F5132] border-[#22C55E]",
  agency: "bg-[#0B3D2E] text-white border-[#0B3D2E]",
};

export function PlanBadge({ plan }: { plan: string }) {
  const cls = PLAN_COLORS[(plan || "free").toLowerCase()] || PLAN_COLORS.free;
  return (
    <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cls}`}>
      {(plan || "free").toLowerCase()}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-[#E6F2EA] text-[#0F5132]",
  agency: "bg-[#0B3D2E] text-white",
  trial: "bg-white text-[#0F5132] border border-[#22C55E]",
  free: "bg-[#F7F9F8] text-[#5B6B64]",
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
    facebook: "bg-[#E6F2EA] text-[#0F5132] border border-[#D3E6DA]",
    instagram: "bg-white text-[#0F5132] border border-[#22C55E]",
    google_ads: "bg-[#22C55E] text-white",
    organic: "bg-[#F7F9F8] text-[#5B6B64] border border-[#E1E8E4]",
    referral: "bg-[#E6F2EA] text-[#5B6B64]",
    direct: "bg-[#F7F9F8] text-[#5B6B64]",
    landing: "bg-white text-[#0F5132] border border-[#D3E6DA]",
  };
  const s = source || "direct";
  const cls = map[s] || map.direct;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      {s.replace("_", " ")}
    </span>
  );
}

const LEAD_STATUS: Record<string, { cls: string; label: string }> = {
  new: { cls: "bg-[#E6F2EA] text-[#0F5132]", label: "New" },
  contacted: { cls: "bg-white text-[#0F5132] border border-[#22C55E]", label: "Contacted" },
  trial_started: { cls: "bg-white text-[#0B3D2E] border border-[#0B3D2E]", label: "Trial" },
  converted: { cls: "bg-[#22C55E] text-white", label: "Converted" },
  lost: { cls: "bg-[#F7F9F8] text-[#5B6B64]", label: "Lost" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const s = LEAD_STATUS[status] || LEAD_STATUS.new;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "text-[#0A2E22]",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#5B6B64] mb-1">{label}</p>
            <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
            {sub && <p className="text-xs font-normal text-[#5B6B64] mt-1">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E6F2EA] flex items-center justify-center shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressBar({ pct, color = "bg-[#22C55E]" }: { pct: number; color?: string }) {
  return (
    <div className="w-full bg-[#E6F2EA] rounded-full h-1.5 overflow-hidden">
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
    <div className="flex items-center justify-between mt-4 text-xs font-normal text-[#5B6B64]">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <span className="px-3 py-1.5 rounded-lg bg-[#0B3D2E] text-white tabular-nums">{page}</span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] disabled:opacity-40 disabled:cursor-not-allowed"
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

