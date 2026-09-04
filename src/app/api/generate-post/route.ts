import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chatWithFallback } from '@/lib/openai';
import { parsePostContent, buildCleanPost } from '@/lib/post-parser';
import { buildPostPrompt, type PostPromptContext } from '@/lib/post-prompt';
import { countUserPosts } from '@/lib/post-usage';
import { generateSocialContent } from '@/lib/social-content';
import { PLAN_LIMITS, getCycleStartIso, getRemainingDays } from '@/lib/plans';

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
    let profilePhone: string | null = null;
    let growthTier = false;
    if (userId) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('selected_plan, phone, plan_started_at, trial_started_at, created_at')
          .eq('id', userId)
          .maybeSingle();
        profilePhone = profileData?.phone || null;

        const planTier = profileData?.selected_plan || 'free';
        const quota = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
        const trialStart = profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at;

        // Growth/Agency/Unlimited → also write Facebook + Instagram posts (same as WhatsApp flow).
        if (planTier === 'growth' || planTier === 'agency' || planTier === 'unlimited') growthTier = true;

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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Business context (real name, category, location) for SEO/AEO/GEO enrichment
    // (best-effort — never blocks generation)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const postCtx: PostPromptContext = { businessName: bizName };
    try {
      if (profilePhone) {
        const { data: biz } = await supabase
          .from('business_profiles')
          .select('business_name, address, category')
          .eq('user_phone', profilePhone)
          .maybeSingle();
        if (biz) {
          postCtx.businessName = biz.business_name || bizName;
          postCtx.category = biz.category || null;
          postCtx.locationHint = biz.address || null;
        }
      }
    } catch (ctxErr) {
      console.warn('⚠️ Could not load business context:', ctxErr);
    }

    const { system, user } = buildPostPrompt(postCtx, { jobDescription, hasImage: !!imageUrl });
    const aiResponse = await chatWithFallback({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }, { priority: growthTier });

    const postContent = aiResponse.choices[0].message.content || '';
    const parsed = parsePostContent(postContent);

    // Full multi-line extraction (same as the WhatsApp webhook) — no truncation,
    // no generic fallbacks injected. Body falls back to the real job description.
    const headline = parsed.headline || '';
    const bodyText = parsed.body || jobDescription;
    const cta = parsed.cta || '';
    const hashtags = parsed.hashtags || '';
    const postType = parsed.postType || '';
    const qaQuestion = parsed.qaQuestion || '';
    const qaAnswer = parsed.qaAnswer || '';

    const fullText = buildCleanPost(headline, bodyText, cta, hashtags);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Growth/Agency: also generate Facebook + Instagram content (same as WhatsApp
    // tier-based flow). Best-effort — if it fails the Google post still returns.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let social = null;
    if (growthTier) {
      try {
        social = await generateSocialContent({
          jobTopic: jobDescription,
          businessName: postCtx.businessName || bizName,
          businessCategory: postCtx.category || 'Local Service',
          priority: growthTier,
        });
      } catch (socialErr: any) {
        console.warn('⚠️ generate-post social content failed (Google post still returned):', socialErr?.message || socialErr);
      }
    }

    return NextResponse.json({
      success: true,
      headline,
      body: bodyText,
      cta,
      hashtags,
      postType,
      qaQuestion,
      qaAnswer,
      fullText,
      social,
      growthTier
    });
  } catch (error: any) {
    console.error('❌ generate-post error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}