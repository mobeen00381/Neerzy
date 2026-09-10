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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("❌ Website POST error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Could not update your website. Please try again." },
      { status: 500 }
    );
  }
}

