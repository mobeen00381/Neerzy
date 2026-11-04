// src/lib/audit-engine.ts
//
// The single scoring engine behind the GBP audit report.
//
// DESIGN RULE: nothing here may be invented. Every finding is either
//   - verifiable from Google's public Places API,
//   - verifiable by fetching the business's own website / robots.txt / llms.txt,
//   - or explicitly marked "manual" (status: "manual") because it lives inside
//     the Google Business Profile dashboard (posts, Q&A, owner replies,
//     attributes, holiday hours, photo albums past the 10-photo public cap).
//
// Manual findings never count for or against a score. This is what stops the
// report telling a plumber to "fix" something Google does not publish.
//
// Scores are the three surfaces a trade business actually competes on:
//   local_seo — Google Maps / Local Pack fundamentals (profile + reviews + photos)
//   aeo       — answer-engine readiness: can a voice assistant or AI answer
//               "who's a good plumber near me?" using your own website + profile
//   geo       — generative-engine access: can AI crawlers read your site, and is
//               your business described in structured data they can quote
//
// Section scores are 0-100 over VERIFIED weight only. The overall score is the
// weighted mean of the MEASURABLE sections, renormalised, so a business without
// a website is not silently capped for a surface we could not read.

// ─── Shared vocabulary ───────────────────────────────────────────────────────

/** Types Google attaches to nearly every listing - useless as a category signal. */
export const GENERIC_TYPES = new Set([
  "point_of_interest",
  "establishment",
  "local_business",
  "service",
  "store",
  "premise",
  "subpremise",
]);

/** Too generic to count as the trade keyword in a business name. */
const GENERIC_NAME_WORDS = new Set([...GENERIC_TYPES, "contractor", "company", "supplier"]);

/** First non-generic Places type, unmodified ("roofing_contractor"). */
export function primaryCategoryOf(types?: string[] | null): string | null {
  for (const raw of types || []) {
    const type = String(raw || "").trim();
    if (!type || GENERIC_TYPES.has(type)) continue;
    return type;
  }
  return null;
}

/** Meaningful service words on this listing ("plumber", "roofing", ...). */
export function serviceKeywords(types?: string[] | null): string[] {
  const words = new Set<string>();
  for (const type of types || []) {
    for (const part of String(type).split("_")) {
      const word = part.trim().toLowerCase();
      if (word.length >= 5 && !GENERIC_NAME_WORDS.has(word)) words.add(word);
    }
  }
  return [...words];
}

/**
 * Is the trade actually in the business name? Compared on 5-character stems so
 * plumber/plumbing and electrician/electrical both match.
 */
export function nameHasServiceKeyword(name: string, types?: string[] | null): boolean {
  const normalized = String(name || "").toLowerCase();
  if (!normalized) return false;
  return serviceKeywords(types).some((keyword) => normalized.includes(keyword.slice(0, 5)));
}

// ─── Trade profile layer ─────────────────────────────────────────────────────
//
// The audit already captures `types` but never used it. Trade shape changes what
// "good" looks like: an emergency trade lives or dies on being findable and
// callable in the next five minutes, a scheduled trade on being comparable.
//
// Benchmarks come from the guides this site already publishes
// (content/guides/*.mdx): reviews "50+" is the rough benchmark for scoring
// well, photos "50+ recent, varied" is the standard, with electricians aiming
// for 100+.
export type TradeProfile = {
  /** Stable key derived from the primary Places type. */
  key: string;
  /** Human label for copy: "Plumbing", "Electrical". */
  label: string;
  /** True when customers search in an emergency (call-now intent). */
  emergency: boolean;
  /** Competitive review count for this trade (published benchmark). */
  reviewBenchmark: number;
  /** Photo target for this trade (published benchmark). */
  photoTarget: number;
  /** Search phrases a customer of this trade actually types. */
  keywords: string[];
  /** Why this trade's shape changes the priority order, in plain English. */
  note: string;
};

const TRADE_PROFILES: Record<string, Omit<TradeProfile, "key">> = {
  plumber: {
    label: "Plumbing",
    emergency: true,
    reviewBenchmark: 50,
    photoTarget: 50,
    keywords: ["emergency plumber", "plumber near me", "boiler repair"],
    note: "Plumbing is emergency work: the customer calls the first listing that looks real and answers, usually within minutes.",
  },
  electrician: {
    label: "Electrical",
    emergency: true,
    reviewBenchmark: 50,
    photoTarget: 100,
    keywords: ["emergency electrician", "electrician near me", "fuse box repair"],
    note: "Electrical work is trust-heavy and urgent. Proof of certification and recent job photos do the selling.",
  },
  hvac: {
    label: "Heating & Cooling",
    emergency: true,
    reviewBenchmark: 50,
    photoTarget: 50,
    keywords: ["emergency boiler repair", "heating engineer near me", "air conditioning installation"],
    note: "Heating failures are urgent and seasonal; being findable the day it breaks is most of the battle.",
  },
  roofing: {
    label: "Roofing",
    emergency: true,
    reviewBenchmark: 50,
    photoTarget: 50,
    keywords: ["roof repair near me", "emergency roofer", "storm damage roof"],
    note: "Roofing is storm-driven and high-value: photos of completed roofs carry more weight than any copy.",
  },
  locksmith: {
    label: "Locksmith",
    emergency: true,
    reviewBenchmark: 50,
    photoTarget: 50,
    keywords: ["locksmith near me", "emergency locksmith", "lock change"],
    note: "Locksmith demand is immediate and mobile - the customer is often standing outside a locked door.",
  },
  handyman: {
    label: "Handyman & Property Maintenance",
    emergency: false,
    reviewBenchmark: 50,
    photoTarget: 50,
    keywords: ["handyman near me", "property maintenance", "odd jobs"],
    note: "Handyman work is planned, so comparison shopping matters more than instant callability.",
  },
  dentist: {
    label: "Dental",
    emergency: false,
    reviewBenchmark: 50,
    photoTarget: 50,
    keywords: ["dentist near me", "emergency dentist", "teeth whitening"],
    note: "Dental patients compare carefully; review recency and a clear service list decide the shortlist.",
  },
  auto_repair: {
    label: "Garage & Auto Repair",
    emergency: false,
    reviewBenchmark: 50,
    photoTarget: 50,
    keywords: ["garage near me", "car service", "MOT and repairs"],
    note: "Drivers check three things: can you fit them in, do you do their job, and how close you are.",
  },
};

/** Places type -> trade profile key. */
const TRADE_ALIASES: Record<string, string> = {
  plumber: "plumber",
  plumbing: "plumber",
  electrician: "electrician",
  electrical: "electrician",
  hvac_business: "hvac",
  hvac: "hvac",
  heating_contractor: "hvac",
  roofer: "roofing",
  roofing_contractor: "roofing",
  locksmith: "locksmith",
  handyman: "handyman",
  general_contractor: "handyman",
  home_and_construction_business: "handyman",
  dentist: "dentist",
  dental_clinic: "dentist",
  auto_repair: "auto_repair",
  car_repair: "auto_repair",
};

