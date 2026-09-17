import { NextResponse } from "next/server";
import {
  DOMAIN_PRICE_USD,
  checkDomainAvailability,
  getBuyableTlds,
  normalizeDomain,
  suggestDomains,
  tldOf,
} from "@/lib/domain-registry";

/**
 * POST /api/domains
 *
 *   { action: "check",   domain }              → exactly one candidate (legacy)
 *   { action: "suggest", domain, country?, address? }
 *                                              → ordered suggestions: the
 *                                                trader's own country TLD
 *                                                first, then the local-style
 *                                                name+country+.com fallback,
 *                                                then plain .com, with one
 *                                                "Suggested by Neerzy" pick
 *
 * Uses the real Porkbun check API when keys are configured, otherwise a
 * dev-only DNS probe. `buyable` is decided per request by getBuyableTlds() —
 * `.com` plus allowlisted ccTLDs whose live wholesale cost is under the $15
 * ceiling — so the UI never offers a name the checkout would refuse.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, domain } = body || {};

    // ── Suggestions (business name → ranked list with badges) ──
    if (action === "suggest") {
      const raw = normalizeDomain(domain || "");
      if (!raw) {
        return NextResponse.json({ error: "Please enter a business name or domain." }, { status: 400 });
      }
      const country = typeof body.country === "string" ? body.country : null;
      const address = typeof body.address === "string" ? body.address : null;

      const { query, country: detected, suggestions } = await suggestDomains(raw, {
        country,
        address,
      });

      return NextResponse.json({ query, country: detected, suggestions });
    }

    if (action !== "check") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const raw = normalizeDomain(domain || "");
    if (!raw) {
      return NextResponse.json({ error: "Please enter a business name or domain." }, { status: 400 });
    }

    // Porkbun rate-limits availability lookups (~1 per 10s per API key), so we
    // check exactly ONE domain per request. A bare name means ".com".
    const candidate = raw.includes(".") ? raw : `${raw}.com`;
    const check = await checkDomainAvailability(candidate, { allowStaleCache: true });

    // `buyable` comes from the live margin gate, not a hardcoded TLD list.
    const buyableTlds = await getBuyableTlds();
    const buyable = buyableTlds.includes(tldOf(candidate) || "");

    const results = [
      {
        domain: check.domain,
        available: check.available,
        price: buyable ? DOMAIN_PRICE_USD : check.price ?? null,
        currency: check.currency,
        simulated: check.simulated,
        buyable,
        premium: check.premium === true,
        verified: !check.simulated && !check.error,
      },
    ];

    return NextResponse.json({ query: raw, results });
  } catch (error: any) {
    console.error("❌ Domain check error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
