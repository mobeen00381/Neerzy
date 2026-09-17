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
 * TLDs Porkbun can register WITHOUT extended attributes (no .us nexus, no .ca
 * legal type, …). Recognized as domains — NOT automatically sellable: the
 * flat-$19 offer is gated per request by getBuyableTlds().
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

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TLD wholesale pricing → margin gate
//
//  Neerzy sells EVERY domain at the flat $19 (see DOMAIN_PRICE_USD). A TLD is
//  only sellable while Porkbun's wholesale cost stays under MAX_TLD_COST_USD
//  on BOTH the registration AND the renewal: registrations are created with
//  `autoRenew: "yes"`, so Neerzy's own card carries the renewal, and the
//  day-330 renewal notice promises the trader "the same $19". Gating on the
//  max of the two keeps that promise truthful and the margin ≥ $4.
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Ceiling on Porkbun wholesale cost (USD) for any TLD we sell at $19. */
export const MAX_TLD_COST_USD = 15;

/**
 * Markup on Porkbun PREMIUM-priced names (a specific domain, not a TLD, that
 * the registry sells far above base cost). The customer pays wholesale + 20%,
 * so Neerzy still earns on every premium sale instead of refusing the name.
 *
 * NOTE: Paddle (merchant of record) keeps ~5% + $0.50 per transaction, so a
 * 20% markup nets roughly 14–15%. Raise PREMIUM_MARKUP if 20% NET is wanted.
 */
export const PREMIUM_MARKUP = 1.2;

/** Customer price for a premium domain: wholesale + markup, rounded UP to a
 *  whole dollar so we never round a margin away. */
export function premiumCustomerPrice(wholesaleUsd: number): number {
  if (!Number.isFinite(wholesaleUsd) || wholesaleUsd <= 0) return DOMAIN_PRICE_USD;
  return Math.ceil(wholesaleUsd * PREMIUM_MARKUP);
}

export interface TldPricing {
  registration: number | null;
  renewal: number | null;
  transfer: number | null;
}

/** Highest of registration/renewal — the number the margin gate uses. */
export function effectiveTldCost(p: TldPricing | undefined): number | null {
  if (!p) return null;
  const values = [p.registration, p.renewal].filter(
    (v): v is number => typeof v === "number" && v > 0
  );
  return values.length ? Math.max(...values) : null;
}

/**
 * ccTLDs Porkbun can register WITHOUT extended attributes.
 *
 * DELIBERATELY MANUAL (human-approved), never inferred from the pricing API:
 * eligibility is registry policy (CIRA presence for .ca, US nexus for .us,
 * ABN/ACN for .com.au, …), not a field Porkbun exposes. Each TLD added here
 * must be verified with a sandbox registration before it goes live — see
 * TLD_NEEDS_ATTRIBUTES for the known exclusions and their reasons.
 *
 * Verified against live /pricing/get output (scratch/diag-porkbun-pricing.js,
 * 2026-09-18): .in $7.83 · .co.nz $14.99 · .co.uk $5.66 — all under the $15
 * ceiling. `.co.za` was REMOVED from this list: Porkbun publishes no pricing
 * for it, so the margin gate would fail closed and it could never be sold.
 */
export const CC_TLD_ALLOWLIST = [".in", ".co.nz", ".co.uk"] as const;

/** TLDs a trader may see suggested but that are never auto-charged: each one
 *  needs registry paperwork (ABN, CIRA presence, nexus, legal type …) that the
 *  one-click $19 checkout cannot collect. */
export const TLD_NEEDS_ATTRIBUTES: Record<string, string> = {
  ".ca": "Canadian presence requirement (CIRA)",
  ".us": "US nexus requirement",
  ".ie": "Irish/EU connection + legal type",
  ".com.au": "ABN/ACN required",
  ".uk": "registry verification required",
};

const PRICING_CACHE_MS = 24 * 60 * 60 * 1000;

/**
 * Fallback wholesale costs, used ONLY when Porkbun's pricing API is
 * unreachable WHILE credentials are configured. Kept intentionally minimal: a
 * TLD missing here fails CLOSED (not sellable) rather than being sold against
 * a guessed price. Every hit is logged loudly.
 */
const FALLBACK_TLD_PRICING: Record<string, TldPricing> = {
  // Informational only: .com is always sellable, so this value never gates it.
  ".com": { registration: 11.08, renewal: 11.08, transfer: 11.08 },
};

let pricingCache: { at: number; pricing: Record<string, TldPricing>; live: boolean } | null = null;

/** "com" / "COM" / ".com" → ".com" (Porkbun omits the leading dot). */
function normalizeTldKey(key: string): string {
  const k = String(key || "").trim().toLowerCase();
  return k ? (k.startsWith(".") ? k : `.${k}`) : "";
}