/** Resolve a trade profile from Places types, falling back to a neutral profile. */
export function tradeProfileFor(types?: string[] | null): TradeProfile {
  const category = primaryCategoryOf(types);
  const profileKey = category ? TRADE_ALIASES[category] : undefined;
  const profile = profileKey ? TRADE_PROFILES[profileKey] : undefined;

  if (profileKey && profile) {
    return { key: profileKey, ...profile };
  }

  return {
    key: "local_service",
    label: category ? category.replace(/_/g, " ") : "Local service",
    emergency: false,
    reviewBenchmark: 50,
    photoTarget: 50,
    keywords: ["near me", "local trade", "same day service"],
    note: "Every local trade competes on the same three things: a complete profile, recent reviews, and being callable.",
  };
}

// ─── Website scan ────────────────────────────────────────────────────────────
//
// Every AEO/GEO finding below comes from a plain server-side GET of the pages the
// business has already published: homepage HTML, /robots.txt and /llms.txt. If a
// site cannot be read the finding is reported as "manual" with the reason, never
// as a failure - a Cloudflare block is not the owner's fault and not a ranking
// fact we can prove.

/** AI crawlers whose access decides whether an LLM can read the site at all. */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-Web",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "Meta-ExternalAgent",
];

const MAX_BODY_CHARS = 400_000;
const FETCH_TIMEOUT_MS = 6000;

/** Identifies us honestly; sites that block bots simply get "manual" findings. */
const SCAN_USER_AGENT =
  "NeerzyAuditBot/1.0 (+https://www.neerzy.com/gmb-audit-tool; one-off public profile audit)";

export type WebsiteScan = {
  url: string;
  /** True when the homepage answered; false makes every HTML finding "manual". */
  reachable: boolean;
  status: number | null;
  error: string | null;
  title: string | null;
  metaDescription: string | null;
  /** Business name or trade keyword present in <title>. */
  nameInTitle: boolean;
  /** Google Business Profile phone number appears on the page (NAP match). */
  phoneOnPage: boolean;
  /** Trade keyword appears anywhere in the visible HTML. */
  tradeOnPage: boolean;
  schema: {
    blocks: number;
    types: string[];
    hasLocalBusiness: boolean;
    hasTelephone: boolean;
    hasAddress: boolean;
    hasOpeningHours: boolean;
    hasFaq: boolean;
    hasService: boolean;
  };
  robots: {
    checked: boolean;
    exists: boolean;
    /** AI crawlers explicitly disallowed from the whole site. */
    blockedCrawlers: string[];
    /** `User-agent: *` + `Disallow: /` — blocks every crawler including AI. */
    blocksAllCrawlers: boolean;
  };
  llmsTxt: { checked: boolean; exists: boolean };
};

type FetchResult = {
  ok: boolean;
  status: number | null;
  text: string;
  error: string | null;
};

async function fetchText(url: string, maxChars = MAX_BODY_CHARS): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": SCAN_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });
    const text = (await res.text()).slice(0, maxChars);
    return { ok: res.ok, status: res.status, text, error: null };
  } catch (error) {
    return {
      ok: false,
      status: null,
      text: "",
      error: error instanceof Error ? error.message : "fetch failed",
    };
  }
}

/** Normalise whatever the owner typed into a real http(s) URL. */
export function normalizeWebsite(website?: string | null): URL | null {
  const raw = String(website || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function normalizeWords(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** schema.org LocalBusiness family - what an AI engine needs to quote you. */
const LOCAL_BUSINESS_TYPES = new Set([
  "LocalBusiness",
  "ProfessionalService",
  "HomeAndConstructionBusiness",
  "Plumber",
  "Electrician",
  "HVACBusiness",
  "RoofingContractor",
  "Locksmith",
  "GeneralContractor",
  "HousePainter",
  "Carpenter",
  "AutoRepair",
  "Dentist",
  "MedicalBusiness",
  "Store",
  "Restaurant",
  "BeautySalon",
  "MovingCompany",
  "LegalService",
  "FinancialService",
  "LodgingBusiness",
]);

type SchemaWalk = { types: Set<string>; keys: Set<string> };

function collectSchemaFacts(node: unknown, walk: SchemaWalk, depth = 0): void {
  if (depth > 6 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaFacts(item, walk, depth + 1);
    return;
  }
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  for (const value of Array.isArray(type) ? type : [type]) {
    if (typeof value === "string") walk.types.add(value);
  }
  for (const [key, value] of Object.entries(obj)) {
    walk.keys.add(key.toLowerCase());
    if (value && typeof value === "object") collectSchemaFacts(value, walk, depth + 1);
  }
}

function readSchema(html: string): WebsiteScan["schema"] {
  const walk: SchemaWalk = { types: new Set(), keys: new Set() };
  const blocks = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];

  for (const block of blocks) {
    const payload = String(block[1] || "").trim();
    if (!payload) continue;
    try {
      collectSchemaFacts(JSON.parse(payload), walk);
    } catch {
      // Malformed JSON-LD is still a JSON-LD block; the count tells the story.
    }
  }

  const types = [...walk.types];
  const has = (name: string) => walk.keys.has(name);

  return {
    blocks: blocks.length,
    types,
    hasLocalBusiness: types.some((type) => LOCAL_BUSINESS_TYPES.has(type)),
    hasTelephone: has("telephone") || has("phone"),
    hasAddress: has("address") || has("postaladdress") || has("streetaddress"),
    hasOpeningHours: has("openinghoursspecification") || has("openinghours"),
    hasFaq: types.includes("FAQPage") || (types.includes("Question") && has("acceptedanswer")),
    hasService: types.includes("Service") || has("hasoffercatalog") || has("makesoffer"),
  };
}

/** A rule that blocks a crawler from the whole site. */
function blocksEverything(path: string): boolean {
  const value = path.trim();
  return value === "/" || value === "/*";
}

/**
 * Reads robots.txt the way crawlers do: consecutive `User-agent` lines share the
 * rules that follow. Only whole-site (`Disallow: /`) rules count as a block,
 * because a partial disallow does not stop an AI engine reading the homepage.
 */
function readRobots(text: string): WebsiteScan["robots"] {
  const blocked = new Set<string>();
  const aiCrawlers = new Map(AI_CRAWLERS.map((name) => [name.toLowerCase(), name]));
  let blocksAllCrawlers = false;

  let group: string[] = [];
  let sawRule = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === "user-agent") {
      if (sawRule) {
        group = [];
        sawRule = false;
      }
      group.push(value.toLowerCase());
      continue;
    }

    if (key !== "disallow") continue;
    sawRule = true;
    if (!blocksEverything(value)) continue;

    for (const agent of group) {
      if (agent === "*") {
        blocksAllCrawlers = true;
        continue;
      }
      const name = aiCrawlers.get(agent);
      if (name) blocked.add(name);
    }
  }

  return {
    checked: true,
    exists: text.trim().length > 0,
    blockedCrawlers: [...blocked],
    blocksAllCrawlers,
  };
}

function readTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() || null : null;
}

function readMetaDescription(html: string): string | null {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]).trim() || null;
  }
  return null;
}

