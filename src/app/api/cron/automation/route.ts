// src/app/api/cron/automation/route.ts
/**
 * GET|POST /api/cron/automation - the daily drain of public.message_queue.
 *
 * Scheduled at 10:00 UTC (see vercel.json). Two entry points on purpose: Vercel
 * Cron issues a GET with `Authorization: Bearer $CRON_SECRET`, while an operator
 * (or a backfill script) normally curls a POST - both run the same drainer.
 *
 * AUTH IS FAIL-CLOSED, unlike the domain-renewal cron. That one warns and runs
 * anyway when CRON_SECRET is missing; this one refuses, because an anonymous
 * caller here could trigger real marketing email. Accepted:
 *   Authorization: Bearer {CRON_SECRET}   (Vercel standard)
 *   X-Cron-Secret: {CRON_SECRET}
 *
 * Query parameters (both optional):
 *   dryRun=1  - evaluate every guard, send nothing, write nothing
 *   limit=N   - consider at most N rows this run (capped to the batch limit)
 *
 * Everything about "how" lives in lib/automation/drain.ts, so the admin tab's
 * "run now" button and this cron cannot drift apart.
 */

import { NextResponse } from "next/server";
import { drainQueue } from "@/lib/automation/drain";

/** A drain can spend a minute in Resend - give it room, like the website cron. */
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  // No secret configured = no anonymous drains, ever.
  if (!secret) {
    console.error("[Cron][Automation] CRON_SECRET is not set - refusing to run.");
    return false;
  }
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const headerSecret = (req.headers.get("x-cron-secret") || "").trim();
  return bearer === secret || headerSecret === secret;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = ["1", "true", "yes"].includes((url.searchParams.get("dryRun") || "").toLowerCase());
  const limitParam = Number(url.searchParams.get("limit") || "");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.trunc(limitParam) : undefined;

  try {
    const result = await drainQueue({ dryRun, limit });
    // The drainer never throws, so a failure is a 500 with a redacted reason and
    // the counts collected so far.
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error: any) {
    // Defensive only: drainQueue handles its own errors.
    console.error("[Cron][Automation] unexpected error:", error?.message || error);
    return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
