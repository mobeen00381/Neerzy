/**
 * BUILD WEBSITE — shared constants + helpers.
 *
 * Pricing model (current — the old $99 early-adopter model was retired):
 *   Everyone gets the same deal:
 *     • Website build: FREE (no setup fee)
 *     • Custom domain: $19 once, registered in the customer's own name
 *     • Hosting: free for the first 90 days, then $10/month
 *
 *   Live Google sync (new reviews + profile photos) runs on PAID Neerzy plans
 *   only — see WEBSITE_SYNC_ELIGIBLE_PLANS. A free site is still built from the
 *   trader's real Google Business Profile data; it just does not auto-update.
 *   That keeps Google Places API calls to paying customers.
 */

export const HOSTING_PRICE_USD = 10;

/** Free hosting window (days) — applies to every new website. */
export const HOSTING_FREE_DAYS = 90;
/** Hosting reminder is sent this many days before the free window ends. */
export const HOSTING_NOTICE_DAYS_BEFORE = 7;

/** Hosting subscription price (Paddle Live catalog). */
export const HOSTING_PADDLE_PRICE_ID =
  process.env.PADDLE_HOSTING_PRICE_ID || '';

/**
 * Plans whose websites live-sync with Google (new reviews + profile photos).
 * Free-plan sites are built from the same real data but do not auto-update, so
 * Google Places API calls stay limited to paying customers. This is the gate
 * inside isReviewSyncAllowed() (src/lib/website-builder.ts).
 */
export const WEBSITE_SYNC_ELIGIBLE_PLANS = ['pro', 'growth', 'agency', 'unlimited'];

export function isWebsiteSyncEligiblePlan(plan: string | null | undefined): boolean {
  return WEBSITE_SYNC_ELIGIBLE_PLANS.includes((plan || '').toLowerCase());
}

/** Days left of the free hosting window (null when not in a trial). */
export function hostingDaysLeft(freeUntil?: string | null): number | null {
  if (!freeUntil) return null;
  const end = new Date(freeUntil).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
}
