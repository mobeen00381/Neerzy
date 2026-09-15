import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/audit/review
 *
 * Public, unauthenticated capture endpoint for the "How was your audit?"
 * rating shown on /gmb-audit-tool/results.
 *
 * Every row it writes is status='pending' — nothing reaches the public page
 * (or the JSON-LD AggregateRating) until a human approves it in /admin.
 *
 * Abuse controls, in order:
 *   1. Honeypot field — bots fill it, humans never see it.
 *   2. Minimum submit time — nobody rates a tool 500ms after it renders.
 *   3. Per-IP rate limit via the shared rate_limits table (fails closed).
 *   4. UNIQUE (ip_hash, scan_place_id) — one rating per scan per person.
 *
 * The client IP is hashed with REVIEW_IP_SALT before it is stored; raw IPs
 * never touch the database.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
);

const ENDPOINT = "audit/review";
const RATE_WINDOW_MS = 3_600_000; // 1 hour
const RATE_MAX = 5; // 5 submissions per IP per hour
const MIN_ELAPSED_MS = 3_000; // faster than this = bot
const MAX_COMMENT = 500;
const MAX_NAME = 60;
const MAX_SCAN_REF = 128;

/** sha256(ip + salt) — salted so the hash can't be reversed by brute force. */
function hashIp(ip: string): string {
  const salt = process.env.REVIEW_IP_SALT || "neerzy-audit-review";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

/** Same shape as a success, so bots can't tell they were silently dropped. */
function silentlyAccepted() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { rating, comment, author_name, scan_place_id, honeypot, elapsed_ms } =
      body || {};

    // ── 1. Honeypot ──
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
      return silentlyAccepted();
    }

    // ── 2. Minimum submit time ──
    const elapsed = Number(elapsed_ms);
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_ELAPSED_MS) {
      return silentlyAccepted();
    }

    // ── 3. Validate ──
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "Please choose a rating between 1 and 5 stars." },
        { status: 400 }
      );
    }

    const text =
      typeof comment === "string" ? comment.trim().slice(0, MAX_COMMENT) : "";
    const name =
      typeof author_name === "string"
        ? author_name.trim().slice(0, MAX_NAME)
        : "";
    const scanRef =
      typeof scan_place_id === "string" && scan_place_id.trim()
        ? scan_place_id.trim().slice(0, MAX_SCAN_REF)
        : null;

    // ── 4. Per-IP rate limit (shared limiter; per-instance memory fallback so a
    //      broken limiter store can't block every rating) ──
    const ip = getClientIp(req);
    const limit = await checkRateLimit({
      ip,
      endpoint: ENDPOINT,
      max: RATE_MAX,
      windowMs: RATE_WINDOW_MS,
      blockMs: RATE_WINDOW_MS,
      fallbackToMemory: true,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many submissions from this connection. Please try again later." },
        { status: 429 }
      );
    }

    // ── 5. Insert as pending ──
    const { error } = await supabase.from("audit_reviews").insert({
      rating: stars,
      comment: text || null,
      author_name: name || null,
      scan_place_id: scanRef,
      ip_hash: hashIp(ip),
      status: "pending",
    });

    if (error) {
      // 23505 — this person already rated this exact scan.
      if ((error as any).code === "23505") {
        return NextResponse.json({ ok: true, already: true });
      }
      console.error("audit review insert failed:", error);
      return NextResponse.json(
        { error: "Could not save your rating. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("audit review route error:", err);
    return NextResponse.json(
      { error: "Could not save your rating. Please try again." },
      { status: 500 }
    );
  }
}
