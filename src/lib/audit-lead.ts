// src/lib/audit-lead.ts
/**
 * GMB audit -> Admin -> Leads capture (LAYER 1 of the audit funnel).
 *
 * Principle: capturing a visitor costs them NOTHING. /api/audit/run calls
 * captureAuditLead() server-side after a real audit completes, so a lead row
 * exists even when the visitor never touches the optional "get this report"
 * card (see /api/audit/report/send for that layer).
 *
 * Why place_id is the key: autocomplete fires 4-8 calls per session, so
 * capturing at /api/audit/search would flood the pipeline with junk. A place_id
 * only exists once a visitor chose one specific business and ran a full audit -
 * that is a real human, one row per business (unique index on leads.place_id).
 * A re-run therefore updates the existing row instead of duplicating it.
 *
 * Safety rules:
 *  - NEVER throws: every failure is caught and logged (redacted) so a database
 *    hiccup can never break or slow down the public report.
 *  - mock scans (mock_* place ids / no Places key) never become leads.
 *  - only the service-role client writes; no secret value is ever logged.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { redact } from "@/lib/email";

/** Value stored in leads.source for every audit-tool lead. */
export const AUDIT_LEAD_SOURCE = "gmb_audit";

export interface AuditLeadInput {
  placeId: string;
  businessName?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  /** Google Places `types` - only used to pick one readable category. */
  types?: string[] | null;
  auditScore?: number | null;
}

export interface CaptureAuditLeadResult {
  ok: boolean;
  leadId?: string;
  /** true = a new lead row was created, false = an existing one was refreshed. */
  created?: boolean;
}

/** Types Google attaches to almost everything - useless as a "category". */
const GENERIC_TYPES = new Set([
  "point_of_interest",
  "establishment",
  "local_business",
  "service",
  "store",
  "premise",
  "subpremise",
]);

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

/** True for empty ids and for the mock ids the audit tool uses without a key. */
export function isMockPlaceId(placeId?: string | null): boolean {
  const id = String(placeId || "").trim().toLowerCase();
  return !id || id.startsWith("mock");
}

/** The public, shareable report URL (live - it re-runs the audit on open). */
export function auditReportUrl(placeId: string, businessName?: string | null): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://www.neerzy.com").replace(/\/+$/, "");
  const params = new URLSearchParams({ placeId: String(placeId) });
  const name = String(businessName || "").trim();
  if (name) params.set("name", name);
  return `${base}/gmb-audit-tool/results?${params.toString()}`;
}

/** First non-generic Places type, humanized ("roofing_contractor" -> "roofing contractor"). */
export function primaryCategory(types?: string[] | null): string | null {
  for (const raw of types || []) {
    const type = String(raw || "").trim();
    if (!type || GENERIC_TYPES.has(type)) continue;
    return type.replace(/_/g, " ");
  }
  return null;
}

/**
 * The admin needs the scan context at a glance, so it is compacted into
 * `notes` (which the leads table already shows under the lead name):
 *   "GMB audit 72/100 - 4.8* (213 reviews) - roofing contractor - site: x.com - 12 Main St"
 */
export function buildAuditNotes(input: AuditLeadInput): string {
  const bits: string[] = [];
  const score =
    typeof input.auditScore === "number" && Number.isFinite(input.auditScore)
      ? Math.round(input.auditScore)
      : null;
  bits.push(score === null ? "GMB audit" : `GMB audit ${score}/100`);

  const reviews = typeof input.reviewCount === "number" ? Math.round(input.reviewCount) : 0;
  if (typeof input.rating === "number" && input.rating > 0) {
    bits.push(`${input.rating.toFixed(1)}\u2605${reviews > 0 ? ` (${reviews} reviews)` : ""}`);
  } else if (reviews > 0) {
    bits.push(`${reviews} reviews`);
  }

  const category = primaryCategory(input.types);
  if (category) bits.push(category);

  const site = String(input.website || "").trim();
  if (site) bits.push(`site: ${site.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`);

  const address = String(input.address || "").trim();
  if (address) bits.push(address);

  return bits.join(" \u00b7 ").slice(0, 500);
}

/**
 * Creates or refreshes the lead for one audited listing.
 * Call it AFTER the audit payload is built and BEFORE the response is returned;
 * it cannot throw, so the report never waits on (or breaks because of) the DB.
 */
