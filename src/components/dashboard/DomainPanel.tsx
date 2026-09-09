"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Globe,
  Search,
  Loader2,
  RefreshCw,
  ExternalLink,
  Lock,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Helpers (pure, client-safe copies of lib/domain-registry)
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RENEWAL_NOTICE_BEFORE_DAYS = 35; // day 330 of 365

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function daysUntil(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  if (Number.isNaN(exp)) return null;
  return Math.ceil((exp - Date.now()) / (24 * 60 * 60 * 1000));
}

function inRenewalWindow(expiresAt?: string | null): boolean {
  const d = daysUntil(expiresAt);
  return d !== null && d >= 0 && d <= RENEWAL_NOTICE_BEFORE_DAYS;
}

type DomainRow = {
  id: string;
  domain_name: string;
  status: string;
  client_label: string | null;
  price_paid?: number | null;
  registered_at?: string | null;
  expires_at?: string | null;
  auto_renew?: boolean;
  error?: string | null;
  created_at?: string | null;
};

type CheckResult = {
  domain: string;
  available: boolean;
  price: number | null;
  currency: string;
  simulated: boolean;
  buyable: boolean;
  verified: boolean;
};

type StatusChipProps = { status: string };
function StatusChip({ status }: StatusChipProps) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-100">
        <CheckCircle2 className="w-3 h-3" /> Active
      </span>
    );
  }
  if (status === "provisioning") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-amber-100">
        <Loader2 className="w-3 h-3 animate-spin" /> Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded-full uppercase tracking-wider border border-red-100">
      <AlertCircle className="w-3 h-3" /> Failed
    </span>
  );
}

