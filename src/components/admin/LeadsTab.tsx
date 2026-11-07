// src/components/admin/LeadsTab.tsx
"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Search, RefreshCw, Download, Plus, X, Mail } from "lucide-react";
import { adminFetch, exportCsv, qs } from "@/components/admin/api";
import {
  Spinner, EmptyState, SourceBadge, PaginationBar, fmtDate, PriorityBadge, WebsiteCell,
} from "@/components/admin/ui";
import type { AdminLead, AdminLeadList } from "@/lib/admin-types";
import type { LeadPriorityLevel } from "@/lib/lead-priority";
import LeadDrawer from "@/components/admin/LeadDrawer";

const STATUSES = ["new", "contacted", "trial_started", "converted", "lost"];
// `gmb_audit` = a visitor who ran the free GBP audit tool (captured server-side
// by /api/audit/run - see lib/audit-lead.ts).
const SOURCES = [
  "facebook", "instagram", "google_ads", "organic", "referral", "direct", "gmb_audit",
];

/** Priority filter dropdown; the levels themselves come from lib/lead-priority.ts. */
const PRIORITIES: { value: LeadPriorityLevel; label: string }[] = [
  { value: "hot", label: "HOT" },
  { value: "warm", label: "WARM" },
  { value: "cold", label: "COLD" },
];

/** Sort rank for the table: HOT first, then WARM, COLD and finally no priority. */
const PRIORITY_RANK: Record<string, number> = { hot: 0, warm: 1, cold: 2 };

/**
 * The BUSINESS column was dropped from the table (no room for it at 1366px), so
 * the business name is only printed under the lead name when it actually says
 * something different from it.
 */
function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
}

/**
 * Row clicks open the lead detail drawer, so the cells with their own controls
 * (status select, website link, follow-up button) spread this to stay inert.
 */
const stopRow = {
  onClick: (e: ReactMouseEvent) => e.stopPropagation(),
  onKeyDown: (e: ReactKeyboardEvent) => e.stopPropagation(),
};

export default function LeadsTab() {
  const [data, setData] = useState<AdminLeadList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  // Priority is derived server-side (lib/lead-priority.ts), so it is filtered
  // and re-sorted on the loaded page instead of in SQL.
  const [priorityFilter, setPriorityFilter] = useState<"" | LeadPriorityLevel>("");
  // Internal test leads (20261108_leads_is_test.sql) are hidden by default;
  // they keep flowing through the automation either way.
  const [hideTest, setHideTest] = useState(true);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [followupLead, setFollowupLead] = useState<AdminLead | null>(null);
  // Lead detail drawer: which lead is open, plus a key the drawer reloads on
  // when something outside it changed the lead (e.g. a sent follow-up email).
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);

  const load = async (p = page, st = statusFilter, src = sourceFilter, q = appliedQuery) => {
    setLoading(true);
    setError("");
    try {
      const url = "/api/admin/leads" + qs({
        page: p, pageSize: 25, status: st || undefined, source: src || undefined, q: q || undefined,
      });
      setData(await adminFetch<AdminLeadList>(url));
    } catch (e: any) {
      setError(e?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, statusFilter, sourceFilter, appliedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, sourceFilter, appliedQuery]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminFetch("/api/admin/leads", {
        method: "POST",
        body: JSON.stringify({ action: "update", id, status }),
      });
      setData((prev) =>
        prev
          ? { ...prev, leads: prev.leads.map((l) => (l.id === id ? { ...l, status: status as AdminLead["status"] } : l)) }
          : prev
      );
    } catch (e: any) {
      setError(e?.message || "Failed to update lead");
    }
  };

