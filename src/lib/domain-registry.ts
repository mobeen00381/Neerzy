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
  if (!res.ok) {
    throw new Error(`Porkbun API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
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
}

/**
 * Real Porkbun check: POST /domain/check/{domain}.
 * Simulated DNS probe when keys are missing (dev only).
 */
export async function checkDomainAvailability(
  domainName: string
): Promise<AvailabilityResult> {
  const domain = normalizeDomain(domainName);

  const creds = porkbunAuth();
  if (!creds) {
    return simulateAvailability(domain);
  }

  try {
    const json = await porkbunPost<{
      status: string;
      availability?: string;
      price?: string;
      currency?: string;
    }>(`/domain/check/${encodeURIComponent(domain)}`, creds);

    const raw = json.availability || "";
    const available =
      json.status === "SUCCESS" &&
      (raw === "AVAILABLE" || raw === "UNREGISTERED");

    return {
      domain,
      available,
      price: json.price ? Number(json.price) : null,
      currency: json.currency || "USD",
      simulated: false,
      rawStatus: raw || undefined,
    };
  } catch (err: any) {
    console.error("❌ Porkbun availability check failed:", err?.message || err);
    // Never hard-block the UI on a lookup failure — surface "could not verify".
    return { domain, available: false, price: null, currency: "USD", simulated: true };
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
    const res = await porkbunPost<{
      status: string;
      price?: string;
      error?: string;
      requestId?: string;
    }>(`/domain/register/${encodeURIComponent(domain)}`, {
      ...creds,
      years: 1,
      autoRenew: "yes",
    });

    if (res.status !== "SUCCESS") {
      return {
        success: false,
        domain,
        expiresAt: null,
        price: null,
        simulated: false,
        error: res.error || `Porkbun registration failed (${res.status})`,
      };
    }

    // Best-effort: make sure auto-renew is on for year 2 (no surprise lapses).
    try {
      await porkbunPost(`/domain/update/${encodeURIComponent(domain)}`, {
        ...creds,
        autoRenew: "yes",
      });
    } catch (renewErr: any) {
      console.warn("⚠️ Auto-renew toggle failed (non-fatal):", renewErr?.message || renewErr);
    }

    const expiresAt = new Date(Date.now() + YEAR_MS).toISOString();
    return {
      success: true,
      domain,
      expiresAt,
      price: res.price ? Number(res.price) : DOMAIN_PRICE_USD,
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
