"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import WebsiteEditor from "@/components/dashboard/WebsiteEditor";
import {
  Globe,
  Loader2,
  Lock,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  CreditCard,
} from "lucide-react";

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Types
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type WebsiteRow = {
  id: string;
  domain_name: string | null;
  status: string;              // pending | building | live | paused
  setup_waived: boolean;
  setup_paid: boolean;
  hosting_status: string;      // none | trial | active | canceled
  free_until: string | null;
  preview_ready?: boolean;
  template_id?: string | null;
  content?: any;
  error?: string | null;
  created_at?: string | null;
};

type WebsiteState = {
  plan: string;
  eligible: boolean;
  hasActiveDomain: boolean;
  domainName: string | null;
  earlyAdopter: boolean;
  website: WebsiteRow | null;
  freeDaysLeft: number | null;
  needsSetupPayment: boolean;
  hostingUnpaid: boolean;
  prices: { setup: number; hosting: number };
};

async function fetchState(): Promise<WebsiteState | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/websites", {
    headers: { Authorization: `Bearer ${session?.access_token || ""}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as WebsiteState;
}

async function postAction(action: "start" | "checkout" | "build") {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/websites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify({ action }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

function scrollToDomains() {
  document.getElementById("custom-domain")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    building: "bg-amber-50 text-amber-800 border-amber-100",
    live: "bg-emerald-50 text-emerald-800 border-emerald-100",
    paused: "bg-red-50 text-red-700 border-red-100",
    pending: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const label: Record<string, string> = {
    building: "Building",
    live: "Live",
    paused: "Paused",
    pending: "Payment due",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider border ${map[status] || map.pending}`}>
      {status === "building" && <Loader2 className="w-3 h-3 animate-spin" />}
      {label[status] || status}
    </span>
  );
}

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WebsiteCtaButton — the 3rd button in the dashboard setup card
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function WebsiteCtaButton({ onOpen }: { onOpen: () => void }) {
  const [state, setState] = useState<WebsiteState | null>(null);

  useEffect(() => {
    fetchState().then(setState).catch(() => setState(null));
  }, []);

  if (!state) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2.5 px-6 py-4 bg-white/60 text-emerald-900/60 rounded-2xl text-sm font-black cursor-wait"
      >
        <Loader2 className="w-5 h-5 animate-spin" /> Website…
      </button>
    );
  }

  const site = state.website;
  const priceNote = state.earlyAdopter
    ? "Free for early adopters · $10/mo hosting after 90 days"
    : `$${state.prices.setup} setup + $${state.prices.hosting}/mo hosting`;

  // Already building / live / paused → status chip instead of a price card
  if (site) {
    return (
      <button
        onClick={onOpen}
        className="flex flex-col items-start gap-0.5 px-6 py-4 bg-white text-emerald-900 rounded-2xl text-sm font-black shadow-lg shadow-emerald-900/20 hover:bg-emerald-50 transition-all active:scale-95"
      >
        <span className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-emerald-600" /> Website: {site.status === "paused" ? "Paused" : site.status === "live" ? "Live" : "Building"}
        </span>
        <span className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wider">
          {site.hosting_status === "active"
            ? `Hosting active · $${state.prices.hosting}/mo`
            : state.freeDaysLeft !== null && state.freeDaysLeft >= 0
            ? `${state.freeDaysLeft} free hosting days left`
            : site.status === "paused"
            ? "Tap to reactivate hosting"
            : "Tap to manage"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="flex flex-col items-start gap-0.5 px-6 py-4 bg-white text-emerald-900 rounded-2xl text-sm font-black shadow-lg shadow-emerald-900/20 hover:bg-emerald-50 transition-all active:scale-95"
    >
      <span className="flex items-center gap-2.5">
        <Globe className="w-5 h-5 text-[#0F5C4D]" /> Build Website
      </span>
      <span className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wider">
        {priceNote}
      </span>
    </button>
  );
}

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WebsitePanel — Account tab card (next to DomainPanel)
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function WebsitePanel() {
  const [state, setState] = useState<WebsiteState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchState();
      if (s) setState(s);
      else setError("Could not load your website status.");
    } catch {
      setError("Could not load your website status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const start = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { ok, json } = await postAction("start");

      if (!ok) {
        if (json?.needsDomain) {
          setError("Buy your custom domain first — your website is built on it.");
        } else {
          setError(json?.error || "Could not start your website. Please try again.");
        }
        return;
      }

      if (json?.checkoutRequired) {
        // Latecomer → must pay $99 setup + $10/mo hosting before the build
        const pay = await postAction("checkout");
        if (pay.ok && pay.json?.url) {
          window.location.href = pay.json.url;
          return;
        }
        setError(pay.json?.error || "Could not start checkout. Please try again.");
        return;
      }

      setNotice(
        json?.earlyAdopter
          ? "🚧 Building your website… this usually takes about a minute."
          : "Building your website…"
      );
      await load();

      // Early adopters build immediately (no payment step). Latecomers were
      // already routed to checkout above.
      const built = await postAction("build");
      if (!built.ok) {
        setError(
          built.json?.error ||
            "We couldn't finish building your website. Tap “Try again” — nothing was lost."
        );
      } else {
        setNotice("🎉 Your website is ready! Preview it below or open your live link.");
      }
      await load();
    } catch {
      setError("Could not start your website. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const rebuild = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { ok, json } = await postAction("build");
      if (!ok) {
        setError(json?.error || "We couldn't build your website. Please try again.");
      } else {
        setNotice("🎉 Your website is ready! Preview it below or open your live link.");
      }
      await load();
    } catch {
      setError("We couldn't build your website. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { ok, json } = await postAction("checkout");
      if (ok && json?.url) {
        window.location.href = json.url;
        return;
      }
      if (ok && json?.alreadyActive) {
        setNotice("Hosting is already active ✅");
        await load();
        return;
      }
      setError(json?.error || "Could not start checkout. Please try again.");
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setBusy(false);
    }
  };


  // ── Loading ──
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/50">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Website</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading…</p>
          </div>
        </div>
        <div className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  const s = state;
  const site = s?.website || null;
  const setup = s?.prices.setup ?? 99;
  const hosting = s?.prices.hosting ?? 10;
  const freeDays = s?.freeDaysLeft ?? null;
  const freeEndingSoon = freeDays !== null && freeDays >= 0 && freeDays <= 7;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/50">
          <Globe className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">Website</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Built on your custom domain
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50"
          title="Refresh website status"
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

      {/* ── Locked: not on Pro/Growth/Agency ── */}
      {s && !s.eligible && (
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-base font-black text-slate-900 mb-1">Build your own website</h4>
          <p className="text-sm text-slate-500 font-medium max-w-sm mb-5 leading-relaxed">
            Websites are included with <span className="font-black text-slate-700">Pro</span> and{" "}
            <span className="font-black text-slate-700">Growth</span> (and{" "}
            <span className="font-black text-slate-700">Agency</span>). Early adopters get the{" "}
            {`$${setup}`} setup free — hosting then just {`$${hosting}/month`}.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> View Pricing
          </Link>
        </div>
      )}


      {/* ── Eligible but no domain yet: domain is the entry point ── */}
      {s && s.eligible && !s.hasActiveDomain && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200/70 space-y-3">
            <p className="text-sm font-black text-slate-900">① Get your custom domain</p>
            <p className="text-sm text-slate-500 font-medium">
              Your website is built on your own domain — that is what makes it yours.
              One-time {`$${19}`} registration.
            </p>
            <button
              onClick={scrollToDomains}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all active:scale-95"
            >
              <Globe className="w-4 h-4" /> Go to my domain
            </button>
          </div>
          <div className="p-5 rounded-2xl border border-dashed border-slate-200 opacity-60">
            <p className="text-sm font-black text-slate-400">② Build your website</p>
            <p className="text-xs text-slate-400 font-bold mt-1">
              Unlocks automatically once your domain is live.
            </p>
          </div>
        </div>
      )}

      {/* ── Eligible + domain, no website yet: the offer ── */}
      {s && s.eligible && s.hasActiveDomain && !site && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                  {s.earlyAdopter ? "Early adopter offer" : "Website setup"}
                </p>
                {s.earlyAdopter ? (
                  <p className="mt-1">
                    <span className="text-2xl font-black text-slate-400 line-through mr-2">
                      {`$${setup}`}
                    </span>
                    <span className="text-3xl font-black text-emerald-700">FREE</span>
                  </p>
                ) : (
                  <p className="mt-1 text-3xl font-black text-slate-900">{`$${setup}`}</p>
                )}
              </div>
              <Sparkles className="w-6 h-6 text-emerald-500 shrink-0" />
            </div>
            <ul className="mt-4 space-y-1.5 text-sm font-semibold text-slate-600">
              <li>🌐 Custom website built on {s.domainName || "your domain"}</li>
              <li>
                🔁 Hosting {`$${hosting}/month`}
                {s.earlyAdopter
                  ? " — free for your first 90 days, then $10/month"
                  : " — starts today"}
              </li>
              {s.earlyAdopter && (
                <li className="text-emerald-700 font-black">
                  🎉 $99 setup fee waived forever (early adopter)
                </li>
              )}
            </ul>
          </div>

          <button
            onClick={start}
            disabled={busy}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {s.earlyAdopter ? "Build my website — Free" : `Pay ${`$${setup}`} + ${`$${hosting}`}/mo & build`}
          </button>
        </div>
      )}


      {/* ── Website exists: status + hosting/payment state ── */}
      {s && site && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {site.domain_name && (
                    <a
                      href={`https://${site.domain_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-black text-emerald-700 hover:underline truncate inline-flex items-center gap-1.5"
                    >
                      {site.domain_name} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <StatusBadge status={site.status} />
                </div>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  {site.status === "building"
                    ? "We're building your website — it will appear on your domain shortly."
                    : site.status === "live"
                    ? "Your website is live."
                    : "Your website is paused until hosting is reactivated."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
              <span>
                Setup:{" "}
                <span className="text-slate-900">
                  {site.setup_waived
                    ? `${`$${setup}`} waived (early adopter)`
                    : site.setup_paid
                    ? `${`$${setup}`} paid`
                    : `${`$${setup}`} due`}
                </span>
              </span>
              <span>
                Hosting:{" "}
                <span className={site.hosting_status === "active" ? "text-emerald-700" : "text-slate-900"}>
                  {site.hosting_status === "active"
                    ? `${`$${hosting}/month`} — active`
                    : site.hosting_status === "canceled"
                    ? "canceled"
                    : site.hosting_status === "trial"
                    ? freeDays !== null && freeDays >= 0
                      ? `free — ${freeDays} day${freeDays === 1 ? "" : "s"} left`
                      : "free period ended"
                    : "not started"}
                </span>
              </span>
            </div>
          </div>

          {/* Actions: preview · live · rebuild */}
          <div className="flex flex-wrap gap-3">
            {site.preview_ready ? (
              <a
                href={`/site/preview/${site.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all active:scale-95"
              >
                👀 Preview
              </a>
            ) : (
              <button
                onClick={rebuild}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {busy ? "Building…" : "Build my website"}
              </button>
            )}

            {site.domain_name && site.status === "live" && (
              <a
                href={`https://${site.domain_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:border-emerald-300 hover:text-emerald-800 transition-all active:scale-95"
              >
                🌐 View live site
              </a>
            )}

            {site.preview_ready && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all active:scale-95"
              >
                ✏️ Edit website
              </button>
            )}

            {site.preview_ready && (
              <button
                onClick={rebuild}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-3 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                🔄 Try again
              </button>
            )}
          </div>

          {/* Hosting ending soon (early adopter, 7 days left) */}
          {site.hosting_status === "trial" && freeEndingSoon && (
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-sm text-sky-900 font-semibold flex items-start gap-3">
              <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-sky-600" />
              <div>
                <p>
                  Your free hosting ends in <span className="font-black">{freeDays} day{freeDays === 1 ? "" : "s"}</span>.
                  Keep your website live for just {`$${hosting}/month`} — your {`$${setup}`} setup fee stays waived.
                </p>
                <button
                  onClick={pay}
                  disabled={busy}
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-black hover:bg-sky-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  {`Pay $${hosting}/month hosting`}
                </button>
              </div>
            </div>
          )}

          {/* Website paused or hosting unpaid → reactivate */}
          {(site.status === "paused" || s.hostingUnpaid) && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-900 font-semibold flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p>
                  Reactivate hosting for {`$${hosting}/month`} to bring your website back online.
                  Your content is saved — nothing is lost.
                </p>
                <button
                  onClick={pay}
                  disabled={busy}
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  {`Reactivate — $${hosting}/month`}
                </button>
              </div>
            </div>
          )}

          {/* Latecomer awaiting setup payment */}
          {s.needsSetupPayment && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-700 font-semibold">
              <p>
                Complete payment ({`$${setup}`} setup + {`$${hosting}/month`} hosting) to start the build.
              </p>
              <button
                onClick={pay}
                disabled={busy}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Complete payment
              </button>
            </div>
          )}
        </div>
      )}
      {/* ── "Make it yours" editor modal ── */}
      {editing && site && (
        <WebsiteEditor
          siteId={site.id}
          initialContent={site.content || {}}
          onClose={() => setEditing(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

