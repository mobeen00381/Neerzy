import { NextResponse } from "next/server";
import { guardPublicRequest, PREVIEW_EVENT_LIMIT } from "@/lib/api-guard";
import { getAdminSupabase, isMissingTableError } from "@/lib/admin-server";
import { isPreviewEvent } from "@/lib/preview-events";

/**
 * POST /api/preview/event — the /website-builder widget's funnel beacon.
 *
 * Public by design (previewing needs no account), so it is guarded like the
 * other anonymous routes: PREVIEW_EVENT_LIMIT (60/hour per IP) with the
 * limiter's memory fallback, i.e. it FAILS OPEN — a rate-limiter outage must
 * never stop the funnel beacons.
 *
 * Payload is validated field by field (see src/lib/preview-events.ts):
 *   event     must be in the PREVIEW_EVENTS allowlist
 *   placeId   Google Places id shape, <= 200 chars
 *   trade     template id token, <= 40 chars
 *   source    surface token, <= 40 chars
 *   sessionId random per-tab id, 8-64 chars
 *
 * NOTHING personal is accepted or stored: there is no name, email, phone or IP
 * column, and the IP is used only as the rate-limit key (never written here).
 *
 * Responses are always 202 for a well-formed request, even when the insert
 * fails (e.g. the migration has not been applied yet): analytics must never
 * take the widget down. Malformed payloads get a 400 so callers can be fixed.
 */
const MAX_PLACE_ID = 200;
const MAX_TRADE = 40;
const MAX_SOURCE = 40;
const MAX_SESSION_ID = 64;
const MIN_SESSION_ID = 8;

/** Places (New) ids / legacy ids: letters, digits, underscore, hyphen. */
const PLACE_ID_RE = /^[A-Za-z0-9_-]+$/;
/** Template ids and surface names are lowercase tokens. */
const TOKEN_RE = /^[a-z0-9_-]+$/;
/** UUID (with hyphens) or hex fallback from the widget. */
const SESSION_RE = /^[A-Za-z0-9-]+$/;

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Trim + validate one optional string field. null = invalid, "" = absent. */
function cleanField(value: unknown, max: number, re: RegExp): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > max) return null;
  if (trimmed && !re.test(trimmed)) return null;
  return trimmed;
}

export async function POST(req: Request) {
  const guard = await guardPublicRequest(
    req,
    "preview:event",
    PREVIEW_EVENT_LIMIT,
    "Too many preview events from this device — please try again later."
  );
  if (!guard.allowed) return guard.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return bad("Invalid payload");

    if (!isPreviewEvent(body.event)) return bad("Unknown event");
    const event = body.event;

    const placeId = cleanField(body.placeId, MAX_PLACE_ID, PLACE_ID_RE);
    const trade = cleanField(body.trade, MAX_TRADE, TOKEN_RE);
    const source = cleanField(body.source, MAX_SOURCE, TOKEN_RE);
    const sessionId = cleanField(body.sessionId, MAX_SESSION_ID, SESSION_RE);

    if (placeId === null || trade === null || source === null || sessionId === null) {
      return bad("Invalid field");
    }
    if (sessionId && sessionId.length < MIN_SESSION_ID) return bad("Invalid session id");

    const { error } = await getAdminSupabase().from("preview_events").insert({
      event,
      place_id: placeId || null,
      trade: trade || null,
      source: source || null,
      session_id: sessionId || null,
    });

    if (error && !isMissingTableError(error)) {
      // Analytics only — log it and still answer the beacon.
      console.error("preview/event insert failed:", error.message);
    }

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (err: any) {
    // A broken beacon must never surface as an error the page has to handle.
    console.error("preview/event error:", err?.message || err);
    return NextResponse.json({ ok: true }, { status: 202 });
  }
}
