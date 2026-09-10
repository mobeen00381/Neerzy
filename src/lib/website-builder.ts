/**
 * Part 2 — Website builder engine.
 *
 * Turns a trader's existing data into a live website with ZERO input:
 *   1. Collect  — business_profiles + Google Place Details (hours, photos,
 *                 rating, reviews) when a place_id + Places API key exist
 *   2. Write    — one AI call generates tagline, hero, about, services, SEO
 *   3. Design   — template + palette auto-picked by trade (TEMPLATE_REGISTRY)
 *   4. Publish  — content saved to websites.content, status → live,
 *                 users.website_url set (this wakes up the existing
 *                 WhatsApp → website_posts update pipeline)
 *   5. Notify   — one WhatsApp message with the live link + sneak-peek link
 *
 * Cost: a single LLM call (~1,200 tokens) per build; everything else is
 * plain REST + DB writes. Idempotent + retryable.
 */

import { createClient } from "@supabase/supabase-js";
import { chatWithFallback } from "@/lib/openai";
import { sendMetaText } from "@/lib/whatsapp";
import { TEMPLATE_REGISTRY, type TemplateId } from "@/lib/templates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.neerzy.com";

/** Trade → template registry id (the registry is the single source of truth). */
const TEMPLATE_IDS: TemplateId[] = [
  "plumber", "hvac", "electrician", "roofing", "handyman",
  "dentist", "grocery", "hardware", "mechanic", "generic",
];

function pickTemplate(templateType: string | undefined): TemplateId {
  const t = (templateType || "").toLowerCase().trim() as TemplateId;
  return TEMPLATE_IDS.includes(t) ? t : "generic";
}

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. Google Places enrichment (optional — silent fallback)
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type Enrichment = {
  hours: string[];
  photos: string[];
  rating: number | null;
  userRatingsTotal: number | null;
  reviews: { author: string; rating: number; text: string; time: string }[];
  phone: string | null;
  address: string | null;
  website: string | null;
  geo: { lat: number; lng: number } | null;
};

const EMPTY_ENRICHMENT: Enrichment = {
  hours: [], photos: [], rating: null, userRatingsTotal: null,
  reviews: [], phone: null, address: null, website: null, geo: null,
};

async function enrichFromPlaces(placeId: string | null): Promise<Enrichment> {
  // Prefer a dedicated server key; fall back to the existing ones.
  // NOTE: this uses **Places API (New)** — the legacy /maps/api/place/* endpoints
  // are disabled on the Neerzy Google Cloud project.
  const key =
    process.env.GOOGLE_PLACES_SERVER_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";
  if (!key || !placeId) return EMPTY_ENRICHMENT;

  try {
    const fieldMask = [
      "id",
      "displayName",
      "formattedAddress",
      "internationalPhoneNumber",
      "nationalPhoneNumber",
      "regularOpeningHours.weekdayDescriptions",
      "photos",
      "rating",
      "userRatingCount",
      "reviews",
      "location",
      "googleMapsUri",
      "websiteUri",
    ].join(",");

    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": fieldMask },
        cache: "no-store",
      }
    );
    const json: any = await res.json();

    if (!res.ok) {
      console.warn(
        `⚠️ [Website Builder] Places (New) error ${res.status}: ${json?.error?.message || "unknown"}`
      );
      return EMPTY_ENRICHMENT;
    }

    const hours: string[] = json.regularOpeningHours?.weekdayDescriptions || [];

    const photos: string[] = (json.photos || [])
      .slice(0, 6)
      .filter((p: any) => p?.name)
      .map(
        (p: any) =>
          `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=1200&key=${key}`
      );

    const reviews = (json.reviews || []).slice(0, 5).map((rv: any) => ({
      author: rv.authorAttribution?.displayName || "Customer",
      rating: rv.rating || 5,
      text: rv.text?.text || "",
      time: rv.relativePublishTimeDescription || "",
    }));

    return {
      hours,
      photos,
      rating: typeof json.rating === "number" ? json.rating : null,
      userRatingsTotal: typeof json.userRatingCount === "number" ? json.userRatingCount : null,
      reviews,
      phone: json.internationalPhoneNumber || json.nationalPhoneNumber || null,
      address: json.formattedAddress || null,
      website: json.websiteUri || null,
      geo:
        json.location?.latitude && json.location?.longitude
          ? { lat: json.location.latitude, lng: json.location.longitude }
          : null,
    };
  } catch (err: any) {
    console.warn("⚠️ [Website Builder] Places enrichment skipped:", err?.message || err);
    return EMPTY_ENRICHMENT;
  }
}

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GEO/AEO helpers — structured data from Places data
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function to24h(t: string): string | null {
  const m = (t || "").trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Places "Monday: 9:00 AM – 5:00 PM" → schema.org openingHoursSpecification */
function toHoursSpec(
  lines: string[]
): { dayOfWeek: string; opens: string; closes: string }[] {
  const spec: { dayOfWeek: string; opens: string; closes: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!m) continue;
    const day = m[1];
    const rest = m[2];
    if (/closed/i.test(rest)) continue;
    const parts = rest.split(/[–—]| - /).map((s) => s.trim());
    if (parts.length < 2) continue;
    const opens = to24h(parts[0]);
    const closes = to24h(parts[1]);
    if (opens && closes) spec.push({ dayOfWeek: day, opens, closes });
  }
  return spec;
}

