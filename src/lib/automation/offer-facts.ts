// src/lib/automation/offer-facts.ts
/**
 * The website offer, written down ONCE.
 *
 * Every automated email that mentions money or a promise about the website
 * product reads its numbers from here, and every number here comes from the
 * billing constants - never from a sentence someone typed into a template.
 * That is the whole point: an outbound email that quotes the wrong price is a
 * refund, a complaint and (in the UK) a pricing-transparency problem.
 *
 * Verified against src/app/website-builder/page.tsx and the billing constants:
 *   - website build + preview: FREE, no setup fee, no card to preview
 *   - publishing on a custom domain: $19 ONCE, registered in the customer's
 *     name (DOMAIN_PRICE_USD - the same value Porkbun registration is billed at)
 *   - hosting: free for the first 90 days, then $10/month
 *     (HOSTING_FREE_DAYS / HOSTING_PRICE_USD)
 *   - live Google sync needs a paid Neerzy plan, so it is NEVER promised in
 *     these emails (WEBSITE_SYNC_ELIGIBLE_PLANS gates it in the product)
 *
 * If a price changes, it changes in website.ts / domain-registry.ts and this
 * file follows automatically. Anything that needs a NEW claim must be checked
 * against the live pages first - do not add adjectives here.
 */

import { DOMAIN_PRICE_USD } from "@/lib/domain-registry";
import { HOSTING_FREE_DAYS, HOSTING_PRICE_USD } from "@/lib/website";

/** Numbers only - formatting lives in OFFER_NUMBERS below. */
export const OFFER_FACTS = {
  /** FREE build/preview: the $99 early-adopter setup fee was retired. */
  buildFeeUsd: 0,
  /** One-off domain registration - the only payment that unlocks publishing. */
  publishPriceUsd: DOMAIN_PRICE_USD,
  /** Free hosting window that starts when the site goes live. */
  hostingFreeDays: HOSTING_FREE_DAYS,
  /** Hosting price AFTER the free window. */
  hostingMonthlyUsd: HOSTING_PRICE_USD,
} as const;

/** Pre-formatted prices for copy. Keep the $ inside so callers never build money. */
export const OFFER_NUMBERS = {
  publish: `$${OFFER_FACTS.publishPriceUsd}`,
  hostingMonthly: `$${OFFER_FACTS.hostingMonthlyUsd}/month`,
  hostingFree: `${OFFER_FACTS.hostingFreeDays} days`,
  build: "free",
} as const;

/** Public pages the automated emails link to. */
export const WEBSITE_PREVIEW_PATH = "/website-builder";
export const AUDIT_TOOL_PATH = "/gmb-audit-tool";

/** Same base URL the rest of lib/ uses (trailing slashes stripped). */
export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.neerzy.com").replace(/\/+$/, "");
}

/** Where a lead can build a free preview of their own site. */
export function websitePreviewUrl(): string {
  return `${appBaseUrl()}${WEBSITE_PREVIEW_PATH}`;
}

/**
 * The three-line offer, plain text. Used by every "here is what it costs"
 * paragraph so HTML and text versions cannot disagree.
 */
export const OFFER_LINES: readonly string[] = [
  `Website build: free - no setup fee, no card to preview it.`,
  `Publish on your own domain: ${OFFER_NUMBERS.publish} once, registered in your name.`,
  `Hosting: free for the first ${OFFER_NUMBERS.hostingFree}, then ${OFFER_NUMBERS.hostingMonthly}.`,
] as const;

/**
 * The one sentence that must never be dropped: publishing is the paid step, and
 * the price is a one-off domain registration rather than a subscription trap.
 */
export const OFFER_PUBLISH_NOTE =
  `The build and the preview cost nothing. The single payment is the ${OFFER_NUMBERS.publish} ` +
  `domain, once, in your name - hosting is free for the first ${OFFER_NUMBERS.hostingFree}.`;

/** Where a happy lead is asked to leave a review. Empty string = not configured. */
export function reviewInviteUrl(): string {
  const value = (
    process.env.NEERZY_REVIEW_URL ||
    process.env.NEXT_PUBLIC_NEERZY_REVIEW_URL ||
    ""
  ).trim();
  return /^https?:\/\/\S+$/i.test(value) ? value : "";
}

