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
import { makeUnlockToken } from "@/lib/report-unlock";
import { normalizePhone, phoneColumns } from "@/lib/phone";
import { isSocialOrPlaceholderUrl } from "@/lib/website-signal";
import {
  CONSENT_PURPOSE_MARKETING,
  type ConsentChannel,
} from "@/lib/consent";

/** Value stored in leads.source for every audit-tool lead. */
export const AUDIT_LEAD_SOURCE = "gmb_audit";

export interface AuditLeadInput {
  placeId: string;
  businessName?: string | null;
  /** Raw phone exactly as Google publishes it (national form) - this is what leads.phone stores. */
  phone?: string | null;
  /**
   * Google Places `internationalPhoneNumber` (already carries the +country code).
   * Used ONLY to derive phone_e164 / country - the raw value is never stored.
   */
  internationalPhone?: string | null;
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

/**
 * The public report URL. It re-runs the audit on open, so it is only useful
 * while Google's numbers hold - but the `t` token is what makes the fix list
 * render, so a link without it opens the teaser and nothing more.
 */
export function auditReportUrl(
  placeId: string,
  businessName?: string | null,
  unlock?: string | null
): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://www.neerzy.com").replace(/\/+$/, "");
  const params = new URLSearchParams({ placeId: String(placeId) });
  const name = String(businessName || "").trim();
  if (name) params.set("name", name);
  const token = String(unlock || "").trim();
  if (token) params.set("t", token);
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
    // Machine form of the same number (WhatsApp / future automation). Google's
    // international number already carries the +country code, so it is the
    // primary source; the raw (national) value is only the fallback for listings
    // that publish no international form. The audit still fetches no Places
    // country, so this can legitimately stay null.
    const normalizeSource = String(input.internationalPhone || "").trim() || phone;
    const normalized = normalizePhone(normalizeSource);
    const notes = buildAuditNotes(input);
    // A fresh token per capture: the admin opens the FULL report from the leads
    // table, and it expires with the link like any other unlock.
    const reportLink = auditReportUrl(placeId, businessName, makeUnlockToken(placeId));
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
    // A social page or link-in-bio is not a website the owner controls, so it
    // counts as "no website" for priority + automation while `website` keeps
    // the URL Google published (the admin can still open it).
    const hasWebsite = Boolean(website) && !isSocialOrPlaceholderUrl(website);
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
        has_website: hasWebsite,
        review_count: reviewCount,
        rating,
        updated_at: new Date().toISOString(),
      };
      if (businessName) patch.business_name = businessName;
      if (phone) patch.phone = phone;
      // Fill the normalized columns whenever the number parses - now from the
      // international form, so a re-run backfills phone_e164/country on leads
      // captured before it was passed through. An unparseable number leaves them
      // untouched rather than NULLing a value.
      Object.assign(patch, phoneColumns(normalizeSource));

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
        has_website: hasWebsite,
        review_count: reviewCount,
        rating,
        phone_e164: normalized.e164,
        country: normalized.country,
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
      .select("id, email, phone, phone_e164")
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

    // Normalize whichever raw number we now hold - fill-only, so a value that is
    // already stored is never overwritten with NULL.
    if (!lead.phone_e164) {
      const rawPhone = (patch.phone as string | undefined) || lead.phone || null;
      Object.assign(patch, phoneColumns(rawPhone));
    }

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

/**
 * Records (or refreshes) marketing consent for one lead + channel.
 *
 * Called only when the visitor TICKED the optional box on the "get this report"
 * card - never on a bare report request, and never for the admin. The stored
 * `consent_text` is the exact label the checkbox rendered
 * (MARKETING_CONSENT_TEXT in lib/consent.ts), so the row is evidence of what was
 * agreed to, not a paraphrase of it.
 *
 * Upsert on (lead_id, channel, purpose): ticking the box again re-dates the
 * opt-in and clears any earlier opt-out instead of stacking rows.
 * Never throws - a consent write failure must not fail the report delivery.
 */
export async function recordLeadConsent(input: {
  leadId?: string | null;
  channel: ConsentChannel;
  /** Where the consent was captured, e.g. CONSENT_SOURCE_AUDIT_REPORT_CARD. */
  source?: string | null;
  /** Exact wording the visitor saw; defaults to the stored label server-side. */
  consentText?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    const leadId = String(input.leadId || "").trim();
    if (!leadId) return { ok: false };
    if (input.channel !== "email" && input.channel !== "whatsapp") return { ok: false };

    const supabase = serviceClient();
    if (!supabase) return { ok: false };

    const { error } = await supabase.from("lead_consent").upsert(
      {
        lead_id: leadId,
        channel: input.channel,
        purpose: CONSENT_PURPOSE_MARKETING,
        opted_in_at: new Date().toISOString(),
        opted_out_at: null,
        source: String(input.source || "").trim() || null,
        consent_text: String(input.consentText || "").trim() || null,
      },
      { onConflict: "lead_id,channel,purpose" }
    );

    if (error) {
      // 42P01/42703 = migration not applied yet: log and carry on, the report
      // itself has already been delivered by this point.
      console.error(`[AuditLead] consent upsert failed: ${redact(String(error.message || error.code))}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (error: any) {
    console.error(`[AuditLead] consent upsert failed: ${redact(String(error?.message || error))}`);
    return { ok: false };
  }
}

/**
 * Marks every marketing consent row belonging to one email address as opted out.
 *
 * Used by /api/unsubscribe (lib/unsubscribe.ts verifies the token first): the
 * global suppression entry stops future sends, and this keeps the per-lead
 * consent history truthful - "this lead opted out on <date>" instead of a row
 * that still claims an active opt-in.
 *
 * Matching is on the exact lowercase address, which is how audit leads store it
 * (attachAuditLeadContact lowercases). Rows already opted out are left alone, so
 * the FIRST unsubscribe date is the one that survives. Never throws.
 */
export async function optOutLeadConsent(
  email: string | null | undefined
): Promise<{ ok: boolean; leads: number; rows: number }> {
  const address = String(email || "").trim().toLowerCase();
  if (!address) return { ok: false, leads: 0, rows: 0 };

  const supabase = serviceClient();
  if (!supabase) return { ok: false, leads: 0, rows: 0 };

  try {
    const { data: leads, error: findError } = await supabase
      .from("leads")
      .select("id")
      .eq("email", address);
    if (findError) {
      console.error(`[AuditLead] consent opt-out lookup failed: ${redact(String(findError.message || findError.code))}`);
      return { ok: false, leads: 0, rows: 0 };
    }

    const leadIds = (leads || []).map((row: any) => row?.id).filter(Boolean);
    if (leadIds.length === 0) return { ok: true, leads: 0, rows: 0 };

    const { data: updated, error } = await supabase
      .from("lead_consent")
      .update({ opted_out_at: new Date().toISOString() })
      .in("lead_id", leadIds)
      .is("opted_out_at", null)
      .select("id");
    if (error) {
      console.error(`[AuditLead] consent opt-out failed: ${redact(String(error.message || error.code))}`);
      return { ok: false, leads: leadIds.length, rows: 0 };
    }

    return { ok: true, leads: leadIds.length, rows: (updated || []).length };
  } catch (error: any) {
    console.error(`[AuditLead] consent opt-out failed: ${redact(String(error?.message || error))}`);
    return { ok: false, leads: 0, rows: 0 };
  }
}
