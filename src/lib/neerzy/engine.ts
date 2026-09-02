import { supabase } from "@/lib/supabase";
import { chatWithFallback } from "@/lib/openai";

export interface NeerzyInput {
  trader_id: string;
  trade: 'plumber' | 'electrician' | 'roofer' | 'mechanic' | string;
  service: string; // e.g., "burst pipe", "EV charger install", "storm damage", "brake replacement"
  jobDescription?: string; // Trader's actual job text — the source of truth for the post (falls back to `service`)."
  intent: 'emergency' | 'routine' | 'inspection' | 'upgrade' | string;
  address: string;
  target_region: 'US' | 'UK' | 'CA' | 'AU' | string;
  past_performance?: { ctr: number; review_rate: number; top_keywords: string[] };
  location?: string; // Derived or passed
  category?: string; // Legacy field mapping
  geo_signals?: string;
}

/**
 * Layer 3: Tier 1 Localization Matrix
 */
const LOCALIZATION_MATRIX: Record<string, any> = {
  US: {
    format: "ZIP",
    currency: "$",
    urgency_words: ["same-day", "24/7", "now"],
    modifiers: ["Neighborhood", "City", "County"],
    trust: ["BBB rating", "upfront pricing", "emergency 24/7"],
    terms: ["licensed", "insured", "same-day"]
  },
  UK: {
    format: "Postcode",
    currency: "£",
    urgency_words: ["urgent", "call-out", "same-day"],
    modifiers: ["Suburb", "Borough", "near Landmark"],
    trust: ["Trustpilot mentions", "transparent call-out fees", "Gas Safe/NICEIC"],
    terms: ["fully qualified", "NICEIC", "Gas Safe"]
  },
  CA: {
    format: "Postal Code",
    currency: "C$",
    urgency_words: ["same-day", "emergency", "24/7"],
    modifiers: ["Neighbourhood", "Municipality"],
    trust: ["Red Seal certified", "WSIB compliant", "winter readiness"],
    terms: ["Red Seal", "WSIB"]
  },
  AU: {
    format: "Postcode",
    currency: "A$",
    urgency_words: ["urgent", "same-day", "mobile"],
    modifiers: ["Suburb", "Regional City"],
    trust: ["Clean Energy Council", "Master Builders", "emergency mobile"],
    terms: ["licensed electrician", "qualified tradesman"]
  }
};

/**
 * Layer 2: Trade-Specific SEO/AEO/GEO Rules
 */
const TRADE_RULES: Record<string, any> = {
  plumber: {
    seo: ["emergency", "leak repair", "drain cleaning", "licensed", "no surprise fees"],
    aeo: ["How fast do you fix bursts?", "How much does a plumber cost in this city?", "Do you charge by hour or job?"],
    geo: ["Neighborhood + water hardness notes", "local pipe age trends"],
    pro_tips: ["Emphasize licensed status", "Mention transparent pricing", "Address cost questions directly"]
  },
  electrician: {
    seo: ["panel upgrade", "EV charger", "code compliance", "insured", "permit handling"],
    aeo: ["Is my home ready for EV charging?", "What causes flickering lights?", "How do I handle electrical permits?"],
    geo: ["Suburb/estate names", "local grid capacity notes", "permit zones", "grid upgrades"],
    pro_tips: ["Highlight code compliance", "Mention permit handling", "Focus on EV readiness"]
  },
  roofer: {
    seo: ["storm damage", "shingle replacement", "inspection", "warranty", "insurance claims"],
    aeo: ["When should I replace vs repair?", "How long does roofing take?", "Should I repair or replace my roof in this region?"],
    geo: ["County weather patterns", "historic material styles", "hail zones", "storm response"],
    pro_tips: ["Offer insurance claim assistance", "Focus on storm response", "Clarify repair vs replace decision"]
  },
  mechanic: {
    seo: ["brake service", "diagnostics", "oil change", "ASE certified", "mobile service"],
    aeo: ["Why is my check engine light on?", "How often should I service?", "What are local inspection mandates?"],
    geo: ["City traffic wear patterns", "local inspection mandates", "commute distance", "commute wear"],
    pro_tips: ["Focus on diagnostics", "Highlight ASE certification", "Mention mobile service convenience"]
  }
};

