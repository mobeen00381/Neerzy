import { NextResponse } from "next/server";
import {
  DOMAIN_TLDS,
  DOMAIN_PRICE_USD,
  checkDomainAvailability,
  normalizeDomain,
  suggestDomains,
} from "@/lib/domain-registry";

/**
 * POST /api/domains
 *
 *   { action: "check",   domain }              → exactly one candidate (legacy)
 *   { action: "suggest", domain, country?, address? }
 *                                              → ordered suggestions: the
 *                                                trader's own country TLD
 *                                                first, then .com/.net, with
 *                                                one "Suggested by Neerzy" pick
 *
 * Uses the real Porkbun check API when keys are configured, otherwise a
 * dev-only DNS probe. Only .com is purchasable at the flat $19 price today
 * (see `buyable`) — local TLDs are shown and suggested, bought later.
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
    // check exactly ONE domain per request. `.com` is the purchasable offer.
    const candidate = raw.includes(".") ? raw : `${raw}.com`;
    const check = await checkDomainAvailability(candidate);

    const results = [
      {
        domain: check.domain,
        available: check.available,
        price: check.price ?? (candidate.endsWith(".com") ? DOMAIN_PRICE_USD : null),
        currency: check.currency,
        simulated: check.simulated,
        buyable: candidate.endsWith(".com"),
        verified: !check.simulated && !check.error,
      },
    ];

    return NextResponse.json({ query: raw, results });
  } catch (error: any) {
    console.error("❌ Domain check error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
