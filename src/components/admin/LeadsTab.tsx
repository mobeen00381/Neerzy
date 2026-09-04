// src/components/admin/LeadsTab.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Search, RefreshCw, Download, Plus, X } from "lucide-react";
import { adminFetch, exportCsv, qs } from "@/components/admin/api";
import {
  Spinner, EmptyState, SourceBadge, PaginationBar, fmtDate,
} from "@/components/admin/ui";
import type { AdminLead, AdminLeadList } from "@/lib/admin-types";

const STATUSES = ["new", "contacted", "trial_started", "converted", "lost"];
const SOURCES = ["facebook", "instagram", "google_ads", "organic", "referral", "direct"];

export default function LeadsTab() {
  const [data, setData] = useState<AdminLeadList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Leads</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Inbound pipeline from Facebook, Instagram, Google Ads and organic traffic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add lead
          </button>
          <button
            onClick={() => exportCsv("leads").catch(() => {})}
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
                className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border ${
                  statusFilter === s
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setPage(1); setAppliedQuery(query); }
            }}
            placeholder="Search name, phone, email or business…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500"
        >
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      </div>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading && !data ? (
            <Spinner label="Loading leads…" />
          ) : !data || data.leads.length === 0 ? (
            <EmptyState message="No leads yet. Point your ad landing-page forms at POST /api/leads/submit." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Lead</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Business</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Source</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Campaign</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Received</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.leads.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-800">{l.name || "Unnamed"}</p>
                          <p className="text-xs font-medium text-slate-400">
                            {[l.phone, l.email].filter(Boolean).join(" · ") || "No contact"}
                          </p>
                          {l.notes && <p className="text-[11px] text-slate-400 mt-1 italic truncate max-w-[220px]">{l.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">{l.business_name || "—"}</td>
                        <td className="px-4 py-3"><SourceBadge source={l.source} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-slate-500">{l.utm_campaign || "—"}</span>
                          {l.utm_medium && <span className="block text-[10px] font-semibold text-slate-400">via {l.utm_medium}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{fmtDate(l.created_at)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={l.status}
                            onChange={(e) => updateStatus(l.id, e.target.value)}
                            className={`text-xs font-black uppercase px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                              l.status === "new" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              l.status === "contacted" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              l.status === "trial_started" ? "bg-violet-50 text-violet-700 border-violet-200" :
                              l.status === "converted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace("_", " ")}</option>
                            ))}
                          </select>
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

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); setPage(1); load(1, statusFilter, sourceFilter, appliedQuery); }} />}
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
      <label className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-emerald-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Add lead</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
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
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none"
            >
              {SOURCES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-400">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Ad campaign, follow-up plan…"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-emerald-500"
          />
        </div>

        {err && <p className="text-xs font-bold text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save lead"}
        </button>
      </form>
    </div>
  );
}