/**
 * NeerzyEngine Architecture (5 Layers)
 */
export class NeerzyEngine {
  /**
   * Layer 1: Context Ingestion
   * Aggregates trade, location, job type, and trader profile.
   */
  private static ingestContext(params: NeerzyInput) {
    return {
      trade: (params.trade?.toLowerCase() || params.category?.toLowerCase() || "general") as string,
      location: params.location || params.address.split(',').slice(-2, -1)[0]?.trim() || "Local Area",
      jobType: params.service,
      jobDescription: (params.jobDescription || params.service || "").trim(),
      intent: params.intent || "routine",
      region: params.target_region?.toUpperCase() || "US",
      traderProfile: { 
        id: params.trader_id, 
        performance: params.past_performance 
      },
      geoContext: params.geo_signals
    };
  }

  /**
   * Layer 2: Rule & Template Matrix
   * Maps context to specific SEO/AEO/GEO rules and regional localization.
   */
  private static applyRules(context: any) {
    const tradeRules = TRADE_RULES[context.trade] || {
      seo: ["local service", "professional", "reliable"],
      aeo: ["How much does it cost?", "When are you available?"],
      geo: ["Nearby landmarks", "Service area coverage"]
    };

    const localeRules = LOCALIZATION_MATRIX[context.region] || LOCALIZATION_MATRIX.US;

    // Add Seasonal Flags (Mock logic)
    const month = new Date().getMonth();
    const seasonalFlags = [];
    if (context.trade === 'roofer' && (month >= 5 && month <= 10)) seasonalFlags.push("roof_storm_season");
    if (context.trade === 'hvac' && (month >= 5 && month <= 8)) seasonalFlags.push("hvac_peak_summer");

    return {
      seo: [...tradeRules.seo, ...localeRules.terms],
      aeo: tradeRules.aeo,
      geo: [...tradeRules.geo, ...localeRules.modifiers],
      seasonalFlags,
      trustSignals: [...localeRules.trust, "Local business"],
      currency: localeRules.currency,
      urgency: localeRules.urgency_words
    };
  }

  /**
   * Layer 3: Dynamic Prompt Router
   * Constructs the optimal prompt based on intent and region.
   */
  private static routePrompt(context: any, rules: any) {
    const tradeLabel =
      context.trade && context.trade !== "general" ? context.trade : "local service";
    const hasRealCity = !!context.location && context.location !== "Local Area";
    const cityLabel = hasRealCity ? context.location : "your area";

    return `
      Local GBP post for a ${tradeLabel} business serving ${cityLabel} (${context.region}).

      JOB (source of truth — write ONLY about this):
      ${context.jobDescription || "(no job description was provided)"}

      GROUNDING RULES (never break):
      - Describe ONLY the job above. Do NOT invent customer names, materials, brands, prices, outcomes, guarantees, licenses, or locations.
      - If the job description is MISSING or just a one-word ack (yes/no/ok/okay/done/post), write a brief factual post that says only that a ${tradeLabel} job was completed ${hasRealCity ? `in ${context.location}` : "for this business"} — with no invented details.
      - Never claim urgency, emergencies, seasonal work, or trust credentials (licensed/insured/BBB etc.) unless the job description itself supports them.

      SEO:
      - Headline/Title: max 50 characters.
      - Use ONE natural service keyword in the headline and once in the body. Prefer the job's own wording. You MAY use at most 1-2 of these trade keywords ONLY where they accurately describe this job: ${rules.seo.join(", ")}. Never force an irrelevant keyword.

      AEO (answer-engine optimization):
      - Make the BODY's first sentence a short, direct, declarative "what was done" statement that an AI answer engine could quote verbatim.
      - faq_ai: exactly ONE "Q: ... A: ..." pair answering a real question a customer would ask about THIS job/service. Prefer a fitting option from: ${rules.aeo.join(" | ")}. When the job details cannot support a factual answer, output "Q: How can I get this done? A: Contact us — we'll confirm availability and pricing."

      GEO (generative-engine attribution):
      - Mention the real city exactly once in the BODY using "in <city>" phrasing (e.g. "panel upgrade in Houston") so AI engines attribute the post to the right local business. If no real city is known, do NOT mention any place name.

      CTA: use exactly one of (BOOK, CALL_NOW, LEARN_MORE).
      Local currency: ${rules.currency}

      INTENT: ${context.intent}
      GEO CONTEXT: ${context.geoContext || "None"}

      Return ONLY a JSON object with EXACTLY these keys:
      {
        "title": "50-char headline",
        "body": "100-300 char body content",
        "cta": "BOOK | CALL_NOW | LEARN_MORE",
        "faq_ai": "Q: ... A: ..."
      }
    `;
  }