function nameOrTradeInTitle(
  title: string | null,
  businessName: string | undefined,
  types?: string[] | null
): boolean {
  if (!title) return false;
  const words = normalizeWords(title);
  if (!words) return false;

  const name = normalizeWords(businessName || "");
  if (name && words.includes(name)) return true;
  const firstName = name.split(" ")[0];
  if (firstName.length >= 4 && words.includes(firstName)) return true;

  return serviceKeywords(types).some((keyword) => words.includes(keyword));
}

// ─── Report contract ─────────────────────────────────────────────────────────

/** "manual" = lives in the GBP dashboard / not publicly visible. Never scored. */
export type FindingStatus = "pass" | "fail" | "manual";

export type AuditFinding = {
  id: string;
  label: string;
  status: FindingStatus;
  /** Weight inside its section. Manual findings always carry 0. */
  weight: number;
  /** What we actually observed, in plain English. */
  detail: string;
  /** The one action that flips a failing finding to pass. */
  fix?: string;
};

export type AuditSectionKey = "local_seo" | "aeo" | "geo";

export type AuditSection = {
  key: AuditSectionKey;
  label: string;
  /** 0-100 over verified weight only. */
  score: number;
  /** False when nothing in this section could be verified. */
  measurable: boolean;
  verifiedWeight: number;
  earnedWeight: number;
  findings: AuditFinding[];
};

export type AuditTier = {
  key: "critical" | "weak" | "fair" | "strong" | "elite";
  label: string;
  summary: string;
};

/**
 * One row of the fix roadmap.
 *   red   — a verified fail that costs the most points: do this first
 *   amber — a verified fail with a smaller weight
 *   green — a signal Google does not publish: confirm it in the dashboard
 */
export type RoadmapStep = {
  id: string;
  section: AuditSectionKey;
  sectionLabel: string;
  priority: "red" | "amber" | "green";
  label: string;
  detail: string;
  action?: string;
  weight: number;
};

/** The top-ranked business Google returns for the same trade in the same town. */
export type CompetitorSnapshot = {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  /** Photos Google exposes (public API caps at 10). */
  photoCount: number;
  types: string[];
};

/** You vs the competitor returned by the same Places Text Search. */
export type BenchmarkRow = {
  id: string;
  label: string;
  you: string;
  them: string;
  status: "ahead" | "behind" | "level";
};

/**
 * The "what is this costing you" block.
 *
 * MEASURED inputs: your position among the listings Google returned for the same
 * trade + town, your review count and the leader's, your rating and theirs.
 *
 * MODELLED output: a band expressed as a PERCENTAGE of the owner's own enquiry
 * volume. There is no public API for a business's call volume, so printing "you
 * are losing 47 calls a month" would be a number this engine cannot support.
 * Instead the report shows the measured gaps, then a deliberately wide band with
 * every input listed, and lets the owner put their own volume in.
 */
export type CallEstimate = {
  /** 1-based position of the audited listing in the same text search. */
  searchRank: number | null;
  /** How many results that search returned (the pool the rank is out of). */
  rankedOf: number | null;
  /** Reviews the leader has above you (0 when you are level or ahead). */
  reviewGap: number;
  /** Modelled band as a % change in enquiries. Null when it cannot be supported. */
  uplift: { low: number; high: number } | null;
  headline: string;
  /** Every input, labelled measured or modelled, so the reader can audit it. */
  basis: Array<{ label: string; value: string; kind: "measured" | "modelled" }>;
};

export type AuditReport = {
  placeId: string;
  businessName: string;
  generatedAt: string;
  trade: TradeProfile;
  scores: { local_seo: number; aeo: number; geo: number; overall: number };
  sections: Record<AuditSectionKey, AuditSection>;
  tier: AuditTier;
  /** Ordered 🔴 → 🟡 → 🟢 fix list built from the findings. */
  roadmap: RoadmapStep[];
  /** Top-1 competitor from the same search, or null when it could not be read. */
  competitor: CompetitorSnapshot | null;
  /** You-vs-them rows. Empty when there is no competitor snapshot. */
  benchmark: BenchmarkRow[];
  /** Measured gaps + a labelled, modelled enquiry band. */
  opportunity: CallEstimate;
  /** Verbatim scan results, so every AEO/GEO claim can be traced. */
  site: WebsiteScan | null;
  /** How many signals need the owner to check their Google dashboard. */
  manualCheckCount: number;
  /**
   * Set by the API, never by the engine: true when the gated parts (fix list,
   * head-to-head table, evidence detail) were withheld from this response.
   */
  locked?: boolean;
  /** How many fixes the full report holds. Teaser responses only. */
  roadmapTotal?: number;
  /** How many of those are urgent/red. Teaser responses only. */
  roadmapRedCount?: number;
  facts: {
    reviewCount: number;
    rating: number;
    /** Photos Google's public API returned (capped at 10). */
    photoCount: number;
    hasRecentReview: boolean;
    newestReview: string | null;
  };
};

/** Section weights for the overall score (renormalised over measurable ones). */
const SECTION_WEIGHTS: Record<AuditSectionKey, number> = {
  local_seo: 50,
  aeo: 25,
  geo: 25,
};

const RECENT_REVIEW_DAYS = 365;

/** A profile is dormant when its newest SAMPLED review is older than a year. */
export function hasRecentReview(reviews: unknown[], days = RECENT_REVIEW_DAYS): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return (reviews || []).some((review) => {
    const published = Date.parse(String((review as { publishTime?: string })?.publishTime || ""));
    return Number.isFinite(published) && published >= cutoff;
  });
}

/** Date (YYYY-MM-DD) of the newest review Google sampled, or null if none. */
export function newestReviewIso(reviews: unknown[]): string | null {
  let newest = 0;
  for (const review of reviews || []) {
    const published = Date.parse(String((review as { publishTime?: string })?.publishTime || ""));
    if (Number.isFinite(published) && published > newest) newest = published;
  }
  return newest > 0 ? new Date(newest).toISOString().slice(0, 10) : null;
}

function buildSection(
  key: AuditSectionKey,
  label: string,
  findings: AuditFinding[]
): AuditSection {
  const verified = findings.filter((f) => f.status !== "manual");
  const verifiedWeight = verified.reduce((total, f) => total + f.weight, 0);
  const earnedWeight = verified
    .filter((f) => f.status === "pass")
    .reduce((total, f) => total + f.weight, 0);

  return {
    key,
    label,
    score: verifiedWeight > 0 ? Math.round((earnedWeight / verifiedWeight) * 100) : 0,
    measurable: verifiedWeight > 0,
    verifiedWeight,
    earnedWeight,
    findings,
  };
}

/** Overall = weighted mean of the measurable sections, renormalised. */
export function overallFromSections(sections: Record<AuditSectionKey, AuditSection>): number {
  let weight = 0;
  let weighted = 0;
  for (const key of Object.keys(SECTION_WEIGHTS) as AuditSectionKey[]) {
    const section = sections[key];
    if (!section?.measurable) continue;
    weight += SECTION_WEIGHTS[key];
    weighted += section.score * SECTION_WEIGHTS[key];
  }
  return weight > 0 ? Math.round(weighted / weight) : 0;
}

