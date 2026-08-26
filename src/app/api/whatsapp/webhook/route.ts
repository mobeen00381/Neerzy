import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMetaText, sendMetaTemplate, sendMetaMedia, getPhoneNumberId, getAccessToken } from '@/lib/whatsapp';
import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from '@/lib/openai';
import { PLAN_LIMITS, getCycleStartIso } from '@/lib/plans';
import { parsePostContent, buildCleanPost } from '@/lib/post-parser';
import { countUserPosts } from '@/lib/post-usage';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = getOpenAIClient();

const META_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1256240127573258';
const META_VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN || 'neerzy_webhook_verify_2024';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Message-ID dedup cache: prevent double-processing from Meta retries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const processedMessageIds = new Map<string, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache user_id lookups by phone to avoid repeated DB queries
const userIdCache = new Map<string, string | null>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET - Meta Webhook Verification
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('🔔 Meta Webhook Verification:', { mode, token, challenge });

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  console.warn('❌ Webhook verification failed');
  return new Response('Verification failed', { status: 403 });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Rate Limiter: DB-backed, 5 generations per phone per 60 min
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GEN_RATE_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
const GEN_RATE_MAX = 5; // 5 generation calls per window

async function checkGenRateLimit(phone: string): Promise<{ allowed: boolean; remaining: number; retryMinutes: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - GEN_RATE_WINDOW_MS);

  try {
    // Cleanup stale entries
    void supabase.from('rate_limits').delete().lt('created_at', new Date(now.getTime() - 86400_000).toISOString());

    const { data: existing } = await supabase
      .from('rate_limits')
      .select('id, request_count, window_start')
      .eq('ip_address', phone)
      .eq('endpoint', 'whatsapp_gen')
      .gt('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) {
      await supabase.from('rate_limits').insert({
        ip_address: phone,
        endpoint: 'whatsapp_gen',
        request_count: 1,
        window_start: now.toISOString(),
      });
      return { allowed: true, remaining: GEN_RATE_MAX - 1, retryMinutes: 0 };
    }

    if (existing.request_count >= GEN_RATE_MAX) {
      const resetAt = new Date(existing.window_start).getTime() + GEN_RATE_WINDOW_MS;
      const retryMinutes = Math.ceil((resetAt - now.getTime()) / 60000);
      return { allowed: false, remaining: 0, retryMinutes };
    }

    await supabase.from('rate_limits').update({ request_count: existing.request_count + 1 }).eq('id', existing.id);
    return { allowed: true, remaining: GEN_RATE_MAX - (existing.request_count + 1), retryMinutes: 0 };
  } catch (err) {
    console.error('Rate limiter DB error:', err);
    return { allowed: false, remaining: 0, retryMinutes: 60 }; // fail-closed
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST - Meta Webhook Message Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(req: Request) {
  // Per-invocation correlation id — lets logs from a single Meta delivery be tied together
  const requestId = Math.random().toString(36).slice(2, 10);
  let webhookData: any;
  let senderPhone = '';

  try {
    // Meta sends: { object: "whatsapp_business_account", entry: [{ changes: [{ value: { messages: [...] } }] }] }
    webhookData = await req.json();
    console.log(`📥 [${requestId}] Webhook payload received, snapshot:`, JSON.stringify(webhookData).substring(0, 500));

    const entry = webhookData?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    // Ignore non-message events (status updates, etc.)
    if (!messages || !messages.length) {
      console.log(`📥 [${requestId}] Non-message webhook event, ignoring`);
      return NextResponse.json({ status: 'ok' });
    }

    const message = messages[0];
    const from = message?.from || '';
    senderPhone = from;
    const body = message?.text?.body || '';
    const messageType = message?.type || 'text';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Dedup check: prevent double-processing from Meta retries
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const messageId = message?.id;
    if (messageId) {
      if (processedMessageIds.has(messageId)) {
        console.log(`🔁 [${requestId}] Duplicate message ID ${messageId}, skipping`);
        return NextResponse.json({ status: 'ok' });
      }
      processedMessageIds.set(messageId, Date.now());
      // Clean up old entries to prevent memory leak
      if (processedMessageIds.size > 1000) {
        const cutoff = Date.now() - DEDUP_TTL_MS;
        for (const [id, timestamp] of processedMessageIds.entries()) {
          if (timestamp < cutoff) {
            processedMessageIds.delete(id);
          }
        }
      }
    }

    // Extract media if present (image, video, audio, document)
    const hasMedia = ['image', 'video', 'audio', 'document'].includes(messageType);

    if (!from) {
      console.log(`📥 [${requestId}] Message with no sender, ignoring`);
      return NextResponse.json({ status: 'ok' });
    }

    console.log(`📥 [${requestId}] [Meta WhatsApp] From: ${from}, Type: ${messageType}, Body: "${body.substring(0, 100)}"`);

    // `to` was the business number in Twilio — now unused (Meta uses phone number ID), keep as null for compat
    const to = undefined;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Commands first (POST / RESET / DONE)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (body) {
      const text = body.toUpperCase().trim();

      if (text === 'POST') {
        // Rate-limit check before allowing generation
        const rateCheck = await checkGenRateLimit(from);
        if (!rateCheck.allowed) {
          return await sendWhatsappText(
            from,
            `⚠️ *Generation limit reached.*\n\nYou can generate ${GEN_RATE_MAX} posts every 60 minutes. Try again in about ${rateCheck.retryMinutes} minute${rateCheck.retryMinutes !== 1 ? 's' : ''}.`,
            undefined
          );
        }

        // Return 200 immediately to Meta to avoid webhook timeout
        // Process the heavy workflow asynchronously
        void processPostWorkflow(from, undefined);
        return NextResponse.json({ status: 'processing' });
      }

      if (text === 'RESET') {
        // Clear all active drafts for this phone
        await supabase.from('pending_posts').update({ status: 'cleared' }).eq('user_phone', from).eq('status', 'draft');
        userIdCache.delete(from); // clear user ID cache
        return await sendWhatsappText(from, '🗑️ *All drafts cleared.*\n\nStart fresh by sending a new photo.', to);
      }

      if (text === 'DONE') {
        // Return 200 immediately to Meta to avoid webhook timeout
        // Process the review workflow asynchronously
        void processReviewWorkflow(from, undefined);
        return NextResponse.json({ status: 'processing' });
      }

      // Check if message matches customer name and phone details: e.g. "John Doe +1234567890"
      const phoneMatch = body.match(/(\+?\d{10,15})/);

      if (phoneMatch) {
        const name = body.replace(phoneMatch[1], '').trim() || 'Customer';
        const formattedCustPhone = formatToE164(phoneMatch[1], from);
        const cc = extractCountryCode(formattedCustPhone);
        const flag = getCountryFlag(cc);
        const postState = await saveDraft(from, { customerName: name, customerPhone: formattedCustPhone });
        if (postState === 'generated') {
          return await sendWhatsappText(from, `✅ *Customer details saved.*\n\n👤 ${name}\n📱 ${flag} ${formattedCustPhone}\n\nType *DONE* to send the review link to ${name} now.`, to);
        }
        return await sendWhatsappText(from, `✅ *Customer details saved.*\n\n👤 ${name}\n📱 ${flag} ${formattedCustPhone}\n\nType *DONE* to send the review link to ${name}, or send photos & a description then type *POST* to create a post.`, to);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Media handling with clear workflow confirmations
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (hasMedia) {
      // For Meta, media is referenced by ID — we need to download via Graph API
      const mediaId = message[messageType]?.id;
      const mimeType = message[messageType]?.mime_type || '';
      const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || '';
      const downloadUrl = `https://graph.facebook.com/v22.0/${mediaId}`;

      if (messageType === 'audio') {
        console.log('🎙️ Received Voice Note, downloading from Meta...');
        try {
          const audioResponse = await fetch(downloadUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio from Meta: ${audioResponse.status}`);
          }
          const buffer = await audioResponse.arrayBuffer();

          let voiceText = '';
          if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
            console.warn("No AI API key, mocking voice note transcription");
            voiceText = "[Voice Note] Update recorded via WhatsApp";
          } else {
            const transcription = await openai.audio.transcriptions.create({
              file: new File([buffer], "audio.ogg", { type: mimeType || 'audio/ogg' }),
              model: "whisper-1",
            });
            console.log('✅ Transcribed:', transcription.text);
            voiceText = transcription.text;
          }

          await saveDraft(from, { voice_note: voiceText });
          return await sendWhatsappText(
            from,
            `✅ *Voice note received & saved!* 🎙️\n\n_Transcribed: ${voiceText.length > 80 ? voiceText.substring(0, 80) + '...' : voiceText}_\n\nNow type *POST* to generate your GMB post.`,
            to
          );
        } catch (err) {
          console.error("❌ Whisper Transcription Failed:", err);
          await saveDraft(from, { voice_note: "[Voice note transcription failed]" });
          return await sendWhatsappText(from, `⚠️ *Voice note saved but couldn't transcribe.*\n\nPlease send a short text description instead, then type *POST*.`, to);
        }
      } else {
        // Image/Document/Video received — resolve the actual download URL from Meta
        console.log('📸 Received media, type:', messageType, 'media ID:', mediaId);

        let resolvedImageUrl = downloadUrl; // fallback to Graph API endpoint
        try {
          const mediaInfoRes = await fetch(`https://graph.facebook.com/v22.0/${mediaId}?phone_number_id=${META_PHONE_NUMBER_ID}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (mediaInfoRes.ok) {
            const mediaInfo = await mediaInfoRes.json();
            resolvedImageUrl = mediaInfo.url || downloadUrl;
            console.log('✅ Resolved media URL:', resolvedImageUrl.substring(0, 80));
          } else {
            console.warn('⚠️ Failed to resolve media URL, using Graph API endpoint:', mediaInfoRes.status);
          }
        } catch (err) {
          console.warn('⚠️ Media URL resolution failed, using Graph API endpoint:', err);
        }

        try {
          await saveDraft(from, { imageUrl: resolvedImageUrl });

          // Get current image count
          const { data: draft } = await supabase
            .from('pending_posts')
            .select('images')
            .eq('user_phone', from)
            .eq('status', 'draft')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          const imageCount = draft?.images?.length || 1;

          return await sendWhatsappText(
            from,
            `✅ *Image received & saved!* 📸 (${imageCount} photo${imageCount !== 1 ? 's' : ''} saved in gallery)\n\n_Send a short description or voice note, then type *POST* to generate your post._`,
            to
          );
        } catch (err) {
          console.error('❌ Image save/send failed:', err);
          return await sendWhatsappText(
            from,
            `⚠️ Image was received but there was an issue saving it. Please try sending again.`,
            to
          );
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Text that's not a command: save as description
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (body && !body.match(/(\+?\d{10,15})/)) {
      await saveDraft(from, { voice_note: body });

      // Check if there are already images waiting
      const { data: existingDraft } = await supabase
        .from('pending_posts')
        .select('images')
        .eq('user_phone', from)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const hasImages = existingDraft?.images?.length > 0;
      if (hasImages) {
        return await sendWhatsappText(
          from,
          `✅ *Description saved!* ✍️\n\nNow type *POST* to generate your GMB post with your photos & description.`,
          to
        );
      }
      return await sendWhatsappText(
        from,
        `✅ *Description saved!* ✍️\n\n_Send photos or a voice note, then type *POST* to generate._`,
        to
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Fallback: nothing meaningful received — silent (don't encourage
    // irrelevant chat)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(`🔇 [${requestId}] No action taken for sender ${senderPhone} (nothing to process).`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    // Surface the FULL error so failures are never silent:
    console.error(`❌ [${requestId}] Webhook Error (sender: ${senderPhone}):`, error?.message || error);
    console.error('   Stack:', error?.stack || '(no stack)');
    if (webhookData) {
      console.error('   Payload snapshot:', JSON.stringify(webhookData).substring(0, 500));
    }

    // Best-effort: let the sender know something went wrong instead of leaving them in silence
    if (senderPhone) {
      try {
        await sendMetaText({
          to: senderPhone,
          body: '⚠️ Something went wrong while processing your message. Please try again or contact support.',
        });
        console.log(`✅ [${requestId}] Notified sender ${senderPhone} about the failure.`);
      } catch (notifyErr: any) {
        console.error(`❌ [${requestId}] Could not notify sender (send failed too):`, notifyErr?.message || notifyErr);
      }
    }

    // Always return 200 to Meta to prevent retry loops
    return NextResponse.json({ status: 'ok' });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// User lookup helper (cached)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function getUserIdByPhone(phone: string): Promise<string | null> {
  // Check cache first
  const cached = userIdCache.get(phone);
  if (cached !== undefined) return cached;

  // Look up user by phone
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (userData?.id) {
    userIdCache.set(phone, userData.id);
    return userData.id;
  }

  // Fallback: try matching on metadata too
  const { data: authUser } = await supabase
    .from('users')
    .select('id')
    .or(`phone.eq.${phone},raw_user_meta_data->>phone.eq.${phone}`)
    .maybeSingle();

  if (authUser?.id) {
    userIdCache.set(phone, authUser.id);
    return authUser.id;
  }

  userIdCache.set(phone, null);
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Draft persistence helper
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function saveDraft(phone: string, data: any): Promise<string> {
  // Resolve user_id for quota tracking
  const userId = await getUserIdByPhone(phone);

  // 1. Look for active draft first
  let { data: existing } = await supabase
    .from('pending_posts')
    .select('id, images, customer_phone, status')
    .eq('user_phone', phone)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. If no active draft, check for a recently generated post that hasn't been published yet (within last 2 hours)
  if (!existing && (data.customerName || data.customerPhone)) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: generated } = await supabase
      .from('pending_posts')
      .select('id, images, customer_phone, status')
      .eq('user_phone', phone)
      .eq('status', 'generated')
      .gt('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (generated) {
      existing = generated;
    }
  }

  const targetStatus = existing ? existing.status : 'draft';

  if (data.customerName) {
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        user_id: userId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        images: [],
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        user_id: userId
      }).eq('id', existing.id);
    }
  }

  // Save voice_note (job details/description)
  if (data.voice_note) {
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        user_id: userId,
        voice_note: data.voice_note,
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({
        voice_note: data.voice_note,
        user_id: userId
      }).eq('id', existing.id);
    }
  }

  // Save image URL
  if (data.imageUrl) {
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        user_id: userId,
        images: [data.imageUrl],
        status: 'draft'
      });
    } else {
      const currentImages = existing.images || [];
      await supabase.from('pending_posts').update({
        images: [...currentImages, data.imageUrl],
        user_id: userId
      }).eq('id', existing.id);
    }
  }

  return targetStatus;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Post generation workflow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function handleGeneratePost(phone: string, fromNumber?: string) {
  try {
    console.log('🔍 Fetching draft for:', phone);

    const { data: draft, error: fetchError } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('user_phone', phone)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !draft) {
      console.error('❌ Database fetch error:', fetchError);
      return await sendWhatsappText(phone, "⚠️ *No active draft found.*\n\nSend details or photos first, then type *POST*.", fromNumber);
    }

    if (!draft.images?.length) {
      return await sendWhatsappText(phone, "⚠️ *No images found.*\n\nSend photos first, then type *POST*.", fromNumber);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Plan Quota Check: posts from WhatsApp + web dashboard count together
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const userIdForQuota = await getUserIdByPhone(phone);
    if (userIdForQuota) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('selected_plan, plan_started_at, trial_started_at, created_at')
          .eq('id', userIdForQuota)
          .maybeSingle();

        const planTier = profileData?.selected_plan || 'free';
        const quota = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
        const cycleStartIso = getCycleStartIso(profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at);
        const usage = await countUserPosts(userIdForQuota, phone, cycleStartIso);

        if (quota.totalPosts !== -1 && usage.total >= quota.totalPosts) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Post limit reached.*\n\nYour ${planTier} plan allows ${quota.totalPosts} posts per month. Upgrade to continue posting.`,
            fromNumber
          );
        }

        if (quota.dailyPosts > 0 && usage.daily >= quota.dailyPosts) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Daily post limit reached.*\n\nYour ${planTier} plan allows ${quota.dailyPosts} post${quota.dailyPosts !== 1 ? 's' : ''} per day. Try again tomorrow.`,
            fromNumber
          );
        }
      } catch (quotaErr) {
        console.warn('⚠️ Could not check post quota:', quotaErr);
        // Soft check: continue even if quota lookup fails
      }
    }

    console.log('📊 Found draft with', draft.images.length, 'images. Generating post...');

    // AI Generation — strict prompt to prevent hallucination
    const jobDescription = draft.voice_note || 'Completed successfully';
    const aiResponse = await openai.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      messages: [{
        role: "system",
        content: "You are a Google Business Profile post writer. Write a short, factual post based ONLY on the job details provided. NEVER invent products, services, locations, or business names that are not mentioned in the input. If you don't know a detail, leave it out. Do not make up prices, materials, or product descriptions. Only describe what was actually done."
      },
      {
        role: "user",
        content: `Business: ${draft.customer_name || 'Local Business'}\nJob completed: ${jobDescription}\n\nCreate a Google Business Profile post about this specific job. Format:\nHEADLINE: (max 40 chars, based on the actual job)\nBODY: (max 250 chars, describe only what was done)\nCTA: (short call to action)\nHASHTAGS: (3 max, relevant to the trade)`
      }]
    });

    const postContent = aiResponse.choices[0].message.content || '';
    const parsed = parsePostContent(postContent);

    console.log('🤖 AI Generated:', parsed.headline);

    // Save generated content to database
    await supabase.from('pending_posts').update({
      google_post: postContent,
      status: 'generated'
    }).eq('id', draft.id);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Send Images as WhatsApp media (user saves directly to gallery)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const imagesToSend = draft.images.slice(0, 5);
    const uploadedMediaIds: string[] = [];

    for (let i = 0; i < imagesToSend.length; i++) {
      try {
        const imageUrl = imagesToSend[i];

        // If it's a graph.facebook.com URL, we need to download and re-upload to get a stable media ID
        if (imageUrl.includes('graph.facebook.com')) {
          const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || '';
          const imageResponse = await fetch(imageUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }

          const blob = await imageResponse.blob();
          const formData = new FormData();
          formData.append('file', blob, `photo-${i + 1}.jpg`);
          formData.append('messaging_product', 'whatsapp');
          formData.append('type', 'image');

          const uploadResponse = await fetch(
            `https://graph.facebook.com/v22.0/${getPhoneNumberId()}/messages`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${getAccessToken()}` },
              body: formData
            }
          );

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image: ${uploadResponse.status}`);
          }

          const uploadData: any = await uploadResponse.json();
          if (!uploadData.messages || !uploadData.messages[0]?.id) {
            throw new Error('Upload response missing message ID');
          }

          uploadedMediaIds.push(uploadData.messages[0].id);

          // Send the uploaded media
          await sendMetaMedia({
            to: phone,
            mediaUrl: `https://graph.facebook.com/v22.0/${uploadData.messages[0].id}`,
            caption: `📸 Photo ${i + 1}/${imagesToSend.length}`,
            mediaType: "image"
          });
        } else {
          // For non-graph URLs, send directly
          await sendWhatsappMedia(phone, imageUrl, `📸 Photo ${i + 1}/${imagesToSend.length}`, fromNumber);
          uploadedMediaIds.push(imageUrl);
        }
      } catch (mediaError) {
        console.error('❌ Media send error:', mediaError);
        // Continue with next image
      }
    }

    // Notice about images download
    await sendWhatsappText(phone, `📸 *Photos are sent above. Tap and save them directly to your phone's gallery!*`, fromNumber);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Send the COMPLETE post text directly on WhatsApp so the trader can
    // long-press → copy right from the chat (no extra tabs / links).
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const headline = parsed.headline || draft.customer_name || '';
    const bodyText = parsed.body || draft.voice_note || '';
    const cta = parsed.cta || '';
    const hashtags = parsed.hashtags || '';

    // One clean, copy-paste-ready block (no labels, no markdown noise)
    const cleanPost = buildCleanPost(headline, bodyText, cta, hashtags);

    const postTextMessage = `✅ *Post Ready — copy the text below:*

${cleanPost}

(Then open Google below, paste & publish)`;

    await sendWhatsappText(phone, postTextMessage, fromNumber);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Resolve & Send GBP Link directly on WhatsApp
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let gbpLink = 'https://business.google.com/';
    try {
      const { data: business } = await supabase
        .from('business_profiles')
        .select('business_name, google_place_id')
        .eq('user_phone', phone)
        .maybeSingle();

      if (business) {
        if (business.business_name) {
          gbpLink = `https://www.google.com/search?q=${encodeURIComponent(business.business_name)}`;
        } else if (business.google_place_id) {
          gbpLink = `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`;
        }
      }
    } catch (dbErr) {
      console.warn('⚠️ Could not fetch GBP link:', dbErr);
    }

    const gbpMessage = `🌐 *Open GBP directly to paste & publish:*
${gbpLink}

(Paste the copied text above and select the saved photos)`;
    await sendWhatsappText(phone, gbpMessage, fromNumber);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Quick links: download images + open Google (no "Copy Post" link —
    // the full post text was already sent above for direct copy).
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const appUrl = 'https://www.neerzy.com';

    const actionMessage = `🖼️ *Download Images (save to your phone):*

${appUrl}/images/${draft.id}

🌐 *Open Google to publish:*

${gbpLink}

📌 *Steps:* copy the text above → paste on Google → add the saved photos → publish.
Type *DONE* when published.`;

    return await sendWhatsappText(phone, actionMessage, fromNumber);

  } catch (error: any) {
    console.error('❌ handleGeneratePost error:', error);
    return await sendWhatsappText(phone, `❌ Error: ${error.message}\n\nPlease try again.`, fromNumber);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Review-request workflow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function handleSendReview(phone: string, fromNumber?: string) {
  try {
    // 1. Try to find the last generated post WITH customer_phone
    const { data: generatedPostWithCustomer } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('user_phone', phone)
      .eq('status', 'generated')
      .not('customer_phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Try to find the last draft post that has customer details
    const { data: draftPostWithCustomer } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('user_phone', phone)
      .eq('status', 'draft')
      .not('customer_phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Also check for generated posts WITHOUT customer_phone (lower priority)
    const { data: generatedPostAny } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('user_phone', phone)
      .eq('status', 'generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Prefer posts that have customer_phone — this is critical to avoid sending to the trader
    let post = null;
    if (generatedPostWithCustomer && draftPostWithCustomer) {
      const genTime = new Date(generatedPostWithCustomer.created_at).getTime();
      const draftTime = new Date(draftPostWithCustomer.created_at).getTime();
      post = genTime >= draftTime ? generatedPostWithCustomer : draftPostWithCustomer;
    } else {
      post = generatedPostWithCustomer || draftPostWithCustomer;
    }

    if (!post) {
      post = generatedPostAny;
    }

    if (!post) {
      return await sendWhatsappText(phone, "⚠️ *No pending generated post or review draft found.*", fromNumber);
    }

    // ⛔ CRITICAL: Ensure we have a customer phone — NEVER fall back to the trader's phone
    if (!post.customer_phone) {
      console.warn(`⚠️ Post ${post.id} has no customer_phone. Trader phone: ${phone}. NOT sending review to trader.`);
      return await sendWhatsappText(
        phone,
        "⚠️ *No customer phone number found.*\n\nPlease send the customer's name and phone number first.\n\nExample: _Amjad +923711291617_",
        fromNumber
      );
    }

    // 🔍 Find the review link — try sender phone first, then fallback to any business profile
    let reviewLink = '';
    let business: any = null;
    try {
      const { data: exactBusiness } = await supabase
        .from('business_profiles')
        .select('review_link, google_place_id, business_name')
        .eq('user_phone', phone)
        .maybeSingle();

      business = exactBusiness;

      if (!business) {
        const { data: anyBusiness } = await supabase
          .from('business_profiles')
          .select('review_link, google_place_id, business_name')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        business = anyBusiness;
      }

      if (business?.review_link) {
        reviewLink = business.review_link;
      } else if (business?.google_place_id) {
        reviewLink = `https://search.google.com/local/writereview?placeid=${business.google_place_id}`;
      }
      console.log(`✅ Review link: "${reviewLink}"`);
    } catch (dbError) {
      console.warn('⚠️ Failed to load review link:', dbError);
    }

    if (!reviewLink) {
      return await sendWhatsappText(phone, "⚠️ *No Google Business Profile connected.* Please connect your GBP first at https://www.neerzy.com/onboarding", fromNumber);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Soft Plan-Quota Check: block sending if trader has hit their plan limits
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const userIdForPublish = await getUserIdByPhone(phone);
    if (userIdForPublish) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('selected_plan, plan_started_at, trial_started_at, created_at')
          .eq('id', userIdForPublish)
          .maybeSingle();

        const planTier = profileData?.selected_plan || 'free';
        const quota = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
        const cycleStartIso = getCycleStartIso(profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at);

        // Check total quota for the current 30-day cycle
        if (quota.totalReviewRequests !== -1) {
          const { count: sentTotal } = await supabase
            .from('review_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userIdForPublish)
            .gte('sent_at', cycleStartIso);

          if (sentTotal !== null && sentTotal >= quota.totalReviewRequests) {
            return await sendWhatsappText(
              phone,
              `⚠️ *Review request limit reached.*\n\nYour ${planTier} plan allows ${quota.totalReviewRequests} review requests per month. Upgrade to send more.`,
              fromNumber
            );
          }
        }

        // Check daily quota
        if (quota.dailyReviewRequests !== -1) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { count: sentToday } = await supabase
            .from('review_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userIdForPublish)
            .gte('sent_at', todayStart.toISOString());

          if (sentToday !== null && sentToday >= quota.dailyReviewRequests) {
            return await sendWhatsappText(
              phone,
              `⚠️ *Daily review limit reached.*\n\nYour ${planTier} plan allows ${quota.dailyReviewRequests} review requests per day. Try again tomorrow.`,
              fromNumber
            );
          }
        }
      } catch (quotaErr) {
        console.warn('⚠️ Could not check review quota:', quotaErr);
        // Soft check: continue even if quota lookup fails
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Send Review Request to the CUSTOMER (never the trader)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const businessName = business?.business_name || 'Your Connected Business';
    const targetCustomerPhone = formatToE164(post.customer_phone, phone);
    const customerName = (post.customer_name || 'Customer').replace(/[\n\r]+/g, ' ').trim();

    // Final safety check: never send review link to the trader's own number
    const cleanCustomerPhone = targetCustomerPhone.replace(/\D/g, '');
    const cleanMerchantPhone = phone.replace(/\D/g, '');
    const isSelfSend = cleanCustomerPhone === cleanMerchantPhone || (cleanCustomerPhone.length >= 8 && cleanMerchantPhone.endsWith(cleanCustomerPhone.slice(-8)));

    if (isSelfSend) {
      console.warn(`⚠️ Customer phone ${targetCustomerPhone} matches trader phone ${phone}. Blocking self-send.`);
      return await sendWhatsappText(
        phone,
        "⚠️ *The customer phone number matches your own number.*\n\nPlease send the correct customer's name and phone number.\n\nExample: _Amjad +923711291617_",
        fromNumber
      );
    }

    console.log(`📤 Sending review link to CUSTOMER: ${customerName} at ${targetCustomerPhone} (trader: ${phone})`);

    let messageSentVia = 'whatsapp';
    let messageSuccess = false;

    try {
      // Step 1: Try approved template first
      const templateName = process.env.META_TEMPLATE_REVIEW_REQUEST || 'review_request';
      const templateResult = await sendMetaTemplate({
        to: targetCustomerPhone,
        templateName,
        languageCode: "en_US",
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: customerName },
            { type: "text", text: businessName },
            { type: "text", text: reviewLink },
          ]
        }],
      });
      console.log('✅ Review request TEMPLATE sent! Message ID:', templateResult.messages?.[0]?.id);
      messageSentVia = 'whatsapp_template';
      messageSuccess = true;

    } catch (templateError: any) {
      console.error('❌ Template failed:', templateError.message);
      console.error('   This usually means template is not approved yet in Meta Business Manager.');

      // Step 2: FALLBACK - Send free-form text within 24h window
      console.log('📩 FALLBACK: Attempting free-form WhatsApp message...');
      try {
        const fallbackText = `Hi ${customerName}! 👋\n\nThank you for choosing ${businessName}! We'd really appreciate it if you could leave us a quick review.\n\n🔗 Review link: ${reviewLink}\n\nIt helps us grow! 🙏`;

        const fallbackResult = await sendMetaText({
          to: targetCustomerPhone,
          body: fallbackText
        });

        console.log('✅ FALLBACK MESSAGE SENT successfully! Message ID:', fallbackResult.messages?.[0]?.id);
        console.log(`💡 Note: Free-form messages work when customers contacted you within last 24 hours.`);
        messageSentVia = 'whatsapp_fallback';
        messageSuccess = true;

      } catch (fallbackError: any) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        console.error('   Both delivery methods failed. Check your Meta access token and phone number.');
        messageSuccess = false;
      }
    }

    if (!messageSuccess) {
      throw new Error('Failed to send WhatsApp review request via any method');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Insert review_requests row for dashboard tracking/stats
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      const messageText = `Hi ${customerName}! 👋\n\nThank you for choosing ${businessName}! We'd really appreciate it if you could leave us a quick review. It helps us grow!\n\n🔗 Review link: ${reviewLink}`;
      const businessId = business?.id || null;
      const { error: insertErr } = await supabase.from('review_requests').insert({
        user_id: userIdForPublish || null,
        business_id: businessId,
        customer_name: customerName,
        customer_phone: targetCustomerPhone,
        message_text: messageText,
        review_link: reviewLink,
        status: 'sent',
        sent_via: messageSentVia,
        sent_at: new Date().toISOString(),
      });
      if (insertErr) {
        console.error('⚠️ Failed to insert review_requests row:', insertErr);
      } else {
        console.log(`📝 Inserted review_requests row for ${customerName} (user: ${userIdForPublish || 'unknown'}) via ${messageSentVia}`);
      }
    } catch (insertErr) {
      console.error('⚠️ Failed to insert review_requests row:', insertErr);
    }

    // Now mark post as published — only after successful send + logging
    await supabase.from('pending_posts').update({
      status: 'published',
      user_id: userIdForPublish
    }).eq('id', post.id);

    // Always send confirmation to the trader since we verified it's a real customer
    const customerCC = extractCountryCode(targetCustomerPhone);
    const customerFlag = getCountryFlag(customerCC);
    const confirmMessage = `✅ *Review request sent to ${customerName}!*\n\n📱 Sent to: ${customerFlag} ${targetCustomerPhone}\n🔗 Here is the review link:\n\n${reviewLink}\n\n_Your customer received the review request via WhatsApp._\n_Done! Workflow complete._ ✅`;
    await sendWhatsappText(phone, confirmMessage, fromNumber);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ handleSendReview error:', error);
    return await sendWhatsappText(phone, `❌ Error: ${error.message}`, fromNumber);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Async processing wrappers (prevent webhook timeouts)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function processPostWorkflow(phone: string, fromNumber?: string) {
  try {
    await handleGeneratePost(phone, fromNumber);
  } catch (error) {
    console.error('❌ Async post workflow failed:', error);
  }
}

async function processReviewWorkflow(phone: string, fromNumber?: string) {
  try {
    await handleSendReview(phone, fromNumber);
  } catch (error) {
    console.error('❌ Async review workflow failed:', error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Meta send helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function sendWhatsappText(to: string, text: string, _fromNumber?: string) {
  try {
    const result = await sendMetaText({ to, body: text });
    console.log('✅ Meta WhatsApp text sent! ID:', result.messages?.[0]?.id);
    return NextResponse.json({ success: true, id: result.messages?.[0]?.id });
  } catch (error: any) {
    console.error(`❌ sendWhatsappText error (to ${to}):`, error?.message || error);
    throw error;
  }
}

async function sendWhatsappTemplate(to: string, templateName: string, vars: any, _fromNumber?: string) {
  try {
    // Convert Twilio-style vars {"1":"val1","2":"val2"} → Meta-style components
    const parameters = Object.entries(vars || {}).map(([, value]) => ({
      type: "text" as const,
      text: String(value),
    }));
    const result = await sendMetaTemplate({
      to,
      templateName,
      languageCode: "en_US",
      components: parameters.length > 0 ? [{ type: "body", parameters }] : [],
    });
    console.log('✅ Meta WhatsApp template sent! ID:', result.messages?.[0]?.id);
  } catch (error: any) {
    console.error('❌ sendWhatsappTemplate error:', error.message);
    throw error;
  }
}

async function sendWhatsappMedia(to: string, url: string, caption: string, _fromNumber?: string) {
  try {
    const result = await sendMetaMedia({ to, mediaUrl: url, caption, mediaType: "image" });
    console.log('✅ Meta WhatsApp media sent! ID:', result.messages?.[0]?.id);
  } catch (error: any) {
    console.error('❌ sendWhatsappMedia error:', error.message);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Parsing helpers — shared via @/lib/post-parser (used by the
// WhatsApp webhook, dashboard generate API, and dashboard view)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Country Code → Flag Emoji Helper (calling-code based)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getCountryFlag(countryCode: string): string {
  const flagMap: Record<string, string> = {
    '1': '🇺🇸', '20': '🇪🇬', '27': '🇿🇦', '30': '🇬🇷', '31': '🇳🇱', '32': '🇧🇪',
    '33': '🇫🇷', '34': '🇪🇸', '36': '🇭🇺', '39': '🇮🇹', '40': '🇷🇴', '41': '🇨🇭',
    '43': '🇦🇹', '44': '🇬🇧', '45': '🇩🇰', '46': '🇸🇪', '47': '🇳🇴', '48': '🇵🇱',
    '49': '🇩🇪', '51': '🇵🇪', '52': '🇲🇽', '54': '🇦🇷', '55': '🇧🇷', '56': '🇨🇱',
    '57': '🇨🇴', '58': '🇻🇪', '60': '🇲🇾', '61': '🇦🇺', '62': '🇮🇩', '63': '🇵🇭',
    '64': '🇳🇿', '65': '🇸🇬', '66': '🇹🇭', '81': '🇯🇵', '82': '🇰🇷', '84': '🇻🇳',
    '86': '🇨🇳', '90': '🇹🇷', '91': '🇮🇳', '92': '🇵🇰', '93': '🇦🇫', '94': '🇱🇰',
    '95': '🇲🇲', '98': '🇮🇷', '212': '🇲🇦', '213': '🇩🇿', '216': '🇹🇳', '218': '🇱🇾',
    '220': '🇬🇲', '221': '🇸🇳', '222': '🇲🇷', '223': '🇲🇱', '224': '🇬🇳', '225': '🇨🇮',
    '226': '🇧🇫', '227': '🇳🇪', '228': '🇹🇬', '229': '🇧🇯', '230': '🇲🇺', '231': '🇱🇷',
    '232': '🇸🇱', '233': '🇬🇭', '234': '🇳🇬', '235': '🇹🇩', '236': '🇨🇫', '237': '🇨🇲',
    '238': '🇨🇻', '239': '🇸🇹', '240': '🇬🇶', '241': '🇬🇦', '242': '🇨🇬', '243': '🇨🇩',
    '244': '🇦🇴', '245': '🇬🇼', '246': '🇮🇴', '248': '🇸🇨', '249': '🇸🇩', '250': '🇷🇼',
    '251': '🇪🇹', '252': '🇸🇴', '253': '🇩🇯', '254': '🇰🇪', '255': '🇹🇿', '256': '🇺🇬',
    '257': '🇧🇮', '258': '🇲🇿', '260': '🇿🇲', '261': '🇲🇬', '262': '🇷🇪', '263': '🇿🇼',
    '264': '🇳🇦', '265': '🇲🇼', '266': '🇱🇸', '267': '🇧🇼', '268': '🇸🇿', '269': '🇰🇲',
    '291': '🇪🇷', '297': '🇦🇼', '298': '🇫🇴', '299': '🇬🇱', '350': '🇬🇮', '351': '🇵🇹',
    '352': '🇱🇺', '353': '🇮🇪', '354': '🇮🇸', '355': '🇦🇱', '356': '🇲🇹', '357': '🇨🇾',
    '358': '🇫🇮', '359': '🇧🇬', '370': '🇱🇹', '371': '🇱🇻', '372': '🇪🇪', '373': '🇲🇩',
    '374': '🇦🇲', '375': '🇧🇾', '376': '🇦🇩', '377': '🇲🇨', '378': '🇸🇲', '380': '🇺🇦',
    '381': '🇷🇸', '382': '🇲🇪', '383': '🇽🇰', '385': '🇭🇷', '386': '🇸🇮', '387': '🇧🇦',
    '389': '🇲🇰', '420': '🇨🇿', '421': '🇸🇰', '423': '🇱🇮', '500': '🇫🇰', '501': '🇧🇿',
    '502': '🇬🇹', '503': '🇸🇻', '504': '🇭🇳', '505': '🇳🇮', '506': '🇨🇷', '507': '🇵🇦',
    '509': '🇭🇹', '591': '🇧🇴', '592': '🇬🇾', '593': '🇪🇨', '594': '🇬🇫', '595': '🇵🇾',
    '597': '🇸🇷', '598': '🇺🇾', '599': '🇨🇼', '672': '🇦🇶', '673': '🇧🇳', '674': '🇳🇷',
    '675': '🇵🇬', '676': '🇹🇴', '677': '🇸🇧', '678': '🇻🇺', '679': '🇫🇯', '680': '🇵🇼',
    '681': '🇼🇫', '682': '🇨🇰', '685': '🇼🇸', '686': '🇰🇮', '687': '🇳🇨', '688': '🇹🇻',
    '689': '🇵🇫', '690': '🇹🇰', '691': '🇫🇲', '692': '🇲🇭', '850': '🇰🇵', '852': '🇭🇰',
    '853': '🇲🇴', '855': '🇰🇭', '856': '🇱🇦', '880': '🇧🇩', '886': '🇹🇼', '960': '🇲🇻',
    '961': '🇱🇧', '962': '🇯🇴', '963': '🇸🇾', '964': '🇮🇶', '965': '🇰🇼', '966': '🇸🇦',
    '967': '🇾🇪', '968': '🇴🇲', '970': '🇵🇸', '971': '🇦🇪', '972': '🇮🇱', '973': '🇧🇭',
    '974': '🇶🇦', '975': '🇧🇹', '976': '🇲🇳', '977': '🇳🇵', '992': '🇹🇯', '993': '🇹🇲',
    '994': '🇦🇿', '995': '🇬🇪', '996': '🇰🇬', '998': '🇺🇿',
  };
  return flagMap[countryCode] || '🌍';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get country calling-code from an E.164 number for flag display
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractCountryCode(e164Phone: string): string {
  if (!e164Phone.startsWith('+')) return '';
  const digits = e164Phone.replace(/\D/g, '');
  const threeDigit = digits.substring(0, 3);
  const twoDigit = digits.substring(0, 2);
  const oneDigit = digits.substring(0, 1);

  const threeDigitCodes = ['212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '291', '297', '298', '299', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500', '501', '502', '503', '504', '505', '506', '507', '509', '591', '592', '593', '594', '595', '597', '598', '599', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '992', '993', '994', '995', '996', '998'];
  if (threeDigitCodes.includes(threeDigit)) return threeDigit;

  const twoDigitCodes = ['20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98'];
  if (twoDigitCodes.includes(twoDigit)) return twoDigit;

  if (['1', '7'].includes(oneDigit)) return oneDigit;

  return twoDigit; // fallback guess
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Normalize a locally-entered phone number to E.164
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function formatToE164(rawPhone: string, merchantPhone: string): string {
  // Clean all non-digit characters except leading +
  let cleaned = rawPhone.replace(/[^\d+]/g, '');

  // If already has +, assume it's E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Known country codes (ordered longest-first for correct matching)
  const knownCountryCodes = [
    '971', '966', '965', '964', '963', '962', '961', '960',
    '994', '993', '992',
    '977', '975', '974', '973',
    '880',
    '94',
    '92',
    '91',
    '90',
    '86',
    '82',
    '81',
    '66',
    '65',
    '63',
    '62',
    '61',
    '60',
    '55',
    '49',
    '48',
    '47',
    '46',
    '45',
    '44',
    '43',
    '41',
    '39',
    '34',
    '33',
    '31',
    '27',
    '20',
    '1',
  ];

  // Extract merchant's country code using known codes table
  let merchantCountryCode = '92'; // default to Pakistan
  if (merchantPhone.startsWith('+')) {
    const merchantDigits = merchantPhone.replace(/\D/g, '');
    for (const cc of knownCountryCodes) {
      if (merchantDigits.startsWith(cc)) {
        merchantCountryCode = cc;
        break;
      }
    }
  }

  // Handle leading 0 (common in local dialing: 0300... in PK, 07... in UK, etc.)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If the cleaned number already starts with the country code, just add +
  if (cleaned.startsWith(merchantCountryCode)) {
    if (merchantCountryCode === '92' && cleaned.length !== 12) {
      if (cleaned.length > 12) {
        return `+${merchantCountryCode}${cleaned}`;
      }
    }
    return `+${cleaned}`;
  }

  // Otherwise, prepend the merchant's country code
  const result = `+${merchantCountryCode}${cleaned}`;

  console.log(`📱 formatToE164: "${rawPhone}" → "${result}" (country code: ${merchantCountryCode}, merchant: ${merchantPhone})`);

  return result;
}