export async function captureAuditLead(input: AuditLeadInput): Promise<CaptureAuditLeadResult> {
  try {
    const placeId = String(input.placeId || "").trim();
    if (isMockPlaceId(placeId)) return { ok: false };

    const supabase = serviceClient();
    if (!supabase) return { ok: false };

    const businessName = String(input.businessName || "").trim() || null;
    const phone = String(input.phone || "").trim() || null;
    const notes = buildAuditNotes(input);
    const reportLink = auditReportUrl(placeId, businessName);
    const auditScore =
      typeof input.auditScore === "number" && Number.isFinite(input.auditScore)
        ? Math.round(input.auditScore)
        : null;

    // Structured signals for the Admin -> Leads priority badge - the same facts
    // buildAuditNotes() compacts into `notes`, but stored as real columns so the
    // UI never has to parse prose. review_count uses the exact number the notes
    // builder used (0 when Places reported none), and a missing website is a
    // real "has no website" signal, not an unknown.
    const website = String(input.website || "").trim() || null;
    const reviewCount =
      typeof input.reviewCount === "number" && Number.isFinite(input.reviewCount)
        ? Math.round(input.reviewCount)
        : 0;
    const rating =
      typeof input.rating === "number" && Number.isFinite(input.rating) && input.rating > 0
        ? Number(input.rating.toFixed(1))
        : null;

    const { data: existing, error: findError } = await supabase
      .from("leads")
      .select("id")
      .eq("place_id", placeId)
      .maybeSingle();

    if (findError) {
      // 42703 = place_id column missing (migration not applied yet): skip the
      // capture quietly instead of 500-ing the audit endpoint.
      console.error(`[AuditLead] lookup failed: ${redact(String(findError.message || findError.code))}`);
      return { ok: false };
    }

    if (existing?.id) {
      const patch: Record<string, unknown> = {
        audit_score: auditScore,
        report_link: reportLink,
        notes,
        // Re-auditing refreshes the signals too: a website added since the last
        // scan (or reviews earned since) must move the lead's priority.
        website,
        has_website: Boolean(website),
        review_count: reviewCount,
        rating,
        updated_at: new Date().toISOString(),
      };
      if (businessName) patch.business_name = businessName;
      if (phone) patch.phone = phone;

      const { error: updateError } = await supabase
        .from("leads")
        .update(patch)
        .eq("id", existing.id);
      if (updateError) {
        console.error(`[AuditLead] refresh failed: ${redact(String(updateError.message || updateError.code))}`);
        return { ok: false };
      }
      return { ok: true, leadId: existing.id, created: false };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("leads")
      .insert({
        name: null, // an audit only ever reveals the business, never the owner's name
        email: null,
        phone,
        business_name: businessName,
        service_type: primaryCategory(input.types),
        source: AUDIT_LEAD_SOURCE,
        status: "new",
        notes,
        place_id: placeId,
        audit_score: auditScore,
        report_link: reportLink,
        website,
        has_website: Boolean(website),
        review_count: reviewCount,
        rating,
      })
      .select("id")
      .single();

    if (insertError) {
      // 23505 = the same listing was audited twice at once; the row exists now,
      // so refresh it instead of losing the capture.
      if ((insertError as { code?: string }).code === "23505") {
        const { data: raced } = await supabase
          .from("leads")
          .select("id")
          .eq("place_id", placeId)
          .maybeSingle();
        if (raced?.id) return { ok: true, leadId: raced.id, created: false };
      }
      console.error(`[AuditLead] insert failed: ${redact(String(insertError.message || insertError.code))}`);
      return { ok: false };
    }

    return { ok: true, leadId: inserted?.id, created: true };
  } catch (error: any) {
    console.error(`[AuditLead] capture failed: ${redact(String(error?.message || error))}`);
    return { ok: false };
  }
}

/**
 * Attaches the contact a visitor typed into the optional "get this report" card.
 * Existing values are never overwritten - an ad-form lead may already carry the
 * address the owner actually answers from.
 */
export async function attachAuditLeadContact(input: {
  placeId: string;
  email?: string | null;
  phone?: string | null;
}): Promise<{ ok: boolean; leadId?: string }> {
  try {
    const placeId = String(input.placeId || "").trim();
    if (isMockPlaceId(placeId)) return { ok: false };

    const email = String(input.email || "").trim().toLowerCase() || null;
    const phone = String(input.phone || "").trim() || null;
    if (!email && !phone) return { ok: false };

    const supabase = serviceClient();
    if (!supabase) return { ok: false };

    const { data: lead, error } = await supabase
      .from("leads")
      .select("id, email, phone")
      .eq("place_id", placeId)
      .maybeSingle();

    if (error) {
      console.error(`[AuditLead] contact lookup failed: ${redact(String(error.message || error.code))}`);
      return { ok: false };
    }
    // No row means the run-time capture was skipped (mock scan / DB outage).
    if (!lead?.id) return { ok: false };

    const patch: Record<string, unknown> = {};
    if (email && !lead.email) patch.email = email;
    if (phone && !lead.phone) patch.phone = phone;
    if (Object.keys(patch).length === 0) return { ok: true, leadId: lead.id };

    patch.updated_at = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("leads")
      .update(patch)
      .eq("id", lead.id);
    if (updateError) {
      console.error(`[AuditLead] contact update failed: ${redact(String(updateError.message || updateError.code))}`);
      return { ok: false, leadId: lead.id };
    }
    return { ok: true, leadId: lead.id };
  } catch (error: any) {
    console.error(`[AuditLead] contact attach failed: ${redact(String(error?.message || error))}`);
    return { ok: false };
  }
}
