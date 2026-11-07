// src/components/admin/LeadDrawer.tsx
// Right-side detail drawer for one lead (opened by clicking a row in LeadsTab).
// Full lead record + quick contact actions + GBP audit summary + a manual
// review checklist + an append-only activity timeline. Data comes from
// GET /api/admin/leads/[id]; actions POST to the same route, and list-side
// fields (status, last contacted) sync back through onUpdated() so the table
// row stays fresh without a page reload - filters and pagination untouched.
"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  PauseCircle,
  Phone,
  Send,
  StickyNote,
  X,
} from "lucide-react";
import { adminFetch } from "@/components/admin/api";
import { EmptyState, PriorityBadge, SourceBadge, Spinner, fmtDateTime } from "@/components/admin/ui";
import type { AdminLead, LeadDetail } from "@/lib/admin-types";

const STATUSES = ["new", "contacted", "trial_started", "converted", "lost"];

/** Manual pre-outreach checklist - each tick is stored as a 'reviewed' activity row. */
const CHECKLIST = [
  "Profile reviewed",
  "Website checked",
  "Number verified on WhatsApp",
  "Contacted",
];

type IconComponent = ComponentType<{ className?: string }>;

const ACTIVITY_META: Record<string, { Icon: IconComponent; label: string }> = {
  note: { Icon: StickyNote, label: "Internal note" },
  contacted_whatsapp: { Icon: MessageCircle, label: "Contacted on WhatsApp" },
  contacted_email: { Icon: Mail, label: "Contacted by email" },
  called: { Icon: Phone, label: "Called" },
  status_change: { Icon: ArrowRightLeft, label: "Status changed" },
  reviewed: { Icon: CheckCircle2, label: "Review check" },
  // Written by lib/automation/* (created_by: "automation" | "admin").
  automation_enrolled: { Icon: Send, label: "Sequence enrolled" },
  automation_sent: { Icon: Send, label: "Sequence email sent" },
  automation_failed: { Icon: AlertTriangle, label: "Sequence email failed" },
  automation_cancelled: { Icon: X, label: "Sequence cancelled" },
  automation_pause_changed: { Icon: PauseCircle, label: "Marketing paused/resumed" },
};

const HEADING_CLS = "text-[11px] font-bold uppercase tracking-wider text-[#5B6B64]";
const QUICK_CLS =
  "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-[#E1E8E4] bg-white text-[#0F5132] hover:border-[#22C55E] hover:bg-[#F7F9F8]";

type WhatsAppInfo = { href: string; warning?: undefined } | { href?: undefined; warning: string };

/**
 * wa.me only accepts FULL international numbers, but leads store phones in
 * every local format. Since 20261106_consent_suppression.sql the capture code
 * also stores `phone_e164` (lib/phone.ts), which is exactly what wa.me wants -
 * LeadDrawer passes that first and falls back to this heuristic when the raw
 * number could not be parsed.
 *
 * Heuristic (documented assumption):
 *   +... / 00...                  -> country code already present, use as-is
 *   0 + 7XXXXXXXXX (11 digits)    -> UK mobile  -> 44...
 *   0 + 3XXXXXXXXX (11 digits)    -> Pakistani mobile -> 92... (UK 0300
 *                                    non-geographic numbers are not WhatsApp
 *                                    numbers, so the collision is harmless)
 *   NN + 9XXXXXXXX (11 digits)    -> Brazilian mobile (area code + 9 digits
 *                                    starting with 9) -> 55...
 *   anything else starting with 0 -> landline / unknown country: no auto link,
 *                                    show a "check number format" warning
 *   anything else                 -> assume the country code is included
 */