function toMoney(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * POST /domain/getPricing → per-TLD wholesale costs (USD), cached 24h.
 *
 * `live: false` means "do not sell ccTLDs": either we have no credentials at
 * all (local/dev simulation — allowlisted ccTLDs stay visible for testing) or
 * the API failed while credentials exist (fail closed).
 */
export async function getPorkbunPricing(): Promise<{
  pricing: Record<string, TldPricing>;
  live: boolean;
}> {
  if (pricingCache && Date.now() - pricingCache.at < PRICING_CACHE_MS) {
    return { pricing: pricingCache.pricing, live: pricingCache.live };
  }

  const creds = porkbunAuth();
  if (!creds) {
    return { pricing: FALLBACK_TLD_PRICING, live: false };
  }

  try {
    const json = await porkbunPost<{
      status: string;
      pricing?: Record<string, Record<string, unknown>>;
      code?: string;
      message?: string;
    }>("/pricing/get", creds);

    if (json.status !== "SUCCESS" || !json.pricing) {
      throw new Error(json.message || json.code || `status ${json.status}`);
    }

    const pricing: Record<string, TldPricing> = {};
    for (const [key, value] of Object.entries(json.pricing)) {
      const tld = normalizeTldKey(key);
      if (!tld || !value || typeof value !== "object") continue;
      pricing[tld] = {
        registration: toMoney((value as any).registration),
        renewal: toMoney((value as any).renewal),
        transfer: toMoney((value as any).transfer),
      };
    }
    pricingCache = { at: Date.now(), pricing, live: true };
    return { pricing, live: true };
  } catch (err: any) {
    console.error(
      "❌ [Domain Registry] Porkbun pricing lookup failed — using the hardcoded cost map. " +
        "ccTLDs are withheld (fail closed) until the API recovers:",
      err?.message || err
    );
    return { pricing: FALLBACK_TLD_PRICING, live: false };
  }
}

export interface BuyableTldInfo {
  tld: string;
  /** max(registration, renewal) — null when pricing is unavailable. */
  cost: number | null;
  registration: number | null;
  renewal: number | null;
  underCeiling: boolean;
  noExtendedAttributes: boolean;
  buyable: boolean;
}

/**
 * The single source of truth for "what can the $19 checkout register today".
 * `.com` is always present (the original offer); allowlisted ccTLDs join it
 * only while their live wholesale cost stays under the ceiling, so a TLD that
 * crosses $15 is withdrawn automatically on the next 24h refresh.
 */
export async function getBuyableTldInfo(): Promise<BuyableTldInfo[]> {
  const { pricing, live } = await getPorkbunPricing();
  const credsConfigured = !!porkbunAuth();

  const entries: string[] = [".com", ...CC_TLD_ALLOWLIST];

  return entries.map((tld) => {
    const p = pricing[tld];
    const cost = effectiveTldCost(p);
    const noExtendedAttributes = !(tld in TLD_NEEDS_ATTRIBUTES);
    // No credentials at all → local/dev simulation, so allowlisted ccTLDs stay
    // visible for testing. Credentials present but pricing unavailable → fail
    // closed (never sell a ccTLD against a guessed cost).
    const underCeiling =
      tld === ".com" ? true : live ? cost !== null && cost < MAX_TLD_COST_USD : !credsConfigured;
    return {
      tld,
      cost,
      registration: p?.registration ?? null,
      renewal: p?.renewal ?? null,
      underCeiling,
      noExtendedAttributes,
      buyable: underCeiling && noExtendedAttributes,
    };
  });
}

/** Buyable TLD list (`.com` first) — used by suggest + purchase so both agree. */
export async function getBuyableTlds(): Promise<string[]> {
  const info = await getBuyableTldInfo();
  return info.filter((i) => i.buyable).map((i) => i.tld);
}

/** Longest-match TLD lookup: "smithheating.co.nz" → ".co.nz". */
export function tldOf(domainName: string): string | null {
  const d = normalizeDomain(domainName);
  if (!d.includes(".")) return null;
  const parts = d.split(".");
  if (parts.length >= 3) {
    const two = `.${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (two in TLD_NEEDS_ATTRIBUTES || (CC_TLD_ALLOWLIST as readonly string[]).includes(two)) {
      return two;
    }
  }
  return `.${parts[parts.length - 1]}`;
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

/** True when the domain ends in one of the registerable TLDs.
 *
 *  Superset of what the $19 checkout can actually charge for: ccTLDs listed in
 *  TLD_NEEDS_ATTRIBUTES are intentionally NOT registerable (registry paperwork
 *  the one-click flow cannot collect). Per-request buyability is decided by
 *  getBuyableTlds(). */
export function isRegisterableDomain(domainName: string): boolean {
  const d = domainName.toLowerCase();
  return [...DOMAIN_TLDS, ...CC_TLD_ALLOWLIST].some((tld) => d.endsWith(tld));
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
  /**
   * Porkbun sells this specific name at a premium (registry premium list), or
   * the per-domain price sits above MAX_TLD_COST_USD — the one-price $19 offer
   * cannot cover it, so it is quoted at wholesale + PREMIUM_MARKUP instead.
   */
  premium?: boolean;
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

    // Premium detection, two independent signals:
    //   1) Porkbun's own `premium` flag (string: "yes"/"true"/the premium price)
    //   2) the per-domain price sits above the TLD ceiling — since a sellable TLD
    //      is by definition under MAX_TLD_COST_USD, a higher quote for one name
    //      means the registry premium-priced that name.
    const premiumRaw = String((r as any).premium ?? "").toLowerCase();
    const premium =
      premiumRaw === "yes" ||
      premiumRaw === "true" ||
      (Number.isFinite(Number(premiumRaw)) && Number(premiumRaw) > 0) ||
      (price !== null && price > MAX_TLD_COST_USD);

    const result: AvailabilityResult = {
      domain,
      available,
      price,
      currency: "USD",
      simulated: false,
      rawStatus: avail || json.status,
      premium,
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

/** ISO-3166 alpha-2 → local ccTLDs (most preferred first).
 *
 *  `suffix` is what gets appended to the business name for the local-style
 *  `.com` fallback (smithheating + au + .com). It defaults to the lowercased
 *  ISO-2 code; the UK is the one case where the natural suffix is NOT the ISO
 *  code (people say "uk", not "gb"). */
export const COUNTRY_TLDS: Record<string, { name: string; tlds: string[]; suffix?: string }> = {
  CA: { name: "Canada", tlds: [".ca"] },
  US: { name: "United States", tlds: [".us"] },
  GB: { name: "United Kingdom", tlds: [".co.uk", ".uk"], suffix: "uk" },
  AU: { name: "Australia", tlds: [".com.au"] },
  NZ: { name: "New Zealand", tlds: [".co.nz"] },
  IE: { name: "Ireland", tlds: [".ie"] },
  ZA: { name: "South Africa", tlds: [".co.za"] },
  IN: { name: "India", tlds: [".in"] },
};

/** "smithheating" + AU → "au" · "smithheating" + GB → "uk". */
export function countrySuffix(code: string): string {
  const upper = (code || "").toUpperCase();
  return (COUNTRY_TLDS[upper]?.suffix || upper).toLowerCase();
}

/** Global fallbacks, tried AFTER the trader's own country TLDs. */
export const GLOBAL_TLDS = [".com", ".net"] as const;

// NOTE: there is deliberately no static "buyable" list any more. Buyability is
// decided per request by getBuyableTlds() — `.com` plus allowlisted ccTLDs whose
// live wholesale cost is under MAX_TLD_COST_USD — so an imported constant can
// never drift out of sync with what the checkout will actually accept.

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
  /** How the candidate was built — drives badge + copy in the UI. */
  kind: "local-tld" | "local-com" | "global-com" | "exact";
  /** Set when the TLD needs registry paperwork (ABN, CIRA presence, nexus …). */
  requires?: string;
}

/**
 * Ordered candidate list — the trader's own country first, then the local-style
 * `.com` fallback, then the plain global `.com`:
 *
 *   "Smith Heating", AU →
 *     1. smithheating.com.au     (local TLD — needs an ABN, so not buyable)
 *     2. smithheatingau.com      (business name + country + .com  ← the fallback)
 *     3. smithheating.com        (plain .com, always buyable)
 *     4. smithplumbingandheating.com (full slug, when short & full differ)
 *
 * Duplicates are dropped and the list is capped so one lookup stays quick
 * (Porkbun rate-limits availability checks; ranking itself uses the DNS probe).
 */
export function candidateDomains(
  name: string,
  country?: string | null,
  limit = 4
): DomainCandidate[] {
  const raw = normalizeDomain(name);
  if (!raw) return [];
  // Already a full domain → only that one is relevant.
  if (raw.includes(".")) return [{ domain: raw, localFor: null, kind: "exact" }];

  const code = country ? country.toUpperCase() : null;
  const local = code ? COUNTRY_TLDS[code] : undefined;
  const full = domainSlug(raw);
  const short = shortDomainSlug(raw);

  const out: DomainCandidate[] = [];
  const push = (domain: string, localFor: string | null, kind: DomainCandidate["kind"]) => {
    if (!domain || out.some((c) => c.domain === domain)) return;
    out.push({ domain, localFor, kind, requires: TLD_NEEDS_ATTRIBUTES[tldOf(domain) || ""] });
  };

  if (code && local) {
    // 1) The trader's own TLD — shown even when it needs paperwork, so a local
    //    business sees their real local name and understands the trade-off.
    push(`${short}${local.tlds[0]}`, code, "local-tld");
    // 2) Local-style .com fallback (smithheatingau.com) — the one that always
    //    works, because it is a plain .com at the flat $19.
    push(`${short}${countrySuffix(code)}.com`, null, "local-com");
  }

  // 3) + 4) Plain global .com.
  push(`${short}${GLOBAL_TLDS[0]}`, null, "global-com");
  push(`${full}${GLOBAL_TLDS[0]}`, null, "global-com");

  return out.slice(0, Math.max(1, limit));
}

export interface DomainSuggestion extends AvailabilityResult {
  /** Neerzy's pick: the first candidate that is BOTH available AND sellable. */
  suggested: boolean;
  /** Why it is recommended — or why it can't be sold yet. */
  note?: string;
  /** True when the lookup actually completed (never claim "taken" otherwise). */
  verified: boolean;
  /** True when the $19 checkout can register it right now. */
  buyable: boolean;
  /** How the name was built — "local-tld" | "local-com" | "global-com" | "exact". */
  kind: DomainCandidate["kind"];
  /** Registry paperwork the one-click flow cannot collect (e.g. "ABN/ACN required"). */
  requires: string | null;
  localFor: string | null;
  countryName: string | null;
}

/**
 * Ranks the ordered candidates and marks exactly one as Neerzy's pick.
 *
 * Ranking uses the fast DNS probe (see probeDomainAvailability) because
 * Porkbun's own check is rate-limited to ~1 per 10s and cannot rank a list; the
 * authoritative check runs at purchase. A failed probe comes back as
 * `verified: false` so the UI says "couldn't verify" rather than wrongly
 * telling a trader the name is taken.
 *
 * Filtering uses the live margin gate: a TLD costing ≥ $15 at Porkbun is
 * dropped entirely, and only TLDs the $19 checkout can actually register are
 * ever marked `buyable` — so a name is never suggested here and refused at
 * checkout. Paper-gated ccTLDs (.com.au, .ca …) stay visible with a note.
 */
export async function suggestDomains(
  name: string,
  opts: { country?: string | null; address?: string | null; limit?: number } = {}
): Promise<{ query: string; country: string | null; suggestions: DomainSuggestion[] }> {
  const explicit = opts.country ? opts.country.toUpperCase() : null;
  const country = explicit || detectCountryFromAddress(opts.address) || null;
  const candidates = candidateDomains(name, country, opts.limit ?? 4);

  // One shared source of truth for "what can we sell today".
  const buyableTlds = new Set(await getBuyableTlds());

  const suggestions: DomainSuggestion[] = [];

  for (const c of candidates) {
    const tld = tldOf(c.domain) || "";

    // Margin gate: over-ceiling TLDs are never shown. Paper-gated TLDs stay
    // visible (with `requires`) so a local trader understands why they can't
    // have the local name and sees the .com alternative right below it.
    if (tld !== ".com" && !buyableTlds.has(tld) && !c.requires) continue;

    const check = await probeDomainAvailability(c.domain);
    const verified = !check.error;
    const available = verified && check.available === true;
    const buyable = available && buyableTlds.has(tld);

    suggestions.push({
      ...check,
      available,
      suggested: false,
      verified,
      buyable,
      kind: c.kind,
      requires: c.requires ?? null,
      localFor: c.localFor,
      countryName: c.localFor ? COUNTRY_TLDS[c.localFor]?.name ?? null : null,
      // Every sellable name is the flat Neerzy price, whatever the TLD costs.
      price: buyable ? DOMAIN_PRICE_USD : check.price,
    });
  }

  // Exactly one recommendation: the first candidate that is BOTH available and
  // sellable. Only when nothing is sellable do we fall back to the first
  // available name (e.g. AU, where .com.au needs an ABN).
  let pickedIdx = suggestions.findIndex((s) => s.available && s.buyable);
  if (pickedIdx === -1) pickedIdx = suggestions.findIndex((s) => s.available);

  // Explain the paperwork block on every gated candidate, not just the pick.
  for (const s of suggestions) {
    if (s.requires) {
      s.note = `Needs ${s.requires} — the $19 one-click checkout can't register this yet`;
    }
  }

  if (pickedIdx >= 0) {
    const pick = suggestions[pickedIdx];
    pick.suggested = true;
    pick.note = pick.requires
      ? `Available, but needs ${pick.requires} — pick the .com below`
      : pick.kind === "local-tld"
        ? "Best for local businesses"
        : pick.kind === "local-com"
          ? "Your business name + country + .com"
          : "Best available name for your business";
  }

  return { query: normalizeDomain(name), country, suggestions };
}
