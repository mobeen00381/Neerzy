// lib/post-prompt.ts
// ─────────────────────────────────────────────────────────────
// Shared prompt builder for Neerzy's Google Business Profile post writer.
// Used by BOTH the WhatsApp webhook and the web dashboard generate API so
// every generated post carries consistent SEO / AEO / GEO enrichment while
// staying 100% grounded in the real job description (no hallucination).
// ─────────────────────────────────────────────────────────────

export interface PostPromptContext {
  /** Real business name from the user's GBP connection (or fallback). */
  businessName: string;
  /** Google category, e.g. "Plumber" — used as a natural service keyword. */
  category?: string | null;
  /** Address string from the user's GBP connection — the city is used as a geo signal. */
  locationHint?: string | null;
}

export interface PostPromptInput {
  jobDescription: string;
  hasImage: boolean;
}

export interface PostPrompt {
  system: string;
  user: string;
}

/**
 * Description strings that carry no usable job detail. Empty text, voice notes
 * that failed to transcribe, and stray one-word acks ("yes"/"post"/"done")
 * must NOT become the "job description" — otherwise the model invents a generic
 * post unrelated to the actual work. Treat them as "no description" and let the
 * prompt ground itself in the business category/location only.
 */
export const VOID_DESCRIPTIONS: ReadonlySet<string> = new Set([
  '',
  '[voice note transcription failed]',
  '[Voice note transcription failed]',
  'yes',
  'no',
  'ok',
  'okay',
  'done',
  'post',
]);

/** True when a description string carries real job details worth posting about. */
export function isUsableJobDescription(raw: string | null | undefined): boolean {
  const value = (raw || '').trim().toLowerCase();
  return value.length > 0 && !VOID_DESCRIPTIONS.has(value);
}

const SYSTEM_PROMPT = `You are a Google Business Profile (GBP) post writer for a local service business.

STRICT RULES (never break these):
1. Write ONLY about the specific job described by the user. Do NOT invent products, materials, prices, services, or locations.
2. Do NOT use the business name or category to guess what the business sells. The job description is the ONLY source of what was actually done.
3. Keep the post factual — describe what was actually done, not what the business might do.
4. If the job description is MISSING or very short (1-3 words), DO NOT invent any job details (no customer, no materials, no outcome). Instead write a brief factual post that says only that a job was completed for this business, using the business category and city when provided — e.g. headline "Plumbing Job Done" + "A plumbing job was completed in Houston." If no category is provided, write the same minimal "job completed" post WITHOUT guessing the trade.

SEO RULES:
5. Use the primary service keyword naturally in the HEADLINE and once in the BODY. When a business category is provided (e.g. "Plumber"), derive the keyword from it (e.g. "plumbing") and use it once in the BODY.
6. When a business location is provided, mention ONLY the city/town from it exactly once in the BODY. Never invent or guess a location if none is provided.

AEO RULES (answer-engine friendly):
7. Make the BODY's first sentence a short, direct, declarative statement of what was done (who/what/where) that an AI answer engine could quote verbatim.

GEO RULES (generative-engine attribution):
8. When a service keyword and a city are both used, phrase them together once as "service in City" (e.g. "plumbing in Austin") so AI engines can attribute the post to the right local business.
9. When a city is known, make ONE of the 3 hashtags a hyper-local tag that combines the city with the service keyword (e.g. #AustinPlumbing or #HoustonRoofRepair). Never invent a city when none is provided.

CTA RULES:
10. The CTA must be short, natural, and specific to the job (e.g. "Need the same fix? Send us a message."). Do not invent phone numbers, websites, or booking links.

FORMATTING (your ENTIRE reply must be exactly these labelled lines):
HEADLINE: (max 40 chars, includes the service keyword where natural)
BODY: (max 250 chars, answer-first first sentence)
CTA: (short call to action)
HASHTAGS: (3 max, trade-relevant — when a city is known include one local tag like #AustinPlumbing)
POST_TYPE: (one of STANDARD, OFFER, EVENT — STANDARD unless the job clearly involves a special offer or an event)
Q_A: (one question a customer might ask about this job/service and a one-line factual answer, formatted as "Question -> Answer"; output "Q_A: none" if you cannot answer factually from the job details)`;

export function buildPostPrompt(ctx: PostPromptContext, input: PostPromptInput): PostPrompt {
  const facts: string[] = [];
  if (ctx.businessName) facts.push(`Business name: ${ctx.businessName}`);
  if (ctx.category) facts.push(`Business category: ${ctx.category}`);
  if (ctx.locationHint) facts.push(`Business location: ${ctx.locationHint}`);

  const user = [
    ...facts,
    input.jobDescription
      ? `Job completed: ${input.jobDescription}`
      : 'Job completed: (no description was provided — write the minimal job-completed post described in rule 4, grounded only in the business facts above)',
    input.hasImage ? 'An image of the work is attached.' : '',
    '',
    'Create a Google Business Profile post about this specific job. Format exactly:',
    'HEADLINE: (max 40 chars)',
    'BODY: (max 250 chars)',
    'CTA: (short call to action)',
    'HASHTAGS: (3 max)',
    'POST_TYPE: (STANDARD / OFFER / EVENT)',
    'Q_A: (Question -> Answer, or "none")',
  ].filter(Boolean).join('\n');

  return { system: SYSTEM_PROMPT, user };
}