  /**
   * Layer 4 & 5: Validation & GBP Compliance
   * Checks GBP limits, engagement best practices, and policy compliance.
   */
  private static validate(raw: any, context: any) {
    const limits = { 
      body_max: 300,
      title_max: 50
    };

    // 0. Normalize partial / malformed AI output before touching fields.
    raw = raw && typeof raw === "object" ? raw : {};
    raw.title = typeof raw.title === "string" ? raw.title : "";
    raw.body = typeof raw.body === "string" ? raw.body : "";
    raw.cta = typeof raw.cta === "string" ? raw.cta : "";
    raw.faq_ai = typeof raw.faq_ai === "string" ? raw.faq_ai : "";

    // 1. Length checks
    if (raw.title && raw.title.length > limits.title_max) {
      raw.title = raw.title.substring(0, 47) + "...";
    }
    if (raw.body && raw.body.length > limits.body_max) {
      raw.body = raw.body.substring(0, 297) + "...";
    }

    // 2. Prohibited terms (GBP policy). Strip the offending claim entirely —
    // never substitute placeholder text like "[trusted]" into the published post.
    const banned = ['guaranteed', 'cheapest', '#1', 'free', '100%'];
    const bannedRegex = new RegExp(banned.join('|'), 'gi');
    const scrub = (value: string) =>
      value.replace(bannedRegex, '').replace(/[ \t]{2,}/g, ' ').trim();
    if (raw.body) raw.body = scrub(raw.body);
    if (raw.title) raw.title = scrub(raw.title);

    // 3. Format hashtags (Hyper-local) — city + capitalized trade, e.g. #HoustonPlumber
    const cityRaw =
      context.location && context.location !== "Local Area"
        ? String(context.location).replace(/\s/g, "")
        : "";
    const tradeCap = capitalizeFirst(String(context.trade).replace(/\s/g, ""));
    raw.hashtags = cityRaw
      ? [`#${cityRaw}${tradeCap}`, `#${tradeCap}NearMe`, `#${cityRaw}Service`]
      : [`#${tradeCap}Services`, `#${tradeCap}NearMe`];

    // 4. CTA mapping (GBP only allows specific actions)
    const validCTAs = ['BOOK', 'CALL_NOW', 'LEARN_MORE', 'ORDER_ONLINE'];
    const ctaAction = raw.cta?.toUpperCase() || 'CALL_NOW';
    raw.cta = validCTAs.includes(ctaAction) ? ctaAction : 'CALL_NOW';

    // 5. Final Formatting
    return {
      preview: raw.title,
      text: `${raw.body}\n\n${raw.hashtags.join(' ')}\n\n❓ ${raw.faq_ai}`,
      cta: raw.cta,
      ctaUrl: `https://${context.traderProfile.id}.neerzy.com/book?utm_source=whatsapp&utm_medium=gbp_post`
    };
  }

