/**
 * BUILD WEBSITE — shared constants + helpers.
 *
 * Pricing model:
 *   Early adopters (website created before WEBSITE_EARLY_ADOPTER_ENDS):
 *     • $99 setup fee WAIVED FOREVER
 *     • hosting free for their first 90 days, then $10/month
 *   Everyone after the window:
 *     • pay $99 setup + $10/mo hosting BEFORE the build starts
 */

export const WEBSITE_SETUP_PRICE_USD = 99;
export const HOSTING_PRICE_USD = 10;

/** Free hosting window (days) for early adopters. */
export const HOSTING_FREE_DAYS = 90;
/** Hosting reminder is sent this many days before the free window ends. */
export const HOSTING_NOTICE_DAYS_BEFORE = 7;

/**
 * End of the early-adopter window. Anyone who builds a website BEFORE this
 * date keeps the $99 setup fee waived forever. Defaults to 90 days after
 * launch (2026-09-10) when the env var is not set.
 */
export const WEBSITE_EARLY_ADOPTER_ENDS =
  process.env.WEBSITE_EARLY_ADOPTER_ENDS || '2026-12-09T23:59:59.000Z';

/** Paddle price IDs (Live catalog). */
export const WEBSITE_SETUP_PADDLE_PRICE_ID =
  process.env.PADDLE_WEBSITE_SETUP_PRICE_ID || '';
export const HOSTING_PADDLE_PRICE_ID =
  process.env.PADDLE_HOSTING_PRICE_ID || '';

/** Plans allowed to build a website (inherited from the domain gate). */
export const WEBSITE_ELIGIBLE_PLANS = ['pro', 'growth', 'agency', 'unlimited'];

export function isWebsiteEligiblePlan(plan: string | null | undefined): boolean {
  return WEBSITE_ELIGIBLE_PLANS.includes((plan || '').toLowerCase());
}

/** True while the early-adopter window is still open. */
export function isEarlyAdopterWindowOpen(now: Date = new Date()): boolean {
  const ends = new Date(WEBSITE_EARLY_ADOPTER_ENDS);
  if (Number.isNaN(ends.getTime())) return true; // fail-open to be generous
  return now.getTime() <= ends.getTime();
}

/** Days left of the free hosting window (null when not in a trial). */
export function hostingDaysLeft(freeUntil?: string | null): number | null {
  if (!freeUntil) return null;
  const end = new Date(freeUntil).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
}