export default function DomainPanel() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("");
  const [eligible, setEligible] = useState(false);
  const [quota, setQuota] = useState(0);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [priceUsd, setPriceUsd] = useState(19);

  // Add-domain flow
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/domains/purchase", {
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Could not load your domain status.");
        return;
      }
      const j = await res.json();
      setPlan(j.plan || "");
      setEligible(!!j.eligible);
      setQuota(j.quota || 0);
      setDomains(j.domains || []);
      setPriceUsd(j.priceUsd || 19);
    } catch (err: any) {
      console.error("Failed to load domains:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startAdding = () => {
    setAdding(true);
    setError("");
    setNotice("");
    setSearchTerm("");
    setResults([]);
  };

  const checkDomains = async () => {
    if (!searchTerm.trim()) {
      setError("Enter a name like “austin plumbing” or “austinplumbing.com”.");
      return;
    }
    setError("");
    setChecking(true);
    setResults([]);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", domain: searchTerm.trim() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Could not check availability. Please try again.");
      } else {
        setResults(j.results || []);
      }
    } catch (err: any) {
      setError("Could not check availability. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const buy = async (domain: string) => {
    setBuying(domain);
    setError("");
    setNotice("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/domains/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ domain, clientLabel }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Could not start checkout. Please try again.");
        return;
      }
      setNotice(`Starting checkout for ${j.domain} — complete payment to activate your domain.`);
      // Paddle hosted checkout → user returns and the domain shows as "Processing".
      if (j.url) {
        window.location.href = j.url;
      }
    } catch (err: any) {
      setError("Could not start checkout. Please try again.");
    } finally {
      setBuying(null);
    }
  };


  if (loading) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/50">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Custom Domain</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading…</p>
          </div>
        </div>
        <div className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  const ownedActiveCount = domains.filter((d) => d.status === "active" || d.status === "provisioning").length;
  const canAdd = eligible && ownedActiveCount < quota;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/50">
          <Globe className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">Custom Domain</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Your website, your own .com
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50"
          title="Refresh domain status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-2xl border border-red-100 text-sm font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-100 text-sm font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* ── Locked (Free / not eligible) ── */}
      {!eligible && (
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-base font-black text-slate-900 mb-1">
            Get your own custom domain
          </h4>
          <p className="text-sm text-slate-500 font-medium max-w-sm mb-5 leading-relaxed">
            Custom domains are included with <span className="font-black text-slate-700">Pro</span> and{" "}
            <span className="font-black text-slate-700">Growth</span> plans.{" "}
            <span className="font-black text-slate-700">Agency</span> gets one per client (up to 10).
            <span className="block mt-2">One-time $19 registration — auto-renews at the same price.</span>
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> View Pricing
          </Link>
        </div>
      )}


      {/* ── Owner state (has domains OR can add) ── */}
      {eligible && !adding && (
        <>
          {/* Existing domains */}
          {domains.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Your Domains
                  <span className="ml-2 text-[10px] text-slate-400 font-bold">
                    {ownedActiveCount}/{quota} used
                  </span>
                </h4>
              </div>
              {domains.map((d) => (
                <div key={d.id} className="p-5 rounded-2xl border border-slate-200/70 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`https://${d.domain_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-black text-emerald-700 hover:underline truncate inline-flex items-center gap-1.5"
                        >
                          {d.domain_name} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <StatusChip status={d.status} />
                      </div>
                      {d.client_label && (
                        <p className="text-xs text-slate-500 font-bold mt-0.5">
                          Client: {d.client_label}
                        </p>
                      )}
                      {d.status === "failed" && d.error && (
                        <p className="text-xs text-red-600 font-semibold mt-1">{d.error}</p>
                      )}
                    </div>
                    <span className="text-sm font-black text-slate-900 shrink-0">
                      {`$${d.price_paid || priceUsd}`}
                      <span className="text-[10px] text-slate-400 font-bold block text-right">
                        one-time
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
                    <span>
                      Registered: <span className="text-slate-900">{fmtDate(d.registered_at)}</span>
                    </span>
                    <span>
                      Renews: <span className="text-slate-900">{fmtDate(d.expires_at)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" /> Auto-renew ON
                    </span>
                  </div>

                  {/* Day-330 renewal heads-up (in-app echo of the WhatsApp notice) */}
                  {d.status === "active" && d.auto_renew && inRenewalWindow(d.expires_at) && (
                    <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-100 text-sm text-sky-900 font-semibold flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-sky-600" />
                      <span>
                        🔁 <span className="font-black">{d.domain_name}</span> renews automatically on{" "}
                        {fmtDate(d.expires_at)} — same $19 as registration. No surprise fees, nothing to do.
                      </span>
                    </div>
                  )}

                  {d.status === "provisioning" && (
                    <p className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Payment confirmed? Your domain registers automatically within ~2 minutes.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add another domain */}
          {canAdd ? (
            <button
              onClick={startAdding}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-sm font-black flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {domains.length === 0
                ? `Get your custom domain for $${priceUsd}`
                : plan === "agency"
                ? "Add a domain for another client (+$19)"
                : "Manage your custom domain"}
            </button>
          ) : eligible && domains.length > 0 ? (
            <p className="text-xs text-slate-400 font-bold text-center">
              {plan === "agency"
                ? `You've reached your Agency plan limit of ${quota} domains (one per client).`
                : "Your plan includes 1 custom domain."}
            </p>
          ) : null}
        </>
      )}


      {/* ── Add-domain flow ── */}
      {eligible && adding && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {plan === "agency" ? "Add a Client Domain" : "Claim Your Domain"}
            </h4>
            <button
              onClick={() => setAdding(false)}
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50"
              aria-label="Close domain search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            One-time <span className="font-black text-slate-900">{`$${priceUsd}`}</span> registration on Porkbun —
            your website is auto-generated and keeps updating with every post you make. Renewal is the same
            {`$${priceUsd}`}, automatic, and never surprises you.
          </p>

          {plan === "agency" && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Which client/trader is this domain for?
              </label>
              <input
                type="text"
                value={clientLabel}
                onChange={(e) => setClientLabel(e.target.value)}
                placeholder="e.g. Jake’s Plumbing — client #1"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Business name or desired domain
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkDomains()}
                placeholder="austin plumbing"
                className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 transition-colors"
              />
              <button
                onClick={checkDomains}
                disabled={checking}
                className="px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Check
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.domain}
                  className="p-4 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-base font-black text-slate-900 truncate">{r.domain}</p>
                    <p className="text-xs font-bold mt-0.5">
                      {r.available ? (
                        <span className="text-emerald-600">
                          ✓ Available{r.price ? ` · $${r.price}` : ""} · 1 year
                        </span>
                      ) : (
                        <span className="text-red-500">Not available</span>
                      )}
                    </p>
                  </div>
                  {r.available && r.buyable ? (
                    <button
                      onClick={() => buy(r.domain)}
                      disabled={buying === r.domain}
                      className="shrink-0 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {buying === r.domain ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {`Buy $${r.price || priceUsd}`}
                    </button>
                  ) : r.available ? (
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider shrink-0 border border-slate-200 px-2.5 py-1 rounded-full">
                      Coming soon
                    </span>
                  ) : null}
                </div>
              ))}
              <p className="text-[11px] text-slate-400 font-bold pt-1">
                Tip: your Neerzy website is auto-updated with every Google post you make — customers can find
                you instantly at your new domain. 🌐
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

