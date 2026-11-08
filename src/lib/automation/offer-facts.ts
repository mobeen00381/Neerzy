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
 * Verified against the product as it actually works today:
 *   - preview: the on-page preview on /website-builder is FREE and needs NO
 *     account. It is a mock built from the visitor's Google listing - that is
 *     the only free, no-account step in the funnel
 *   - the real build: needs a FREE ACCOUNT and a PAID custom domain first, so
 *     nothing here may say the build itself is free
 *   - the domain: $19 ONCE for standard names, registered in the customer's
 *     name (DOMAIN_PRICE_USD - the same value Porkbun registration is billed
 *     at). Premium names cost more, and the price is shown before purchase
 *   - hosting: free for the first 90 days after the site is built, then $10/month
 *     (HOSTING_FREE_DAYS / HOSTING_PRICE_USD). The clock starts when the build
 *     starts (free_until is set in /api/websites), NOT at publish — so no copy
 *     here may date the free window from the publish step
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
  /** No setup fee of any kind - the $99 early-adopter fee stays retired. */
  buildFeeUsd: 0,
  /** One-off domain registration - the payment that unlocks the real build. */
  publishPriceUsd: DOMAIN_PRICE_USD,
  /** Free hosting window — starts when the site is BUILT (free_until is set in
   *  /api/websites at build start), not when it is published. */
  hostingFreeDays: HOSTING_FREE_DAYS,
  /** Hosting price AFTER the free window. */
  hostingMonthlyUsd: HOSTING_PRICE_USD,
} as const;

/** Pre-formatted prices for copy. Keep the $ inside so callers never build money. */
export const OFFER_NUMBERS = {
  publish: `$${OFFER_FACTS.publishPriceUsd}`,
  hostingMonthly: `$${OFFER_FACTS.hostingMonthlyUsd}/month`,
  hostingFree: `${OFFER_FACTS.hostingFreeDays} days`,
} as const;

/** Public pages the automated emails link to. */
export const WEBSITE_PREVIEW_PATH = "/website-builder";
export const AUDIT_TOOL_PATH = "/gmb-audit-tool";

/** Same base URL the rest of lib/ uses (trailing slashes stripped). */
export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.neerzy.com").replace(/\/+$/, "");
}

/** Where a lead can preview a mock of their own site - free, no account. */
export function websitePreviewUrl(): string {
  return `${appBaseUrl()}${WEBSITE_PREVIEW_PATH}`;
}

/**
 * The three-line offer, plain text. Used by every "here is what it costs"
 * paragraph so HTML and text versions cannot disagree.
 *
 * Only the preview is free and account-free. The real build needs a free
 * account plus a paid domain, so no line here may call the build free.
 */
export const OFFER_LINES: readonly string[] = [
  `Preview a site made from your Google listing: free, no account needed.`,
  `To build and publish the real site you register your own domain: ${OFFER_NUMBERS.publish} once for standard names, in your name.`,
  `Hosting is free for the first ${OFFER_NUMBERS.hostingFree}, then ${OFFER_NUMBERS.hostingMonthly}.`,
] as const;

/**
 * The one paragraph that must never be dropped: the free, no-account step is the
 * preview; the real build starts with the paid domain, registered in the
 * customer's name (premium names cost more, price shown before purchase).
 */
export const OFFER_PUBLISH_NOTE =
  `The preview is free and needs no account. To build and publish the real site you need a free ` +
  `account and your own domain: ${OFFER_NUMBERS.publish} once for standard names, in your name ` +
  `(premium names cost more, and the price is shown before you buy). Hosting is free for the first ` +
  `${OFFER_NUMBERS.hostingFree}, then ${OFFER_NUMBERS.hostingMonthly}.`;

/** Where a happy lead is asked to leave a review. Empty string = not configured. */
export function reviewInviteUrl(): string {
  const value = (
    process.env.NEERZY_REVIEW_URL ||
    process.env.NEXT_PUBLIC_NEERZY_REVIEW_URL ||
    ""
  ).trim();
  return /^https?:\/\/\S+$/i.test(value) ? value : "";
}

