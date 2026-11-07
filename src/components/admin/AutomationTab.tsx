// src/components/admin/AutomationTab.tsx
// Admin -> Automation: the switches and the queue behind the daily email
// sequences (Phase 1 of lead automation).
//
// The tab is a window on three things and can change two of them:
//   - agent_settings: the global pause switch and the daily send cap,
//   - message_queue: what is owed, what went out, what failed,
//   - the plans (lib/automation/sequences.ts), read-only.
//
// "Run now" calls the exact same drainQueue() the nightly cron uses, so a button
// here can never behave differently from the scheduled run. The dry run button
// sits next to it on purpose: rehearse, look at the outcomes, then send.
//
// "Send a test email" renders one template with a fixed fake lead and mails it to
// the admin, so the copy can be read in a real inbox BEFORE the pause is lifted.
// It writes no queue row and touches no lead - see send_test in
// app/api/admin/automation/route.ts.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  Trash2,
  Zap,
} from "lucide-react";
import { adminFetch, qs } from "@/components/admin/api";
import { KpiCard, PaginationBar, Spinner, EmptyState, fmtDateTime } from "@/components/admin/ui";
import type {
  AutomationOverview,
  AutomationQueueRow,
  AutomationStats,
} from "@/lib/admin-types";

/** The subset of DrainResult this tab renders (see lib/automation/drain.ts). */
interface RunResult {
  ok: boolean;
  dryRun: boolean;
  paused: boolean;
  cap: number;
  sentToday: number;
  remaining: number;
  reclaimed: number;
  claimed: number;
  sent: number;
  skipped: number;
  cancelled: number;
  failed: number;
  retried: number;
  backlog: boolean;
  notes: string[];
  error?: string;
  outcomes?: Array<{ id: string; stepKey: string; kind: string; action: string; reason?: string }>;
}

