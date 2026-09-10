import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { paddle } from "@/lib/paddle";
import {
  HOSTING_FREE_DAYS,
  HOSTING_PADDLE_PRICE_ID,
  HOSTING_PRICE_USD,
  WEBSITE_SETUP_PADDLE_PRICE_ID,
  WEBSITE_SETUP_PRICE_USD,
  hostingDaysLeft,
  isEarlyAdopterWindowOpen,
  isWebsiteEligiblePlan,
} from "@/lib/website";
import { buildWebsite } from "@/lib/website-builder";
import { TEMPLATE_REGISTRY } from "@/lib/templates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function authenticate(authHeader: string | null) {
  const { data, error } = await supabaseAdmin.auth.getUser(
    (authHeader || "").replace("Bearer ", "")
  );
  if (error || !data?.user) return null;
  return data.user;
}

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Editor whitelist — ONLY these fields are customer-writable.
//  SEO / AEO / GEO fields (seo, faqs, keywords, areaServed, hoursSpec, geo,
//  rating, reviews, palette) are system-managed and never accepted here.
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LIMITS = {
  tagline: 60,
  headline: 90,
  subheadline: 200,
  about: 1000,
  serviceTitle: 60,
  serviceDesc: 140,
  address: 150,
  hour: 60,
  url: 300,
} as const;

