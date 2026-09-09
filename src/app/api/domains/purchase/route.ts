import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { paddle } from "@/lib/paddle";
import {
  DOMAIN_PRICE_USD,
  DOMAIN_TLDS,
  DOMAIN_PADDLE_PRICE_ID,
  checkDomainAvailability,
  isRegisterableDomain,
  normalizeDomain,
} from "@/lib/domain-registry";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Number of domains each plan may own.
 *   Pro     → 1 (their own custom domain)
 *   Growth  → 1
 *   Agency  → up to 10 (one per trader/client — matches the 10-trader quota)
 *   Free / everything else → 0 (locked card + upgrade prompt in dashboard)
 */
const DOMAIN_QUOTA: Record<string, number> = {
  pro: 1,
  growth: 1,
  agency: 10,
};

/** Purchase is flat $19 — matches every pricing page / FAQ. Only .com is buyable. */
function isBuyable(domain: string): boolean {
  return domain.toLowerCase().endsWith(".com");
}

async function authenticate(authHeader: string | null) {
  const { data, error } = await supabaseAdmin.auth.getUser(
    (authHeader || "").replace("Bearer ", "")
  );
  if (error || !data?.user) return null;
  return data.user;
}

// GET /api/domains/purchase → quota + owned domains for the DomainPanel card
export async function GET(req: Request) {
  try {
    const user = await authenticate(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("selected_plan, business_name")
      .eq("id", user.id)
      .maybeSingle();

    const plan = (profile?.selected_plan || "free").toLowerCase();
    const quota = DOMAIN_QUOTA[plan] || 0;

    const { data: domains, error: domainErr } = await supabaseAdmin
      .from("domains")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (domainErr) {
      console.error("❌ Failed to list domains:", domainErr);
    }

    return NextResponse.json({
      plan,
      eligible: quota > 0,
      quota,
      priceUsd: DOMAIN_PRICE_USD,
      tlds: DOMAIN_TLDS,
      domains: domains || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load domains" }, { status: 500 });
  }
}

// POST /api/domains/purchase → plan-gate → availability re-check → Paddle checkout
export async function POST(req: Request) {
  try {
    const user = await authenticate(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const rawDomain = normalizeDomain(body.domain || "");
    const clientLabel =
      typeof body.clientLabel === "string" ? body.clientLabel.trim().slice(0, 60) : "";

    if (!rawDomain) {
      return NextResponse.json({ error: "Please enter a domain name." }, { status: 400 });
    }
    if (!isRegisterableDomain(rawDomain)) {
      return NextResponse.json(
        { error: `We support ${DOMAIN_TLDS.join(", ")} domains right now.` },
        { status: 400 }
      );
    }
    if (!isBuyable(rawDomain)) {
      return NextResponse.json(
        {
          error:
            "Flat-price ($19) registration is available on .com for now — enter your name followed by .com.",
        },
        { status: 400 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("selected_plan, business_name")
      .eq("id", user.id)
      .maybeSingle();

    const plan = (profile?.selected_plan || "free").toLowerCase();
    const quota = DOMAIN_QUOTA[plan] || 0;

    if (quota === 0) {
      return NextResponse.json(
        {
          error:
            "Custom domains are included with the Pro, Growth, and Agency plans. Upgrade to buy your domain.",
        },
        { status: 403 }
      );
    }

    // Quota: active + provisioning rows count against the limit.
    const { count, error: countErr } = await supabaseAdmin
      .from("domains")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["active", "provisioning"]);

    if (countErr) console.error("❌ Failed to count domains:", countErr);
    if ((count || 0) >= quota) {
      return NextResponse.json(
        {
          error:
            plan === "agency"
              ? `Your Agency plan includes up to ${quota} domains (one per trader). You've used all ${quota}.`
              : "You already own your plan's custom domain. Check your Account → Custom Domain card.",
        },
        { status: 403 }
      );
    }

    // Authoritative re-check before charging (never trust a stale UI result).
    const availability = await checkDomainAvailability(rawDomain);
    if (!availability.available) {
      return NextResponse.json(
        {
          error: `${rawDomain} is already registered${availability.simulated ? " (lookup could not be verified)" : ""}. Try a different name.`,
        },
        { status: 409 }
      );
    }

    // Create a Paddle one-time $19 transaction.
    const transaction = await paddle.transactions.create({
      items: [{ priceId: DOMAIN_PADDLE_PRICE_ID, quantity: 1 }],
      customData: {
        userId: user.id,
        planId: plan, // keeps users.plan valid (ledger + profiles stay consistent)
        domainName: rawDomain,
        businessName: profile?.business_name || "",
        source: "dashboard",
        clientLabel: clientLabel || undefined,
      },
    });

    // Pre-provision a row so the dashboard can show "payment processing…"
    // until the webhook flips it to active/failed.
    const { error: insertErr } = await supabaseAdmin.from("domains").insert({
      user_id: user.id,
      domain_name: rawDomain,
      status: "provisioning",
      client_label: clientLabel || null,
      price_paid: DOMAIN_PRICE_USD,
      paddle_transaction_id: transaction.id,
    });

    if (insertErr) {
      console.error("⚠️ Could not pre-provision domain row:", insertErr);
    }

    return NextResponse.json({
      success: true,
      url: transaction.checkout?.url || "",
      domain: rawDomain,
    });
  } catch (err: any) {
    console.error("❌ Domain purchase error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}

