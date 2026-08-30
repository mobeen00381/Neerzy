import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from '@/lib/openai';
import { parsePostContent, buildCleanPost } from '@/lib/post-parser';
import { countUserPosts } from '@/lib/post-usage';
import { PLAN_LIMITS, getCycleStartIso, getRemainingDays } from '@/lib/plans';

const openai = getOpenAIClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * List of words/text that indicate the user hasn't given a real description
 */
const VAGUE_INPUTS = [
  'copy', 'test', 'hello', 'hi', 'ok', 'yes', 'no', 'post', 'done',
  'completed successfully', 'photo update', 'image update',
];

function isVagueDescription(description: string | null | undefined): boolean {
  if (!description || !description.trim()) return true;
  const cleaned = description.trim().toLowerCase();
  if (cleaned.length < 5) return true;
  if (VAGUE_INPUTS.includes(cleaned)) return true;
  // If it's only a phone number or numeric
  if (/^[\+\d\s\-\(\)]+$/.test(cleaned)) return true;
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description, businessName, imageUrl, userId } = body;

    if (!description && !businessName) {
      return NextResponse.json({ error: 'Missing description or business name' }, { status: 400 });
    }

    // Block vague descriptions — force user to provide real job details
    if (isVagueDescription(description) && !imageUrl) {
      return NextResponse.json(
        { error: 'VAGUE_DESCRIPTION', message: 'Please provide a short description of the job you completed before generating a post.' },
        { status: 422 }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Plan quota check — posts from WhatsApp + web dashboard count together
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (userId) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('selected_plan, phone, plan_started_at, trial_started_at, created_at')
          .eq('id', userId)
          .maybeSingle();

        const planTier = profileData?.selected_plan || 'free';
        const quota = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
        const trialStart = profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at;

        if (quota.trialDays > 0 && trialStart && getRemainingDays(trialStart, quota.trialDays) <= 0) {
          return NextResponse.json(
            { error: 'Your 30-day free trial has ended. Upgrade to continue posting.' },
            { status: 403 }
          );
        }

        const cycleStartIso = getCycleStartIso(profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at);
        const usage = await countUserPosts(userId, profileData?.phone || null, cycleStartIso);

        if (quota.totalPosts !== -1 && usage.total >= quota.totalPosts) {
          return NextResponse.json(
            { error: `You've reached your plan limit of ${quota.totalPosts} posts per month. Upgrade to post more.` },
            { status: 403 }
          );
        }

        if (quota.dailyPosts > 0 && usage.daily >= quota.dailyPosts) {
          return NextResponse.json(
            { error: `Daily limit of ${quota.dailyPosts} post${quota.dailyPosts !== 1 ? 's' : ''} reached. Try again tomorrow.` },
            { status: 403 }
          );
        }
      } catch (quotaErr) {
        console.warn('⚠️ Could not check post quota:', quotaErr);
      }
    }

    const jobDescription = description?.trim() || 'Completed job';
    const bizName = businessName?.trim() || 'Local Business';

    const aiResponse = await openai.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a Google Business Profile post writer for a local service business called "${bizName}".
          
STRICT RULES:
1. Write ONLY about the specific job described by the user. Do NOT invent products, materials, prices, or services not mentioned.
2. Do NOT use the business name to guess what the business sells or does. The business name alone is NOT a prompt to describe their products.
3. Keep the post factual — describe what was actually done, not what the business might do.
4. If the job description is very short (1-3 words), write a brief, neutral post about completing a job without inventing details.`
        },
        {
          role: 'user',
          content: `My business: ${bizName}
Job completed: ${jobDescription}
${imageUrl ? 'An image of the work is attached.' : ''}

Create a Google Business Profile post about this specific job. Format exactly:
HEADLINE: (max 40 chars)
BODY: (max 250 chars)
CTA: (short call to action)
HASHTAGS: (3 max)`
        }
      ]
    });

    const postContent = aiResponse.choices[0].message.content || '';
    const parsed = parsePostContent(postContent);

    // Full multi-line extraction (same as the WhatsApp webhook) — no truncation,
    // no generic fallbacks injected. Body falls back to the real job description.
    const headline = parsed.headline || '';
    const bodyText = parsed.body || jobDescription;
    const cta = parsed.cta || '';
    const hashtags = parsed.hashtags || '';

    const fullText = buildCleanPost(headline, bodyText, cta, hashtags);

    return NextResponse.json({
      success: true,
      headline,
      body: bodyText,
      cta,
      hashtags,
      fullText
    });
  } catch (error: any) {
    console.error('❌ generate-post error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}