  /**
   * Layer 6: Fallback Template Engine
   * Generates a high-quality post using rule-based logic if the LLM fails.
   */
  private static generateFallback(context: any, _rules: any) {
    const tradeLabel =
      context.trade && context.trade !== "general" ? context.trade : "local service";
    const hasRealCity = !!context.location && context.location !== "Local Area";
    const cityPhrase = hasRealCity ? ` in ${context.location}` : "";

    // Only a genuine description (not the empty default / one-word ack) grounds the post.
    const jobRaw = (context.jobDescription || context.jobType || "").trim();
    const isVoid = !jobRaw || /^(done|yes|no|ok|okay|post)$/i.test(jobRaw);
    const job = isVoid ? "" : jobRaw;

    // Minimal, factual, anti-hallucination copy — never invents credentials,
    // materials, outcomes, or generic marketing claims.
    const title = truncate(capitalizeFirst(job || `${tradeLabel} job completed`), 50);
    const body = job
      ? `${capitalizeFirst(job)}${cityPhrase}. For ${tradeLabel} help${hasRealCity ? ` in ${context.location}` : ""}, send us a message.`
      : `${capitalizeFirst(tradeLabel)} job completed${cityPhrase}. Send us a message for ${tradeLabel} help.`;
    const faq_ai = `Q: Need ${job ? "this service" : `${tradeLabel} services`}${hasRealCity ? ` in ${context.location}` : ""}? A: Yes — send us a message for details.`;

    return {
      title,
      body,
      cta: "CALL_NOW",
      faq_ai
    };
  }

  /**
   * Layer 5: Feedback Loop
   * Log generation events for future weight optimization.
   */
  private static async track(traderId: string, result: any, source: 'ai' | 'fallback') {
    console.log(`📈 Generation tracked for trader ${traderId} (Source: ${source})`);
    
    // Save to Supabase for future prompt weighting
    try {
      await supabase.from('generation_logs').insert({
        trader_id: traderId,
        output_preview: result.preview,
        source: source,
        metadata: { timestamp: new Date().toISOString() }
      });
    } catch (e) {
      console.warn("⚠️ Failed to log generation event:", e);
    }
  }

  static async generate(params: NeerzyInput) {
    const context = this.ingestContext(params);
    const rules = this.applyRules(context);
    const prompt = this.routePrompt(context, rules);
    
    let raw: any;
    let source: 'ai' | 'fallback' = 'ai';

    try {
      const response = await chatWithFallback(
        {
          messages: [
            { role: "system", content: "You are the Neerzy Engine v2. Output only JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        },
        undefined,
        { timeout: 30000 } // 30s (8s previously fired the generic fallback constantly)
      );

      raw = JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.warn("⚠️ AI Generation failed, triggering fallback engine:", error);
      raw = this.generateFallback(context, rules);
      source = 'fallback';
    }
    
    // 4 & 5. Validation & Compliance
    const validated = this.validate(raw, context);
    
    // 6. Feedback
    await this.track(params.trader_id, validated, source);

    return validated;
  }
}

/** Capitalize the first letter of a phrase (sentence case, not title case). */
function capitalizeFirst(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Truncate to `max` characters with a "..." suffix when needed. */
function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 3).trimEnd() + "...";
}

/**
 * Mock helper: Fetch local keywords for a service in a specific location
 */
export async function fetchLocalKeywords(service: string, location: string): Promise<string[]> {
  return [
    `${service} near me`,
    `best ${service} in ${location}`,
    `${service} ${location} cost`,
    `reliable ${service}`
  ];
}

/**
 * Mock helper: Load AEO (Answer Engine Optimization) templates for a category
 */
export async function loadAEOTemplates(category: string): Promise<string[]> {
  return [
    "Direct Answer Format",
    "List-based structured data",
    "Citation-friendly snippets"
  ];
}

/**
 * Mock helper: Get geo-context from a physical address
 */
export async function getGeoContext(address: string): Promise<string> {
  return `Located near major transit and residential areas in ${address}.`;
}
