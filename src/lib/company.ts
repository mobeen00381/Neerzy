/**
 * Single source of truth for Neerzy's company / postal details.
 *
 * Every surface that shows where the company is registered — the contact page,
 * the footer, the Organization JSON-LD in app/layout.tsx, the email shell
 * footer — reads from here, so the next address change is a one line edit
 * instead of a hunt through the codebase. Contact channels that are *not* a
 * postal address (phone, WhatsApp) stay in src/lib/contact.ts.
 *
 * Facts only: no registration number, no company suffix, no VAT/tax id.
 */

export interface CompanyDetails {
  /** Trading name, exactly as it should be published. */
  name: string;
  /** Street level part of the address (building + road). */
  addressLine1: string;
  /** City / locality. */
  city: string;
  /** Postal code. */
  postalCode: string;
  /** Country name, for visible copy. */
  country: string;
  /** ISO 3166-1 alpha-2 country code, for schema.org addressCountry. */
  countryCode: "PK";
  /** The address support requests and legal notices go to. */
  supportEmail: string;
  /** Canonical one-line address for metadata, emails and schema. */
  fullAddress: string;
  /** Same address broken into display lines (top to bottom). */
  addressLines: readonly string[];
}

export const COMPANY: CompanyDetails = {
  name: "Neerzy",
  addressLine1: "Main Sui Gas Road, Rafique Center",
  city: "Gujranwala",
  postalCode: "52250",
  country: "Pakistan",
  countryCode: "PK",
  supportEmail: "support@neerzy.com",
  fullAddress:
    "Neerzy, Main Sui Gas Road, Rafique Center, Gujranwala 52250, Pakistan",
  addressLines: [
    "Neerzy",
    "Main Sui Gas Road, Rafique Center",
    "Gujranwala 52250",
    "Pakistan",
  ],
};

/**
 * schema.org PostalAddress built from COMPANY — shared by every JSON-LD block
 * (Organization in app/layout.tsx, ContactPage on /contact) so the markup can
 * never drift from the address printed on the page.
 */
export function companyPostalAddress() {
  return {
    "@type": "PostalAddress" as const,
    streetAddress: COMPANY.addressLine1,
    addressLocality: COMPANY.city,
    postalCode: COMPANY.postalCode,
    addressCountry: COMPANY.countryCode,
  };
}
