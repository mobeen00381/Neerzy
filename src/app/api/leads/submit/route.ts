import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public lead capture endpoint. Point your ad landing pages / lead forms at
// POST /api/leads/submit. Runs with the service role (server-only) so the RLS
// "service access" policy on public.leads allows the insert.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const ALLOWED_SOURCES = ["facebook", "instagram", "google_ads", "organic", "referral", "direct", "landing"];

/** Derives a channel source from UTM / click IDs when none is provided. */
function inferSource(utm_source?: string | null, gclid?: string | null, fbclid?: string | null): string {
  if (gclid) return "google_ads";
  if (fbclid) return "facebook";
  const src = (utm_source || "").toLowerCase();
  if (src.includes("facebook") || src.includes("fb")) return "facebook";
  if (src.includes("instagram") || src.includes("ig")) return "instagram";
  if (src.includes("google") || src.includes("gads")) return "google_ads";
  if (src.includes("referral")) return "referral";
  if (src) return "organic";
  return "organic";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const businessName = String(body.business_name || "").trim();
    const serviceType = String(body.service_type || "").trim();

    if (!name && !phone && !email) {
      return NextResponse.json(
        { error: "At least one of name, phone or email is required" },
        { status: 400 }
      );
    }

    const utm_source = body.utm_source ? String(body.utm_source).slice(0, 120) : null;
    const utm_medium = body.utm_medium ? String(body.utm_medium).slice(0, 120) : null;
    const utm_campaign = body.utm_campaign ? String(body.utm_campaign).slice(0, 160) : null;
    const requestedSource = body.source ? String(body.source).toLowerCase() : "";
    const source = ALLOWED_SOURCES.includes(requestedSource)
      ? requestedSource
      : inferSource(utm_source, body.gclid ? String(body.gclid) : null, body.fbclid ? String(body.fbclid) : null);
    const status = body.status && ["new", "contacted", "trial_started", "converted", "lost"].includes(body.status)
      ? body.status
      : "new";
    const notes = body.notes ? String(body.notes).slice(0, 2000) : null;

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: name || null,
        phone: phone || null,
        email: email || null,
        business_name: businessName || null,
        service_type: serviceType || null,
        source,
        utm_source,
        utm_medium,
        utm_campaign,
        status,
        notes,
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ /api/leads/submit insert failed:", error);
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error("❌ /api/leads/submit error:", error?.message || error);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
