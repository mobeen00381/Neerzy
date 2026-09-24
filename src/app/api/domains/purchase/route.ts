import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { paddle } from "@/lib/paddle";
import {
  DOMAIN_PRICE_USD,
  DOMAIN_PADDLE_PRICE_ID,
  MAX_TLD_COST_USD,
  PREMIUM_MARKUP,
  TLD_NEEDS_ATTRIBUTES,
  checkDomainAvailability,
  getBuyableTldInfo,
  normalizeDomain,
  premiumCustomerPrice,
  tldOf,
} from "@/lib/domain-registry";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Number of domains each owner may hold.
 *   Free    → 1 (the $19 domain is how a free-plan site goes live)
 *   Pro     → 1 (their own custom domain)
 *   Growth  → 1
 *   Agency  → up to 10 (one per trader/client — matches the 10-trader quota)
 */
const DOMAIN_QUOTA: Record<string, number> = {
  free: 1,
  pro: 1,
  growth: 1,
  agency: 10,
  unlimited: 999, // internal full-power plan (src/lib/plans.ts) — effectively no cap
};

/** Purchase is the flat $19 for every TLD the margin gate allows; only
 *  PREMIUM-priced individual names are quoted at wholesale + PREMIUM_MARKUP. */

let cachedDomainProductId: string | null = null;

/**
 * The Paddle product the $19 domain price belongs to. Premium names are charged
 * with an inline custom price, and Paddle requires every price to hang off a
 * product — env override first, otherwise derived once from the catalog price.
 */
