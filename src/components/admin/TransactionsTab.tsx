// src/components/admin/TransactionsTab.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { RefreshCw, Download, Wallet, CalendarRange } from "lucide-react";
import { adminFetch, exportCsv, qs } from "@/components/admin/api";
import { Spinner, EmptyState, PlanBadge, PaginationBar, fmtDateTime, money } from "@/components/admin/ui";
import type { AdminTransactionList } from "@/lib/admin-types";

export default function TransactionsTab() {
  const [data, setData] = useState<AdminTransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const load = async (p = page, plan = planFilter, type = typeFilter) => {
    setLoading(true);
    setError("");
    try {
      const url = "/api/admin/transactions" + qs({
        page: p, pageSize: 25, plan: plan || undefined, event_type: type || undefined,
      });
      setData(await adminFetch<AdminTransactionList>(url));
    } catch (e: any) {
      setError(e?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, planFilter, typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, planFilter, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Transactions</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">Every Paddle payment event, recorded by the webhook ledger.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv("transactions").catch(() => {})}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Revenue — all time</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums">
                  {money(data.totals.revenue)} <span className="text-xs font-bold text-slate-400">{data.totals.currency}</span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <CalendarRange className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Revenue — this month</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums">
                  {money(data.totals.revenueThisMonth)} <span className="text-xs font-bold text-slate-400">{data.totals.currency}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500"
        >
          <option value="">All plans</option>
          <option value="pro">Pro</option>
          <option value="growth">Growth</option>
          <option value="agency">Agency</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500"
        >
          <option value="">All event types</option>
          <option value="transaction.completed">transaction.completed (revenue)</option>
          <option value="subscription.created">subscription.created</option>
          <option value="subscription.canceled">subscription.canceled</option>
          <option value="subscription.activated">subscription.activated</option>
        </select>
        {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      </div>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading && !data ? (
            <Spinner label="Loading transactions…" />
          ) : !data || data.transactions.length === 0 ? (
            <EmptyState message="No transactions recorded yet. Paddle webhook events will appear here automatically." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Customer</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Plan</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Event</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400 text-right">Amount</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">When</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.transactions.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-800">{tr.email || "—"}</p>
                          {tr.paddle_subscription_id && (
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5 font-mono truncate max-w-[220px]">{tr.paddle_subscription_id}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">{tr.plan ? <PlanBadge plan={tr.plan} /> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-600">{(tr.event_type || "transaction.completed").replace(".", " · ")}</span>
                          {tr.origin && <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">{tr.origin}</span>}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-black tabular-nums ${Number(tr.amount) < 0 ? "text-red-600" : "text-slate-900"}`}>
                          {tr.amount === null ? "—" : money(Number(tr.amount))}
                          {tr.amount !== null && tr.currency && Number(tr.amount) >= 0 && (
                            <span className="text-[10px] font-bold text-slate-400 ml-1">{tr.currency}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{fmtDateTime(tr.occurred_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            tr.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            tr.status === "canceled" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                          }`}>
                            {tr.status || "completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-100">
                <PaginationBar page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

