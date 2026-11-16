// src/app/api/admin/preview-events/route.ts
// Admin -> Overview: the /website-builder preview funnel (last 30 days).
//
//   GET -> counts per funnel step + the step-to-step percentages.
//
// Same guard chain as every other /api/admin/* route (IS_ADMIN_CONFIGURED, then
// verifyAdminRequest), service-role Supabase underneath. The events are written
// anonymously by POST /api/preview/event (20261114_preview_events.sql) — this
// route only reads, and reads COUNTS only: never place ids, trades or session
// ids, because the card answers "how many people got to each step", not "who".
//
// Four head-counts (one per allowlisted event) instead of fetching rows: the
// payload stays tiny no matter how much traffic the widget gets.
import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  isMissingTableError,
} from "@/lib/admin-server";
import { PREVIEW_EVENTS, type PreviewEventName } from "@/lib/preview-events";
import type { PreviewFunnel, PreviewFunnelStep } from "@/lib/admin-types";

const WINDOW_DAYS = 30;

/** Human labels for the card — keyed by the allowlist so a new step cannot drift. */
const EVENT_LABELS: Record<PreviewEventName, string> = {
  preview_searched: "Searched a business",
  preview_selected: "Picked a listing",
  preview_build_click: "Clicked Build This Website",
  preview_try_another: "Clicked Try another business",
};

/** Percentage with one decimal, or null when there is no previous step to divide by. */
function pct(part: number, whole: number): number | null {
  if (!whole || whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    const counts = await Promise.all(
      PREVIEW_EVENTS.map(async (event) => {
        const { count, error } = await supabase
          .from("preview_events")
          .select("*", { count: "exact", head: true })
          .eq("event", event)
          .gte("created_at", since);
        return { event, count: count || 0, missing: isMissingTableError(error) };
      })
    );

    const tablesReady = !counts.some((row) => row.missing);
    const searched = counts[0]?.count || 0;

    let previous = 0;
    const steps: PreviewFunnelStep[] = counts.map((row, index) => {
      const step: PreviewFunnelStep = {
        event: row.event,
        label: EVENT_LABELS[row.event],
        count: tablesReady ? row.count : 0,
        // First step has nothing to compare against; later steps are measured
        // against the step directly above them (pick rate, build rate, ...).
        stepPct: index === 0 ? null : pct(row.count, previous),
        sharePct: pct(row.count, searched) ?? 0,
      };
      previous = row.count;
      return step;
    });

    const payload: PreviewFunnel = { windowDays: WINDOW_DAYS, tablesReady, steps };
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("admin/preview-events error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load preview funnel" }, { status: 500 });
  }
}
