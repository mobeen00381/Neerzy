// src/lib/website-signal.ts
/**
 * "Does this lead really have a website?"
 *
 * A Google Business Profile "website" field is often just a social page or a
 * link-in-bio: instagram.com/shop, linktr.ee/shop, m.facebook.com/shop. Those
 * profiles are NOT a website you can rank, scan or hand over, so every surface
 * that decides a lead "has a website" (leads.has_website, the HOT/WARM/COLD
 * priority, the report email's website offer, the automation guards and the
 * Admin -> Leads table) must treat them as "no website".
 *
 * The stored URL itself is never rewritten - the admin still sees and can open
 * what Google published. Only the yes/no verdict changes.
 *
 * Deliberately dependency-free and pure: imported by server code, by the admin
 * client components and by scripts.
 */

/**
 * Hosts (plus their subdomains) that count as "no real website".
 * Compared against the HOST only - a path or query never matches, so
 * `example.com/instagram.com` is a real website and `instagram.com.evil.com`
 * is not instagram.
 */
export const SOCIAL_OR_PLACEHOLDER_HOSTS: readonly string[] = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "fb.me",
  "linktr.ee",
  "linktree.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "wa.me",
  "whatsapp.com",
  "g.page",
  "business.site",
  "sites.google.com",
  "google.com",
  "maps.google.com",
  "wixsite.com",
  "godaddysites.com",
  "carrd.co",
  "bio.link",
  "beacons.ai",
  "lnk.bio",
  "taplink.cc",
  "wa.link",
];

const HOST_SET = new Set<string>(SOCIAL_OR_PLACEHOLDER_HOSTS);

/** Prefixes that never identify the business, only the mobile/www front door. */
const IGNORED_HOST_PREFIXES = ["www.", "m."];

/**
 * The host a stored website value points at, lowercased and stripped of
 * `www.` / `m.`. NULL for empty or unparseable input.
 *
 * Google publishes absolute URLs, but the admin also edits leads by hand, so a
 * bare `instagram.com/shop` (no protocol) must work too.
 */
function bareHost(raw: string | null | undefined): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;

  // Protocol-relative ("//instagram.com/x") needs a scheme before new URL().
  const candidate = /^\/\//.test(value)
    ? `https:${value}`
    : /^[a-z][a-z0-9+.-]*:/i.test(value)
      ? value
      : `https://${value}`;

  let host: string;
  try {
    host = new URL(candidate).hostname;
  } catch {
    return null;
  }

  host = host.toLowerCase().replace(/\.+$/, "");
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const prefix of IGNORED_HOST_PREFIXES) {
      if (host.startsWith(prefix) && host.length > prefix.length) {
        host = host.slice(prefix.length);
        stripped = true;
      }
    }
  }

  return host || null;
}

/**
 * TRUE when the URL points at a social network, a link-in-bio page or another
 * Google-hosted placeholder instead of a website the owner controls.
 *
 * Matching is exact on the host, or on a dot boundary for subdomains
 * (`shop.wixsite.com`, `mybiz.business.site`) - never a substring, so
 * `notinstagram.com` and `instagram.com.evil.com` are both real websites.
 * Invalid input (empty, malformed, non-http) returns false: "we cannot tell" is
 * never treated as "no website".
 */
export function isSocialOrPlaceholderUrl(url: string | null | undefined): boolean {
  const host = bareHost(url);
  if (!host) return false;
  if (HOST_SET.has(host)) return true;
  for (const domain of SOCIAL_OR_PLACEHOLDER_HOSTS) {
    if (host.endsWith(`.${domain}`)) return true;
  }
  return false;
}

/**
 * The website verdict every consumer should use: a stored URL that is social or
 * a placeholder forces FALSE ("no real website"), otherwise the stored
 * has_website boolean is kept - including NULL, which means "never checked" and
 * must never be read as "no".
 *
 * `website` is optional so callers that only load has_website still work.
 */
export function effectiveHasWebsite(
  hasWebsite: boolean | null | undefined,
  website?: string | null
): boolean | null {
  if (isSocialOrPlaceholderUrl(website)) return false;
  return typeof hasWebsite === "boolean" ? hasWebsite : null;
}