/** Plain-English tier. Thresholds are the report's only editorial opinion. */
export function tierFor(overall: number, trade: TradeProfile): AuditTier {
  if (overall >= 85) {
    return {
      key: "elite",
      label: "Leading",
      summary: `You are ahead of most ${trade.label.toLowerCase()} businesses nearby. Keep the review and photo cadence going — that lead is what competitors are trying to close.`,
    };
  }
  if (overall >= 70) {
    return {
      key: "strong",
      label: "Competitive",
      summary: `You are in the fight for the map pack, but the gaps below are the ones a rival is already closing.`,
    };
  }
  if (overall >= 55) {
    return {
      key: "fair",
      label: "Mid-pack",
      summary: `There are enough gaps here that you are being shown to some customers and skipped by others.`,
    };
  }
  if (overall >= 40) {
    return {
      key: "weak",
      label: "Losing jobs",
      summary: `Customers searching for your trade are being shown businesses with more proof than yours.`,
    };
  }
  return {
    key: "critical",
    label: "Barely visible",
    summary: `Your profile is missing the basics Google needs to rank you. Fix the red items first — nothing else will move until they are done.`,
  };
}

/**
 * Turn the findings into an ordered fix list. Only verified fails are "work to
 * do"; manual findings are appended as "confirm in your dashboard" so the list
 * never asks the owner to fix something we could not actually see.
 */
export function buildRoadmap(
  report: AuditReport,
  options: { redWeight?: number; max?: number } = {}
): RoadmapStep[] {
  const redWeight = options.redWeight ?? 8;
  const order: Record<RoadmapStep["priority"], number> = { red: 0, amber: 1, green: 2 };
  const steps: RoadmapStep[] = [];

  for (const key of ["local_seo", "aeo", "geo"] as AuditSectionKey[]) {
    const section = report.sections[key];
    if (!section) continue;

    for (const finding of section.findings) {
      const priority: RoadmapStep["priority"] | null =
        finding.status === "fail"
          ? finding.weight >= redWeight
            ? "red"
            : "amber"
          : finding.status === "manual"
            ? "green"
            : null;
      if (!priority) continue;

      steps.push({
        id: finding.id,
        section: key,
        sectionLabel: section.label,
        priority,
        label: finding.label,
        detail: finding.detail,
        action: finding.fix,
        weight: finding.weight,
      });
    }
  }

  steps.sort((a, b) => order[a.priority] - order[b.priority] || b.weight - a.weight);
  return options.max ? steps.slice(0, options.max) : steps;
}

/**
 * You vs the competitor Google itself returns for the same trade and town.
 * Every row is a number or a yes/no that came from the same public API, so the
 * comparison cannot flatter the customer or invent a rival's weakness.
 */
export function buildBenchmark(
  place: AuditEnginePlace,
  competitor: CompetitorSnapshot | null,
  trade: TradeProfile
): BenchmarkRow[] {
  if (!competitor) return [];

  const yourReviews = place.user_ratings_total || 0;
  const yourRating = place.rating || 0;
  const yourPhotos = place.photos?.length || 0;
  const yourTradeInName = nameHasServiceKeyword(place.name || "", place.types);
  const theirTradeInName = nameHasServiceKeyword(competitor.name, competitor.types);

  const compareNumbers = (you: number, them: number): BenchmarkRow["status"] => {
    if (Math.abs(you - them) < 0.05) return "level";
    return you > them ? "ahead" : "behind";
  };
  const compareFlags = (you: boolean, them: boolean): BenchmarkRow["status"] => {
    if (you === them) return "level";
    return you ? "ahead" : "behind";
  };

  return [
    {
      id: "reviews",
      label: "Reviews",
      you: String(yourReviews),
      them: String(competitor.reviewCount),
      status: compareNumbers(yourReviews, competitor.reviewCount),
    },
    {
      id: "rating",
      label: "Star rating",
      you: yourRating > 0 ? yourRating.toFixed(1) : "none",
      them: competitor.rating > 0 ? competitor.rating.toFixed(1) : "none",
      status: compareNumbers(yourRating, competitor.rating),
    },
    {
      id: "review_target",
      label: `Reviews vs ${trade.reviewBenchmark} benchmark`,
      // Shown as attainment so "level" means "you both clear the benchmark",
      // instead of comparing two raw counts that are already past it.
      you: `${Math.min(yourReviews, trade.reviewBenchmark)}/${trade.reviewBenchmark}`,
      them: `${Math.min(competitor.reviewCount, trade.reviewBenchmark)}/${trade.reviewBenchmark}`,
      status: compareNumbers(
        Math.min(yourReviews, trade.reviewBenchmark),
        Math.min(competitor.reviewCount, trade.reviewBenchmark)
      ),
    },
    {
      id: "photos",
      label: "Photos Google exposes (max 10)",
      you: String(yourPhotos),
      them: String(competitor.photoCount),
      status: compareNumbers(yourPhotos, competitor.photoCount),
    },
    {
      id: "trade_in_name",
      label: "Trade word in the name",
      you: yourTradeInName ? "Yes" : "No",
      them: theirTradeInName ? "Yes" : "No",
      status: compareFlags(yourTradeInName, theirTradeInName),
    },
  ];
}

/**
 * Modelled enquiry band by map position.
 *
 * Google shows three results above the fold on a phone, and published
 * map-click studies consistently put the first result at roughly two to three
 * times the fourth. The bands below are deliberately wide and rounded DOWN,
 * because this is a shape, not a measurement. Position 1 gets no band: there is
 * no rank upside to sell, so the report does not pretend there is.
 */
const UPLIFT_BY_RANK: Record<number, { low: number; high: number }> = {
  2: { low: 10, high: 25 },
  3: { low: 20, high: 40 },
  4: { low: 30, high: 55 },
  5: { low: 35, high: 65 },
};

/**
 * Measured gaps + a labelled band. Never invents a call count: the output is a
 * percentage of the owner's own volume, and every input is listed so the reader
 * can check it against their call log.
 */
