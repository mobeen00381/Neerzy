// src/lib/lead-priority.ts
/**
 * HOT / WARM / COLD triage for Admin -> Leads.
 *
 * Pure and dependency-free on purpose: /api/admin/leads (list) and
 * /api/admin/export (CSV) both call it, so the badge in the table and the
 * Priority column in the spreadsheet can never disagree - and changing a rule
 * needs no migration and no backfill.
 *
 * The signals are the columns added in
 * supabase/migrations/20261104_leads_audit_signals.sql.
 */

export type LeadPriorityLevel = "hot" | "warm" | "cold";

export interface LeadPrioritySignals {
  /** 0-100 GBP audit score - NULL means the lead was never audited. */
  audit_score?: number | null;
  /** FALSE = no website at the last audit, NULL/undefined = not checked. */
  hasWebsite?: boolean | null;
  reviewCount?: number | null;
  rating?: number | null;
}

export interface LeadPriority {
  level: LeadPriorityLevel;
  score: number;
  /** Only the rules that actually fired, highest points first. */
  reasons: string[];
}

export function getLeadPriority(lead: LeadPrioritySignals): LeadPriority {
  const auditScore =
    typeof lead.audit_score === "number" && Number.isFinite(lead.audit_score)
      ? lead.audit_score
      : null;

  // An ad-form lead (or one whose audit row is older than the column) has
  // nothing to prioritise on: it must never look HOT on a guess.
  if (auditScore === null) {
    return { level: "cold", score: 0, reasons: ["No audit data"] };
  }

  // `order` breaks ties between equal points so the reason list is stable.
  const hits: { points: number; reason: string; order: number }[] = [];

  // UNKNOWN is not "no website": NULL/undefined earns nothing, ever.
  if (lead.hasWebsite === false) {
    hits.push({ points: 40, reason: "No website", order: 1 });
  }

  if (auditScore < 50) {
    hits.push({ points: 20, reason: "Low Google score", order: 2 });
  } else if (auditScore < 70) {
    hits.push({ points: 10, reason: "Google score can improve", order: 3 });
  }

  const reviews =
    typeof lead.reviewCount === "number" && Number.isFinite(lead.reviewCount)
      ? lead.reviewCount
      : null;
  if (reviews !== null) {
    if (reviews < 10) {
      hits.push({ points: 25, reason: `Only ${reviews} reviews`, order: 4 });
    } else if (reviews < 30) {
      hits.push({ points: 10, reason: "Few reviews", order: 5 });
    }
  }

  const rating =
    typeof lead.rating === "number" && Number.isFinite(lead.rating) ? lead.rating : null;
  // A rating under 4.0 only means something once somebody actually rated.
  if (rating !== null && reviews !== null && reviews > 0 && rating < 4) {
    hits.push({ points: 10, reason: "Rating under 4.0", order: 6 });
  }

  hits.sort((a, b) => b.points - a.points || a.order - b.order);

  const score = hits.reduce((sum, hit) => sum + hit.points, 0);
  const level: LeadPriorityLevel = score >= 70 ? "hot" : score >= 30 ? "warm" : "cold";

  return { level, score, reasons: hits.map((hit) => hit.reason) };
}
