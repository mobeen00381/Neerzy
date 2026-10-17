import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chatWithFallback } from '@/lib/openai';
import { parsePostContent, buildCleanPost } from '@/lib/post-parser';
import { buildPostPrompt, type PostPromptContext } from '@/lib/post-prompt';
import { generateSocialContent } from '@/lib/social-content';
import { getBusinessProfileForUser } from '@/lib/business-profile';
import { checkPostGate, postGateResponse } from '@/lib/post-gate';

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
  // Declared outside the try so a failure AFTER the quota was consumed can
  // hand the post back (delete the row) instead of silently burning a credit.
  let createdPostId: string | null = null;

  try {
    const body = await req.json();
    const { description, businessName, imageUrl } = body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Identity comes from the session, never from the request body — `userId`
    // used to be trusted here, so any client could post as anyone.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const userId: string | undefined = authData?.user?.id;
    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    // Plan + account identity
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let profilePhone: string | null = null;
    let planTier = 'free';
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('selected_plan, phone')
        .eq('id', userId)
        .maybeSingle();
      profilePhone = profileData?.phone || authData?.user?.phone || null;
      planTier = profileData?.selected_plan || 'free';
    } catch (profileErr) {
      console.warn('⚠️ Could not load profile:', profileErr);
    }

    // Growth/Agency/Unlimited → also write Facebook + Instagram posts (same as WhatsApp flow).
    const growthTier = planTier === 'growth' || planTier === 'agency' || planTier === 'unlimited';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Unified quota gate — checks the plan AND creates the `posts` row in one
    // serialized transaction, so two parallel requests can never both pass.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const gate = await checkPostGate({
      userId,
      phone: profilePhone,
      source: 'dashboard',
      payload: {
        content: description?.trim() || 'Photo update',
        image_url: imageUrl || null,
        status: 'published',
      },
    });

    if (!gate.allowed) {
      console.log(`🚫 generate-post denied for ${userId}: ${gate.reason}`);
      return postGateResponse(gate);
    }

    createdPostId = gate.postId;

    const jobDescription = description?.trim() || 'Completed job';
    const bizName = businessName?.trim() || 'Local Business';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Business context (real name, category, location) for SEO/AEO/GEO enrichment
    // (best-effort — never blocks generation)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const postCtx: PostPromptContext = { businessName: bizName };
    try {
      const biz = await getBusinessProfileForUser(supabase, userId, profilePhone);
      if (biz) {
        postCtx.businessName = biz.business_name || bizName;
        postCtx.category = biz.category || null;
        postCtx.locationHint = biz.address || null;
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Persist the generated copy on the row the gate already created. The post
    // counts toward the quota from the moment of insertion, so it must never be
    // left without the AI output.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const socialFb = social?.facebook
      ? `${social.facebook.postText}\n\n${social.facebook.hashtags}`.trim()
      : null;
    const socialIg = social?.instagram
      ? `${social.instagram.caption}\n\n${social.instagram.hashtags}`.trim()
      : null;

    if (createdPostId) {
      const { error: saveError } = await supabase
        .from('posts')
        .update({
          ai_reply: fullText,
          social_facebook: socialFb,
          social_instagram: socialIg,
        })
        .eq('id', createdPostId);

      if (saveError) {
        // The post exists and is published; only the copy failed to save.
        console.error('⚠️ Could not save generated post content:', saveError.message);
      }
    }

    return NextResponse.json({
      success: true,
      postId: createdPostId,
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

    // Generation failed after the quota was consumed — hand the post back so
    // the trader isn't charged for a post they never received.
    if (createdPostId) {
      const { error: cleanupError } = await supabase
        .from('posts')
        .delete()
        .eq('id', createdPostId);
      if (cleanupError) {
        console.error('⚠️ Could not roll back post row (quota stays consumed):', cleanupError.message);
      }
    }

    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}