export function buildOpportunity(input: {
  trade: TradeProfile;
  facts: { reviewCount: number; rating: number };
  competitor: CompetitorSnapshot | null;
  searchRank?: number | null;
  rankedOf?: number | null;
}): CallEstimate {
  const { trade, facts, competitor } = input;
  const rank =
    typeof input.searchRank === "number" && input.searchRank > 0 ? input.searchRank : null;
  const rankedOf =
    typeof input.rankedOf === "number" && input.rankedOf > 0 ? input.rankedOf : null;
  const reviewGap = competitor ? Math.max(0, competitor.reviewCount - facts.reviewCount) : 0;
  const phrase = trade.keywords[0] || "your trade";

  // No competitor read: say so instead of guessing at a gap.
  if (!competitor || rank === null) {
    return {
      searchRank: rank,
      rankedOf,
      reviewGap,
      uplift: null,
      headline:
        "We could not read the listings Google returns for your trade next to yours, so this report shows no call estimate rather than a made-up one.",
      basis: [
        {
          label: "Competitor search",
          value: competitor ? "returned results, your listing was not among them" : "no results",
          kind: "measured",
        },
      ],
    };
  }

  const uplift = rank >= 2 ? UPLIFT_BY_RANK[Math.min(rank, 5)] || { low: 30, high: 55 } : null;
  const rankText = rankedOf ? `#${rank} of ${rankedOf}` : `#${rank}`;

  const basis: CallEstimate["basis"] = [
    {
      label: `Position for "${phrase}"`,
      value: rankText,
      kind: "measured",
    },
    {
      label: "Your reviews vs the leader",
      value: `${facts.reviewCount} vs ${competitor.reviewCount}`,
      kind: "measured",
    },
    {
      label: "Your rating vs the leader",
      value: `${facts.rating > 0 ? facts.rating.toFixed(1) : "none"} vs ${
        competitor.rating > 0 ? competitor.rating.toFixed(1) : "none"
      }`,
      kind: "measured",
    },
  ];

  if (uplift) {
    basis.push({
      label: `Enquiry uplift from moving up from ${rankText}`,
      value: `${uplift.low}–${uplift.high}% (modelled band, not a measurement)`,
      kind: "modelled",
    });
  }

  if (reviewGap > 0) {
    basis.push({
      label: "Review gap to close",
      value: `${reviewGap} reviews`,
      kind: "measured",
    });
  }

  let headline: string;
  if (rank === 1 && reviewGap === 0) {
    headline = `You are the first listing Google returns for "${phrase}" and you lead on reviews. The job now is holding that spot — a quiet month hands it back.`;
  } else if (rank === 1) {
    headline = `You are the first listing Google returns for "${phrase}", but ${
      competitor.name
    } has ${reviewGap} more reviews. That is the gap that closes first.`;
  } else if (trade.emergency) {
    headline = `You are ${rankText} for "${phrase}". In an emergency trade the first results take nearly every call — the customers who scroll past you have already dialled someone else.`;
  } else {
    headline = `You are ${rankText} for "${phrase}". The businesses above you are taking the enquiries you would otherwise get.`;
  }

  return { searchRank: rank, rankedOf, reviewGap, uplift, headline, basis };
}

/**
 * Absolute version of the modelled band, only when the owner types their own
 * monthly enquiry volume into the report. Returns null instead of a number we
 * cannot stand behind.
 */
export function monthlyCallsFromEnquiries(
  estimate: CallEstimate,
  monthlyEnquiries: number
): { low: number; high: number } | null {
  if (!estimate.uplift) return null;
  if (!Number.isFinite(monthlyEnquiries) || monthlyEnquiries <= 0) return null;
  const low = Math.max(1, Math.round((monthlyEnquiries * estimate.uplift.low) / 100));
  const high = Math.max(low + 1, Math.round((monthlyEnquiries * estimate.uplift.high) / 100));
  return { low, high };
}



/**
 * Scan the business's own site for AEO/GEO signals. Null when there is no site.
 * Runs up to three parallel GETs (homepage, robots.txt, llms.txt) with a hard
 * timeout, and degrades every unreadable signal to "manual" rather than a fail.
 */
export async function scanWebsite(
  website?: string | null,
  context: { businessName?: string; phone?: string; types?: string[] | null } = {}
): Promise<WebsiteScan | null> {
  const url = normalizeWebsite(website);
  if (!url) return null;

  const [home, robotsFile, llmsFile] = await Promise.all([
    fetchText(url.toString()),
    fetchText(`${url.origin}/robots.txt`, 60_000),
    fetchText(`${url.origin}/llms.txt`, 60_000),
  ]);

  const html = home.text;
  const haystack = normalizeWords(html.slice(0, 250_000));
  const pageDigits = digitsOnly(html.slice(0, 300_000));
  const gbpDigits = digitsOnly(context.phone || "");
  const phoneTail = gbpDigits.slice(-9);
  const llmsBody = llmsFile.text.trim();
  const title = readTitle(html);

  return {
    url: url.toString(),
    reachable: home.ok,
    status: home.status,
    error: home.error,
    title,
    metaDescription: readMetaDescription(html),
    nameInTitle: nameOrTradeInTitle(title, context.businessName, context.types),
    phoneOnPage:
      phoneTail.length === 9 && (pageDigits.includes(phoneTail) || pageDigits.includes(gbpDigits)),
    tradeOnPage: serviceKeywords(context.types).some((keyword) => haystack.includes(keyword)),
    schema: readSchema(html),
    // A 404 means "no robots.txt", which blocks nobody. A network error or a 403
    // means we simply cannot tell, so the finding must degrade to "manual" rather
    // than awarding a pass we did not verify.
    robots:
      robotsFile.status === null || (robotsFile.status !== 404 && !robotsFile.ok)
        ? { checked: false, exists: false, blockedCrawlers: [], blocksAllCrawlers: false }
        : robotsFile.ok
          ? readRobots(robotsFile.text)
          : { checked: true, exists: false, blockedCrawlers: [], blocksAllCrawlers: false },
    llmsTxt: {
      checked: llmsFile.status !== null,
      exists: llmsFile.ok && llmsBody.length > 0 && !llmsBody.startsWith("<"),
    },
  };
}

// ─── Sections ────────────────────────────────────────────────────────────────

/** The normalised profile shape the audit route produces from Places API v1. */
export type AuditEnginePlace = {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: unknown;
  reviews?: unknown[];
  photos?: unknown[];
  user_ratings_total?: number;
  rating?: number;
  editorial_summary?: unknown;
  types?: string[];
};

