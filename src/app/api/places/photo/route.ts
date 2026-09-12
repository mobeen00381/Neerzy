import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/** Places (New) photo resource: `places/{placeId}/photos/{photoReference}`. */
const PHOTO_NAME = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]{10,512}$/;
/** Legacy Maps API photo reference (opaque token, still used by the audit fallback). */
const PHOTO_REF = /^[A-Za-z0-9_-]{10,600}$/;

/**
 * GET /api/places/photo?name=places/…/photos/…&w=400
 *
 * Streams a Google Places photo so dashboard search results can show
 * thumbnails WITHOUT the API key ever reaching the browser. Generated public
 * websites never use this route — their photos are copied into the
 * `site-media` bucket at build time (see website-builder.persistPlacePhotos).
 *
 * Auth: a signed-in user, since these thumbnails only appear in the dashboard.
 * The `name` must match the Places photo-resource shape, so this can't be
 * abused as an open proxy for arbitrary Google URLs.
 */
export async function GET(req: Request) {
  try {
    const { data: auth, error: authErr } = await supabaseAdmin.auth.getUser(
      (req.headers.get("authorization") || "").replace("Bearer ", "")
    );
    if (authErr || !auth?.user) {
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
        // Browser-cached for a day so repeat dashboard views cost nothing.
        "Cache-Control": "private, max-age=86400",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (err: any) {
    console.error("❌ Places photo proxy error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Photo proxy failed" }, { status: 500 });
  }
}
