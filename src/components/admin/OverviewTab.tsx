// src/components/admin/OverviewTab.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  TrendingUp, Wallet, Users, Target, Activity, Globe, Download, RefreshCw, MessageSquare, Smartphone,
} from "lucide-react";
import { adminFetch, exportCsv } from "@/components/admin/api";
import {
  KpiCard, Spinner, SourceBadge, LeadStatusBadge, fmtDate, money,
} from "@/components/admin/ui";
import { SignupLineChart, RevenueBarChart, PlanDoughnutChart } from "@/components/admin/Charts";
import type { AdminOverview } from "@/lib/admin-types";

export default function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await adminFetch<AdminOverview>("/api/admin/stats");
      setData(d);
    } catch (e: any) {
      setError(e?.message || "Failed to load overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) return <Spinner label="Loading overview…" />;
  if (error && !data) {
    return (
      <div className="max-w-xl">
        <Card className="border-[#E1E8E4] bg-[#E6F2EA]">
          <CardContent className="p-6 text-[#0F5132] text-sm font-normal">{error}</CardContent>
        </Card>
      </div>
    );
  }
  if (!data) return null;

  const t = data.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E22]">Overview</h1>
          <p className="text-sm font-normal text-[#5B6B64] mt-0.5">
            Revenue, users, quotas and lead pipeline — updated live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv("transactions").catch(() => {})}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8]"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#0B3D2E] text-white hover:bg-[#0F5132]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard label="Monthly recurring revenue" value={money(t.mrr)} sub={`${t.payingUsers} paying users`}
          icon={<TrendingUp className="w-5 h-5 text-[#16A34A]" />} accent="text-[#16A34A]" />
        <KpiCard label="Revenue all-time" value={money(t.revenueAllTime)}
          sub={`${money(t.revenueThisMonth)} this month`} icon={<Wallet className="w-5 h-5 text-[#0F5132]" />} />
        <KpiCard label="Total users" value={t.users.toLocaleString()}
          sub={`${t.usersThisMonth} new this month`} icon={<Users className="w-5 h-5 text-[#0F5132]" />} />
        <KpiCard label="Leads captured" value={t.leadsTotal.toLocaleString()}
          sub={`${t.leadsNew} new · ${t.conversionRate}% converted`} icon={<Target className="w-5 h-5 text-[#0F5132]" />} />
        <KpiCard label="Posts today" value={t.postsToday.toLocaleString()}
          sub={`${t.postsAllTime.toLocaleString()} all-time`} icon={<Activity className="w-5 h-5 text-[#0F5132]" />} />
        <KpiCard label="GBP connected" value={t.gbpConnected.toLocaleString()}
          sub={`${t.agencyClients} agency traders`} icon={<Globe className="w-5 h-5 text-[#0F5132]" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-[#0A2E22]">Revenue — last 6 months</CardTitle>
            <CardDescription>Completed Paddle transactions, per month.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={data.revenueSeries} />
          </CardContent>
        </Card>
        <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-[#0A2E22]">Users by plan</CardTitle>
            <CardDescription>Current plan distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanDoughnutChart breakdown={data.planBreakdown} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-[#0A2E22]">New signups — last 14 days</CardTitle>
            <CardDescription>
              {data.signupSources.length > 0
                ? "Source: " + data.signupSources.map((s) => `${s.source} (${s.count})`).join(" · ")
                : "No signups in this window yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupLineChart data={data.signupSeries} />
          </CardContent>
        </Card>
      </div>


      {/* Recent activity, transactions, leads */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)]">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold text-[#0A2E22]">Recent transactions</CardTitle>
            <button onClick={() => onNavigate("transactions")}
              className="text-xs font-bold text-[#0F5132] hover:underline inline-flex items-center gap-0.5">
              View all <span>→</span>
            </button>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-[#5B6B64] font-normal px-4 py-6 text-center">
                No payments recorded yet. Once Paddle webhooks flow, every transaction appears here.
              </p>
            ) : (
              <ul className="divide-y divide-[#E1E8E4]">
                {data.recentTransactions.map((tr) => (
                  <li key={tr.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0A2E22] truncate">{tr.email || "—"}</p>
                      <p className="text-[11px] font-normal text-[#5B6B64] mt-0.5">
                        {(tr.event_type || "transaction").replace(".", " · ")} {tr.plan ? `· ${tr.plan}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${Number(tr.amount) < 0 ? "text-[#0F5132]" : "text-[#0A2E22]"}`}>
                        {tr.amount === null ? "—" : money(Number(tr.amount))}
                      </p>
                      <p className="text-[10px] font-normal text-[#5B6B64]">{fmtDate(tr.occurred_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)]">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold text-[#0A2E22]">Recent leads</CardTitle>
            <button onClick={() => onNavigate("leads")}
              className="text-xs font-bold text-[#0F5132] hover:underline inline-flex items-center gap-0.5">
              View all <span>→</span>
            </button>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {data.recentLeads.length === 0 ? (
              <p className="text-sm text-[#5B6B64] font-normal px-4 py-6 text-center">
                No leads yet. Wire your Facebook / Instagram / Google Ads forms to <code className="text-[#0F5132]">POST /api/leads/submit</code>.
              </p>
            ) : (
              <ul className="divide-y divide-[#E1E8E4]">
                {data.recentLeads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0A2E22] truncate">{l.name || l.business_name || l.email || "—"}</p>
                      <p className="text-[11px] font-normal text-[#5B6B64] mt-0.5 truncate">{l.phone || l.email || "No contact"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <SourceBadge source={l.source} />
                      <LeadStatusBadge status={l.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)]">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold text-[#0A2E22]">Latest activity</CardTitle>
            <button onClick={() => onNavigate("activity")}
              className="text-xs font-bold text-[#0F5132] hover:underline inline-flex items-center gap-0.5">
              View all <span>→</span>
            </button>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-[#5B6B64] font-normal px-4 py-6 text-center">No posts generated yet.</p>
            ) : (
              <ul className="divide-y divide-[#E1E8E4]">
                {data.recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      a.source === "whatsapp" ? "bg-[#E6F2EA] text-[#128C7E]" : "bg-[#E6F2EA] text-[#0F5132]"
                    }`}>
                      {a.source === "whatsapp" ? <MessageSquare className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0A2E22] truncate">{a.author}</p>
                      <p className="text-[11px] text-[#5B6B64] line-clamp-2 mt-0.5 leading-snug">{a.text || "Media post"}</p>
                      <p className="text-[10px] font-normal text-[#5B6B64] mt-1">{fmtDate(a.date)} · {a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