function buildLocalSeo(
  place: AuditEnginePlace,
  trade: TradeProfile,
  businessName: string
): AuditSection {
  const types = place.types || [];
  const reviewCount = place.user_ratings_total || 0;
  const rating = place.rating || 0;
  const photoCount = place.photos?.length || 0;
  const category = primaryCategoryOf(types);
  const realCategories = types.filter((type) => !GENERIC_TYPES.has(type));
  const tradeInName = nameHasServiceKeyword(businessName, types);
  const newest = newestReviewIso(place.reviews || []);
  const recent = hasRecentReview(place.reviews || []);
  const displayName = place.name || businessName || "your business";

  const findings: AuditFinding[] = [
    {
      id: "name",
      label: "Business name",
      status: place.name ? "pass" : "fail",
      weight: 6,
      detail: place.name ? `Google shows "${place.name}".` : "Google has no business name on this listing.",
      fix: place.name ? undefined : "Add your business name in the Google Business Profile dashboard.",
    },
    {
      id: "primary_category",
      label: "Primary category",
      status: category ? "pass" : "fail",
      weight: 12,
      detail: category
        ? `Primary category is ${category.replace(/_/g, " ")}.`
        : "No primary category is set on the public profile.",
      fix: category
        ? undefined
        : 'Set the closest primary category — "Plumber", not "Contractor", so Google matches what people type.',
    },
    {
      id: "secondary_categories",
      label: "Secondary categories",
      status: realCategories.length > 1 ? "pass" : "fail",
      weight: 6,
      detail: `${realCategories.length} category signal${realCategories.length === 1 ? "" : "s"} on the public profile.`,
      fix:
        realCategories.length > 1
          ? undefined
          : "Add the secondary services you actually do — boiler repair, bathroom installs, leak detection.",
    },
    {
      id: "phone",
      label: "Phone number",
      status: place.formatted_phone_number ? "pass" : "fail",
      weight: 8,
      detail: place.formatted_phone_number
        ? `Google shows ${place.formatted_phone_number}.`
        : "There is no phone number on the public profile.",
      fix: place.formatted_phone_number ? undefined : "Add a trackable phone number to the profile.",
    },
    {
      id: "address",
      label: "Address",
      status: place.formatted_address ? "pass" : "fail",
      weight: 6,
      detail: place.formatted_address
        ? `Address on file: ${place.formatted_address}.`
        : "No address is published (normal for a service-area business).",
      fix: place.formatted_address ? undefined : "Confirm your address or service area in the dashboard.",
    },
    {
      id: "website",
      label: "Website",
      status: place.website ? "pass" : "fail",
      weight: 8,
      detail: place.website
        ? `Linked site: ${place.website}.`
        : "No website is linked — there is nothing for AI answers to read.",
      fix: place.website ? undefined : "Add a website you control. A one-page site is enough to start.",
    },
    {
      id: "hours",
      label: "Opening hours",
      status: place.opening_hours ? "pass" : "fail",
      weight: 8,
      detail: place.opening_hours
        ? "Opening hours are published on the profile."
        : 'Hours are missing, so "open now" searches cannot match you.',
      fix: place.opening_hours ? undefined : "Set your regular hours in the dashboard.",
    },
    {
      id: "description",
      label: "Business description",
      status: place.editorial_summary || place.website ? "pass" : "fail",
      weight: 6,
      // Google writes this summary from the linked website, so a profile with an
      // owner-written description but no summary yet is not a proven miss.
      detail:
        place.editorial_summary || place.website
          ? "Google has enough to describe the business on the profile."
          : "Google has no description or linked website to summarise.",
      fix:
        place.editorial_summary || place.website
          ? undefined
          : "Write the description in the dashboard and link a website.",
    },
    {
      id: "trade_in_name",
      label: "Trade word in business name",
      status: tradeInName ? "pass" : "fail",
      weight: 6,
      detail: tradeInName
        ? `"${displayName}" contains the trade word Google matches on.`
        : `"${displayName}" has no trade word in it.`,
      fix: tradeInName
        ? undefined
        : 'Only if it is genuinely your trading name, include the service (e.g. "Smith Plumbing"). Never invent a name — Google suspends profiles for keyword stuffing.',
    },
    {
      id: "photos_5",
      label: "5+ photos",
      status: photoCount >= 5 ? "pass" : "fail",
      weight: 6,
      detail: `Google returned ${photoCount} photo${photoCount === 1 ? "" : "s"}.`,
      fix: photoCount >= 5 ? undefined : "Upload photos of finished jobs, the van and the team.",
    },
    {
      id: "photos_10",
      label: "10+ photos",
      status: photoCount >= 10 ? "pass" : "fail",
      weight: 8,
      detail:
        photoCount >= 10
          ? "Google's public API returned its maximum of 10 photos, so you clear this."
          : `Google returned ${photoCount} photo${photoCount === 1 ? "" : "s"} — under the 10 it will show publicly.`,
      fix: photoCount >= 10 ? undefined : "Add a photo after every job until you are past 10.",
    },
    {
      id: "recent_review",
      label: "Review in the last 12 months",
      status: recent ? "pass" : "fail",
      weight: 8,
      detail: newest
        ? `Newest review in Google's sample: ${newest}.`
        : "Google returns no reviews for this profile.",
      fix: recent
        ? undefined
        : "Ask for a review the same day you finish, while the customer is standing there.",
    },
    {
      id: "review_benchmark",
      label: `${trade.reviewBenchmark}+ reviews (${trade.label.toLowerCase()} benchmark)`,
      status: reviewCount >= trade.reviewBenchmark ? "pass" : "fail",
      weight: 8,
      detail: `${reviewCount} review${reviewCount === 1 ? "" : "s"} on the profile.`,
      fix:
        reviewCount >= trade.reviewBenchmark
          ? undefined
          : `You need ${trade.reviewBenchmark - reviewCount} more to reach the benchmark your competitors hold.`,
    },
    {
      id: "rating_40",
      label: "4.0+ star rating",
      status: rating >= 4 ? "pass" : "fail",
      weight: 4,
      detail: rating > 0 ? `Rating is ${rating.toFixed(1)}.` : "No rating yet.",
      fix: rating >= 4 ? undefined : "Work through recent complaints before chasing review volume.",
    },
    {
      id: "rating_45",
      label: "4.5+ star rating",
      status: rating >= 4.5 ? "pass" : "fail",
      weight: 4,
      detail: rating > 0 ? `Rating is ${rating.toFixed(1)}.` : "No rating yet.",
      fix: rating >= 4.5 ? undefined : "A steady flow of 5-star job reviews is the only reliable way up.",
    },
    // ── Dashboard-only signals: shown, never scored ──
    {
      id: "posts_weekly",
      label: "Weekly Google Posts",
      status: "manual",
      weight: 0,
      detail: "Not in Google's public data — Google Posts are only visible in the Business Profile dashboard.",
      fix: "Post once a week from a job photo.",
    },
    {
      id: "qa_answered",
      label: "Questions & Answers answered",
      status: "manual",
      weight: 0,
      detail: "Q&A is not exposed by the public Places API.",
      fix: "Seed the Q&A with the questions customers actually ask on the phone.",
    },
    {
      id: "owner_replies",
      label: "Owner replies to reviews",
      status: "manual",
      weight: 0,
      detail: "Replies are not included in Google's public review data.",
      fix: "Reply to every review within 48 hours.",
    },
    {
      id: "owner_verified",
      label: "Profile verified by the owner",
      status: "manual",
      weight: 0,
      detail: "Verification status cannot be read from public data.",
    },
    {
      id: "attributes",
      label: "Attributes filled in",
      status: "manual",
      weight: 0,
      detail: "Attributes (emergency call-out, parking, payment types) are dashboard-only.",
      fix: "Tick every attribute that is true for your business.",
    },
    {
      id: "holiday_hours",
      label: "Holiday & special hours",
      status: "manual",
      weight: 0,
      detail: "Special hours are not published through the Places API.",
    },
    {
      id: "photo_album",
      label: `${trade.photoTarget}+ photos in the full album`,
      status: "manual",
      weight: 0,
      detail: `Google's public API stops at 10 photos, so the full album has to be checked in your dashboard. ${trade.label} businesses are benchmarked at ${trade.photoTarget}+.`,
      fix: "Open the dashboard photo library, count the album, then keep adding job photos.",
    },
  ];

  return buildSection("local_seo", "Local SEO", findings);
}

