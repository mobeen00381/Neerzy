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
 * Every way this route can refuse to return a post, with the HTTP status and
 * the trader-facing sentence. The code is also put in the JSON body (`reason`)
 * and in exactly one log line, so a support report ("I got MISSING_INPUT") can
 * be traced without reading request bodies — which may contain the trader's
 * phone number or job description and must never be logged.
 */
const FAILURES = {
  INVALID_JSON: {
    status: 400,
    message: 'Could not read that post request. Please try again.',
  },
  MISSING_TOKEN: {
    status: 401,
    message: 'Please sign in again.',
  },
  INVALID_TOKEN: {
    status: 401,
    message: 'Your session expired. Please sign in again.',
  },
  MISSING_INPUT: {
    status: 400,
    message: 'Add a short description of the job before posting.',
  },
  VAGUE_DESCRIPTION: {
    status: 422,
    message: 'Please provide a short description of the job you completed before generating a post.',
  },
  GENERATION_FAILED: {
    status: 500,
    message: 'Something went wrong while generating your post. Please try again.',
  },
} as const;

type FailureCode = keyof typeof FAILURES;

/**
 * One line per request outcome, no free-form message. Provider/SQL error text
 * can echo the prompt or a phone number, so only a coarse tag (error name,
 * provider code, HTTP status) is recorded.
 */
function errorTag(err: unknown): string {
  if (!err || typeof err !== 'object') return typeof err;
  const e = err as { name?: unknown; code?: unknown; status?: unknown };
  const bits = [e.name, e.code, e.status]
    .filter((bit): bit is string | number => typeof bit === 'string' || typeof bit === 'number')
    .map(String);
  // Never allow a provider message/newline into the log line.
  return (bits.length ? bits.join(':') : 'error').replace(/\s+/g, '_').slice(0, 80);
}

function logFailure(code: string, status: number, userId?: string | null, detail?: string): void {
  const line = `[generate-post] ${code} status=${status} user=${userId || 'anonymous'}${detail ? ` detail=${detail}` : ''}`;
  if (status >= 500) console.error(line);
  else console.warn(line);
}

/** A degraded-but-successful path (post still returned): warn without a body. */
function logWarning(code: string, userId?: string | null, detail?: string): void {
  console.warn(`[generate-post] ${code} user=${userId || 'anonymous'}${detail ? ` detail=${detail}` : ''}`);
}

function failureResponse(code: FailureCode, userId?: string | null, detail?: string) {
  const { status, message } = FAILURES[code];
  logFailure(code, status, userId, detail);
  return NextResponse.json(
    { error: message, message, reason: code },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

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
  if (/^[+\d\s()-]+$/.test(cleaned)) return true;
  return false;
}

export async function POST(req: Request) {
  // Declared outside the try so a failure AFTER the quota was consumed can
  // hand the post back (delete the row) instead of silently burning a credit,
  // and so the catch can log which account failed without re-reading the body.
  let createdPostId: string | null = null;
  let requestUserId: string | undefined;

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Identity comes from the session, never from the request body — `userId`
    // used to be trusted here, so any client could post as anyone. Auth is
    // checked before the body is read so a signed-out request never parses (or
    // logs) trader content.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
    if (!token) {
      return failureResponse('MISSING_TOKEN');
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const userId: string | undefined = authData?.user?.id;
    if (authError || !userId) {
      return failureResponse('INVALID_TOKEN', null, errorTag(authError));
    }
    requestUserId = userId;

    let body: unknown;
    try {
      body = await req.json();
    } catch (jsonErr) {
      return failureResponse('INVALID_JSON', userId, errorTag(jsonErr));
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return failureResponse('INVALID_JSON', userId);
    }

    const raw = body as { description?: unknown; businessName?: unknown; imageUrl?: unknown };
    const description = typeof raw.description === 'string' ? raw.description : null;
    const businessName = typeof raw.businessName === 'string' ? raw.businessName : null;
    const imageUrl = typeof raw.imageUrl === 'string' ? raw.imageUrl : null;

    if (!description && !businessName) {
      return failureResponse('MISSING_INPUT', userId);
    }

    // Block vague descriptions — force user to provide real job details
    if (isVagueDescription(description) && !imageUrl) {
      return failureResponse('VAGUE_DESCRIPTION', userId);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Plan + account identity
    //
    // A signed-in user can still be missing their `profiles` row: email signup
    // only creates an auth user, and the row is otherwise written by the Google
    // connect step. `create_post_with_quota()` refuses that user with
    // `no_account`, which looks like a broken login even though the session is
    // valid. Insert the row here (before the gate reads it) from the identity we
    // already authenticated.
    //
    // `ignoreDuplicates` turns this into `ON CONFLICT (id) DO NOTHING`: an
    // existing profile is never touched, so plan, phone and trial anchor set by
    // onboarding/paddle/WhatsApp stay exactly as they are.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const metadata = (authData?.user?.user_metadata || {}) as Record<string, unknown>;
    const metadataPhone =
      typeof metadata.phone === 'string'
        ? metadata.phone
        : typeof metadata.phone_number === 'string'
          ? metadata.phone_number
          : null;

    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, phone: authData?.user?.phone || metadataPhone || null },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    if (profileUpsertError) {
      // Best-effort: if the insert fails the gate will deny with its own
      // friendly `no_account` sentence instead of this route inventing one.
      logWarning('PROFILE_UPSERT_FAILED', userId, errorTag(profileUpsertError));
    }

    let profilePhone: string | null = null;
    let planTier = 'free';
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('selected_plan, phone')
        .eq('id', userId)
        .maybeSingle();
      profilePhone = profileData?.phone || authData?.user?.phone || metadataPhone || null;
      planTier = profileData?.selected_plan || 'free';
    } catch (profileErr) {
      // Plan/phone are best-effort here: the gate itself is authoritative.
      logWarning('PROFILE_LOOKUP_FAILED', userId, errorTag(profileErr));
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
      // Gate denials already carry a trader sentence + reason code in the JSON.
      logFailure(gate.reason.toUpperCase(), gate.status, userId);
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
      logWarning('BUSINESS_CONTEXT_FAILED', userId, errorTag(ctxErr));
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
      } catch (socialErr: unknown) {
        logWarning('SOCIAL_GENERATION_FAILED', userId, errorTag(socialErr));
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
        logWarning('POST_SAVE_FAILED', userId, `post=${createdPostId} ${errorTag(saveError)}`);
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
  } catch (error: unknown) {
    // Generation failed after the quota was consumed — hand the post back so
    // the trader isn't charged for a post they never received.
    if (createdPostId) {
      const { error: cleanupError } = await supabase
        .from('posts')
        .delete()
        .eq('id', createdPostId);
      if (cleanupError) {
        logWarning('POST_ROLLBACK_FAILED', requestUserId, `post=${createdPostId} ${errorTag(cleanupError)}`);
      }
    }

    return failureResponse('GENERATION_FAILED', requestUserId, errorTag(error));
  }
}