// src/components/admin/DemosTab.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Link2, Copy, Check, Trash2, RefreshCw, Plus } from "lucide-react";
import { adminFetch, getAdminToken } from "@/components/admin/api";
import { Spinner, EmptyState, fmtDateTime } from "@/components/admin/ui";

interface DemoLink {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  used_by?: string | null;
}

export default function DemosTab() {
  const [links, setLinks] = useState<DemoLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await adminFetch<{ dLinks: DemoLink[] }>("/api/admin");
      setLinks(d.dLinks || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load demo links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "generateDemoLink" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create link");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create link");
    } finally {
      setGenerating(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const token = getAdminToken();
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "deleteDemoLink", id }),
      });
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Failed to delete link");
    }
  };

  const copy = (l: DemoLink) => {
    navigator.clipboard.writeText(`${window.location.origin}/demo/${l.code}`);
    setCopiedId(l.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const statusOf = (l: DemoLink) => {
    if (l.used) return { label: "Used", cls: "bg-slate-200 text-slate-600" };
    if (new Date(l.expires_at).getTime() < Date.now()) return { label: "Expired", cls: "bg-red-100 text-red-600" };
    return { label: "Active", cls: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Demo Links</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Generate 7-day access links so prospects can try Neerzy before paying.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> {generating ? "Creating…" : "New link"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs font-bold text-red-600">{error}</p>}

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading && !links.length ? (
            <Spinner label="Loading demo links…" />
          ) : links.length === 0 ? (
            <EmptyState message="No demo links yet. Create one to share with a prospect." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {links.map((l) => {
                const st = statusOf(l);
                return (
                  <li key={l.id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 font-mono truncate">/demo/{l.code}</p>
                        <p className="text-[11px] font-semibold text-slate-400">
                          Created {fmtDateTime(l.created_at)} · Expires {fmtDateTime(l.expires_at)}
                          {l.used_by && ` · Used by ${l.used_by}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                      <button
                        onClick={() => copy(l)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
                        title="Copy link"
                      >
                        {copiedId === l.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => remove(l.id)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

