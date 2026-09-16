import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Largest thumbnail an anonymous visitor may load. Signed-in pages (dashboard,
 * onboarding) can ask for more; public pages only ever render small thumbnails,
 * so a hard cap keeps this from becoming a free image-CDN for strangers.
 */
const ANON_MAX_WIDTH = 400;

/** Per-IP budget for anonymous photo loads (per instance fallback included). */
const RATE_ENDPOINT = "places/photo";
const RATE_MAX = 120;
const RATE_WINDOW_MS = 60_000;
const RATE_BLOCK_MS = 5 * 60_000;

/** Places (New) photo resource: `places/{placeId}/photos/{photoReference}`. */
const PHOTO_NAME = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]{10,512}$/;
/** Legacy Maps API photo reference (opaque token, still used by the audit fallback). */
const PHOTO_REF = /^[A-Za-z0-9_-]{10,600}$/;

/**
 * GET /api/places/photo?name=places/…/photos/…&w=400
 *
 * Streams a Google Places photo so search results can show real business
 * thumbnails WITHOUT the API key ever reaching the browser. Generated public
 * websites never use this route — their photos are copied into the
 * `site-media` bucket at build time (see website-builder.persistPlacePhotos).
 *
 * Auth: two paths.
 *   - Signed-in (dashboard, onboarding, GMB checker): full width allowed.
 *   - Anonymous (the free /gmb-audit-tool, which has no signup): the <img> tag
 *     on that public page can never carry an Authorization header, so the
 *     proxy previously answered 401 and every listing thumbnail rendered as the
 *     generic building fallback while names/addresses/ratings synced fine.
 *     Anonymous requests are therefore allowed, but capped at
 *     ANON_MAX_WIDTH and rate limited per visitor IP.
 *
 * Safety: the `name` must match the Places photo-resource shape (and the legacy
 * `ref` an opaque Maps token), so this can't be abused as an open proxy for
 * arbitrary Google URLs, and no key is ever handed to the browser.
 */
export async function GET(req: Request) {
  try {
    // A signed-in caller sends its Supabase access token; the public audit tool
    // has no session at all, so an absent token means "anonymous", not "denied".
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
    const user = token
      ? (await supabaseAdmin.auth.getUser(token)).data?.user ?? null
      : null;

    // A token that is present but invalid still fails, so a stale dashboard
    // session errors loudly instead of silently dropping to the 400px cap.
    if (token && !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const key =
      process.env.GOOGLE_PLACES_SERVER_KEY ||
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      "";
    if (!key) {
      return NextResponse.json({ error: "Places API key not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const name = (searchParams.get("name") || "").trim();
    const ref = (searchParams.get("ref") || "").trim();
    const width = Math.min(1600, Math.max(48, Number(searchParams.get("w")) || 400));

    // Anonymous visitors (the free GMB audit tool) get real thumbnails only:
    // small enough that the route can't be used as an image CDN for strangers.
    if (!user) {
      if (width > ANON_MAX_WIDTH) {
        return NextResponse.json(
          { error: "Sign in to load full-size business photos." },
          { status: 401 }
        );
      }

      const limit = await checkRateLimit({
        ip: getClientIp(req),
        endpoint: RATE_ENDPOINT,
        max: RATE_MAX,
        windowMs: RATE_WINDOW_MS,
        blockMs: RATE_BLOCK_MS,
        fallbackToMemory: true,
      });
      if (!limit.allowed) {
        return NextResponse.json({ error: "Too many photo requests." }, { status: 429 });
      }
    }

    let upstream: string;
    if (name) {
      if (!PHOTO_NAME.test(name)) {
        return NextResponse.json({ error: "Invalid photo reference" }, { status: 400 });
      }
      upstream = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}`;
    } else if (ref) {
      if (!PHOTO_REF.test(ref)) {
        return NextResponse.json({ error: "Invalid photo reference" }, { status: 400 });
      }
      // The legacy endpoint only authenticates via ?key= — safe here because this
      // URL is built and consumed server-side only (never returned to a client).
      upstream = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${width}&photoreference=${ref}&key=${key}`;
    } else {
      return NextResponse.json({ error: "Missing photo reference" }, { status: 400 });
    }

    const res = await fetch(upstream, {
      headers: name ? { "X-Goog-Api-Key": key } : {},
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Places photo lookup failed (${res.status})` }, { status: 502 });
    }

    const bytes = await res.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        // Browser-cached for a day so repeat views cost nothing. Signed-in
        // responses stay private; anonymous thumbnails are shared, cacheable
        // content (the URL carries no key).
        "Cache-Control": user ? "private, max-age=86400" : "public, max-age=86400",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (err: any) {
    console.error("❌ Places photo proxy error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Photo proxy failed" }, { status: 500 });
  }
}
