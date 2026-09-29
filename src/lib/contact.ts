/**
 * Single source of truth for Neerzy's public contact channels.
 *
 * One number answers calls, texts and WhatsApp: +1 (213) 519-5117. It replaced
 * the retired toll free 833 number, and every surface that shows it (footer,
 * contact page, Organization schema, the floating support buttons) reads from
 * here — so the next number change is a one line edit, not a hunt through
 * the codebase.
 */

/** Digits only, E.164 without the "+" — the exact format wa.me requires. */
export const CONTACT_PHONE_DIGITS = "12135195117";

/** Human readable form, shown next to every link. */
export const CONTACT_PHONE_DISPLAY = "+1 (213) 519-5117";

/**
 * E.164 with dashes: the format schema.org/contactPoint expects from the
 * Organization markup in app/layout.tsx.
 */
export const CONTACT_PHONE_E164 = "+1-213-519-5117";

/** tel: link — tapping it dials the number on mobile. */
export const CONTACT_TEL_HREF = "tel:+" + CONTACT_PHONE_DIGITS;

/** sms: link — opens the messaging app with the number pre-filled. */
export const CONTACT_SMS_HREF = "sms:+" + CONTACT_PHONE_DIGITS;

/**
 * WhatsApp deep link with a pre-filled opener, so the visitor's first message is
 * never empty (an empty chat thread is easy to abandon).
 *
 * encodeURIComponent leaves "'" alone; escaping it keeps the URL safe inside HTML
 * attributes and matches the links that are already published in the wild.
 */
export function contactWhatsAppHref(
  message = "Hi Neerzy! I'd like to know more."
): string {
  return (
    "https://wa.me/" +
    CONTACT_PHONE_DIGITS +
    "?text=" +
    encodeURIComponent(message).replace(/'/g, "%27")
  );
}