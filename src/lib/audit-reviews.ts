// src/lib/audit-reviews.ts
// Server-only data layer for the reviews shown on /gmb-audit-tool.
//
// This is the SINGLE SOURCE OF TRUTH for the review numbers. Both consumers
// read the same object:
//   • the visible reviews section — src/components/reviews/AuditReviewsSection.tsx
//   • the AggregateRating JSON-LD — src/app/gmb-audit-tool/page.tsx
//
// If the two ever drifted, the schema would describe something the page
// doesn't show, which is exactly the guideline violation we removed. So there
// is deliberately no second query anywhere.
//
// Only status='published' rows are ever returned. Moderation happens in /admin.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Minimum number of published ratings before we emit AggregateRating at all.
 *
 * Below this we still render the visible reviews, we just skip the schema.
 * Two reasons: "5.0 from 3 reviews" reads worse than no stars to anyone who
 * looks, and this way the failure mode is silence rather than a thin number.
 */
export const REVIEW_SCHEMA_MIN = 15;

export interface AuditReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  author_name: string | null;
  created_at: string;
}

export interface PublishedAuditReviews {
  /** Newest ratings for display (author + stars + optional comment). */
  display: AuditReviewRow[];
  /** Total published ratings — the number both the page and the schema report. */
  count: number;
  /** Mean rating across every published rating, or null when there are none. */
  average: number | null;
  /** True once there are enough published ratings to justify AggregateRating. */
  readyForSchema: boolean;
}

const EMPTY: PublishedAuditReviews = {
  display: [],
  count: 0,
  average: null,
  readyForSchema: false,
};

function getServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Every published rating, newest first for display, with the average computed
 * over ALL published rows (not just the displayed page — otherwise the number
 * we publish would misdescribe the reviews).
 *
 * The average is computed in JS from a single `rating` column fetch. At the
 * scale this page will see for a long time (tens to low thousands of rows,
 * cached by ISR for an hour) that is a few KB per rebuild. If it ever grows
 * past ~5k published rows, move the mean into a Postgres aggregate/RPC.
 *
 * Never throws: a DB problem renders the page WITHOUT reviews rather than
 * 500-ing the highest-intent page on the site.
 */
export async function getPublishedAuditReviews(
  displayLimit = 12
): Promise<PublishedAuditReviews> {
  const supabase = getServerClient();
  if (!supabase) return EMPTY;

  try {
    const [listRes, ratingRes] = await Promise.all([
      supabase
        .from("audit_reviews")
        .select("id, rating, comment, author_name, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(displayLimit),
      supabase.from("audit_reviews").select("rating").eq("status", "published"),
    ]);

    if (listRes.error) throw listRes.error;
    if (ratingRes.error) throw ratingRes.error;

    const ratings = (ratingRes.data || [])
      .map((r: any) => Number(r.rating))
      .filter((n: number) => Number.isFinite(n));

    const count = ratings.length;
    const average = count
      ? ratings.reduce((sum: number, n: number) => sum + n, 0) / count
      : null;

    return {
      display: (listRes.data || []) as AuditReviewRow[],
      count,
      average,
      readyForSchema: count >= REVIEW_SCHEMA_MIN,
    };
  } catch (err) {
    console.error(
      "getPublishedAuditReviews failed — rendering the page without reviews:",
      err
    );
    return EMPTY;
  }
}

/**
 * The AggregateRating block for JSON-LD, or null when there aren't enough
 * published ratings yet. `ratingCount` (total ratings) is used rather than
 * `reviewCount` because a star-only submission is a rating, not a review.
 */
export function auditAggregateRating(published: PublishedAuditReviews) {
  if (!published.readyForSchema || published.average === null) return null;
  return {
    "@type": "AggregateRating",
    ratingValue: published.average.toFixed(1),
    ratingCount: String(published.count),
    bestRating: 5,
    worstRating: 1,
  };
}

/** Rounded average for display (e.g. 4.6). Null when there are no ratings. */
export function displayAverage(published: PublishedAuditReviews): string | null {
  return published.average === null ? null : published.average.toFixed(1);
}
