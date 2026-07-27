# BUG #1 Investigation Report: Post-Generation Code Path Analysis

## Executive Summary

After a thorough investigation of the entire post-generation pipeline, I have identified **three distinct code paths** that generate posts, each with its own prompt template. The "real estate" content issue is likely caused by the **NeerzyEngine fallback mechanism** firing when the OpenAI API call fails or times out, combined with the **dashboard's hardcoded fallback business profile** (`+923006291617`) that may be serving stale/cached data.

---

## 1. Code Path A: WhatsApp Webhook → `handleGeneratePost()` (Primary WhatsApp Flow)

**File:** `src/app/api/whatsapp/webhook/route.ts` (lines 252-390)

### Prompt Template (line 277-287):
```
Create a Google Post for {draft.customer_name || 'Client'}. Job details: {draft.voice_note || 'Completed successfully'}.
Format:
HEADLINE: (max 40 chars)
BODY: (max 250 chars)
CTA: (short)
HASHTAGS: (3 max)
```

**Model:** `gpt-4o-mini`

**Does it include the trader's description?** ✅ YES — it uses `draft.voice_note` which is populated from the WhatsApp message body or voice transcription.

**Fallback:** If OpenAI fails, the error is caught (line 386-389) and a generic error message is sent to the user. **No placeholder/demo content is substituted.**

---

## 2. Code Path B: `generate-post.ts` → `generateAndSavePost()` (WhatsApp Session Flow)

**File:** `src/lib/generate-post.ts` (lines 27-79)

### Prompt Template (lines 35-39):
```
Create a Google Business Profile post for:
  - Service: {session.transcript || 'General Handyman Work'}
  - Images: {session.accumulated_images?.length || 0}
  - Customer: {session.customer_name || 'A customer'}
  Return JSON EXACTLY in this format: { "title": "...", "description": "...", "hashtags": ["#..."], "call_to_action": "..." }
```

**Model:** `gpt-4o-mini`

**Does it include the trader's description?** ✅ YES — it uses `session.transcript`.

**Fallback:** If OpenAI fails, the error propagates up (line 64 throws). **No placeholder content is substituted.**

---

## 3. Code Path C: `NeerzyEngine.generate()` (The "Neerzy Engine" — API Route)

**File:** `src/lib/neerzy/engine.ts` (lines 263-296)

### Prompt Template (lines 142-176):
```
Act as the Neerzy AI local marketing expert for the {trade} industry in the {region} region.
Generate a GBP post for a {jobType} job in {location}.

UNIVERSAL PERFORMANCE RULES:
- Title/Headline: Max 50 characters (optimized for mobile preview).
- Body Content: 100-300 characters for maximum engagement.
- AEO Integration: Include exactly one conversational Q&A block answering a common customer intent.
- Local Signals: Include 2-3 hyper-local hashtags.
- Call to Action: Use one of (BOOK, CALL_NOW, LEARN_MORE).

TRADE RULES:
- SEO Keywords: {rules.seo.join(", ")}
- AEO Questions: {rules.aeo.join(", ")}
- GEO Signals: {rules.geo.join(", ")}
- Seasonal Context: {rules.seasonalFlags.join(", ") || "None"}
- Trust Signals: {rules.trustSignals.join(", ")}
- Local Currency: {rules.currency}
- Urgency Modifiers: {rules.urgency.join(", ")}
- PRO TIPS: {rules.pro_tips?.join(", ") || "N/A"}

INTENT: {context.intent}
GEO CONTEXT: {context.geoContext}

Return a JSON object with:
{
  "title": "50-char headline",
  "body": "100-300 char body content",
  "cta": "The CTA keyword",
  "ctaUrl": "The link",
  "hashtags": ["#local1", "#local2"],
  "faq_ai": "The Q&A block"
}
```

**Model:** `gpt-4o`

**Does it include the trader's description?** ❌ **NO** — This prompt does NOT include the trader's actual description of the job. It only uses `context.jobType` (which is the `service` parameter — e.g., "burst pipe") and `context.location`. The actual job details from the trader are **not passed into this prompt**.

### ⚠️ CRITICAL FINDING: Fallback Engine (lines 230-241)

