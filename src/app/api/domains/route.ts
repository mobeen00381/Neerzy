import { NextResponse } from "next/server";
import {
  DOMAIN_TLDS,
  DOMAIN_PRICE_USD,
  checkDomainAvailability,
  normalizeDomain,
} from "@/lib/domain-registry";

/**
 * POST /api/domains  { action: "check", domain: string }
 *
 * Availability lookup for the dashboard DomainPanel. Uses the real Porkbun
 * check API when keys are configured, otherwise a dev-only DNS probe.
 *
 * If `domain` is already a full domain (contains a dot), only that domain is
 * checked. Otherwise suggestions are checked across the registerable TLDs.
 * Only .com is purchasable at the flat $19 price today (see `buyable`).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, domain } = body || {};

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
        verified: !check.simulated,
      },
    ];

    return NextResponse.json({ query: raw, results });
  } catch (error: any) {
    console.error("❌ Domain check error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
