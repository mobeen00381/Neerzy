/**
 * Report-delivery consent copy - the consent a visitor gives on the audit
 * results card, plus the small amount of shared vocabulary around it.
 *
 * Import-safe from BOTH a client component and a route handler: this file has no
 * imports at all on purpose. The React card renders MARKETING_CONSENT_TEXT (split
 * into the two lines of the primary button by the exports below) and
 * /api/audit/report/send stores that SAME string in lead_consent.consent_text, so
 * the proof of consent can never drift from what the visitor actually saw.
 */

/**
 * The exact wording of the consent CHOICE on the "Get your report" card: the
 * primary button, whose click is the deliberate act that opts in to the short
 * follow-up emails.
 *
 * Also stored verbatim in public.lead_consent.consent_text - do NOT reword it
 * here or in the component: change both at once by changing this constant. Rows
 * written before a rewording keep the text they were captured with and are never
 * rewritten, so this constant only ever describes the CURRENT card.
 */
export const MARKETING_CONSENT_TEXT =
  "Send my report + free website preview, plus a few short emails with my top profile fixes. Stop anytime.";

/**
 * The one sentence above, split into the primary button's headline and its
 * smaller second line, both derived from MARKETING_CONSENT_TEXT so the label the
 * visitor read and the consent_text the API stores are the same words by
 * construction (headline + a space + detail === MARKETING_CONSENT_TEXT).
 *
 * The split keeps the comma on the headline: the sentence visibly continues on
 * the second line, and no character of the consent is dropped between them. A
 * rewording without that comma still renders the whole sentence as the headline
 * (and no second line) rather than losing a character to a -1 index.
 */
const CONSENT_LABEL_BREAK = ", ";
const CONSENT_LABEL_BREAK_AT = MARKETING_CONSENT_TEXT.indexOf(CONSENT_LABEL_BREAK);

export const MARKETING_CONSENT_HEADLINE =
  CONSENT_LABEL_BREAK_AT === -1
    ? MARKETING_CONSENT_TEXT
    : `${MARKETING_CONSENT_TEXT.slice(0, CONSENT_LABEL_BREAK_AT)},`;

export const MARKETING_CONSENT_DETAIL =
  CONSENT_LABEL_BREAK_AT === -1
    ? ""
    : MARKETING_CONSENT_TEXT.slice(CONSENT_LABEL_BREAK_AT + CONSENT_LABEL_BREAK.length);

/** Delivery channels we can record consent for (matches lead_consent.channel). */
export type ConsentChannel = "email" | "whatsapp";

/** lead_consent.purpose for anything that is not a service message. */
export const CONSENT_PURPOSE_MARKETING = "marketing";

/** Where the consent was captured (lead_consent.source). */
export const CONSENT_SOURCE_AUDIT_REPORT_CARD = "audit_report_card";

/** Public page that documents what "tips" means and how to opt out. */
export const PRIVACY_POLICY_PATH = "/privacy-policy";
