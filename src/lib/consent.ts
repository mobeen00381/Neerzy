/**
 * Report-delivery consent copy - the consent a visitor gives on the audit
 * results card, plus the small amount of shared vocabulary around it.
 *
 * Import-safe from BOTH a client component and a route handler: this file has no
 * imports at all on purpose. The React checkbox renders
 * MARKETING_CONSENT_TEXT and /api/audit/report/send stores that SAME string in
 * lead_consent.consent_text, so the proof of consent can never drift from what
 * the visitor actually saw.
 */

/**
 * The exact wording of the optional checkbox on the "Get this report" card.
 * Also stored verbatim in public.lead_consent.consent_text - do NOT reword it
 * here or in the component: change both at once by changing this constant.
 */
export const MARKETING_CONSENT_TEXT =
  "Also email me my free website preview and Google profile tips. Unsubscribe anytime.";

/** Delivery channels we can record consent for (matches lead_consent.channel). */
export type ConsentChannel = "email" | "whatsapp";

/** lead_consent.purpose for anything that is not a service message. */
export const CONSENT_PURPOSE_MARKETING = "marketing";

/** Where the consent was captured (lead_consent.source). */
export const CONSENT_SOURCE_AUDIT_REPORT_CARD = "audit_report_card";

/** Public page that documents what "tips" means and how to opt out. */
export const PRIVACY_POLICY_PATH = "/privacy-policy";
