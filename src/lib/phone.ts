// src/lib/phone.ts
/**
 * Phone normalization for leads (libphonenumber-js - one small, dependency-free
 * port of Google's libphonenumber; no metadata server, no network call).
 *
 * Why: leads.phone keeps whatever a human typed or Google published
 * ("01234 567890", "+44 7400 123456", "0044 7400 123456"). That is right for
 * display and dialling, but WhatsApp links and any future automation need ONE
 * canonical form. This module produces it without ever rewriting the raw value.
 *
 * Assumptions, stated once:
 *  - `defaultCountry` (ISO 3166-1 alpha-2) is only a HINT for numbers written in
 *    national format. Without it, "01234 567890" is unparseable - and we return
 *    valid:false rather than guessing a country.
 *  - the audit tool does NOT fetch a country from Google Places (the Places v1
 *    field mask in /api/audit/run has no `addressComponents`), so audit-captured
 *    numbers only normalize when Google returns an international number.
 *  - a number that is not valid is reported as valid:false with e164:null. We
 *    never store a half-parsed number.
 */
import { isSupportedCountry, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export type NormalizedPhoneType = "mobile" | "landline" | "unknown";

export interface NormalizedPhone {
  /** "+447700900123" when the number is valid, otherwise null. */
  e164: string | null;
  /** ISO 3166-1 alpha-2 (e.g. "GB", "PK") when known, otherwise null. */
  country: string | null;
  /** WhatsApp-ability hint: mobile (incl. fixed-or-mobile), landline, or unknown. */
  type: NormalizedPhoneType;
  valid: boolean;
}

const EMPTY: NormalizedPhone = { e164: null, country: null, type: "unknown", valid: false };

/** Narrows an arbitrary string to a country libphonenumber-js knows. */
function toCountryCode(value: string | null | undefined): CountryCode | undefined {
  const code = String(value || "").trim().toUpperCase();
  if (code.length !== 2) return undefined;
  return isSupportedCountry(code) ? (code as CountryCode) : undefined;
}

/**
 * Normalizes one raw phone string.
 *
 * @param raw            the number as typed / published.
 * @param defaultCountry optional ISO 3166-1 alpha-2 hint for national formats.
 */
export function normalizePhone(
  raw: string | null | undefined,
  defaultCountry?: string | null
): NormalizedPhone {
  const text = String(raw || "").trim();
  if (!text) return EMPTY;

  // Cheap guard: libphonenumber would happily parse "+1-800-CALL-NOW" style
  // vanity text into something surprising, and a 3-digit string is never a
  // reachable subscriber number.
  const digits = text.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 17) return EMPTY;

  // "00" is the international prefix in most of the world (0044 7400 123456),
  // and libphonenumber only understands the "+" form. Normalize it here so a
  // number copied off a business card still parses.
  const compact = text.replace(/[\s().\-/]/g, "");
  const candidate = compact.startsWith("00") ? `+${compact.slice(2)}` : text;

  const parsed = parsePhoneNumberFromString(candidate, toCountryCode(defaultCountry));
  if (!parsed) return EMPTY;

  const valid = parsed.isValid();
  const numberType = parsed.getType();

  const type: NormalizedPhoneType =
    numberType === "MOBILE" || numberType === "FIXED_LINE_OR_MOBILE"
      ? "mobile"
      : numberType === "FIXED_LINE"
      ? "landline"
      : "unknown";

  return {
    e164: valid ? parsed.number : null,
    country: parsed.country || null,
    type,
    valid,
  };
}

/**
 * Columns to write alongside a raw phone: `phone_e164` and `country`. Returns an
 * empty object when nothing usable was parsed, so callers can spread it into a
 * Postgres patch without ever writing NULL over a value that was already there
 * (the callers only apply it when the target column is empty).
 */
export function phoneColumns(
  raw: string | null | undefined,
  defaultCountry?: string | null
): { phone_e164?: string; country?: string } {
  const normalized = normalizePhone(raw, defaultCountry);
  if (!normalized.e164) return {};
  return {
    phone_e164: normalized.e164,
    ...(normalized.country ? { country: normalized.country } : {}),
  };
}
