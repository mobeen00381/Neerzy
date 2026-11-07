// src/app/api/admin/automation/route.ts
// Admin -> Automation tab: the switches, the queue, and the manual overrides.
//   GET  -> settings + head-counts + the queue slice the tab renders.
//   POST -> update_settings | cancel_row | cancel_lead | cancel_email |
//           requeue_failed | enroll_lead | run_now | send_test
//
// Same guard chain as every other /api/admin/* route (IS_ADMIN_CONFIGURED, then
// verifyAdminRequest), service-role Supabase underneath. All sending logic lives
// in lib/automation/drain.ts and lib/automation/enroll.ts - this route only
// validates input and calls them, so a button here can never behave differently
// from the nightly cron.
//
// The one exception is `send_test`: it renders a real template with fake lead
// data and mails it to the admin's own address so the copy can be reviewed
// before automation is unpaused. It never reads a lead, never writes the queue
// and is capped at 10 sends/hour.
import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  isMissingTableError,
  ADMIN_EMAIL,
} from "@/lib/admin-server";
import type { AutomationOverview, AutomationSettings } from "@/lib/admin-types";
import { loadAutomationStats, loadQueueRows } from "@/lib/automation/admin-view";
import { drainQueue } from "@/lib/automation/drain";
import { cancelQueueForLead, cancelQueueForEmail, enrollLead } from "@/lib/automation/enroll";
import {
  AUDIT_TOOL_PATH,
  appBaseUrl,
  reviewInviteUrl,
  websitePreviewUrl,
} from "@/lib/automation/offer-facts";
import {
  SEQUENCE_STEPS,
  isSequenceStepKey,
  type SequenceSegment,
} from "@/lib/automation/sequences";
import { auditReportEmailContent, sequenceEmailContent } from "@/lib/email-templates";
import { logEmailSend, sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/unsubscribe";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const QUEUE_STATUSES = ["pending", "sending", "sent", "skipped", "cancelled", "failed"];
const MAX_CAP = 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Test sends allowed per hour. Enough to iterate on the copy, not to spam. */
const TEST_SEND_MAX = 10;
/** Keyed on the admin identity, not the IP: one admin account, one budget. */
const TEST_SEND_KEY = "admin-test-send";
const TEST_SEND_ENDPOINT = "admin:automation-test";

/**
 * The fake lead every test email is rendered with.
 *
 * ONE fixture on purpose: the admin is checking the template (does the price read
 * right, is the score line right), so the numbers must not change between two
 * clicks. No lead row is read and nothing here can leak a real business.
 */
const TEST_SAMPLE = {
  businessName: "Sample Plumbing Co",
  score: 62,
  reviewCount: 213,
  /** Left null so the copy shows "213 reviews" rather than an invented rating. */
  rating: null as number | null,
  hasWebsite: false,
} as const;

/**
 * The address the sample unsubscribe link is built for. A test must never create
 * a token for a real inbox, so the footer link points at a placeholder nobody can
 * own (.invalid is reserved by RFC 2606).
 */
const TEST_SAMPLE_EMAIL = "sample-lead@neerzy.invalid";

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * What the tab shows when the settings row cannot be read. PAUSED, matching the
 * drainer's own fail-closed default: if we cannot prove automation is on, the UI
 * must not claim it is (a green "Active" badge would be a lie the cron disagrees
 * with).
 */
const EMPTY_SETTINGS: AutomationSettings = {
  automation_paused: true,
  daily_send_cap: 50,
  updated_at: null,
  updated_by: null,
};

/** The plans, as data, so the tab never hardcodes the schedule. */
function plansPayload() {
  return (Object.keys(SEQUENCE_STEPS) as SequenceSegment[]).map((segment) => ({
    segment,
    steps: SEQUENCE_STEPS[segment].map((step) => ({
      key: step.key,
      label: step.label,
      kind: step.kind,
      day: step.day,
    })),
  }));
}

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const url = new URL(req.url);
  const requested = String(url.searchParams.get("status") || "pending").toLowerCase();
  const status = QUEUE_STATUSES.includes(requested) ? requested : "pending";
  const limitParam = Number(url.searchParams.get("limit") || "");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.trunc(limitParam) : 50;

  const supabase = getAdminSupabase();
  try {
    const { data: settingsRow, error: settingsError } = await supabase
      .from("agent_settings")
      .select("automation_paused, daily_send_cap, updated_at, updated_by")
      .eq("id", "default")
      .maybeSingle();

    // A missing table is the "migration not applied" case, not an error page.
    const tablesReady = !settingsError || !isMissingTableError(settingsError);
    if (settingsError && !isMissingTableError(settingsError)) throw settingsError;

    const settings: AutomationSettings = settingsRow
      ? {
          automation_paused: (settingsRow as any).automation_paused === true,
          daily_send_cap: Number((settingsRow as any).daily_send_cap) || 50,
          updated_at: (settingsRow as any).updated_at || null,
          updated_by: (settingsRow as any).updated_by || null,
        }
      : EMPTY_SETTINGS;

    const payload: AutomationOverview = {
      settings,
      stats: tablesReady
        ? await loadAutomationStats(supabase)
        : {
            pending: 0,
            sending: 0,
            sentToday: 0,
            sent: 0,
            skipped: 0,
            cancelled: 0,
            failed: 0,
            dueNow: 0,
          },
      queue: tablesReady ? await loadQueueRows(supabase, { status, limit }) : [],
      plans: plansPayload(),
      reviewLinkConfigured: reviewInviteUrl().length > 0,
      tablesReady,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("admin/automation GET error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load automation" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return bad("Invalid JSON body");
    const action = String(body.action || "");

    // ── Global switches ─────────────────────────────────────────────────────
    if (action === "update_settings") {
      const patch: Record<string, unknown> = { updated_by: "admin" };

      if (body.automation_paused !== undefined) {
        if (typeof body.automation_paused !== "boolean") {
          return bad("automation_paused must be true or false");
        }
        patch.automation_paused = body.automation_paused;
      }

      if (body.daily_send_cap !== undefined) {
        const cap = Number(body.daily_send_cap);
        if (!Number.isFinite(cap) || cap < 0 || cap > MAX_CAP) {
          return bad(`daily_send_cap must be a whole number between 0 and ${MAX_CAP}`);
        }
        patch.daily_send_cap = Math.trunc(cap);
      }

      if (Object.keys(patch).length === 1) return bad("Nothing to update");

      const { data, error } = await supabase
        .from("agent_settings")
        .update(patch)
        .eq("id", "default")
        .select("automation_paused, daily_send_cap, updated_at, updated_by")
        .maybeSingle();
      if (error) throw error;

      // The row is seeded by the migration; if it is gone (deleted by hand) put
      // it back so the next cron run reads a real value instead of the default.
      if (!data) {
        const { error: seedError } = await supabase
          .from("agent_settings")
          .insert({ id: "default", ...patch });
        if (seedError) throw seedError;
      }

      return NextResponse.json({ success: true });
    }

    // ── Queue overrides ─────────────────────────────────────────────────────
    if (action === "cancel_row") {
      const id = String(body.id || "").trim();
      if (!UUID_RE.test(id)) return bad("Invalid queue row id");
      const { error } = await supabase
        .from("message_queue")
        .update({
          status: "cancelled",
          claimed_at: null,
          last_error: "cancelled by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending");
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "cancel_lead") {
      const leadId = String(body.leadId || "").trim();
      if (!UUID_RE.test(leadId)) return bad("Invalid lead id");
      const cancelled = await cancelQueueForLead(leadId, "cancelled by admin");
      return NextResponse.json({ success: true, cancelled });
    }

    if (action === "requeue_failed") {
      // Re-open rows that gave up (max attempts) so the next run tries again.
      const { data, error } = await supabase
        .from("message_queue")
        .update({
          status: "pending",
          attempts: 0,
          claimed_at: null,
          run_at: new Date().toISOString(),
          last_error: "requeued by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("status", "failed")
        .select("id");
      if (error) throw error;
      return NextResponse.json({ success: true, requeued: (data || []).length });
    }

    if (action === "cancel_email") {
      const email = String(body.email || "").trim();
      if (!email) return bad("email is required");
      const cancelled = await cancelQueueForEmail(email, "cancelled by admin");
      return NextResponse.json({ success: true, cancelled });
    }

    // ── Enrollment ──────────────────────────────────────────────────────────
    if (action === "enroll_lead") {
      const leadId = String(body.leadId || "").trim();
      if (!UUID_RE.test(leadId)) return bad("Invalid lead id");
      const result = await enrollLead({ leadId, reason: "admin" });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    // ── Manual run (same code path as the cron) ─────────────────────────────
    if (action === "run_now") {
      const dryRun = body.dryRun === true;
      const limitParam = Number(body.limit);
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.trunc(limitParam) : 10;
      const result = await drainQueue({ dryRun, limit });
      return NextResponse.json(result, { status: result.ok ? 200 : 500 });
    }

    // ── Test email (renders one template with fake data) ────────────────────
    //
    // The whole point is to read the copy in a real inbox BEFORE automation is
    // unpaused - no waiting for a real lead to reach day 3. It reads no lead and
    // writes no queue row; the only write is a best-effort email_log entry so the
    // send is accountable, and even that is skipped in dry-run (logEmailSend).
    if (action === "send_test") {
      const stepKey = String(body.stepKey || "").trim();
      // audit_report is the transactional report email (not a sequence step), so
      // it has its own branch - everything else must be a step in the plan table.
      if (stepKey !== "audit_report" && !isSequenceStepKey(stepKey)) {
        return bad("Unknown template");
      }

      // Defaults to the admin's own inbox (ADMIN_EMAIL) - a test should not need
      // the address typed in, and an empty field can never send somewhere random.
      const to = normalizeEmail(body.to || ADMIN_EMAIL);
      if (!EMAIL_RE.test(to)) return bad("Enter a valid email address");

      // 10 per hour, keyed on the admin identity rather than the IP: the budget
      // belongs to the one admin account, so a new network does not reset it.
      const limit = await checkRateLimit({
        ip: TEST_SEND_KEY,
        endpoint: TEST_SEND_ENDPOINT,
        max: TEST_SEND_MAX,
        windowMs: HOUR_MS,
        blockMs: HOUR_MS,
        fallbackToMemory: true,
      });
      if (!limit.allowed) {
        const until = limit.blockedUntil ?? limit.resetAt;
        const retryAfterSeconds = Math.max(1, Math.ceil((until - Date.now()) / 1000));
        return NextResponse.json(
          {
            error: `Test send limit reached (${TEST_SEND_MAX}/hour). Try again in ${Math.ceil(
              retryAfterSeconds / 60
            )} minute(s).`,
            retryAfterSeconds,
          },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
      }

      // Both builders return null when the copy cannot be made honestly (a review
      // step with no review link, an unknown key). A test must not paper over
      // that - it is exactly the failure mode worth seeing before going live.
      const content =
        stepKey === "audit_report"
          ? auditReportEmailContent({
              businessName: TEST_SAMPLE.businessName,
              score: TEST_SAMPLE.score,
              reviewCount: TEST_SAMPLE.reviewCount,
              rating: TEST_SAMPLE.rating,
              // Weighted 50% Local SEO / 25% AEO / 25% GEO, so they add up to the
              // 62 shown above instead of contradicting it.
              sections: [
                { label: "Local SEO", score: 48, measurable: true },
                { label: "AEO", score: 70, measurable: true },
                { label: "GEO", score: 80, measurable: true },
              ],
              actions: [
                "Add your opening hours and the suburbs you serve",
                "Upload 5 recent job photos",
                "Reply to the 3 reviews that have no response",
              ],
              reportUrl: `${appBaseUrl()}${AUDIT_TOOL_PATH}`,
              previewUrl: websitePreviewUrl(),
            })
          : sequenceEmailContent({
              stepKey,
              businessName: TEST_SAMPLE.businessName,
              score: TEST_SAMPLE.score,
              reviewCount: TEST_SAMPLE.reviewCount,
              rating: TEST_SAMPLE.rating,
              hasWebsite: TEST_SAMPLE.hasWebsite,
              reportUrl: `${appBaseUrl()}${AUDIT_TOOL_PATH}`,
              previewUrl: websitePreviewUrl(),
              reviewUrl: reviewInviteUrl(),
              // The footer link is built for a placeholder address, never for the
              // recipient: clicking unsubscribe in a test cannot suppress a real
              // inbox, and the admin can still see the link works.
              email: TEST_SAMPLE_EMAIL,
            });
      if (!content) {
        return bad(
          stepKey === "review_d5"
            ? "The review ask needs NEERZY_REVIEW_URL set before it can be previewed"
            : "That template has no copy configured"
        );
      }

      // marketing: true for every sequence step - the test is sent through the
      // exact same path as the real thing (suppression check, one-click headers),
      // so a suppressed address or a bad API key shows up here, not on day 3.
      // The audit report is transactional (the visitor asked for it), so it is not.
      const isMarketing = stepKey !== "audit_report";
      const result = await sendEmail({
        to,
        subject: `[TEST] ${content.subject}`,
        html: content.html,
        text: content.text,
        template: `automation_test_${stepKey}`,
        marketing: isMarketing,
      });

      await logEmailSend({
        emailType: `automation_${stepKey}`,
        toEmail: to,
        providerId: result.id ?? null,
        status: result.ok ? "sent" : "failed",
        error: result.ok ? null : result.error || "send failed",
      });

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || "Send failed" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        stepKey,
        to,
        dryRun: result.dryRun === true,
        // A dry-run still renders and runs the suppression check, it just never
        // hands the message to the provider - so say that instead of claiming a
        // delivery nobody can find.
        message: result.dryRun
          ? "Dry run - the email was rendered but not delivered."
          : `Test email sent to ${to}.`,
      });
    }

    return bad("Unknown action");
  } catch (error: any) {
    // A missing migration is a setup problem, not a crash: say so plainly.
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "Automation tables are missing - apply supabase/migrations/20261107_message_queue.sql" },
        { status: 503 }
      );
    }
    console.error("admin/automation POST error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Automation action failed" },
      { status: error?.status || 500 }
    );
  }
}