const STATUS_FILTERS = ["pending", "sent", "failed", "cancelled", "skipped", "sending"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-white text-[#B45309] border border-[#FCD34D]",
  sending: "bg-white text-[#1D4ED8] border border-[#93C5FD]",
  sent: "bg-[#E6F2EA] text-[#0F5132]",
  skipped: "bg-[#F7F9F8] text-[#5B6B64]",
  cancelled: "bg-[#F7F9F8] text-[#5B6B64]",
  failed: "bg-[#FDECEC] text-[#9B1C1C]",
};

const SEGMENT_CLS: Record<string, string> = {
  hot: "bg-[#FDECEC] text-[#9B1C1C]",
  warm: "bg-[#FFF7E6] text-[#8A5A00]",
  cold: "bg-[#F7F9F8] text-[#5B6B64]",
};

const HEADING_CLS = "text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]";

/** Badge for one queue row status. */
function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
        STATUS_STYLES[status] || STATUS_STYLES.skipped
      }`}
    >
      {status}
    </span>
  );
}

export default function AutomationTab() {
  const [data, setData] = useState<AutomationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [capDraft, setCapDraft] = useState("");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [testStep, setTestStep] = useState("hot_d1");
  const [testTo, setTestTo] = useState("");

  const pageSize = 25;

  const load = useCallback(
    async (status: StatusFilter = statusFilter) => {
      setLoading(true);
      setError("");
      try {
        const overview = await adminFetch<AutomationOverview>(
          "/api/admin/automation" + qs({ status, limit: 100 })
        );
        setData(overview);
        setCapDraft(String(overview.settings.daily_send_cap));
      } catch (e: any) {
        setError(e?.message || "Failed to load automation");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    void load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  /** One POST, then a reload so every number on the page stays truthful. */
  const act = async (
    key: string,
    payload: Record<string, unknown>,
    successMessage?: string
  ): Promise<any | null> => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const result = await adminFetch<any>("/api/admin/automation", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (successMessage) setNotice(successMessage);
      await load(statusFilter);
      return result;
    } catch (e: any) {
      setError(e?.message || "Action failed");
      return null;
    } finally {
      setBusy("");
    }
  };

  const togglePause = async () => {
    if (!data) return;
    const next = !data.settings.automation_paused;
    await act(
      "pause",
      { action: "update_settings", automation_paused: next },
      next ? "Automation paused - the cron will not send." : "Automation resumed."
    );
  };

  const saveCap = async () => {
    const cap = Number(capDraft);
    if (!Number.isFinite(cap) || cap < 0) {
      setError("Daily cap must be a positive number.");
      return;
    }
    await act("cap", { action: "update_settings", daily_send_cap: Math.trunc(cap) }, "Daily cap updated.");
  };

  const runNow = async (dryRun: boolean) => {
    setBusy(dryRun ? "dryRun" : "run");
    setError("");
    setNotice("");
    setRunResult(null);
    try {
      const result = await adminFetch<RunResult>("/api/admin/automation", {
        method: "POST",
        body: JSON.stringify({ action: "run_now", dryRun, limit: 25 }),
      });
      setRunResult(result);
      if (!result.ok && result.error) setError(result.error);
      await load(statusFilter);
    } catch (e: any) {
      setError(e?.message || "Run failed");
    } finally {
      setBusy("");
    }
  };

  const cancelRow = async (id: string) => {
    await act("row:" + id, { action: "cancel_row", id }, "Queued email cancelled.");
  };

  const requeueFailed = async () => {
    const result = await act("requeue", { action: "requeue_failed" }, undefined);
    if (result) setNotice(`${result.requeued} failed email(s) queued for another attempt.`);
  };

  /**
   * Send one template to the admin's own inbox. Deliberately does NOT reload the
   * page: a test writes no queue row, so nothing on screen can have changed - and
   * the server's message (sent vs dry run) is the whole point of the button.
   */
  const sendTest = async () => {
    setBusy("test");
    setError("");
    setNotice("");
    try {
      const result = await adminFetch<{ message?: string }>("/api/admin/automation", {
        method: "POST",
        body: JSON.stringify({ action: "send_test", stepKey: testStep, to: testTo }),
      });
      setNotice(result?.message || "Test email sent.");
    } catch (e: any) {
      setError(e?.message || "Test send failed");
    } finally {
      setBusy("");
    }
  };

  const stats: AutomationStats =
    data?.stats || {
      pending: 0,
      sending: 0,
      sentToday: 0,
      sent: 0,
      skipped: 0,
      cancelled: 0,
      failed: 0,
      dueNow: 0,
    };
  const settings = data?.settings;
  const queue: AutomationQueueRow[] = data?.queue || [];
  const paged = queue.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(queue.length / pageSize));

  /** Every step in every plan, deduped, plus the transactional audit report. */
  const testTemplates: Array<{ key: string; label: string }> = (() => {
    const seen = new Set<string>();
    const list: Array<{ key: string; label: string }> = [];
    for (const plan of data?.plans || []) {
      for (const step of plan.steps) {
        if (seen.has(step.key)) continue;
        seen.add(step.key);
        list.push({
          key: step.key,
          label: `${plan.segment} · day ${step.day} · ${step.label}`,
        });
      }
    }
    list.push({ key: "audit_report", label: "audit report (transactional, not a sequence step)" });
    return list;
  })();
  const cap = settings?.daily_send_cap || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E22]">Automation</h1>
          <p className="text-sm font-normal text-[#5B6B64]">
            Consent-gated email sequences. The cron drains this queue once a day at 10:00 UTC.
          </p>
        </div>
        <button
          onClick={() => void load(statusFilter)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Migration missing / global warnings */}
      {data && !data.tablesReady && (
        <div className="flex items-start gap-2 rounded-xl border border-[#FCD34D] bg-[#FFF7E6] p-3">
          <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <p className="text-xs font-normal text-[#8A5A00]">
            Automation tables are missing on this environment. Apply{" "}
            <code className="font-mono">supabase/migrations/20261107_message_queue.sql</code> before
            sending anything.
          </p>
        </div>
      )}
      {data && !data.reviewLinkConfigured && (
        <div className="flex items-start gap-2 rounded-xl border border-[#E1E8E4] bg-[#F7F9F8] p-3">
          <ShieldAlert className="w-4 h-4 text-[#5B6B64] shrink-0 mt-0.5" />
          <p className="text-xs font-normal text-[#5B6B64]">
            No review URL configured (<code className="font-mono">NEERZY_REVIEW_URL</code>), so the day-5
            review ask is skipped instead of linking somewhere random.
          </p>
        </div>
      )}
      {settings?.automation_paused && (
        <div className="flex items-start gap-2 rounded-xl border border-[#FCA5A5] bg-[#FDECEC] p-3">
          <AlertTriangle className="w-4 h-4 text-[#9B1C1C] shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-[#9B1C1C]">
            Automation is PAUSED - the queue is frozen and nothing will be sent.
          </p>
        </div>
      )}

      {error && <p className="text-xs font-bold text-[#9B1C1C]">{error}</p>}
      {notice && <p className="text-xs font-bold text-[#0F5132]">{notice}</p>}

      {loading && !data && <Spinner label="Loading automation..." />}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Due now"
              value={stats.dueNow}
              sub={`${stats.pending} pending in total`}
              icon={<Clock className="w-5 h-5 text-[#0F5132]" />}
            />
            <KpiCard
              label="Sent today"
              value={`${stats.sentToday}/${cap}`}
              sub="daily cap (UTC)"
              icon={<Send className="w-5 h-5 text-[#0F5132]" />}
              accent={cap > 0 && stats.sentToday >= cap ? "text-[#9B1C1C]" : "text-[#0A2E22]"}
            />
            <KpiCard
              label="Sent all time"
              value={stats.sent}
              sub={`${stats.cancelled} cancelled`}
              icon={<CheckCircle2 className="w-5 h-5 text-[#0F5132]" />}
            />
            <KpiCard
              label="Failed"
              value={stats.failed}
              sub={`${stats.skipped} skipped · ${stats.sending} in flight`}
              icon={<AlertTriangle className="w-5 h-5 text-[#0F5132]" />}
              accent={stats.failed > 0 ? "text-[#9B1C1C]" : "text-[#0A2E22]"}
            />
          </div>

          {/* Switches */}
          <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white">
            <CardContent className="p-5 space-y-4">
              <h2 className={HEADING_CLS}>Controls</h2>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#0A2E22]">Automation</p>
                  <p className="text-xs font-normal text-[#5B6B64]">
                    {settings?.automation_paused
                      ? "Paused - the cron exits without sending."
                      : "Running - the cron sends whatever is due, up to the cap."}
                  </p>
                </div>
                <button
                  onClick={() => void togglePause()}
                  disabled={busy === "pause" || !data.tablesReady}
                  className={`text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50 ${
                    settings?.automation_paused
                      ? "bg-[#22C55E] text-white hover:bg-[#16A34A]"
                      : "border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8]"
                  }`}
                >
                  {settings?.automation_paused ? "Resume sending" : "Pause sending"}
                </button>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3 pt-3 border-t border-[#E1E8E4]">
                <div>
                  <p className="text-sm font-bold text-[#0A2E22]">Daily send cap</p>
                  <p className="text-xs font-normal text-[#5B6B64]">
                    Hard limit per UTC day, manual runs included. Keep it low while the domain warms up.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={capDraft}
                    onChange={(e) => setCapDraft(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
                  />
                  <button
                    onClick={() => void saveCap()}
                    disabled={busy === "cap" || capDraft === String(cap)}
                    className="text-xs font-bold px-3 py-2 rounded-lg bg-[#22C55E] text-white hover:bg-[#0F5132] disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E1E8E4]">
                <button
                  onClick={() => void runNow(true)}
                  disabled={busy !== "" || !data.tablesReady}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" /> Dry run
                </button>
                <button
                  onClick={() => void runNow(false)}
                  disabled={busy !== "" || !data.tablesReady || settings?.automation_paused}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#22C55E] text-white hover:bg-[#16A34A] disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> {busy === "run" ? "Sending..." : "Run now"}
                </button>
                <button
                  onClick={() => void requeueFailed()}
                  disabled={busy !== "" || !data.tablesReady || stats.failed === 0}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Requeue failed
                </button>
                <span className="text-[11px] font-normal text-[#9DB4A9]">
                  A dry run evaluates every guard and sends nothing - claimed rows go back to pending
                  for the real run.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Test email - reads the copy in a real inbox before anything is live */}
          <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white">
            <CardContent className="p-5 space-y-3">
              <h2 className={HEADING_CLS}>Send a test email</h2>
              <p className="text-xs font-normal text-[#5B6B64]">
                Renders one template with sample data (Sample Plumbing Co - score 62, 213 reviews, no
                website) and mails it to you. No lead is touched, nothing is queued, one-click
                unsubscribe included. Capped at 10 per hour.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={testStep}
                  onChange={(e) => setTestStep(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E1E8E4] text-xs font-normal bg-white outline-none focus:border-[#22C55E]"
                >
                  {testTemplates.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="Send to (defaults to the admin address)"
                  className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-[#E1E8E4] text-xs font-normal outline-none focus:border-[#22C55E]"
                />
                <button
                  onClick={() => void sendTest()}
                  disabled={busy !== ""}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />{" "}
                  {busy === "test" ? "Sending..." : "Send test email"}
                </button>
              </div>
              <p className="text-[11px] font-normal text-[#9DB4A9]">
                The subject is prefixed with [TEST], and the unsubscribe link in the footer is built for
                a placeholder address - clicking it can never suppress a real inbox.
              </p>
            </CardContent>
          </Card>

          {/* Result of the last manual run */}
          {runResult && (
            <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className={HEADING_CLS}>
                    {runResult.dryRun ? "Dry run result" : "Run result"}
                  </h2>
                  <span className="text-[11px] font-normal text-[#9DB4A9]">
                    cap {runResult.cap} · sent today {runResult.sentToday} · remaining{" "}
                    {runResult.remaining}
                    {runResult.reclaimed > 0 ? ` · reclaimed ${runResult.reclaimed}` : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="px-2 py-1 rounded-lg bg-[#E6F2EA] text-[#0F5132]">
                    sent {runResult.sent}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[#F7F9F8] text-[#5B6B64]">
                    skipped {runResult.skipped}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[#F7F9F8] text-[#5B6B64]">
                    cancelled {runResult.cancelled}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[#FDECEC] text-[#9B1C1C]">
                    failed {runResult.failed}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[#FFF7E6] text-[#8A5A00]">
                    retry {runResult.retried}
                  </span>
                </div>
                {runResult.paused && (
                  <p className="text-xs font-bold text-[#9B1C1C]">
                    Automation is paused - the run exited before touching the queue.
                  </p>
                )}
                {runResult.backlog && (
                  <p className="text-xs font-normal text-[#8A5A00]">
                    More rows are due than this run handled - run again to continue.
                  </p>
                )}
                {runResult.notes.length > 0 && (
                  <ul className="space-y-1">
                    {runResult.notes.map((note, i) => (
                      <li key={i} className="text-[11px] font-normal text-[#5B6B64]">
                        · {note}
                      </li>
                    ))}
                  </ul>
                )}
                {(runResult.outcomes || []).length > 0 && (
                  <ul className="divide-y divide-[#E1E8E4] border border-[#E1E8E4] rounded-xl overflow-hidden">
                    {(runResult.outcomes || []).slice(0, 25).map((o) => (
                      <li key={o.id + o.action} className="flex items-start gap-2 px-3 py-2 bg-white">
                        <StatusPill status={o.action.replace("would_", "")} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0A2E22]">{o.stepKey}</p>
                          {o.reason && (
                            <p className="text-[11px] font-normal text-[#5B6B64] break-words">
                              {o.reason}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Plans (read-only) */}
          <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white">
            <CardContent className="p-5 space-y-3">
              <h2 className={HEADING_CLS}>Plans</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {data.plans.map((plan) => (
                  <div key={plan.segment} className="rounded-xl border border-[#E1E8E4] p-3">
                    <span
                      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        SEGMENT_CLS[plan.segment] || SEGMENT_CLS.cold
                      }`}
                    >
                      {plan.segment}
                    </span>
                    <ul className="mt-2 space-y-1">
                      {plan.steps.map((step) => (
                        <li key={step.key} className="text-xs font-normal text-[#0A2E22]">
                          <span className="font-bold">Day {step.day}</span> · {step.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-normal text-[#5B6B64]">
                Every step - the review ask included - is automated marketing mail, so every step needs
                an active marketing opt-in and is checked against the unsubscribe list. A lead without
                consent is not enrolled at all; converted, trial and lost leads never are. Without a
                website on file the two website-offer steps are skipped instead of being sent.
              </p>
            </CardContent>
          </Card>

          {/* Queue */}
          <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white">
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className={HEADING_CLS}>Queue</h2>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTERS.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setPage(1);
                        setStatusFilter(status);
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize ${
                        statusFilter === status
                          ? "bg-[#0B3D2E] text-white"
                          : "border border-[#E1E8E4] bg-white text-[#5B6B64] hover:bg-[#F7F9F8]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {queue.length === 0 ? (
                <EmptyState
                  message={
                    data.tablesReady
                      ? `No ${statusFilter} emails in the queue.`
                      : "The message_queue table does not exist yet - apply the migration."
                  }
                />
              ) : (
                <ul className="divide-y divide-[#E1E8E4] border border-[#E1E8E4] rounded-xl overflow-hidden">
                  {paged.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 bg-white"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusPill status={row.status} />
                          <span className="text-xs font-bold text-[#0A2E22] truncate">
                            {row.business_name || row.email}
                          </span>
                          <span
                            className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              SEGMENT_CLS[row.segment] || SEGMENT_CLS.cold
                            }`}
                          >
                            {row.segment}
                          </span>
                          {row.kind === "review" && (
                            <span className="text-[10px] font-bold uppercase text-[#0F5132]">
                              service
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-normal text-[#5B6B64] mt-0.5">
                          {row.step_label} · {row.email}
                        </p>
                        <p className="text-[10px] font-normal text-[#9DB4A9]">
                          {row.status === "sent"
                            ? `sent ${fmtDateTime(row.sent_at)}`
                            : `due ${fmtDateTime(row.run_at)}`}
                          {row.attempts > 0 ? ` · ${row.attempts} attempt(s)` : ""}
                          {row.lead_status ? ` · lead ${row.lead_status}` : ""}
                          {row.last_error ? ` · ${row.last_error}` : ""}
                        </p>
                      </div>
                      {row.status === "pending" && (
                        <button
                          onClick={() => void cancelRow(row.id)}
                          disabled={busy !== ""}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] text-[#9B1C1C] disabled:opacity-50 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {queue.length > pageSize && (
                <PaginationBar
                  page={Math.min(page, totalPages)}
                  pageSize={pageSize}
                  total={queue.length}
                  onChange={setPage}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
