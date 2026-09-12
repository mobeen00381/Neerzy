/**
 * Phase 8 → REAL: Domain Automation Engine
 *
 * Programmatic domain registration via Porkbun + Vercel project domain
 * assignment. Used by:
 *   - /api/domains            (availability check, dashboard search)
 *   - /api/domains/purchase   (plan-gated buy flow)
 *   - /api/webhook/paddle     (auto-register after payment succeeds)
 *
 * PRODUCTION requires these env vars:
 *   PORKBUN_API_KEY, PORKBUN_SECRET_API_KEY, VERCEL_TOKEN, VERCEL_PROJECT_ID
 *
 * When the Porkbun keys are missing the registry falls back to a simulated
 * result (dev/local safety) — logs loudly so it is never confused with a real
 * registration in production.
 */

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Constants (single source of truth for pricing/limits)
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/** Base registration price (USD). Mirrors the $19 FAQ / onboarding copy. */
export const DOMAIN_PRICE_USD = 19;

/**
 * TLDs we can register through Porkbun WITHOUT extended attributes
 * (no .us nexus, .ca legal type, etc). Keeps the one-price, one-click flow.
 */
export const DOMAIN_TLDS = [".com", ".net", ".org", ".co"] as const;

/** Day 330 / 365 renewal heads-up: notify 35 days before expiry. */
export const RENEWAL_NOTICE_BEFORE_DAYS = 35;

/** Paddle one-time Price ID for a domain registration. */
export const DOMAIN_PADDLE_PRICE_ID =
  process.env.PADDLE_DOMAIN_PRICE_ID || "pri_01kpqrc7ths0fz8synqzhhasd9";

const PORKBUN_ENDPOINT = "https://api.porkbun.com/api/json/v3";

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Porkbun helpers
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function porkbunAuth(): { apikey: string; secretapikey: string } | null {
  const apikey = process.env.PORKBUN_API_KEY || "";
  const secretapikey = process.env.PORKBUN_SECRET_API_KEY || "";
  if (!apikey || !secretapikey) return null;
  return { apikey, secretapikey };
}

