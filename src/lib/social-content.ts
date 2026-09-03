import { chatWithFallback } from '@/lib/openai';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared AI social-content generation (Facebook + Instagram).
// Used by BOTH the dashboard "Social Content Studio" API and the
// WhatsApp webhook tier-based flow (Growth/Agency: Google + FB + IG).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STYLE_DESCRIPTIONS: Record<string, string> = {
  showcase: 'a job showcase — announce the job that was just completed, describe the work in a proud, trustworthy way, and invite the next customer.',
  before_after: 'a before & after post — describe the problem the customer had before, the fix you completed, and the great result now.',
  offer: 'a special offer post — present a clear, friendly offer or seasonal discount with an easy call to action.',
  review: 'a review-highlight post — celebrate a happy customer and their experience, quoting or summarizing their praise naturally.',
};

export interface SocialContentInput {
  jobTopic: string;
  contentType?: string;
  businessName?: string;
  businessCategory?: string;
  priority?: boolean;
}

export interface SocialContentResult {
  facebook: { postText: string; hashtags: string };
  instagram: { caption: string; hashtags: string };
}

/** Pull the first JSON object out of a model reply (survives code fences + prose). */
export function extractSocialJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    // fall through to fence-stripping + brace slicing
  }
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response contained no JSON object.');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function generateSocialContent(input: SocialContentInput): Promise<SocialContentResult> {
  const { jobTopic, contentType = 'showcase' } = input;
  const businessName = input.businessName || 'My Business';
  const businessCategory = input.businessCategory || 'Local Service';
  const style = STYLE_DESCRIPTIONS[contentType] || STYLE_DESCRIPTIONS.showcase;

  const system = `You are Neerzy, a friendly expert copywriter for LOCAL TRADE businesses (plumbers, electricians, locksmiths, cleaners, handymen). You turn one finished job into posts people love.

Write in plain, warm, trustworthy English a non-technical trader could post as-is. NEVER invent facts that are not in the job details. NEVER make up prices, guarantees, or customer names.

Return STRICT JSON only, with exactly this shape (no markdown, no extra keys):
{
  "facebook": { "postText": "...", "hashtags": "#Example #LocalTrades" },
  "instagram": { "caption": "...", "hashtags": "#Example #CityName #Service" }
}

Rules:
- facebook.postText: 80–150 words, natural and conversational. One short intro line, the job story, and a clear friendly call to action at the end (e.g. "Need the same done? Message us — we'll get you sorted."). NO heavy hashtags — at most 1–2.
- instagram.caption: 60–120 words with 2–3 short lines separated by line breaks. Start with a hook line. End with a soft call to action. Use at most a few tasteful emojis.
- instagram.hashtags: 6–10 targeted hashtags mixing the trade/service and the local area. All lowercase, spaces removed.
- Do NOT invent a location if none is given — just use trade hashtags.
- The generated text must be one single, clean copy block with no headers or labels like "Facebook post:".`;

  const user = `Business name: ${businessName}
Business type: ${businessCategory}
Post style: ${style}

Job details from the trader:
${jobTopic || '(no details given — write a short general post about the business instead)'}`;

  const aiResponse = await chatWithFallback({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.8,
    max_tokens: 1000,
  }, { priority: !!input.priority });

  const raw = aiResponse.choices[0]?.message?.content || '';
  const parsed = extractSocialJson(raw);

  const fb = parsed?.facebook;
  const ig = parsed?.instagram;
  if (!fb || !ig || typeof fb.postText !== 'string' || typeof ig.caption !== 'string') {
    throw new Error('AI response was missing required fields.');
  }

  return {
    facebook: {
      postText: fb.postText.trim(),
      hashtags: (fb.hashtags || '').toString().trim(),
    },
    instagram: {
      caption: ig.caption.trim(),
      hashtags: (ig.hashtags || '').toString().trim(),
    },
  };
}