export function whatsappInfo(phone: string | null | undefined): WhatsAppInfo {
  const raw = String(phone || "").trim();
  if (!raw) return { warning: "No phone number on this lead." };
  let digits = raw.replace(/\D/g, "");
  if (!digits) return { warning: "No usable digits in the phone number." };
  const international = raw.includes("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (international) return { href: "https://wa.me/" + digits };
  if (digits.startsWith("0")) {
    const rest = digits.slice(1);
    if (digits.length === 11 && rest.startsWith("7")) return { href: "https://wa.me/44" + rest };
    if (digits.length === 11 && rest.startsWith("3")) return { href: "https://wa.me/92" + rest };
    return {
      warning:
        "Landline or unknown country - WhatsApp needs the full international number. Check the number format before messaging.",
    };
  }
  if (/^[1-9]\d9\d{8}$/.test(digits)) return { href: "https://wa.me/55" + digits };
  return { href: "https://wa.me/" + digits };
}

function websiteHref(website: string | null | undefined): string | null {
  const w = String(website || "").trim();
  if (!w) return null;
  return /^https?:\/\//i.test(w) ? w : "https://" + w;
}

interface LeadDrawerProps {
  leadId: string;
  /** Bumped by LeadsTab when something outside the drawer changed the lead (e.g. a follow-up email was sent). */
  refreshKey: number;
  onClose: () => void;
  /** Patches the matching row in the LeadsTab list (status, last contacted) without reloading the list. */
  onUpdated: (patch: Partial<AdminLead>) => void;
  /** Opens the existing FollowupModal (owned by LeadsTab) for this lead. */
  onOpenFollowup: (lead: AdminLead) => void;
}

export default function LeadDrawer({
  leadId,
  refreshKey,
  onClose,
  onUpdated,
  onOpenFollowup,
}: LeadDrawerProps) {
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingTest, setSavingTest] = useState(false);

  // Esc closes the drawer; on close, focus returns to the table row that opened it.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!returnFocusRef.current) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
    }
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const el = returnFocusRef.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, []);

  const load = useCallback(async () => {
    try {
      setDetail(await adminFetch<LeadDetail>("/api/admin/leads/" + leadId));
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load lead");
    }
  }, [leadId]);

  // Reloads when the lead id changes or LeadsTab bumps refreshKey (e.g. a
  // follow-up email was sent from the drawer).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load, refreshKey]);

  /** POSTs one activity action to /api/admin/leads/[id] and refreshes the drawer. */
  const act = useCallback(
    async (payload: Record<string, unknown>): Promise<boolean> => {
      setBusy(true);
      setActionError("");
      try {
        await adminFetch("/api/admin/leads/" + leadId, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await load();
        return true;
      } catch (e: any) {
        setActionError(e?.message || "Action failed");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [leadId, load]
  );

  const saveNote = async () => {
    const text = note.trim();
    if (!text || savingNote || busy) return;
    setSavingNote(true);
    if (await act({ action: "add_note", body: text })) setNote("");
    setSavingNote(false);
  };

  // The status update itself keeps going through the existing /api/admin/leads
  // route; the drawer only LOGS the change on the timeline.
  const changeStatus = async (status: string) => {
    const lead = detail?.lead;
    if (!lead || status === lead.status || busy) return;
    setBusy(true);
    setActionError("");
    try {
      await adminFetch("/api/admin/leads", {
        method: "POST",
        body: JSON.stringify({ action: "update", id: lead.id, status }),
      });
      onUpdated({ status: status as AdminLead["status"] });
      try {
        await adminFetch("/api/admin/leads/" + lead.id, {
          method: "POST",
          body: JSON.stringify({ action: "log_status_change", from: lead.status, to: status }),
        });
      } catch {
        // Timeline logging is best effort - never block the status update.
      }
      await load();
    } catch (e: any) {
      setActionError(e?.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const logContact = async (channel: "whatsapp" | "call") => {
    if (await act({ action: "log_contact", channel })) {
      onUpdated({ last_contacted_at: new Date().toISOString() });
    }
  };

  const tickCheck = async (label: string) => {
    if (!busy) await act({ action: "mark_reviewed", body: label });
  };

  /**
   * Flags the lead as an internal test lead (20261108_leads_is_test.sql).
   * Display-only: LeadsTab hides these by default, but the automation keeps
   * enrolling and mailing them exactly like any other lead.
   */
  const toggleTestLead = async (next: boolean) => {
    const current = detail?.lead;
    if (!current || savingTest) return;
    setSavingTest(true);
    setActionError("");
    try {
      await adminFetch("/api/admin/leads", {
        method: "POST",
        body: JSON.stringify({ action: "update", id: current.id, is_test: next }),
      });
      onUpdated({ is_test: next });
      await load();
    } catch (e: any) {
      setActionError(e?.message || "Failed to update the test flag");
    } finally {
      setSavingTest(false);
    }
  };

  const lead = detail?.lead ?? null;
  const activity = detail?.activity ?? [];
  const automation = detail?.automation ?? null;
  const queuedRows = (automation?.queue || []).filter((row) => row.status === "pending");
  const sentRows = (automation?.queue || []).filter((row) => row.status === "sent");
  const doneChecks = new Set(
    activity.filter((a) => a.type === "reviewed" && a.body).map((a) => a.body as string)
  );
  // Prefer the normalized E.164 number (whatsappInfo() then takes the
  // "international" branch); fall back to the raw phone + the landline warning.
  const wa = lead ? whatsappInfo(lead.phone_e164 || lead.phone) : null;
  const websiteLink = lead ? websiteHref(lead.website) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-[#0B3D2E]/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Lead details"
        className="relative h-full w-full max-w-xl bg-white shadow-2xl flex flex-col"
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E1E8E4] bg-white shrink-0">
          {lead && (
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#0A2E22] truncate">
                {lead.business_name || lead.name || "Unnamed lead"}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <PriorityBadge priority={lead.priority} />
                <SourceBadge source={lead.source} />
                {typeof lead.audit_score === "number" && (
                  <span
                    className={
                      "inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full " +
                      (lead.audit_score >= 80
                        ? "bg-[#E6F2EA] text-[#0F5132]"
                        : lead.audit_score >= 50
                        ? "bg-[#FFF7E6] text-[#8A5A00]"
                        : "bg-[#FDECEC] text-[#9B1C1C]")
                    }
                  >
                    {lead.audit_score}/100 audit
                  </span>
                )}
              </div>
              <label className="flex items-center gap-2 mt-2 text-[11px] font-bold uppercase tracking-wider text-[#5B6B64] cursor-pointer">
                <input
                  type="checkbox"
                  checked={lead.is_test === true}
                  disabled={busy || savingTest}
                  onChange={(e) => void toggleTestLead(e.target.checked)}
                  className="w-4 h-4 accent-[#22C55E]"
                />
                Test lead
              </label>
            </div>
          )}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close lead details"
            className="p-2 rounded-lg hover:bg-[#E6F2EA] shrink-0"
          >
            <X className="w-5 h-5 text-[#5B6B64]" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading && !lead && <Spinner label="Loading lead..." />}
          {error && !lead && <EmptyState message={error} />}
          {error && lead && <p className="text-xs font-bold text-[#9B1C1C]">{error}</p>}

          {lead && wa && (
            <>
              {/* Contact + quick actions */}
              <section className="space-y-2">
                <h3 className={HEADING_CLS}>Contact</h3>
                <div className="rounded-xl border border-[#E1E8E4] p-3 space-y-2">
                  <p className="text-sm font-normal text-[#0A2E22]">
                    <span className="font-bold">Phone:</span> {lead.phone || "-"}
                  </p>
                  <p className="text-sm font-normal text-[#0A2E22]">
                    <span className="font-bold">Email:</span> {lead.email || "-"}
                  </p>
                  {lead.last_contacted_at && (
                    <p className="text-[11px] font-normal text-[#5B6B64]">
                      Last contacted: {fmtDateTime(lead.last_contacted_at)}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {wa.href ? (
                      <a
                        href={wa.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={QUICK_CLS}
                        onClick={() => void logContact("whatsapp")}
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    ) : (
                      <span
                        title={wa.warning}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-[#FDECEC] text-[#9B1C1C]"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Check number format
                      </span>
                    )}
                    <button type="button" onClick={() => onOpenFollowup(lead)} className={QUICK_CLS}>
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    {lead.phone && (
                      <a
                        href={"tel:" + lead.phone.replace(/[^0-9+]/g, "")}
                        className={QUICK_CLS}
                        onClick={() => void logContact("call")}
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                  </div>
                  {!wa.href && (
                    <p className="text-[11px] font-normal text-[#8A5A00]">{wa.warning}</p>
                  )}
                </div>
              </section>
              {/* Audit summary - the GBP signals collected by the audit run */}
              <section className="space-y-2">
                <h3 className={HEADING_CLS}>Audit summary</h3>
                <div className="rounded-xl border border-[#E1E8E4] p-3 space-y-2 text-sm font-normal text-[#0A2E22]">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <p>
                      <span className="font-bold">Score:</span>{" "}
                      {typeof lead.audit_score === "number" ? lead.audit_score + "/100" : "-"}
                    </p>
                    <p>
                      <span className="font-bold">Rating:</span>{" "}
                      {typeof lead.rating === "number" ? String(lead.rating) : "-"}
                    </p>
                    <p>
                      <span className="font-bold">Reviews:</span>{" "}
                      {typeof lead.reviewCount === "number" ? String(lead.reviewCount) : "-"}
                    </p>
                    <p>
                      <span className="font-bold">Category:</span> {lead.service_type || "-"}
                    </p>
                  </div>
                  <p className="break-all">
                    <span className="font-bold">Website:</span>{" "}
                    {websiteLink ? (
                      <a
                        href={websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0F5132] hover:underline"
                      >
                        {lead.website}
                      </a>
                    ) : lead.hasWebsite === false ? (
                      <span className="text-[#9B1C1C]">No website</span>
                    ) : (
                      "-"
                    )}
                  </p>
                  {lead.notes && (
                    <div>
                      <p className="font-bold">Notes</p>
                      <p className="text-xs font-normal text-[#5B6B64] whitespace-pre-wrap break-words mt-1">
                        {lead.notes}
                      </p>
                    </div>
                  )}
                  {(lead.report_link || lead.place_id) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {lead.report_link && (
                        <a
                          href={lead.report_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={QUICK_CLS}
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open report
                        </a>
                      )}
                      {lead.place_id && (
                        <a
                          href={"https://www.google.com/maps/place/?q=place_id:" + encodeURIComponent(lead.place_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={QUICK_CLS}
                        >
                          <MapPin className="w-3.5 h-3.5" /> Open on Google Maps
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Manual check - each tick is stored as one reviewed activity row */}
              <section className="space-y-2">
                <h3 className={HEADING_CLS}>Manual check</h3>
                <div className="rounded-xl border border-[#E1E8E4] p-3 space-y-2">
                  {CHECKLIST.map((label) => {
                    const done = doneChecks.has(label);
                    return (
                      <label
                        key={label}
                        className={
                          "flex items-center gap-2.5 text-sm font-normal " +
                          (done ? "text-[#0F5132]" : "text-[#0A2E22]") +
                          (done || busy ? "" : " cursor-pointer")
                        }
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={done || busy}
                          onChange={() => void tickCheck(label)}
                          className="w-4 h-4 accent-[#22C55E]"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Status - the update still goes through the existing /api/admin/leads route */}
              <section className="space-y-2">
                <h3 className={HEADING_CLS}>Status</h3>
                <select
                  value={lead.status}
                  disabled={busy}
                  onChange={(e) => void changeStatus(e.target.value)}
                  className="text-xs font-bold uppercase px-3 py-2 rounded-lg border border-[#E1E8E4] outline-none cursor-pointer focus:border-[#22C55E] disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </section>
              {/* Email automation (Phase 1 sequences) */}
              {automation && (
                <section className="space-y-2">
                  <h3 className={HEADING_CLS}>Automation</h3>
                  <div className="rounded-xl border border-[#E1E8E4] p-3 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E6F2EA] text-[#0F5132]">
                        {automation.sequence_segment
                          ? automation.sequence_segment + " plan"
                          : "not enrolled"}
                      </span>
                      <span
                        className={
                          "inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full " +
                          (automation.marketing_consent?.active
                            ? "bg-[#E6F2EA] text-[#0F5132]"
                            : "bg-[#F7F9F8] text-[#5B6B64]")
                        }
                      >
                        {automation.marketing_consent?.active ? "marketing opt-in" : "no opt-in"}
                      </span>
                      {automation.marketing_paused && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDECEC] text-[#9B1C1C]">
                          paused
                        </span>
                      )}
                    </div>

                    {automation.sequence_enrolled_at && (
                      <p className="text-[11px] font-normal text-[#5B6B64]">
                        Enrolled {fmtDateTime(automation.sequence_enrolled_at)} · {queuedRows.length}{" "}
                        queued · {sentRows.length} sent
                      </p>
                    )}

                    {!automation.tablesReady && (
                      <p className="text-[11px] font-bold text-[#8A5A00]">
                        The automation tables are missing - apply 20261107_message_queue.sql.
                      </p>
                    )}
                    {automation.suppressed && (
                      <p className="text-[11px] font-bold text-[#9B1C1C]">
                        This address is on the do-not-email list. Nothing will be sent, whatever the
                        queue says.
                      </p>
                    )}
                    {!automation.marketing_consent?.active && !automation.suppressed && (
                      <p className="text-[11px] font-normal text-[#5B6B64]">
                        No marketing opt-in on file, so nothing can be queued - every step, the day-5
                        review ask included, counts as marketing mail.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void act({ action: "enroll_automation" })}
                        disabled={
                          busy ||
                          !automation.enrollable ||
                          !automation.tablesReady ||
                          Boolean(automation.sequence_enrolled_at)
                        }
                        className={QUICK_CLS + " disabled:opacity-50"}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {automation.sequence_enrolled_at ? "Already enrolled" : "Enroll in sequence"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void act({ action: "cancel_automation" })}
                        disabled={busy || queuedRows.length === 0}
                        className={QUICK_CLS + " disabled:opacity-50"}
                      >
                        <X className="w-3.5 h-3.5" /> Cancel {queuedRows.length || ""} queued
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void act({ action: "set_marketing_paused", paused: !automation.marketing_paused })
                        }
                        disabled={busy}
                        className={QUICK_CLS + " disabled:opacity-50"}
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        {automation.marketing_paused ? "Resume marketing" : "Pause marketing"}
                      </button>
                    </div>

                    {queuedRows.length > 0 && (
                      <ul className="space-y-1 pt-1">
                        {queuedRows.slice(0, 8).map((row) => (
                          <li key={row.id} className="text-[11px] font-normal text-[#5B6B64]">
                            · {row.step_label} · due {fmtDateTime(row.run_at)}
                          </li>
                        ))}
                        {queuedRows.length > 8 && (
                          <li className="text-[11px] font-normal text-[#9DB4A9]">
                            + {queuedRows.length - 8} more in Admin → Automation
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </section>
              )}
              {/* Internal notes + append-only activity timeline */}
              <section className="space-y-2">
                <h3 className={HEADING_CLS}>Notes and activity</h3>
                <div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Add internal note..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E1E8E4] text-sm font-normal outline-none focus:border-[#22C55E]"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] font-normal text-[#5B6B64]">{note.length}/2000</span>
                    <button
                      type="button"
                      onClick={() => void saveNote()}
                      disabled={savingNote || busy || !note.trim()}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#22C55E] text-white hover:bg-[#0F5132] disabled:opacity-50"
                    >
                      {savingNote ? "Saving..." : "Save note"}
                    </button>
                  </div>
                </div>

                {actionError && <p className="text-xs font-bold text-[#9B1C1C]">{actionError}</p>}
                {activity.length === 0 ? (
                  <p className="text-xs font-normal text-[#9DB4A9]">
                    No activity yet - add a note or tick a checklist item.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {activity.map((a) => {
                      const meta = ACTIVITY_META[a.type] || ACTIVITY_META.note;
                      const Icon = meta.Icon;
                      return (
                        <li key={a.id} className="flex gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#E6F2EA] flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-[#0F5132]" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0A2E22]">{meta.label}</p>
                            {a.body && (
                              <p className="text-xs font-normal text-[#5B6B64] whitespace-pre-wrap break-words">
                                {a.body}
                              </p>
                            )}
                            <p className="text-[10px] font-normal text-[#9DB4A9]">
                              {fmtDateTime(a.created_at)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
