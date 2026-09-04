// src/components/admin/UsersTab.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Search, RefreshCw, X, Download } from "lucide-react";
import { adminFetch, exportCsv, qs } from "@/components/admin/api";
import {
  Spinner, EmptyState, PlanBadge, UserStatusBadge, SourceBadge, ProgressBar,
  PaginationBar, fmtDate, fmtDateTime, money,
} from "@/components/admin/ui";
import type { AdminUserList, UserDetail } from "@/lib/admin-types";

export default function UsersTab() {
  const [data, setData] = useState<AdminUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState("");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (p = page, plan = planFilter, q = appliedQuery) => {
    setLoading(true);
    setError("");
    try {
      const url = "/api/admin/users" + qs({
        page: p, pageSize: 25, plan: plan || undefined, q: q || undefined,
      });
      setData(await adminFetch<AdminUserList>(url));
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, planFilter, appliedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, planFilter, appliedQuery]);

  const openUser = async (id: string) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const d = await adminFetch<UserDetail>(`/api/admin/users/${id}`);
      setSelected(d);
    } catch (e: any) {
      setError(e?.message || "Failed to load user detail");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Users</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Every account with live quota usage for the current 30-day cycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv("users").catch(() => {})}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setAppliedQuery(query);
              }
            }}
            placeholder="Search by phone or business name…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="growth">Growth</option>
          <option value="agency">Agency</option>
        </select>
        {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      </div>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading && !data ? (
            <Spinner label="Loading users…" />
          ) : !data || data.users.length === 0 ? (
            <EmptyState message="No users found." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">User</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Plan</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Status</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Quota (posts / reviews)</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Resets in</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Source</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Joined</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.users.map((u) => {
                      const cy = u.cycle;
                      const initials = (u.business_name || u.email || u.phone || "?")
                        .split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                                {initials || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">{u.business_name || "Unnamed business"}</p>
                                <p className="text-xs font-medium text-slate-400 truncate">{u.email || u.phone || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><PlanBadge plan={u.selected_plan} /></td>
                          <td className="px-4 py-3"><UserStatusBadge status={u.status} /></td>
                          <td className="px-4 py-3 min-w-[200px]">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <ProgressBar pct={cy.postsPct}
                                    color={cy.postsPct >= 90 ? "bg-rose-500" : cy.postsPct >= 60 ? "bg-amber-500" : "bg-emerald-500"} />
                                </div>
                                <span className="text-[11px] font-black text-slate-500 tabular-nums whitespace-nowrap">{cy.postsUsed}/{cy.postsLimit}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1"><ProgressBar pct={cy.reviewsPct} color="bg-blue-500" /></div>
                                <span className="text-[11px] font-black text-slate-500 tabular-nums whitespace-nowrap">{cy.reviewsUsed}/{cy.reviewsLimit}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-black text-slate-600 tabular-nums">{cy.daysLeft}d</span>
                            <p className="text-[10px] font-semibold text-slate-400">resets {fmtDate(cy.resetIso)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <SourceBadge source={u.signup_source || u.utm_source} />
                            {u.utm_campaign && (
                              <p className="text-[10px] font-semibold text-slate-400 mt-1 truncate max-w-[120px]">{u.utm_campaign}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500">{fmtDate(u.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openUser(u.id)}
                              className="inline-flex items-center text-xs font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5"
                            >
                              Detail →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

      {detailLoading && !selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
          <Spinner label="Loading user detail…" />
        </div>
      )}
      {selected && <UserDetailModal detail={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}


function UserDetailModal({ detail, onClose }: { detail: UserDetail; onClose: () => void }) {
  const u = detail.user;
  const cy = u.cycle;
  const initials = (u.business_name || u.email || u.phone || "?")
    .split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-base font-black shrink-0">
              {initials || "?"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900">{u.business_name || "Unnamed business"}</h2>
                <PlanBadge plan={u.selected_plan} />
                <UserStatusBadge status={u.status} />
              </div>
              <p className="text-sm font-medium text-slate-500 mt-0.5">{u.email || "—"} · {u.phone || "no phone"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Posts used</p>
              <p className="text-xl font-black text-slate-900 mt-1">{cy.postsUsed}<span className="text-sm text-slate-400 font-bold"> / {cy.postsLimit}</span></p>
              <div className="mt-2"><ProgressBar pct={cy.postsPct} color={cy.postsPct >= 90 ? "bg-rose-500" : "bg-emerald-500"} /></div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reviews sent</p>
              <p className="text-xl font-black text-slate-900 mt-1">{cy.reviewsUsed}<span className="text-sm text-slate-400 font-bold"> / {cy.reviewsLimit}</span></p>
              <div className="mt-2"><ProgressBar pct={cy.reviewsPct} color="bg-blue-500" /></div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cycle resets</p>
              <p className="text-lg font-black text-slate-900 mt-1">{cy.daysLeft}d</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">{fmtDate(cy.resetIso)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">All-time posts</p>
              <p className="text-xl font-black text-slate-900 mt-1">{u.totalPostsAllTime}</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">
                {u.agencyClients > 0 ? `${u.agencyClients} agency traders` : u.gbp_connected ? "GBP connected" : "No GBP yet"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Joined</p>
              <p className="font-bold text-slate-700">{fmtDateTime(u.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Source</p>
              <p className="font-bold text-slate-700 flex items-center gap-2">
                <SourceBadge source={u.signup_source || u.utm_source} />
                {u.utm_campaign && <span className="text-xs text-slate-400 font-semibold">{u.utm_campaign}</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Onboarded</p>
              <p className="font-bold text-slate-700">{u.onboarded_at ? fmtDate(u.onboarded_at) : "—"}</p>
            </div>
          </div>


          {/* Transactions */}
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Transactions</h3>
            {detail.transactions.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">No payment transactions recorded.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left">
                      <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Event</th>
                      <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Plan</th>
                      <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Amount</th>
                      <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.transactions.map((tr) => (
                      <tr key={tr.id}>
                        <td className="px-3 py-2 text-xs font-bold text-slate-700">{(tr.event_type || "transaction").replace(".", " · ")}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-slate-500">{tr.plan || "—"}</td>
                        <td className={`px-3 py-2 text-xs font-black text-right tabular-nums ${Number(tr.amount) < 0 ? "text-red-600" : "text-slate-800"}`}>
                          {tr.amount === null ? "—" : money(Number(tr.amount))}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold text-slate-500">{fmtDate(tr.occurred_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Review requests</h3>
            {detail.activity.reviews.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">No review requests sent.</p>
            ) : (
              <ul className="space-y-1.5">
                {detail.activity.reviews.slice(0, 8).map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-xs font-bold text-slate-700">{r.customer_name || "Customer"}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400">{r.status || "sent"} · {fmtDate(r.sent_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent posts */}
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Recent posts</h3>
            {detail.activity.posts.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">No posts yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {detail.activity.posts.slice(0, 8).map((p) => (
                  <li key={p.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-600 line-clamp-2">{p.text}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 mt-1">{fmtDate(p.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