async function porkbunPost<T>(
  path: string,
  payload: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${PORKBUN_ENDPOINT}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  // Porkbun returns JSON for both success and errors (400/429/…), so parse the
  // body first and let callers inspect `status` / `code` / `message`.
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Porkbun API ${res.status}: ${text.slice(0, 200)}`);
  }
}

/** Normalizes a user-typed domain → "example.com". */
export function normalizeDomain(input: string): string {
  let d = (input || "").trim().toLowerCase();
  d = d
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
  return d;
}

/** True when the domain ends in one of the registerable TLDs. */
export function isRegisterableDomain(domainName: string): boolean {
  return DOMAIN_TLDS.some((tld) => domainName.toLowerCase().endsWith(tld));
}

export interface AvailabilityResult {
  domain: string;
  available: boolean;
  price: number | null;      // null until a real Porkbun price is returned
  currency: string;
  simulated: boolean;        // true when API keys are not configured
  rawStatus?: string;        // Porkbun "availability" when available
  /** Set when the lookup itself failed — callers must NOT show "taken". */
  error?: string;
}

/**
 * Porkbun allows ~1 availability lookup per 10s per API key, so a verified
 * answer is cached briefly: repeat checks (double-click, tab switch, or the
 * purchase re-quote straight after a check) then cost zero API calls instead
 * of surfacing "couldn't verify".
 */
const AVAILABILITY_CACHE_MS = 60_000;      // reuse as-is, no API call
const AVAILABILITY_STALE_MS = 10 * 60_000; // fallback during a rate-limit window
const availabilityCache = new Map<string, { at: number; result: AvailabilityResult }>();

/**
 * Real Porkbun check: POST /domain/check/{domain}.
 * Simulated DNS probe when keys are missing (dev only).
 *
 * `allowStaleCache` (display paths only) serves the last verified answer when
 * Porkbun rate-limits us; the purchase path stays strict so a cached answer
 * can never gate money.
 */
export async function checkDomainAvailability(
  domainName: string,
  opts: { allowStaleCache?: boolean } = {}
): Promise<AvailabilityResult> {
  const domain = normalizeDomain(domainName);

  const cached = availabilityCache.get(domain);
  if (cached && Date.now() - cached.at < AVAILABILITY_CACHE_MS) {
    return cached.result;
  }

  const creds = porkbunAuth();
  if (!creds) {
    return simulateAvailability(domain);
  }

  try {
    const json = await porkbunPost<{
      status: string;
      response?: {
        avail?: string;
        price?: string;
        regularPrice?: string;
        premium?: string;
      };
      code?: string;
      message?: string;
    }>(`/domain/checkDomain/${encodeURIComponent(domain)}`, creds);

    const r = (json.response || {}) as any;
    const avail = String(r.avail || "").toLowerCase();

    // A non-SUCCESS status (rate limit, bad key, upstream error) is a FAILED
    // lookup — never report it as "taken".
    if (json.status !== "SUCCESS") {
      const rateLimited = json.code === "RATE_LIMIT_EXCEEDED";
      // Display paths keep showing the last verified answer (≤10 min old)
      // instead of a misleading "couldn't verify" during a rate-limit window.
      if (
        rateLimited &&
        opts.allowStaleCache &&
        cached &&
        Date.now() - cached.at < AVAILABILITY_STALE_MS
      ) {
        return cached.result;
      }
      return {
        domain,
        available: false,
        price: null,
        currency: "USD",
        simulated: true,
        rawStatus: json.code || json.status,
        error: rateLimited
          ? "rate-limited"
          : json.message || json.code || "lookup-failed",
      };
    }

    const available = avail === "yes" || avail === "true";
    const price = r.price ? Number(r.price) : r.regularPrice ? Number(r.regularPrice) : null;

    const result: AvailabilityResult = {
      domain,
      available,
      price,
      currency: "USD",
      simulated: false,
      rawStatus: avail || json.status,
    };
    availabilityCache.set(domain, { at: Date.now(), result });
    return result;
  } catch (err: any) {
    console.error("❌ Porkbun availability check failed:", err?.message || err);
    // Never hard-block the UI on a lookup failure — surface "couldn't verify"
    // instead of a false "taken" (see `error` on AvailabilityResult).
    return {
      domain,
      available: false,
      price: null,
      currency: "USD",
      simulated: true,
      error: "lookup-failed",
    };
  }
}



/** Dev-only fallback — DNS probe mirrors the old heuristic. */
async function simulateAvailability(domain: string): Promise<AvailabilityResult> {
  const tld = "." + domain.split(".").pop();
  const priceByTld: Record<string, number> = {
    ".com": DOMAIN_PRICE_USD,
    ".net": 21,
    ".org": 20,
    ".co": 35,
  };
  let available = true;
  try {
    const dns = await import("dns/promises");
    await dns.resolve4(domain);
    available = false;
  } catch {
    try {
      const dns = await import("dns/promises");
      await dns.resolveNs(domain);
      available = false;
    } catch {
      available = true;
    }
  }
  return {
    domain,
    available,
    price: priceByTld[tld] ?? DOMAIN_PRICE_USD,
    currency: "USD",
    simulated: true,
  };
}

/**
 * Fast pre-check used to RANK suggestions.
 *
 * Porkbun rate-limits availability checks to ~1 per 10 seconds, so it cannot
 * rank several candidates in one request (and a rate-limited response must
 * never be shown as "taken"). The suggestion list therefore uses a DNS probe:
 *   • resolves A or NS records → registered → "Taken"
 *   • resolves nothing         → almost certainly free → "Available"
 * The authoritative check runs at purchase time (registerDomain), which
 * refuses the registration if Porkbun says the name is unavailable.
 */
export async function probeDomainAvailability(
  domainName: string
): Promise<AvailabilityResult> {
  const domain = normalizeDomain(domainName);
  const tld = "." + domain.split(".").pop();
  const priceByTld: Record<string, number> = {
    ".com": DOMAIN_PRICE_USD,
    ".net": 21,
    ".org": 20,
    ".co": 35,
  };

  let available = true;
  try {
    const dns = await import("dns/promises");
    await dns.resolve4(domain);
    available = false;
  } catch {
    try {
      const dns = await import("dns/promises");
      await dns.resolveNs(domain);
      available = false;
    } catch (nsErr: any) {
      const code = String(nsErr?.code || "");
      // ENOTFOUND / ENODATA → no records of either kind → likely free.
      // Anything else is a resolver problem, so don't guess.
      if (code && code !== "ENOTFOUND" && code !== "ENODATA") {
        return {
          domain,
          available: false,
          price: null,
          currency: "USD",
          simulated: false,
          error: "lookup-failed",
        };
      }
    }
  }

  return {
    domain,
    available,
    price: priceByTld[tld] ?? DOMAIN_PRICE_USD,
    currency: "USD",
    simulated: false,
    rawStatus: "dns",
  };
}

export interface RegisterResult {
  success: boolean;
  domain: string;
  expiresAt: string | null;
  price: number | null;
  simulated: boolean;
  error?: string;
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Registers a domain on Porkbun for 1 year with auto-renew enabled.
 * POST /domain/register/{domain} (years=1, autoRenew=yes) then best-effort
 * POST /domain/update/{domain} { autoRenew: "yes" }.
 *
 * Callers must treat this as idempotent by domain_name (webhook checks the
 * `domains` table first) so a re-delivered event never double-charges.
 */
export async function registerDomain(domainName: string): Promise<RegisterResult> {
  const domain = normalizeDomain(domainName);
  const creds = porkbunAuth();

  if (!creds) {
    console.warn(
      "📡 [Domain Registry] No Porkbun keys configured — SIMULATING registration " +
        `for ${domain}. Set PORKBUN_API_KEY + PORKBUN_SECRET_API_KEY in production.`
    );
    await new Promise((r) => setTimeout(r, 1200));
    const expiresAt = new Date(Date.now() + YEAR_MS).toISOString();
    return { success: true, domain, expiresAt, price: DOMAIN_PRICE_USD, simulated: true };
  }

  try {
    // 1) Price + availability (Porkbun rate-limits checks to ~1/10s — one call
    //    per purchase is fine; we also need the price to pass `cost`).
    let cost = Math.ceil(DOMAIN_PRICE_USD);
    try {
      const chk = await porkbunPost<{ status: string; response?: any }>(
        `/domain/checkDomain/${encodeURIComponent(domain)}`,
        creds
      );
      const r = chk.response || {};
      const avail = String(r.avail || "").toLowerCase();
      if (chk.status === "SUCCESS" && avail && avail !== "yes") {
        return {
          success: false, domain, expiresAt: null, price: null, simulated: false,
          error: `${domain} is not available for registration`,
        };
      }
      const p = Number(r.price || r.regularPrice || 0);
      if (p > 0) cost = Math.ceil(p);
    } catch (priceErr: any) {
      console.warn("⚠️ [Domain Registry] Price lookup failed — using default cost:", priceErr?.message || priceErr);
    }

    // 2) Register (1 year, auto-renew on). Porkbun requires `cost` as a
    //    confirmation integer; without it the API returns INVALID_INPUT.
    const res = await porkbunPost<{
      status: string;
      code?: string;
      message?: string;
      response?: any;
      price?: string;
      requestId?: string;
    }>(`/domain/create/${encodeURIComponent(domain)}`, {
      ...creds,
      years: 1,
      cost,
      autoRenew: "yes",
    });

    if (res.status !== "SUCCESS") {
      return {
        success: false,
        domain,
        expiresAt: null,
        price: null,
        simulated: false,
        error: res.message || res.code || `Porkbun registration failed (${res.status})`,
      };
    }

    const expiresAt = new Date(Date.now() + YEAR_MS).toISOString();
    return {
      success: true,
      domain,
      expiresAt,
      price: res.price ? Number(res.price) : cost,
      simulated: false,
    };
  } catch (err: any) {
    console.error("❌ [Domain Registry] Registration error:", err?.message || err);
    return {
      success: false,
      domain,
      expiresAt: null,
      price: null,
      simulated: false,
      error: err?.message || "Registration request failed",
    };
  }
}
export interface VercelResult {
  success: boolean;
  simulated: boolean;
  message?: string;
}

/**
 * Adds the domain to the Neerzy Vercel project (hosting + SSL).
 * POST https://api.vercel.com/v9/projects/{projectId}/domains
 */
export async function addDomainToVercel(domainName: string): Promise<VercelResult> {
  const domain = normalizeDomain(domainName);
  const token = process.env.VERCEL_TOKEN || "";
  const projectId = process.env.VERCEL_PROJECT_ID || "";

  if (!token || !projectId) {
    console.warn(
      "☁️ [Vercel API] Missing VERCEL_TOKEN / VERCEL_PROJECT_ID — SKIPPING " +
        `project domain add for ${domain}.`
    );
    return {
      success: true,
      simulated: true,
      message:
        "Domain registered. Add VERCEL_TOKEN + VERCEL_PROJECT_ID to auto-link the project.",
    };
  }

  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
        cache: "no-store",
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (json as any)?.error?.code ||
        (json as any)?.error?.message ||
        `Vercel ${res.status}`;
      console.error("❌ Vercel add-domain failed:", msg);
      return { success: false, simulated: false, message: String(msg) };
    }
    console.log(`✅ [Vercel API] ${domain} linked to project — SSL provisioning started.`);
    return { success: true, simulated: false };
  } catch (err: any) {
    console.error("❌ Vercel add-domain error:", err?.message || err);
    return { success: false, simulated: false, message: err?.message || "Vercel request failed" };
  }
}

/** Days between `expiresAt` and now (negative once expired). */
export function daysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  if (Number.isNaN(exp)) return null;
  return Math.ceil((exp - Date.now()) / (24 * 60 * 60 * 1000));
}

/** True when the domain is in the day-330 window (≤35 days left, still active). */
export function isInRenewalNoticeWindow(expiresAt: string | null | undefined): boolean {
  const days = daysUntilExpiry(expiresAt);
  return days !== null && days >= 0 && days <= RENEWAL_NOTICE_BEFORE_DAYS;
}

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Country-aware suggestions (used by /api/domains "suggest")
//
//  Priority is always the trader's OWN country TLD first, then the global
//  .com. The country comes from the address Google already gave us at
//  onboarding — nothing extra is asked of the trader, and no single country
//  is special-cased in the UI. Unmapped countries simply fall back to .com.
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** ISO-3166 alpha-2 → local ccTLDs (most preferred first). */
export const COUNTRY_TLDS: Record<string, { name: string; tlds: string[] }> = {
  CA: { name: "Canada", tlds: [".ca"] },
  US: { name: "United States", tlds: [".us"] },
  GB: { name: "United Kingdom", tlds: [".co.uk", ".uk"] },
  AU: { name: "Australia", tlds: [".com.au"] },
  NZ: { name: "New Zealand", tlds: [".co.nz"] },
  IE: { name: "Ireland", tlds: [".ie"] },
  ZA: { name: "South Africa", tlds: [".co.za"] },
  IN: { name: "India", tlds: [".in"] },
};

/** Global fallbacks, tried AFTER the trader's own country TLDs. */
export const GLOBAL_TLDS = [".com", ".net"] as const;

/** The only TLD the one-price checkout can register today. */
export const BUYABLE_TLDS = [".com"] as const;

/** Address tails → ISO-2. Google returns e.g. "Austin, TX 78704, USA". */
const COUNTRY_HINTS: Array<[RegExp, string]> = [
  [/canada|canadian/i, "CA"],
  [/united states|u\.?s\.?a\b/i, "US"],
  [/united kingdom|england|scotland|wales|northern ireland|\buk\b|\bgb\b/i, "GB"],
  [/australia/i, "AU"],
  [/new zealand/i, "NZ"],
  [/ireland/i, "IE"],
  [/south africa/i, "ZA"],
  [/india/i, "IN"],
];

/** Best-effort country detection from a formatted Google address. */
export function detectCountryFromAddress(address?: string | null): string | null {
  const a = (address || "").trim();
  if (!a) return null;
  for (const [re, code] of COUNTRY_HINTS) {
    if (re.test(a)) return code;
  }
  return null;
}

/** "Smith Plumbing & Heating" → "smithplumbingandheating". */
export function domainSlug(input: string): string {
  return (input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

/** First two words of the trade name → "smithplumbing" (reads better locally). */
export function shortDomainSlug(input: string): string {
  const words = (input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (words.length <= 1) return domainSlug(input);
  return words.slice(0, 2).join("");
}

export interface DomainCandidate {
  domain: string;
  /** ISO-2 when this candidate came from the trader's own country TLD. */
  localFor: string | null;
}

/**
 * Ordered candidate list: own-country TLD(s) first, then global TLDs.
 * Duplicates are dropped and the list is capped so one lookup stays quick
 * (Porkbun rate-limits availability checks).
 */
export function candidateDomains(
  name: string,
  country?: string | null,
  limit = 4
): DomainCandidate[] {
  const raw = normalizeDomain(name);
  if (!raw) return [];
  // Already a full domain → only that one is relevant.
  if (raw.includes(".")) return [{ domain: raw, localFor: null }];

  const code = country ? country.toUpperCase() : null;
  const local = code ? COUNTRY_TLDS[code] : undefined;
  const full = domainSlug(raw);
  const short = shortDomainSlug(raw);

  const out: DomainCandidate[] = [];
  const push = (domain: string, localFor: string | null) => {
    if (domain && !out.some((c) => c.domain === domain)) out.push({ domain, localFor });
  };

  if (local) {
    push(`${short}${local.tlds[0]}`, code);
    push(`${full}${local.tlds[0]}`, code);
  }
  push(`${full}${GLOBAL_TLDS[0]}`, null);
  push(`${short}${GLOBAL_TLDS[0]}`, null);

  return out.slice(0, Math.max(1, limit));
}

export interface DomainSuggestion extends AvailabilityResult {
  /** This is the one Neerzy recommends (first available in priority order). */
  suggested: boolean;
  /** Why it is recommended. */
  note?: string;
  /** True when the lookup actually completed (never claim "taken" otherwise). */
  verified: boolean;
  /** True when the one-price checkout can register it today. */
  buyable: boolean;
  localFor: string | null;
  countryName: string | null;
}

/**
 * Ranks the ordered candidates and marks exactly one as Neerzy's pick: the
 * first candidate the probe says is free. Uses the fast DNS probe (see
 * probeDomainAvailability) because Porkbun's own check is rate-limited to
 * ~1 per 10s and cannot rank a list; the real check happens at purchase.
 * A failed probe comes back as `verified: false` so the UI says "couldn't
 * verify" instead of wrongly telling a trader the name is taken.
 */
export async function suggestDomains(
  name: string,
  opts: { country?: string | null; address?: string | null; limit?: number } = {}
): Promise<{ query: string; country: string | null; suggestions: DomainSuggestion[] }> {
  const explicit = opts.country ? opts.country.toUpperCase() : null;
  const country = explicit || detectCountryFromAddress(opts.address) || null;
  const candidates = candidateDomains(name, country, opts.limit ?? 4);

  const suggestions: DomainSuggestion[] = [];
  let picked = false;

  for (const c of candidates) {
    const check = await probeDomainAvailability(c.domain);
    const verified = !check.error;
    const available = verified && check.available === true;
    const buyable = available && BUYABLE_TLDS.some((t) => c.domain.endsWith(t));
    const suggested = !picked && available;

    if (suggested) picked = true;

    suggestions.push({
      ...check,
      available,
      suggested,
      note: suggested
        ? c.localFor
          ? "Best for local businesses"
          : "Best available name for your business"
        : undefined,
      verified,
      buyable,
      localFor: c.localFor,
      countryName: c.localFor ? COUNTRY_TLDS[c.localFor]?.name ?? null : null,
    });
  }

  return { query: normalizeDomain(name), country, suggestions };
}
