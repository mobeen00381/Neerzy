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
          <h1 className="text-2xl font-bold text-[#0A2E22]">Users</h1>
          <p className="text-sm font-normal text-[#5B6B64] mt-0.5">
            Every account with live quota usage for the current 30-day cycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv("users").catch(() => {})}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8]"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#0B3D2E] text-white hover:bg-[#0F5132]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B64]" />
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
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#D3E6DA]"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="growth">Growth</option>
          <option value="agency">Agency</option>
        </select>
        {error && <p className="text-xs font-bold text-[#0F5132]">{error}</p>}
      </div>

      <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white overflow-hidden">
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
                    <tr className="bg-[#F7F9F8] text-left">
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">User</th>
                      <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Plan</th>
                      <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Status</th>
                      <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Quota (posts / reviews)</th>
                      <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Resets in</th>
                      <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Source</th>
                      <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Joined</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E8E4]">
                    {data.users.map((u) => {
                      const cy = u.cycle;
                      const initials = (u.business_name || u.email || u.phone || "?")
                        .split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
                      return (
                        <tr key={u.id} className="hover:bg-[#E6F2EA] transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#0F5132] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {initials || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#0A2E22] truncate">{u.business_name || "Unnamed business"}</p>
                                <p className="text-xs font-normal text-[#5B6B64] truncate">{u.email || u.phone || "—"}</p>
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
                                    color={cy.postsPct >= 90 ? "bg-[#22C55E]" : cy.postsPct >= 60 ? "bg-[#22C55E]" : "bg-[#22C55E]"} />
                                </div>
                                <span className="text-[11px] font-bold text-[#5B6B64] tabular-nums whitespace-nowrap">{cy.postsUsed}/{cy.postsLimit}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1"><ProgressBar pct={cy.reviewsPct} color="bg-[#22C55E]" /></div>
                                <span className="text-[11px] font-bold text-[#5B6B64] tabular-nums whitespace-nowrap">{cy.reviewsUsed}/{cy.reviewsLimit}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-[#0F5132] tabular-nums">{cy.daysLeft}d</span>
                            <p className="text-[10px] font-normal text-[#5B6B64]">resets {fmtDate(cy.resetIso)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <SourceBadge source={u.signup_source || u.utm_source} />
                            {u.utm_campaign && (
                              <p className="text-[10px] font-normal text-[#5B6B64] mt-1 truncate max-w-[120px]">{u.utm_campaign}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-[#5B6B64]">{fmtDate(u.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openUser(u.id)}
                              className="inline-flex items-center text-xs font-bold text-[#0F5132] border border-[#D3E6DA] bg-[#E6F2EA] hover:bg-[#D3E6DA] rounded-lg px-2.5 py-1.5"
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
              <div className="px-5 py-3 border-t border-[#E1E8E4]">
                <PaginationBar page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {detailLoading && !selected && (
        <div className="fixed inset-0 z-50 bg-[#0B3D2E]/40 backdrop-blur-sm flex items-center justify-center">
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
    <div className="fixed inset-0 z-50 bg-[#0B3D2E]/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#E1E8E4] flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0F5132] text-white flex items-center justify-center text-base font-bold shrink-0">
              {initials || "?"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#0A2E22]">{u.business_name || "Unnamed business"}</h2>
                <PlanBadge plan={u.selected_plan} />
                <UserStatusBadge status={u.status} />
              </div>
              <p className="text-sm font-normal text-[#5B6B64] mt-0.5">{u.email || "—"} · {u.phone || "no phone"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#E6F2EA]">
            <X className="w-5 h-5 text-[#5B6B64]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#E1E8E4] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B64]">Posts used</p>
              <p className="text-xl font-bold text-[#0A2E22] mt-1">{cy.postsUsed}<span className="text-sm text-[#5B6B64] font-bold"> / {cy.postsLimit}</span></p>
              <div className="mt-2"><ProgressBar pct={cy.postsPct} color={cy.postsPct >= 90 ? "bg-[#22C55E]" : "bg-[#22C55E]"} /></div>
            </div>
            <div className="rounded-xl border border-[#E1E8E4] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B64]">Reviews sent</p>
              <p className="text-xl font-bold text-[#0A2E22] mt-1">{cy.reviewsUsed}<span className="text-sm text-[#5B6B64] font-bold"> / {cy.reviewsLimit}</span></p>
              <div className="mt-2"><ProgressBar pct={cy.reviewsPct} color="bg-[#22C55E]" /></div>
            </div>
            <div className="rounded-xl border border-[#E1E8E4] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B64]">Cycle resets</p>
              <p className="text-lg font-bold text-[#0A2E22] mt-1">{cy.daysLeft}d</p>
              <p className="text-[11px] font-normal text-[#5B6B64] mt-1">{fmtDate(cy.resetIso)}</p>
            </div>
            <div className="rounded-xl border border-[#E1E8E4] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B64]">All-time posts</p>
              <p className="text-xl font-bold text-[#0A2E22] mt-1">{u.totalPostsAllTime}</p>
              <p className="text-[11px] font-normal text-[#5B6B64] mt-1">
                {u.agencyClients > 0 ? `${u.agencyClients} agency traders` : u.gbp_connected ? "GBP connected" : "No GBP yet"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B64] mb-1">Joined</p>
              <p className="font-bold text-[#0A2E22]">{fmtDateTime(u.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B64] mb-1">Source</p>
              <p className="font-bold text-[#0A2E22] flex items-center gap-2">
                <SourceBadge source={u.signup_source || u.utm_source} />
                {u.utm_campaign && <span className="text-xs text-[#5B6B64] font-normal">{u.utm_campaign}</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B64] mb-1">Onboarded</p>
              <p className="font-bold text-[#0A2E22]">{u.onboarded_at ? fmtDate(u.onboarded_at) : "—"}</p>
            </div>
          </div>


          {/* Transactions */}
          <div>
            <h3 className="text-sm font-bold text-[#0A2E22] uppercase tracking-wider mb-2">Transactions</h3>
            {detail.transactions.length === 0 ? (
              <p className="text-sm text-[#5B6B64] font-normal">No payment transactions recorded.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E1E8E4]">
                <table className="w-full text-sm">
                  <thead className="bg-[#F7F9F8]">
                    <tr className="text-left">
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#5B6B64]">Event</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#5B6B64]">Plan</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#5B6B64] text-right">Amount</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#5B6B64]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E8E4]">
                    {detail.transactions.map((tr) => (
                      <tr key={tr.id}>
                        <td className="px-3 py-2 text-xs font-bold text-[#0A2E22]">{(tr.event_type || "transaction").replace(".", " · ")}</td>
                        <td className="px-3 py-2 text-xs font-normal text-[#5B6B64]">{tr.plan || "—"}</td>
                        <td className={`px-3 py-2 text-xs font-bold text-right tabular-nums ${Number(tr.amount) < 0 ? "text-[#0F5132]" : "text-[#0A2E22]"}`}>
                          {tr.amount === null ? "—" : money(Number(tr.amount))}
                        </td>
                        <td className="px-3 py-2 text-xs font-normal text-[#5B6B64]">{fmtDate(tr.occurred_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h3 className="text-sm font-bold text-[#0A2E22] uppercase tracking-wider mb-2">Review requests</h3>
            {detail.activity.reviews.length === 0 ? (
              <p className="text-sm text-[#5B6B64] font-normal">No review requests sent.</p>
            ) : (
              <ul className="space-y-1.5">
                {detail.activity.reviews.slice(0, 8).map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F9F8] px-3 py-2">
                    <span className="text-xs font-bold text-[#0A2E22]">{r.customer_name || "Customer"}</span>
                    <span className="text-[10px] font-bold uppercase text-[#5B6B64]">{r.status || "sent"} · {fmtDate(r.sent_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent posts */}
          <div>
            <h3 className="text-sm font-bold text-[#0A2E22] uppercase tracking-wider mb-2">Recent posts</h3>
            {detail.activity.posts.length === 0 ? (
              <p className="text-sm text-[#5B6B64] font-normal">No posts yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {detail.activity.posts.slice(0, 8).map((p) => (
                  <li key={p.id} className="rounded-lg bg-[#F7F9F8] px-3 py-2">
                    <p className="text-xs font-normal text-[#0F5132] line-clamp-2">{p.text}</p>
                    <p className="text-[10px] font-bold uppercase text-[#5B6B64] mt-1">{fmtDate(p.created_at)}</p>
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