```typescript
private static generateFallback(context: any, rules: any) {
    const title = `🚨 Professional ${context.trade} in ${context.location}`;
    const body = `Need a reliable ${context.trade}? Our team specializes in ${context.jobType} in the ${context.location} area. ${rules.trustSignals[0]} and ${rules.urgency[0]} service.`;
    const faq_ai = `Q: Do you offer ${context.jobType} in ${context.location}? A: Yes, we are fully ${rules.trustSignals[0].toLowerCase()} and ready to help.`;
    
    return { title, body, cta: "CALL_NOW", faq_ai };
}
```

This fallback fires when:
1. **OpenAI API call fails** (network error, timeout, auth failure)
2. **OpenAI API call times out** (the timeout is set to 8000ms on line 280)

The fallback generates **generic, rule-based content** that looks like a real estate / generic service post because it uses template strings like `"Professional {trade} in {location}"` — which would produce content like "Professional Plumber in Austin" — generic enough to look like real estate content.

---

## 4. Code Path D: Dashboard Direct Post (Web App)

**File:** `src/app/dashboard/page.tsx` (lines 517-585)

The dashboard's `handleSendMessage()` function **does NOT call OpenAI at all**. It directly saves the user's raw text to the database (line 524-533) and then simulates a response with hardcoded bot messages:

```typescript
// Line 562-580: Simulated responses — NO actual AI call
setTimeout(() => {
    const optimizationMsg = {
        text: "🔄 Neerzy AI is refining the description, matching keywords, and formatting SEO tags for Google Business Profile...",
        sender: 'bot'
    };
    // ...
    setTimeout(() => {
        const successMsg = {
            text: "✅ Successfully published to your Google Business Profile! Check your GMB listing to see the live update.",
            sender: 'bot'
        };
    }, 1500);
}, 1000);
```

**This means the dashboard web app posts are NEVER actually sent through AI generation.** They are saved raw and the user is shown a fake "optimization" animation.

---

## 5. The "Real Estate" Content Source

The most likely source of the real estate-like content is the **NeerzyEngine fallback** (Code Path C). Here's why:

1. **The fallback generates generic content** like "Professional {trade} in {location}" — this pattern is commonly used by real estate agents ("Professional Realtor in Austin").

2. **The timeout is only 8000ms** (line 280), which is very aggressive for GPT-4o. If the API is slow, it will consistently fall back to the template engine.

3. **The WhatsApp inbound route** (Code Path A, line 69-78) calls the NeerzyEngine API:
   ```typescript
   const neerzyRes = await fetch(`${appUrl}/api/neerzy/generate`, {
       method: 'POST',
       body: JSON.stringify({ service, location: geo.city, category: geo.category, address: geo.address, trader_id: traderId })
   });
   ```
   Note: it passes `service` (e.g., "burst pipe") but **NOT the trader's actual description/voice note**. The trader's description is stored in `draft.voice_note` but is never sent to the NeerzyEngine.

4. **The dashboard healing mechanism** (lines 160-205 in `dashboard/page.tsx`) hardcodes a fallback phone number `+923006291617` and links to a default business profile. If the user has no phone set, they get linked to this sandbox profile, which may have stale/cached data.

---

## 6. Root Cause Summary

| Issue | Location | Severity |
|-------|----------|----------|
| **Trader's description NOT included in NeerzyEngine prompt** | `engine.ts` line 142-176 | 🔴 **HIGH** |
| **Fallback engine generates generic template content** | `engine.ts` lines 230-241 | 🔴 **HIGH** |
| **8-second timeout on GPT-4o is too aggressive** | `engine.ts` line 280 | 🟡 MEDIUM |
| **Dashboard posts bypass AI entirely** | `dashboard/page.tsx` lines 560-580 | 🟡 MEDIUM |
| **Hardcoded fallback business profile** | `dashboard/page.tsx` lines 162-205 | 🟡 MEDIUM |
| **WhatsApp inbound doesn't pass voice_note to NeerzyEngine** | `whatsapp/inbound/route.ts` lines 69-78 | 🟡 MEDIUM |

---

## 7. Recommended Fixes

1. **Include trader's description in NeerzyEngine prompt** — Add a `jobDescription` field to `NeerzyInput` and include it in the prompt template.

2. **Increase timeout or add retry logic** — 8000ms is too short for GPT-4o. Increase to 30s or add exponential backoff.

3. **Improve fallback content** — The fallback should at minimum include the trader's actual description rather than generating generic template text.

4. **Fix dashboard to actually call AI** — The simulated "optimization" messages are misleading. Either make a real API call or remove the simulation.

5. **Remove hardcoded fallback phone** — The healing mechanism should not silently link users to a sandbox profile.