function buildAeo(
  place: AuditEnginePlace,
  trade: TradeProfile,
  site: WebsiteScan | null
): AuditSection {
  const label = "Answer Engine (AEO)";

  if (!site) {
    // No website at all: nothing for a voice assistant or AI answer to read. That
    // absence is already a red item under Local SEO, so this section is marked
    // unmeasurable rather than triple-penalising the same gap.
    return buildSection("aeo", label, [
      {
        id: "aeo_no_site",
        label: "Website linked",
        status: "manual",
        weight: 0,
        detail:
          "No website is linked on your Google profile, so there is nothing here to read. It is already counted as a fail under Local SEO.",
        fix: "Link a website you control to the Google profile.",
      },
    ]);
  }

  const readable = site.reachable;
  const statusOf = (ok: boolean): FindingStatus => (readable ? (ok ? "pass" : "fail") : "manual");
  const weightOf = (weight: number): number => (readable ? weight : 0);
  const unreadable = `Could not read your homepage (${site.status ? `HTTP ${site.status}` : site.error || "no response"}), so this is not scored.`;

  const titleOk = site.nameInTitle;
  const metaOk = (site.metaDescription || "").length >= 50;
  const tradeOk = site.tradeOnPage;
  const faqOk = site.schema.hasFaq;
  const serviceOk = site.schema.hasService;
  const hoursOk = site.schema.hasOpeningHours;

  const findings: AuditFinding[] = [
    {
      id: "homepage",
      label: "Homepage readable",
      status: readable ? "pass" : "manual",
      weight: readable ? 10 : 0,
      detail: readable ? `Homepage answered with HTTP ${site.status ?? 200}.` : unreadable,
      fix: readable ? undefined : "Ask your web host to allow the audit bot, then re-run this report.",
    },
    {
      id: "name_in_title",
      label: "Business name or trade in page title",
      status: statusOf(titleOk),
      weight: weightOf(15),
      detail: readable
        ? site.title
          ? `Page title: "${site.title}".`
          : "The homepage has no <title> tag."
        : unreadable,
      fix: titleOk || !readable
        ? undefined
        : `Put the trade and town in the title, e.g. "${place.name || "Smith Plumbing"} | Plumber in Leeds".`,
    },
    {
      id: "meta_description",
      label: "Meta description",
      status: statusOf(metaOk),
      weight: weightOf(12),
      detail: readable
        ? site.metaDescription
          ? `Description (${site.metaDescription.length} chars): "${site.metaDescription.slice(0, 120)}".`
          : "No meta description found on the homepage."
        : unreadable,
      fix: metaOk || !readable
        ? undefined
        : "Write a 120-155 character description naming the trade, the town and the phone number.",
    },
    {
      id: "phone_on_page",
      label: "Google phone number on the page",
      status: statusOf(site.phoneOnPage),
      weight: weightOf(18),
      detail: readable
        ? site.phoneOnPage
          ? `The phone number on your Google profile (${place.formatted_phone_number}) also appears on the homepage. That is a clean match for an assistant to read out.`
          : `The number on your Google profile (${place.formatted_phone_number || "none"}) was not found on the homepage.`
        : unreadable,
      // NAP consistency: assistants cross-check the number they see on Google
      // against the one on the site. A mismatch is what makes them skip you.
      fix: site.phoneOnPage || !readable
        ? undefined
        : "Show the same phone number on the site as on Google, in plain text (not inside an image).",
    },
    {
      id: "trade_on_page",
      label: "Trade keyword on the page",
      status: statusOf(tradeOk),
      weight: weightOf(10),
      detail: readable
        ? tradeOk
          ? `The page mentions ${serviceKeywords(place.types)[0] || "the trade"} in its text.`
          : `The homepage never uses the word ${serviceKeywords(place.types)[0] || "for your trade"}, so an answer engine has nothing to match.`
        : unreadable,
      fix: tradeOk || !readable
        ? undefined
        : `Name the service in plain words on the page: "${trade.keywords[0]}" and "${trade.keywords[1]}".`,
    },
    {
      id: "services_listed",
      label: "Services listed in structured data",
      status: statusOf(serviceOk),
      weight: weightOf(10),
      detail: readable
        ? serviceOk
          ? "The site describes its services (Service / OfferCatalog / makesOffer)."
          : "No Service or offers markup found, so the list of jobs you do is not machine-readable."
        : unreadable,
      fix: serviceOk || !readable
        ? undefined
        : "Mark up each main service as schema.org Service so an assistant can list what you do.",
    },
    {
      id: "faq_content",
      label: "FAQ answers on the page",
      status: statusOf(faqOk),
      weight: weightOf(15),
      detail: readable
        ? faqOk
          ? "The page carries FAQ markup, the format AI answers quote most often."
          : "No FAQPage markup found. AI answers are built from question-and-answer pairs."
        : unreadable,
      fix: faqOk || !readable
        ? undefined
        : "Add 5 real customer questions with short answers, marked up as FAQPage.",
    },
    {
      id: "hours_on_site",
      label: "Opening hours on the site",
      status: statusOf(hoursOk),
      weight: weightOf(10),
      detail: readable
        ? hoursOk
          ? "Opening hours are published in machine-readable form."
          : "Hours are not in the page markup, so an assistant cannot answer \"is it open now?\" from your site."
        : unreadable,
      fix: hoursOk || !readable
        ? undefined
        : "Add openingHoursSpecification to your LocalBusiness markup, matching your Google hours.",
    },
  ];

  return buildSection("aeo", label, findings);
}