/**
   * Patch one row in place after a drawer action (status, last contacted) so
   * the table stays in sync without reloading the list - filters, search and
   * pagination survive.
   */
  const patchLead = (id: string, patch: Partial<AdminLead>) => {
    setData((prev) =>
      prev ? { ...prev, leads: prev.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) } : prev
    );
  };

  /**
   * What the table renders: test leads hidden (default), then the priority
   * filter, then HOT -> WARM -> COLD -> newest. Both are client-side, so the
   * pagination and the pipeline pills keep their server-side totals - and the
   * NEW pill already excludes test leads in /api/admin/leads.
   */
  const rows = (data?.leads || [])
    .filter((l) => !hideTest || l.is_test !== true)
    .filter((l) => !priorityFilter || l.priority?.level === priorityFilter)
    .sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority?.level || ""] ?? 3) - (PRIORITY_RANK[b.priority?.level || ""] ?? 3) ||
        String(b.created_at || "").localeCompare(String(a.created_at || ""))
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E22]">Leads</h1>
          <p className="text-sm font-normal text-[#5B6B64] mt-0.5">
            Inbound pipeline from Facebook, Instagram, Google Ads and organic traffic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#22C55E] text-white hover:bg-[#0F5132]"
          >
            <Plus className="w-3.5 h-3.5" /> Add lead
          </button>
          <button
            onClick={() => exportCsv("leads").catch(() => {})}
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

      {/* Pipeline summary */}
      {data && data.byStatus.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const bucket = data.byStatus.find((b) => b.status === s);
            if (!bucket) return null;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  statusFilter === s
                    ? "bg-[#0B3D2E] text-white border-slate-900"
                    : "bg-white text-[#0F5132] border-[#E1E8E4] hover:border-slate-400"
                }`}
              >
                {s.replace("_", " ")} · {bucket.count}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B64]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setPage(1); setAppliedQuery(query); }
            }}
            placeholder="Search name, phone, email or business…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#D3E6DA]"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
        >
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as "" | LeadPriorityLevel)}
          className="px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64] cursor-pointer">
          <input
            type="checkbox"
            checked={hideTest}
            onChange={(e) => setHideTest(e.target.checked)}
            className="w-4 h-4 accent-[#22C55E]"
          />
          Hide test leads
        </label>
        {error && <p className="text-xs font-bold text-[#0F5132]">{error}</p>}
      </div>

      <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading && !data ? (
            <Spinner label="Loading leads…" />
          ) : !data || data.leads.length === 0 ? (
            <EmptyState message="No leads yet. Point your ad landing-page forms at POST /api/leads/submit." />
          ) : rows.length === 0 ? (
            <EmptyState message="No leads match the current filters." />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F9F8] text-left">
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Lead</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Priority</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Website</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Source</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Campaign</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Received</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Status</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]">Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E8E4]">
                  {rows.map((l) => (
                    <tr
                      key={l.id}
                      onClick={(e) => {
                        // Keep focus on the row so the drawer can hand it back on close.
                        e.currentTarget.focus();
                        setOpenLeadId(l.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpenLeadId(l.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={"Open details for " + (l.name || l.business_name || "lead")}
                      className="hover:bg-[#E6F2EA] transition-colors cursor-pointer focus:outline-none focus-visible:bg-[#E6F2EA]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-bold text-[#0A2E22] truncate">{l.name || l.business_name || "Unnamed"}</p>
                          {l.is_test === true && (
                            <span
                              title="Internal test lead - hidden by default, but still gets the automation emails"
                              className="inline-flex items-center shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F1F3F2] text-[#6B7C75] border border-[#E1E8E4]"
                            >
                              TEST
                            </span>
                          )}
                        </div>
                        {/* Business name only when it is not just the lead name again. */}
                        {l.business_name && !sameText(l.name || l.business_name, l.business_name) && (
                          <p className="text-xs font-bold text-[#0F5132] truncate max-w-[260px]">{l.business_name}</p>
                        )}
                        <p className="text-xs font-normal text-[#5B6B64] truncate max-w-[260px]">
                          {[l.phone, l.email].filter(Boolean).join(" · ") || "No contact"}
                        </p>
                        {l.notes && <p className="text-[11px] text-[#5B6B64] mt-1 italic truncate max-w-[220px]">{l.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PriorityBadge priority={l.priority} />
                          {typeof l.audit_score === "number" && (
                            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              l.audit_score >= 80
                                ? "bg-[#E6F2EA] text-[#0F5132]"
                                : l.audit_score >= 50
                                ? "bg-[#FFF7E6] text-[#8A5A00]"
                                : "bg-[#FDECEC] text-[#9B1C1C]"
                            }`}>
                              {l.audit_score}/100 audit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" {...stopRow}>
                        <WebsiteCell website={l.website} hasWebsite={l.hasWebsite} />
                      </td>
                      <td className="px-4 py-3"><SourceBadge source={l.source} /></td>
                      <td className="px-4 py-3 max-w-[150px]">
                        <p className="text-xs font-normal text-[#5B6B64] truncate">{l.utm_campaign || "—"}</p>
                        {l.utm_medium && <p className="text-[10px] font-normal text-[#5B6B64] truncate">via {l.utm_medium}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-[#5B6B64] whitespace-nowrap">{fmtDate(l.created_at)}</td>
                      <td className="px-4 py-3" {...stopRow}>
                        <select
                          value={l.status}
                          onChange={(e) => updateStatus(l.id, e.target.value)}
                          className={`text-xs font-bold uppercase px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                            l.status === "new" ? "bg-[#E6F2EA] text-[#0F5132] border-[#E1E8E4]" :
                            l.status === "contacted" ? "bg-[#E6F2EA] text-[#0F5132] border-[#E1E8E4]" :
                            l.status === "trial_started" ? "bg-[#E6F2EA] text-[#0F5132] border-[#E1E8E4]" :
                            l.status === "converted" ? "bg-[#E6F2EA] text-[#0F5132] border-[#D3E6DA]" :
                            "bg-[#E6F2EA] text-[#5B6B64] border-[#E1E8E4]"
                          }`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3" {...stopRow}>
                        <button
                          onClick={() => setFollowupLead(l)}
                          title="Send a follow-up email about this audit"
                          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-[#E1E8E4] bg-white text-[#0F5132] hover:border-[#22C55E] hover:bg-[#F7F9F8]"
                        >
                          <Mail className="w-3 h-3" /> Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-[#E1E8E4]">
                <PaginationBar page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); setPage(1); load(1, statusFilter, sourceFilter, appliedQuery); }} />}

      {followupLead && (
        <FollowupModal
          lead={followupLead}
          onClose={() => setFollowupLead(null)}
          onSent={() => {
            // The email really went out: log it on the lead timeline, close the
            // composer and let an open drawer pick the new entry up.
            adminFetch("/api/admin/leads/" + followupLead.id, {
              method: "POST",
              body: JSON.stringify({ action: "log_contact", channel: "email" }),
            }).catch(() => {});
            setFollowupLead(null);
            setDrawerRefreshKey((k) => k + 1);
            load();
          }}
        />
      )}

      {openLeadId && (
        <LeadDrawer
          leadId={openLeadId}
          refreshKey={drawerRefreshKey}
          onClose={() => setOpenLeadId(null)}
          onUpdated={(patch) => patchLead(openLeadId, patch)}
          onOpenFollowup={(lead) => setFollowupLead(lead)}
        />
      )}
    </div>
  );
}


function AddLeadModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", business_name: "", source: "facebook", status: "new", notes: "",
  });
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await adminFetch("/api/admin/leads", {
        method: "POST",
        body: JSON.stringify({ action: "create", ...form }),
      });
      onAdded();
    } catch (error: any) {
      setErr(error?.message || "Failed to add lead");
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder: string) => (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-[#5B6B64]">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0B3D2E]/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0A2E22]">Add lead</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[#E6F2EA]">
            <X className="w-5 h-5 text-[#5B6B64]" />
          </button>
        </div>

        {field("name", "Name", "e.g. John the Plumber")}
        <div className="grid grid-cols-2 gap-3">
          {field("phone", "Phone", "+44…")}
          {field("email", "Email", "john@…")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field("business_name", "Business", "John's Plumbing")}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5B6B64]">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none"
            >
              {SOURCES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#5B6B64]">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Ad campaign, follow-up plan…"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
          />
        </div>

        {err && <p className="text-xs font-bold text-[#0F5132]">{err}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-[#22C55E] text-white font-bold text-sm hover:bg-[#0F5132] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save lead"}
        </button>
      </form>
    </div>
  );
}

/**
 * Follow-up email composer for one lead.
 * The address is editable because most gmb_audit leads arrive with only the
 * business phone; the admin usually gets the email on the first call and can
 * save it here in the same step (it is written back to the lead first).
 */
function FollowupModal({
  lead, onClose, onSent,
}: { lead: AdminLead; onClose: () => void; onSent: () => void }) {
  const [email, setEmail] = useState(lead.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState(defaultFollowupMessage(lead));
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setErr("");
    try {
      const target = email.trim();
      if (!target) throw new Error("Add an email address first.");
      if (target.toLowerCase() !== (lead.email || "").toLowerCase()) {
        await adminFetch("/api/admin/leads", {
          method: "POST",
          body: JSON.stringify({ action: "update", id: lead.id, email: target }),
        });
      }
      await adminFetch("/api/admin/leads/followup", {
        method: "POST",
        body: JSON.stringify({
          leadId: lead.id,
          subject: subject.trim() || undefined,
          message: message.trim(),
        }),
      });
      setSentTo(target);
      setTimeout(onSent, 900);
    } catch (error: any) {
      setErr(error?.message || "Failed to send follow-up");
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B3D2E]/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0A2E22]">Email follow-up</h3>
            <p className="text-xs font-normal text-[#5B6B64] mt-0.5">
              {lead.business_name || "This lead"}
              {typeof lead.audit_score === "number" ? ` · GBP audit ${lead.audit_score}/100` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[#E6F2EA]">
            <X className="w-5 h-5 text-[#5B6B64]" />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#5B6B64]">To</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@business.com"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
          />
          {!lead.email && (
            <p className="text-[11px] font-normal text-[#5B6B64] mt-1">
              This lead has no email yet — adding one here saves it to the lead.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#5B6B64]">
            Subject <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Leave empty for the default subject"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#5B6B64]">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={7}
            maxLength={2000}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
          />
          <p className="text-[11px] font-normal text-[#5B6B64] mt-1">
            {message.length}/2000 · the lead&apos;s live report link is added automatically.
          </p>
        </div>

        {err && <p className="text-xs font-bold text-[#0F5132]">{err}</p>}
        {sentTo && <p className="text-xs font-bold text-[#0F5132]">Follow-up sent to {sentTo}.</p>}

        <button
          type="submit"
          disabled={sending || Boolean(sentTo)}
          className="w-full py-2.5 rounded-lg bg-[#22C55E] text-white font-bold text-sm hover:bg-[#0F5132] disabled:opacity-50"
        >
          {sentTo ? "Sent" : sending ? "Sending…" : "Send follow-up"}
        </button>
      </form>
    </div>
  );
}

function defaultFollowupMessage(lead: AdminLead): string {
  const business = lead.business_name || "your business";
  const score = typeof lead.audit_score === "number" ? ` (${lead.audit_score}/100)` : "";
  return (
    `Hi,\n\n` +
    `I ran a free audit of ${business}${score} and spotted a few quick wins that would help you appear for more local searches.\n\n` +
    `Want me to send over what to fix first?`
  );
}