/** Plain single-line text (strips any HTML the client might send). */
function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Plain multi-line text (keeps line breaks, strips HTML). */
function cleanMultiline(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/<[^>]*>/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

/** https URLs only, and only from trusted hosts (our storage or Google photos). */
function cleanPhotoUrl(v: unknown): string {
  if (typeof v !== "string") return "";
  const u = v.trim();
  if (!/^https:\/\/[^\s]+$/i.test(u)) return "";
  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/`;
  if (storageBase && storageBase !== "/storage/v1/object/public/" && u.startsWith(storageBase)) return u.slice(0, LIMITS.url);
  if (u.startsWith("https://places.googleapis.com/")) return u.slice(0, LIMITS.url);
  if (u.startsWith("https://maps.googleapis.com/")) return u.slice(0, LIMITS.url);
  return "";
}

function cleanLink(v: unknown): string {
  if (typeof v !== "string") return "";
  const u = v.trim();
  return /^https:\/\/[^\s]+$/i.test(u) ? u.slice(0, LIMITS.url) : "";
}

function cleanPhone(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  return /^[+()\-\s\d]{5,20}$/.test(s) ? s : "";
}

type AccountContext = {
  plan: string;
  businessName: string;
  phone: string;
  eligible: boolean;
  domainId: string | null;
  domainName: string | null;
  website: any | null;
  earlyAdopter: boolean;
};

/**
 * Loads everything the dashboard needs in one shot:
 * plan eligibility, the user's active custom domain (the hard gate), their
 * website row, and whether they are inside the early-adopter window.
 */
async function loadAccountContext(userId: string): Promise<AccountContext> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("selected_plan, business_name, phone")
    .eq("id", userId)
    .maybeSingle();

  const plan = (profile?.selected_plan || "free").toLowerCase();

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("id, domain_name")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: website } = await supabaseAdmin
    .from("websites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    plan,
    businessName: profile?.business_name || "",
    phone: profile?.phone || "",
    eligible: isWebsiteEligiblePlan(plan),
    domainId: domain?.id || null,
    domainName: domain?.domain_name || null,
    website: website || null,
    // Once a website exists its own flag wins (early adopters keep the waiver).
    earlyAdopter: website?.setup_waived ? true : isEarlyAdopterWindowOpen(),
  };
}

// GET /api/websites → everything the BUILD WEBSITE button + panel need
export async function GET(req: Request) {
  try {
    const user = await authenticate(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const ctx = await loadAccountContext(user.id);
    const site = ctx.website;
    const daysLeft = hostingDaysLeft(site?.free_until || null);

    // Latecomer who has not paid yet (or was created before the window closed).
    const needsSetupPayment =
      !!site && !site.setup_waived && !site.setup_paid && site.status === "pending";

    // Early adopter whose 90 free hosting days ran out (or hosting was canceled).
    const hostingUnpaid =
      !!site &&
      (site.hosting_status === "none" || site.hosting_status === "canceled" || site.hosting_status === "trial") &&
      daysLeft !== null &&
      daysLeft < 0;

    return NextResponse.json({
      plan: ctx.plan,
      eligible: ctx.eligible,
      hasActiveDomain: !!ctx.domainId,
      domainName: ctx.domainName,
      earlyAdopter: ctx.earlyAdopter,
      website: site,
      freeDaysLeft: daysLeft,
      needsSetupPayment,
      hostingUnpaid,
      prices: { setup: WEBSITE_SETUP_PRICE_USD, hosting: HOSTING_PRICE_USD },
    });
  } catch (err: any) {
    console.error("❌ Website GET error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to load website" }, { status: 500 });
  }
}

// POST /api/websites  { action: "start" | "checkout" }
export async function POST(req: Request) {
  try {
    const user = await authenticate(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    const ctx = await loadAccountContext(user.id);

    if (!ctx.eligible) {
      return NextResponse.json(
        {
          error:
            "Custom websites are available on the Pro, Growth, and Agency plans. Upgrade to build your website.",
        },
        { status: 403 }
      );
    }

    // The domain is the hard gate — no domain, no website.
    if (!ctx.domainId) {
      return NextResponse.json(
        {
          error: "Buy your custom domain first — your website is built on it.",
          needsDomain: true,
        },
        { status: 409 }
      );
    }

    // ── start: create (or restart) the website row ──
    if (action === "start") {
      const existing = ctx.website;

      // Already running/live → nothing to start; a pending row needs payment.
      if (existing && existing.status !== "paused") {
        return NextResponse.json({
          success: true,
          website: existing,
          earlyAdopter: !!existing.setup_waived,
          checkoutRequired: existing.status === "pending",
        });
      }

      const earlyAdopter = isEarlyAdopterWindowOpen();
      const freeUntil = earlyAdopter
        ? new Date(Date.now() + HOSTING_FREE_DAYS * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const payload: Record<string, unknown> = {
        user_id: user.id,
        domain_id: ctx.domainId,
        domain_name: ctx.domainName,
        status: earlyAdopter ? "building" : "pending",
        setup_waived: earlyAdopter,
        hosting_status: earlyAdopter ? "trial" : "none",
        free_until: freeUntil,
        error: null,
      };

      let saved: any = null;
      if (existing) {
        // Restarting a paused website keeps its original waiver + payment state.
        const { data } = await supabaseAdmin
          .from("websites")
          .update({
            ...payload,
            setup_waived: existing.setup_waived || earlyAdopter,
            setup_paid: existing.setup_paid,
            hosting_status:
              existing.hosting_status === "active" ? "active" : earlyAdopter ? "trial" : "none",
            free_until: existing.free_until || freeUntil,
            status: existing.setup_paid || existing.setup_waived ? "building" : "pending",
          })
          .eq("id", existing.id)
          .select()
          .single();
        saved = data;
      } else {
        const { data, error } = await supabaseAdmin
          .from("websites")
          .insert(payload as any)
          .select()
          .single();
        if (error) {
          console.error("❌ Failed to create website row:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        saved = data;
      }

      console.log(`🚧 Website ${earlyAdopter ? "started (early adopter — $99 waived)" : "created (payment required)"} for ${user.id}`);

      return NextResponse.json({
        success: true,
        website: saved,
        earlyAdopter,
        checkoutRequired: !earlyAdopter,
      });
    }

    // ── checkout: $99 setup (latecomers) + $10/mo hosting ──
    if (action === "checkout") {
      const site = ctx.website;
      if (!site) {
        return NextResponse.json({ error: "Start your website build first." }, { status: 400 });
      }

      const needsSetup = !site.setup_waived && !site.setup_paid;
      const needsHosting = site.hosting_status !== "active";

      const items: { priceId: string; quantity: number }[] = [];
      if (needsSetup) {
        if (!WEBSITE_SETUP_PADDLE_PRICE_ID) {
          return NextResponse.json(
            { error: "Website checkout isn't configured yet (missing PADDLE_WEBSITE_SETUP_PRICE_ID)." },
            { status: 500 }
          );
        }
        items.push({ priceId: WEBSITE_SETUP_PADDLE_PRICE_ID, quantity: 1 });
      }
      if (needsHosting) {
        if (!HOSTING_PADDLE_PRICE_ID) {
          return NextResponse.json(
            { error: "Website checkout isn't configured yet (missing PADDLE_HOSTING_PRICE_ID)." },
            { status: 500 }
          );
        }
        items.push({ priceId: HOSTING_PADDLE_PRICE_ID, quantity: 1 });
      }

      if (items.length === 0) {
        return NextResponse.json({ success: true, alreadyActive: true });
      }

      const transaction = await paddle.transactions.create({
        items,
        customData: {
          userId: user.id,
          websiteId: site.id,
          source: "website",
          setupIncluded: needsSetup ? "yes" : "no",
        },
      });

      await supabaseAdmin
        .from("websites")
        .update({ paddle_transaction_id: transaction.id })
        .eq("id", site.id);

      console.log(`💳 Website checkout created for ${user.id} (setup=${needsSetup ? 99 : 0}, hosting=${needsHosting ? 10 : 0})`);

      return NextResponse.json({
        success: true,
        url: transaction.checkout?.url || "",
        setupIncluded: needsSetup,
        hostingIncluded: needsHosting,
      });
    }

    // ── build: generate the website (collect → AI copy → template → live) ──
    if (action === "build") {
      const site = ctx.website;
      if (!site) {
        return NextResponse.json({ error: "Start your website build first." }, { status: 400 });
      }
      // Latecomers must pay before the build runs.
      if (site.status === "pending" && !site.setup_waived && !site.setup_paid) {
        return NextResponse.json(
          { error: "Payment is required before we build your website.", needsPayment: true },
          { status: 402 }
        );
      }

      const result = await buildWebsite(site.id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error || "Build failed" }, { status: 500 });
      }

      const fresh = await loadAccountContext(user.id);
      return NextResponse.json({ success: true, website: fresh.website });
    }

    // ── save_content: owner edits (whitelist only — SEO/AEO/GEO stay locked) ──
    if (action === "save_content") {
      const site = ctx.website;
      if (!site) {
        return NextResponse.json({ error: "Start your website build first." }, { status: 400 });
      }

      const patch: any = body.patch || {};
      const prev: any = site.content || {};

      // Services: 2–6, sanitized
      let services = prev.services || [];
      if (Array.isArray(patch.services)) {
        const cleaned = patch.services
          .slice(0, 6)
          .map((s: any) => ({
            title: cleanText(s?.title, LIMITS.serviceTitle),
            description: cleanText(s?.description, LIMITS.serviceDesc),
          }))
          .filter((s: any) => s.title.length > 0);
        if (cleaned.length >= 2) services = cleaned;
      }

      const content = {
        // keep every system-managed field (seo, faqs, keywords, areaServed,
        // hoursSpec, geo, rating, userRatingsTotal, reviews, palette, ...)
        ...prev,
        tagline: patch.tagline !== undefined ? cleanText(patch.tagline, LIMITS.tagline) : prev.tagline,
        hero: {
          headline:
            patch?.hero?.headline !== undefined
              ? cleanText(patch.hero.headline, LIMITS.headline)
              : prev?.hero?.headline,
          subheadline:
            patch?.hero?.subheadline !== undefined
              ? cleanText(patch.hero.subheadline, LIMITS.subheadline)
              : prev?.hero?.subheadline,
        },
        about: patch.about !== undefined ? cleanMultiline(patch.about, LIMITS.about) : prev.about,
        services,
        phone: patch.phone !== undefined ? (cleanPhone(patch.phone) || prev.phone) : prev.phone,
        address: patch.address !== undefined ? cleanText(patch.address, LIMITS.address) : prev.address,
        hours: Array.isArray(patch.hours)
          ? patch.hours.map((h: any) => cleanText(h, LIMITS.hour)).filter(Boolean).slice(0, 7)
          : prev.hours,
        photos: Array.isArray(patch.photos)
          ? patch.photos.map(cleanPhotoUrl).filter(Boolean).slice(0, 8)
          : prev.photos,
        reviewLink: patch.reviewLink !== undefined ? (cleanLink(patch.reviewLink) || prev.reviewLink) : prev.reviewLink,
        mapUrl: patch.mapUrl !== undefined ? (cleanLink(patch.mapUrl) || prev.mapUrl) : prev.mapUrl,
        // section visibility toggles (cosmetic only — never SEO data)
        showHours: patch.showHours !== undefined ? !!patch.showHours : prev.showHours,
        showReviews: patch.showReviews !== undefined ? !!patch.showReviews : prev.showReviews,
        showGallery: patch.showGallery !== undefined ? !!patch.showGallery : prev.showGallery,
        updatedByOwnerAt: new Date().toISOString(),
      };

      const { error: saveErr } = await supabaseAdmin
        .from("websites")
        .update({ content })
        .eq("id", site.id);

      if (saveErr) {
        console.error("❌ Failed to save website content:", saveErr);
        return NextResponse.json({ error: saveErr.message }, { status: 500 });
      }

      console.log(`✏️ Website content updated by owner ${user.id} (SEO fields preserved)`);
      return NextResponse.json({ success: true, content });
    }

    // ── set_template: change the look (palette) only ──
    if (action === "set_template") {
      const site = ctx.website;
      if (!site) {
        return NextResponse.json({ error: "Start your website build first." }, { status: 400 });
      }
      const templateId = String(body.templateId || "");
      const def = (TEMPLATE_REGISTRY as any)[templateId];
      if (!def) {
        return NextResponse.json({ error: "Unknown template." }, { status: 400 });
      }

      const content = {
        ...(site.content || {}),
        templateId,
        templateName: def.name,
        palette: def.colorPalette,
      };

      const { error: tErr } = await supabaseAdmin
        .from("websites")
        .update({ content, template_id: templateId })
        .eq("id", site.id);
      if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

      return NextResponse.json({ success: true, content, templateId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("❌ Website POST error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Could not update your website. Please try again." },
      { status: 500 }
    );
  }
}