function buildGeo(site: WebsiteScan | null): AuditSection {
  const label = "AI Search (GEO)";

  if (!site) {
    return buildSection("geo", label, [
      {
        id: "geo_no_site",
        label: "Website linked",
        status: "manual",
        weight: 0,
        detail:
          "No website is linked, so there is no robots.txt, structured data or llms.txt to read. The missing website is already counted as a fail under Local SEO.",
        fix: "Link a website you control to the Google profile.",
      },
    ]);
  }

  // robots.txt and llms.txt are fetched independently of the homepage, so those
  // findings stay verified even when the homepage itself is blocked or broken -
  // but only when the file was actually readable (see `checked`).
  const robotsChecked = site.robots.checked;
  const crawlersOk =
    robotsChecked && !site.robots.blocksAllCrawlers && site.robots.blockedCrawlers.length === 0;
  const robotsDetail = !robotsChecked
    ? "Could not read robots.txt (network error or blocked), so AI crawler access is not scored."
    : !site.robots.exists
      ? "No robots.txt was found, which means no crawler is blocked."
      : crawlersOk
        ? "robots.txt does not block any major AI crawler."
        : site.robots.blocksAllCrawlers
          ? "robots.txt blocks every crawler (User-agent: * / Disallow: /), including AI engines."
          : `robots.txt blocks: ${site.robots.blockedCrawlers.join(", ")}.`;

  const readable = site.reachable;
  const statusOf = (ok: boolean): FindingStatus => (readable ? (ok ? "pass" : "fail") : "manual");
  const weightOf = (weight: number): number => (readable ? weight : 0);
  const unreadable = `Could not read your homepage (${site.status ? `HTTP ${site.status}` : site.error || "no response"}), so the markup checks are not scored.`;
  const typesFound = site.schema.types.slice(0, 8).join(", ");

  const findings: AuditFinding[] = [
    {
      id: "ai_crawlers",
      label: "AI crawlers allowed",
      status: robotsChecked ? (crawlersOk ? "pass" : "fail") : "manual",
      weight: robotsChecked ? 25 : 0,
      detail: robotsDetail,
      fix:
        !robotsChecked || crawlersOk
          ? undefined
          : "Remove the whole-site Disallow rules for the AI crawlers you want to be recommended by (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended).",
    },
    {
      id: "llms_txt",
      label: "llms.txt published",
      status: site.llmsTxt.checked ? (site.llmsTxt.exists ? "pass" : "fail") : "manual",
      weight: site.llmsTxt.checked ? 10 : 0,
      detail: !site.llmsTxt.checked
        ? "Could not read /llms.txt, so this is not scored."
        : site.llmsTxt.exists
          ? `Found a readable ${site.url.replace(/\/$/, "")}/llms.txt.`
          : "No readable /llms.txt. It is optional today, but it is the only place you can state your services and areas in one file for AI engines.",
      fix:
        !site.llmsTxt.checked || site.llmsTxt.exists
          ? undefined
          : "Publish a short /llms.txt: business name, services, service areas, phone, hours.",
    },
    {
      id: "jsonld",
      label: "Structured data (JSON-LD)",
      status: statusOf(site.schema.blocks > 0),
      weight: weightOf(15),
      detail: readable
        ? site.schema.blocks > 0
          ? `${site.schema.blocks} JSON-LD block${site.schema.blocks === 1 ? "" : "s"} found.`
          : "No JSON-LD blocks found on the homepage."
        : unreadable,
      fix: site.schema.blocks > 0 || !readable
        ? undefined
        : "Add a JSON-LD block describing the business. Every AI engine reads this first.",
    },
    {
      id: "local_business_schema",
      label: "LocalBusiness schema",
      status: statusOf(site.schema.hasLocalBusiness),
      weight: weightOf(20),
      detail: readable
        ? site.schema.hasLocalBusiness
          ? `LocalBusiness-family type found: ${typesFound}.`
          : typesFound
            ? `Schema found, but none of it is a LocalBusiness type (found: ${typesFound}).`
            : "No LocalBusiness type found."
        : unreadable,
      fix: site.schema.hasLocalBusiness || !readable
        ? undefined
        : 'Mark the business up as schema.org "Plumber" (or your trade) with @type, name, address and telephone.',
    },
    {
      id: "schema_telephone",
      label: "Phone in structured data",
      status: statusOf(site.schema.hasTelephone),
      weight: weightOf(10),
      detail: readable
        ? site.schema.hasTelephone
          ? "A telephone value is present in the markup."
          : "No telephone value in the markup."
        : unreadable,
      fix: site.schema.hasTelephone || !readable ? undefined : "Add telephone to the LocalBusiness markup.",
    },
    {
      id: "schema_address",
      label: "Address in structured data",
      status: statusOf(site.schema.hasAddress),
      weight: weightOf(10),
      detail: readable
        ? site.schema.hasAddress
          ? "A postal address is present in the markup."
          : "No postal address in the markup."
        : unreadable,
      fix:
        site.schema.hasAddress || !readable
          ? undefined
          : "Add a PostalAddress (street, locality, postal code, country) to the markup.",
    },
    {
      id: "schema_hours",
      label: "Opening hours in structured data",
      status: statusOf(site.schema.hasOpeningHours),
      weight: weightOf(10),
      detail: readable
        ? site.schema.hasOpeningHours
          ? "Opening hours are present in the markup."
          : "No opening hours in the markup."
        : unreadable,
      fix:
        site.schema.hasOpeningHours || !readable
          ? undefined
          : "Add openingHoursSpecification so assistants can answer opening-hours questions.",
    },
  ];

  return buildSection("geo", label, findings);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

/**
 * Build the full report. The only impure step is the website scan; pass
 * `scan: null` to skip network access entirely (sample reports, tests).
 */
export async function buildAuditReport(input: {
  placeId: string;
  businessName?: string;
  place: AuditEnginePlace;
  scan?: WebsiteScan | null;
  /** Top-1 competitor snapshot; omit or pass null to skip the battle table. */
  competitor?: CompetitorSnapshot | null;
  /** 1-based position of this listing in the same text search, when known. */
  searchRank?: number | null;
  /** How many results that search returned. */
  rankedOf?: number | null;
}): Promise<AuditReport> {
  const { place } = input;
  const businessName = String(input.businessName || place.name || "").trim();
  const trade = tradeProfileFor(place.types);

  const site =
    input.scan !== undefined
      ? input.scan
      : await scanWebsite(place.website, {
          businessName,
          phone: place.formatted_phone_number,
          types: place.types,
        });

  const sections: Record<AuditSectionKey, AuditSection> = {
    local_seo: buildLocalSeo(place, trade, businessName),
    aeo: buildAeo(place, trade, site),
    geo: buildGeo(site),
  };

  const overall = overallFromSections(sections);
  const reviews = place.reviews || [];
  const facts = {
    reviewCount: place.user_ratings_total || 0,
    rating: place.rating || 0,
    photoCount: place.photos?.length || 0,
    hasRecentReview: hasRecentReview(reviews),
    newestReview: newestReviewIso(reviews),
  };
  const competitor = input.competitor ?? null;

  const report: AuditReport = {
    placeId: input.placeId,
    businessName,
    generatedAt: new Date().toISOString(),
    trade,
    scores: {
      local_seo: sections.local_seo.score,
      aeo: sections.aeo.score,
      geo: sections.geo.score,
      overall,
    },
    sections,
    tier: tierFor(overall, trade),
    roadmap: [],
    competitor,
    benchmark: buildBenchmark(place, competitor, trade),
    opportunity: buildOpportunity({
      trade,
      facts,
      competitor,
      searchRank: input.searchRank ?? null,
      rankedOf: input.rankedOf ?? null,
    }),
    site,
    manualCheckCount: Object.values(sections).reduce(
      (total, section) =>
        total + section.findings.filter((finding) => finding.status === "manual").length,
      0
    ),
    facts,
  };

  // Built last so it can read the finished report (and so the roadmap can never
  // disagree with the findings it is derived from).
  report.roadmap = buildRoadmap(report);
  return report;
}

/**
 * The free teaser of a report: score, section scores, tier, the gap counts and
 * the competitor's name stay; the fix list, the head-to-head rows, the evidence
 * detail and the raw site scan go.
 *
 * Done server-side, on the way out of the API. CSS-blurring the same data would
 * leave the whole report sitting in the network response, which is not gating at
 * all. The counts that remain (`roadmapTotal`, `roadmapRedCount`) tell the
 * visitor exactly how much is behind the email step without revealing any of it.
 */
export function teaseAuditReport(report: AuditReport): AuditReport {
  const stripDetail = (section: AuditSection): AuditSection => ({
    ...section,
    findings: section.findings.map((finding) => ({
      id: finding.id,
      label: finding.label,
      status: finding.status,
      weight: finding.weight,
      detail: "",
    })),
  });

  return {
    ...report,
    sections: {
      local_seo: stripDetail(report.sections.local_seo),
      aeo: stripDetail(report.sections.aeo),
      geo: stripDetail(report.sections.geo),
    },
    roadmap: [],
    // The name survives so the page can still say who leads the search; the
    // numbers behind the comparison do not.
    competitor: report.competitor ? { ...report.competitor } : null,
    benchmark: [],
    opportunity: { ...report.opportunity, basis: [] },
    site: null,
    locked: true,
    roadmapTotal: report.roadmap.length,
    roadmapRedCount: report.roadmap.filter((step) => step.priority === "red").length,
  };
}