/** All the phone formats a profile/business row might use. */
function phoneVariants(phone: string): string[] {
  const digits = (phone || "").replace(/\D/g, "");
  const set = new Set<string>();
  if (phone) set.add(phone);
  if (digits) {
    set.add(digits);
    set.add(`+${digits}`);
  }
  return [...set].filter(Boolean);
}

/**
 * The WhatsApp connect flow stores `profiles.phone` without a "+", while the
 * onboarding form stores `business_profiles.user_phone` with one — so we try
 * every format before giving up. (This mismatch silently disabled enrichment.)
 */
async function findBusinessProfileByPhone(phone: string) {
  for (const v of phoneVariants(phone)) {
    const { data } = await supabaseAdmin
      .from("business_profiles")
      .select("*")
      .eq("user_phone", v)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

/** Point the trader's legacy `users` row at their website (any phone format). */
async function setUserWebsiteUrl(phone: string, url: string) {
  const variants = phoneVariants(phone);
  for (const v of variants) {
    const { data } = await supabaseAdmin
      .from("users")
      .update({ website_url: url })
      .eq("phone", v)
      .select("id");
    if (data && data.length > 0) return true;
  }
  // No row yet (e.g. a trader who never went through the WhatsApp flow) —
  // create a minimal one so the auto-update pipeline can find them.
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .insert({ phone: variants[0], website_url: url });
    if (error) console.warn("⚠️ Could not create users row:", error.message);
    return !error;
  } catch (e: any) {
    console.warn("⚠️ Could not create users row:", e?.message || e);
    return false;
  }
}

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. AI copywriter — the ONLY LLM call in the whole build
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type SiteCopy = {
  templateType: string;
  tagline: string;
  hero: { headline: string; subheadline: string };
  about: string;
  services: { title: string; description: string }[];
  seo: { title: string; description: string };
  /** AEO: visible Q&A that answer engines quote (also emitted as FAQPage schema). */
  faqs: { q: string; a: string }[];
  /** GEO: topical keywords for generative engines. */
  keywords: string[];
  /** GEO: area the business serves. */
  areaServed: string;
};

const FALLBACK_COPY = (businessName: string, category: string): SiteCopy => ({
  templateType: "generic",
  tagline: `Trusted ${category} in your area`,
  hero: {
    headline: `${businessName} — fast, friendly, local`,
    subheadline: `Quality ${category} work, done right the first time. Call us for a free quote.`,
  },
  about: `${businessName} is a local ${category} business. We show up on time, do the job properly, and stand behind our work. Every completed job is posted right here so you can see our workmanship.`,
  services: [
    { title: "General Repairs", description: "Quick, reliable fixes for everyday problems." },
    { title: "Installations", description: "Professional installation done to code." },
    { title: "Emergency Call-Outs", description: "Fast response when you need help now." },
  ],
  seo: {
    title: `${businessName} | ${category} Services`,
    description: `Local ${category} services from ${businessName}. Call today for a free quote.`,
  },
  faqs: [
    { q: `Do you offer free quotes?`, a: `Yes — call ${businessName} and we'll give you a clear, no-obligation quote before any work starts.` },
    { q: `How quickly can you come out?`, a: `We offer same-day and emergency call-outs wherever possible. Call us and we'll give you the earliest slot.` },
    { q: `Which areas do you cover?`, a: `We serve our local area and surrounding neighbourhoods. Call us to confirm your address.` },
    { q: `Is your work guaranteed?`, a: `Yes. We stand behind every job and will always put things right if you're not happy.` },
  ],
  keywords: [category, `local ${category}`, `${category} near me`, `emergency ${category}`],
  areaServed: "",
});

async function writeSiteCopy(params: {
  businessName: string;
  category: string;
  address: string;
  hours: string[];
}): Promise<SiteCopy> {
  const { businessName, category, address, hours } = params;
  try {
    const response = await chatWithFallback({
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert SEO/AEO/GEO copywriter for local trade businesses.
Reply with ONLY a JSON object matching exactly this structure:
{
  "templateType": "one of: ['plumber','hvac','electrician','roofing','handyman','dentist','grocery','hardware','mechanic','generic'] — the trade that fits best",
  "tagline": "max 8 words",
  "hero": { "headline": "max 12 words, benefit-led", "subheadline": "1-2 short sentences" },
  "about": "3 short sentences, plain English, no buzzwords",
  "services": [{ "title": "...", "description": "max 12 words" }, ...],
  "seo": { "title": "max 60 characters, includes city if known", "description": "max 155 characters" },
  "faqs": [{ "q": "short question a customer would ask", "a": "clear 1-2 sentence answer" }, ...],
  "keywords": ["5-8 short local search phrases"],
  "areaServed": "city/town/region served, or empty string"
}
Exactly 4 services and exactly 4 FAQs. The FAQs must be real questions local customers ask
(pricing, emergency availability, service area, guarantees). Write for a local trade business
a non-technical owner would be proud of. Answers must be quotable on their own by AI assistants.`,
        },
        {
          role: "user",
          content:
            `Business: ${businessName}\nTrade/category: ${category || "local trade"}\n` +
            `Address: ${address || "local area"}\n` +
            (hours.length ? `Opening hours: ${hours.join("; ")}\n` : "") +
            `Write the website copy.`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(raw);
    return {
      templateType: parsed.templateType || "generic",
      tagline: parsed.tagline || "",
      hero: {
        headline: parsed.hero?.headline || businessName,
        subheadline: parsed.hero?.subheadline || "",
      },
      about: parsed.about || "",
      services: Array.isArray(parsed.services) && parsed.services.length
        ? parsed.services.slice(0, 4)
        : FALLBACK_COPY(businessName, category).services,
      seo: {
        title: parsed.seo?.title || `${businessName} | ${category}`,
        description: parsed.seo?.description || "",
      },
      faqs:
        Array.isArray(parsed.faqs) && parsed.faqs.length
          ? parsed.faqs
              .slice(0, 5)
              .filter((f: any) => f && f.q && f.a)
              .map((f: any) => ({ q: String(f.q), a: String(f.a) }))
          : FALLBACK_COPY(businessName, category).faqs,
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.slice(0, 10).map((k: any) => String(k))
        : [],
      areaServed: typeof parsed.areaServed === "string" ? parsed.areaServed : "",
    };
  } catch (err: any) {
    console.warn("⚠️ [Website Builder] AI copy fell back to template copy:", err?.message || err);
    return FALLBACK_COPY(businessName, category);
  }
}


// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. buildWebsite — the whole pipeline, idempotent
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function buildWebsite(websiteId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: site } = await supabaseAdmin
      .from("websites")
      .select("*")
      .eq("id", websiteId)
      .maybeSingle();
    if (!site) return { ok: false, error: "Website not found" };

    // Idempotent: already built + live → nothing to do (safe on retries)
    const hasContent = site.content && typeof site.content === "object" && Object.keys(site.content).length > 0;
    if (hasContent && site.status === "live") {
      console.log(`⏭️ [Website Builder] ${site.domain_name} already built — skipping.`);
      return { ok: true };
    }

    await supabaseAdmin
      .from("websites")
      .update({ status: "building", build_started_at: new Date().toISOString(), error: null })
      .eq("id", websiteId);

    // ── COLLECT ──
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("business_name, phone")
      .eq("id", site.user_id)
      .maybeSingle();
    const phone = profile?.phone || "";

    const biz = phone ? await findBusinessProfileByPhone(phone) : null;

    const businessName = biz?.business_name || profile?.business_name || site.domain_name || "Your Business";
    const category = biz?.category || "";
    const address = biz?.address || "";
    const placeId = biz?.google_place_id || null;

    // Google Place Details enrichment (hours, photos, reviews) — silent fallback
    const enrichment = await enrichFromPlaces(placeId);

    // ── WRITE (single LLM call) ──
    const copy = await writeSiteCopy({
      businessName,
      category,
      address,
      hours: enrichment.hours,
    });

    // ── DESIGN ──
    const templateId = pickTemplate(copy.templateType);
    const palette = TEMPLATE_REGISTRY[templateId].colorPalette;
    const templateName = TEMPLATE_REGISTRY[templateId].name;

    const sitePhone = enrichment.phone || phone || "";
    const siteAddress = enrichment.address || address || "";

    const content = {
      businessName,
      tagline: copy.tagline,
      hero: copy.hero,
      about: copy.about,
      services: copy.services,
      phone: sitePhone,
      address: siteAddress,
      mapUrl:
        biz?.google_maps_url ||
        (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : ""),
      reviewLink: biz?.review_link || "",
      hours: enrichment.hours,
      photos: enrichment.photos,
      rating: enrichment.rating,
      userRatingsTotal: enrichment.userRatingsTotal,
      reviews: enrichment.reviews,
      seo: copy.seo,
      // ── AEO / GEO (system-managed, never customer-editable) ──
      faqs: copy.faqs,
      keywords: copy.keywords,
      areaServed: copy.areaServed,
      hoursSpec: toHoursSpec(enrichment.hours),
      geo: enrichment.geo,
      sameAs:
        biz?.google_maps_url ||
        (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : ""),
      seoLocked: true,
      palette,
      templateId,
      templateName,
      domain: site.domain_name || "",
      generatedAt: new Date().toISOString(),
    };

    // ── PUBLISH ──
    const { error: saveErr } = await supabaseAdmin
      .from("websites")
      .update({
        content,
        template_id: templateId,
        reviews_cache: enrichment.reviews,
        reviews_synced_at: enrichment.reviews.length ? new Date().toISOString() : null,
        status: "live",
        preview_ready: true,
        build_finished_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", websiteId);

    if (saveErr) throw saveErr;

    // Wake up the existing auto-update pipeline (WhatsApp post → website_posts)
    if (phone && site.domain_name) {
      await setUserWebsiteUrl(phone, `https://${site.domain_name}`);
    }

    // ── NOTIFY (best effort — never fails the build) ──
    if (phone) {
      const to = phone.replace(/\D/g, "");
      const previewUrl = `${APP_URL}/site/preview/${websiteId}`;
      const liveUrl = site.domain_name ? `https://${site.domain_name}` : previewUrl;
      try {
        await sendMetaText({
          to,
          body:
            `🎉 *Your website is LIVE!*\n\n` +
            `🌐 ${liveUrl}\n` +
            `👀 Sneak peek: ${previewUrl}\n\n` +
            `Every job you post on WhatsApp now appears on your website automatically. ` +
            `Share the link with your customers — that's it. 🚀`,
        });
      } catch (notifyErr: any) {
        console.warn("⚠️ [Website Builder] WhatsApp notice failed:", notifyErr?.message || notifyErr);
      }
    }

    console.log(`🌐 [Website Builder] ${site.domain_name} is live (template: ${templateId}, photos: ${enrichment.photos.length}, reviews: ${enrichment.reviews.length})`);
    return { ok: true };
  } catch (err: any) {
    const message = err?.message || "Build failed";
    console.error("❌ [Website Builder]", message);
    await supabaseAdmin.from("websites").update({ error: message }).eq("id", websiteId);
    return { ok: false, error: message };
  }
}


// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. Review sync (Phase 2) — paid + ACTIVE subscribers only
//     Cadence: REVIEWS_SYNC_DAYS (default 3).
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const REVIEWS_SYNC_DAYS = Math.max(1, Number(process.env.REVIEWS_SYNC_DAYS || 3));

/**
 * Only paid plans with an ACTIVE subscription may spend Google API calls.
 * Plan off / subscription canceled or past-due → false → ZERO API calls.
 */
export async function isReviewSyncAllowed(userId: string): Promise<boolean> {
  try {
    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("selected_plan, subscription_status")
      .eq("id", userId)
      .maybeSingle();
    if (!p) return false;
    const plan = (p.selected_plan || "free").toLowerCase();
    if (!["pro", "growth", "agency"].includes(plan)) return false;
    return (p.subscription_status || "active").toLowerCase() === "active";
  } catch {
    return false;
  }
}

const reviewSig = (r: any) =>
  `${r?.author || ""}|${r?.time || ""}|${String(r?.text || "").slice(0, 40)}`;

/**
 * Refresh one trader's cached Google reviews (exactly 1 Places call).
 * Updates websites.reviews_cache + content rating and pings WhatsApp when a
 * NEW positive review is found. Safe to call on-demand or from the cron.
 */
export async function syncWebsiteReviewsForUser(userId: string): Promise<{
  ok: boolean;
  updated: boolean;
  hasNewReview: boolean;
  error?: string;
}> {
  try {
    const { data: site } = await supabaseAdmin
      .from("websites")
      .select("id, user_id, domain_name, status, content, reviews_cache")
      .eq("user_id", userId)
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!site) return { ok: false, updated: false, hasNewReview: false, error: "no live website" };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone, business_name")
      .eq("id", userId)
      .maybeSingle();
    const phone = profile?.phone || "";

    const biz = phone ? await findBusinessProfileByPhone(phone) : null;
    const placeId = biz?.google_place_id || null;
    if (!placeId) return { ok: false, updated: false, hasNewReview: false, error: "no place id" };

    const enr = await enrichFromPlaces(placeId);
    if (!enr.reviews.length && enr.rating === null) {
      return { ok: false, updated: false, hasNewReview: false, error: "no review data" };
    }

    const prev: any[] = Array.isArray(site.reviews_cache) ? site.reviews_cache : [];
    const prevSigs = new Set(prev.map(reviewSig));
    const newReview = enr.reviews.find((r) => !prevSigs.has(reviewSig(r))) || null;
    const prevContent: any = site.content || {};
    const changed =
      !!newReview ||
      enr.reviews.length !== prev.length ||
      (enr.rating !== null && enr.rating !== prevContent.rating) ||
      (enr.userRatingsTotal !== null && enr.userRatingsTotal !== prevContent.userRatingsTotal);

    const nowIso = new Date().toISOString();

    if (changed) {
      const content = {
        ...prevContent,
        reviews: enr.reviews,
        rating: enr.rating,
        userRatingsTotal: enr.userRatingsTotal,
        reviewsSyncedAt: nowIso,
      };
      const { error: upErr } = await supabaseAdmin
        .from("websites")
        .update({ reviews_cache: enr.reviews, reviews_synced_at: nowIso, content })
        .eq("id", site.id);
      if (upErr) return { ok: false, updated: false, hasNewReview: false, error: upErr.message };
    } else {
      await supabaseAdmin.from("websites").update({ reviews_synced_at: nowIso }).eq("id", site.id);
    }

    // Celebrate a new review (best effort — positive reviews only)
    if (newReview && phone && (newReview.rating || 0) >= 4) {
      try {
        await sendMetaText({
          to: phone.replace(/\D/g, ""),
          body:
            `⭐ *New ${newReview.rating}-star review!*\n\n` +
            `"${String(newReview.text || "").slice(0, 180)}"\n— ${newReview.author}\n\n` +
            `It's already live on your website: https://${site.domain_name} 🎉`,
        });
      } catch (e: any) {
        console.warn("⚠️ [Review Sync] WhatsApp ping failed:", e?.message || e);
      }
    }

    console.log(
      `⭐ [Review Sync] ${site.domain_name}: ${changed ? "updated" : "no change"}${newReview ? " (new review)" : ""}`
    );
    return { ok: true, updated: changed, hasNewReview: !!newReview };
  } catch (err: any) {
    console.error("❌ [Review Sync]", err?.message || err);
    return { ok: false, updated: false, hasNewReview: false, error: err?.message };
  }
}

