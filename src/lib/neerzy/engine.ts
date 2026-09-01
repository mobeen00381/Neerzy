import { supabase } from "@/lib/supabase";
import { chatWithFallback } from "@/lib/openai";

export interface NeerzyInput {
  trader_id: string;
  trade: 'plumber' | 'electrician' | 'roofer' | 'mechanic' | string;
  service: string; // e.g., "burst pipe", "EV charger install", "storm damage", "brake replacement"
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
    return `
      Act as the Neerzy AI local marketing expert for the ${context.trade} industry in the ${context.region} region.
      Generate a GBP post for a ${context.jobType} job in ${context.location}.
      
      UNIVERSAL PERFORMANCE RULES:
      - Title/Headline: Max 50 characters (optimized for mobile preview).
      - Body Content: 100-300 characters for maximum engagement.
      - AEO Integration: Include exactly one conversational Q&A block answering a common customer intent.
      - Local Signals: Include 2-3 hyper-local hashtags.
      - Call to Action: Use one of (BOOK, CALL_NOW, LEARN_MORE).
      
      TRADE RULES:
      - SEO Keywords: ${rules.seo.join(", ")}
      - AEO Questions: ${rules.aeo.join(", ")}
      - GEO Signals: ${rules.geo.join(", ")}
      - Seasonal Context: ${rules.seasonalFlags.join(", ") || "None"}
      - Trust Signals: ${rules.trustSignals.join(", ")}
      - Local Currency: ${rules.currency}
      - Urgency Modifiers: ${rules.urgency.join(", ")}
      - PRO TIPS: ${rules.pro_tips?.join(", ") || "N/A"}
      
      INTENT: ${context.intent}
      GEO CONTEXT: ${context.geoContext}

      Return a JSON object with:
      {
        "title": "50-char headline",
        "body": "100-300 char body content",
        "cta": "The CTA keyword",
        "ctaUrl": "The link",
        "hashtags": ["#local1", "#local2"],
        "faq_ai": "The Q&A block"
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

    // 1. Length checks
    if (raw.title && raw.title.length > limits.title_max) {
      raw.title = raw.title.substring(0, 47) + "...";
    }
    if (raw.body && raw.body.length > limits.body_max) {
      raw.body = raw.body.substring(0, 297) + "...";
    }

    // 2. Prohibited terms (GBP policy)
    const banned = ['guaranteed', 'cheapest', '#1', 'free', '100%'];
    const bannedRegex = new RegExp(banned.join('|'), 'gi');
    if (raw.body) raw.body = raw.body.replace(bannedRegex, '[trusted]');
    if (raw.title) raw.title = raw.title.replace(bannedRegex, '[trusted]');

    // 3. Format hashtags (Hyper-local)
    const citySafe = context.location.replace(/\s/g, '');
    const tradeSafe = context.trade.replace(/\s/g, '');
    raw.hashtags = [
      `#${citySafe}${tradeSafe}`,
      `#${tradeSafe}NearMe`,
      `#${citySafe}Service`
    ].slice(0, 3);

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
  private static generateFallback(context: any, rules: any) {
    const title = `🚨 Professional ${context.trade} in ${context.location}`;
    const body = `Need a reliable ${context.trade}? Our team specializes in ${context.jobType} in the ${context.location} area. ${rules.trustSignals[0]} and ${rules.urgency[0]} service.`;
    const faq_ai = `Q: Do you offer ${context.jobType} in ${context.location}? A: Yes, we are fully ${rules.trustSignals[0].toLowerCase()} and ready to help.`;
    
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
        { timeout: 8000 } // timeout as request option
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