async function domainProductId(): Promise<string> {
  const fromEnv = process.env.PADDLE_DOMAIN_PRODUCT_ID || "";
  if (fromEnv) return fromEnv;
  if (cachedDomainProductId) return cachedDomainProductId;

  const price = await paddle.prices.get(DOMAIN_PADDLE_PRICE_ID);
  const productId = (price as any)?.productId || (price as any)?.product_id || "";
  if (!productId) throw new Error("Could not resolve the domain product in Paddle");
  cachedDomainProductId = String(productId);
  return cachedDomainProductId;
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

    // Live sellable set — `.com` + ccTLDs whose wholesale cost is under the
    // ceiling. The dashboard uses this for its copy, so it can never advertise
    // an extension the checkout would refuse.
    const sellableTlds = (await getBuyableTldInfo()).filter((b) => b.buyable).map((b) => b.tld);

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
      tlds: sellableTlds,
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
    /** Second call from the premium confirm dialog — the trader has seen the
     *  exact price and agreed, so we may charge the inline custom amount. */
    const confirmPremium = body.confirmPremium === true;

    if (!rawDomain) {
      return NextResponse.json({ error: "Please enter a domain name." }, { status: 400 });
    }

    // ── TLD gate: same source of truth the suggestions used ──
    const buyableInfo = await getBuyableTldInfo();
    const tld = tldOf(rawDomain);
    const tldInfo = tld ? buyableInfo.find((b) => b.tld === tld) : undefined;
    const sellableList = buyableInfo.filter((b) => b.buyable).map((b) => b.tld);
    const paperwork = tld ? TLD_NEEDS_ATTRIBUTES[tld] : undefined;

    // Paper-gated first: the trader should learn WHY the local name can't be
    // sold (ABN, CIRA presence, nexus …) rather than just seeing a TLD list.
    if (paperwork) {
      return NextResponse.json(
        {
          error: `${tld} needs registry paperwork we can't collect automatically (${paperwork}) — try ${sellableList.join(", ")} instead.`,
        },
        { status: 400 }
      );
    }
    if (!tldInfo) {
      return NextResponse.json(
        { error: `We support ${sellableList.join(", ")} domains right now.` },
        { status: 400 }
      );
    }
    if (!tldInfo.buyable) {
      // Allowlisted TLD that has crossed the $15 wholesale ceiling.
      return NextResponse.json(
        {
          error: `${tld} isn't available at our $19 price right now — try ${sellableList.join(", ")}.`,
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
            "Custom domains aren't available on this plan. Upgrade to buy your domain.",
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
          error: availability.error
            ? "We couldn't verify that name with the registrar right now. Please try again in a moment."
            : `${rawDomain} is already registered. Try a different name.`,
        },
        { status: 409 }
      );
    }

    // ── Price: flat $19, or wholesale + PREMIUM_MARKUP for premium names ──
    const wholesale = availability.price ?? null;
    const isPremium = availability.premium === true;

    // A premium name with no confirmed wholesale price must never be charged at
    // the flat price — we'd be selling at a loss. Ask the trader to retry.
    if (isPremium && !wholesale) {
      return NextResponse.json(
        {
          error: `${rawDomain} is a premium name and its price could not be confirmed. Please try again, or pick another name.`,
        },
        { status: 409 }
      );
    }

    const quotedPrice = isPremium && wholesale ? premiumCustomerPrice(wholesale) : DOMAIN_PRICE_USD;
    const markupPercent = Math.round((PREMIUM_MARKUP - 1) * 100);

    // Quote first, charge second: the trader sees the exact premium price and
    // confirms. No Paddle transaction exists at this point.
    if (isPremium && !confirmPremium) {
      return NextResponse.json({
        success: false,
        premium: true,
        domain: rawDomain,
        priceUsd: quotedPrice,
        wholesaleUsd: wholesale,
        markupPercent,
        message: `${rawDomain} is a premium domain — $${quotedPrice} (registry premium price + ${markupPercent}% fee).`,
      });
    }

    // Regular names use the catalog $19 price; premium names use an inline
    // custom price so the amount always equals the quote the trader confirmed.
    const items: Parameters<typeof paddle.transactions.create>[0]["items"] = isPremium
      ? [
          {
            quantity: 1,
            price: {
              productId: await domainProductId(),
              description: `Premium domain — ${rawDomain} (1 year)`,
              unitPrice: {
                amount: String(Math.round(quotedPrice * 100)), // Paddle wants cents
                currencyCode: "USD",
              },
            },
          },
        ]
      : [{ priceId: DOMAIN_PADDLE_PRICE_ID, quantity: 1 }];

    const transaction = await paddle.transactions.create({
      items,
      customData: {
        userId: user.id,
        planId: plan, // keeps users.plan valid (ledger + profiles stay consistent)
        domainName: rawDomain,
        businessName: profile?.business_name || "",
        source: "dashboard",
        clientLabel: clientLabel || undefined,
        premium: isPremium,
        priceUsd: quotedPrice,
        wholesaleUsd: wholesale ?? undefined,
      },
    });

    // Pre-provision a row so the dashboard can show "payment processing…"
    // until the webhook flips it to active/failed.
    const baseRow = {
      user_id: user.id,
      domain_name: rawDomain,
      status: "provisioning",
      client_label: clientLabel || null,
      price_paid: quotedPrice,
      paddle_transaction_id: transaction.id,
    };

    // is_premium / wholesale_cost ship in migration 20260918. If an environment
    // has not applied it yet, still record the purchase (just without the
    // accounting split) rather than losing the row.
    let { error: insertErr } = await supabaseAdmin
      .from("domains")
      .insert({ ...baseRow, is_premium: isPremium, wholesale_cost: wholesale });

    if (insertErr) {
      console.warn("⚠️ Domain insert with premium columns failed, retrying without them:", insertErr.message);
      const retry = await supabaseAdmin.from("domains").insert(baseRow);
      insertErr = retry.error;
    }

    if (insertErr) {
      console.error("⚠️ Could not pre-provision domain row:", insertErr);
    }

    return NextResponse.json({
      success: true,
      url: transaction.checkout?.url || "",
      domain: rawDomain,
      priceUsd: quotedPrice,
      premium: isPremium,
    });
  } catch (err: any) {
    console.error("❌ Domain purchase error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}

