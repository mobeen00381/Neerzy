import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { createClient } from '@supabase/supabase-js';
import { sendMetaText, sendMetaTemplate, sendMetaMedia, getPhoneNumberId, getAccessToken } from '@/lib/whatsapp';
import { getTranscriptionClient, DEFAULT_ASR_MODEL, ASR_MAX_SECONDS, chatWithFallback } from '@/lib/openai';
import { estimateAudioSeconds } from '@/lib/audio-duration';
import { convertOggOpusToWav } from '@/lib/audio-convert';
import { PLAN_LIMITS, getCycleStartIso, getRemainingDays } from '@/lib/plans';
import { parsePostContent, buildCleanPost } from '@/lib/post-parser';
import { generateSocialContent } from '@/lib/social-content';
import { buildPostPrompt, isUsableJobDescription, type PostPromptContext } from '@/lib/post-prompt';
import { countUserPosts } from '@/lib/post-usage';
import { getAgencyByClientPhone, getAgencyClientPhones, countAgencyTraderPosts, countAgencyPoolPosts, countAgencyTraderReviews, countAgencyPoolReviews, AGENCY_TRADER, AGENCY_POOL } from '@/lib/agency';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const META_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1256240127573258';
const META_VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN || 'neerzy_webhook_verify_2024';

// GLM-ASR (Z.AI) only accepts .wav/.mp3 — uploading anything else is a guaranteed
// 400 (code 1214, "file format not supported"). When the OGG→WAV pre-decode fails
// we throw this so the catch block logs the true cause instead of blaming GLM-ASR.
class VoiceNoteConversionError extends Error {
  constructor(detail: string) {
    super(`OGG→WAV conversion failed (${detail}) — GLM-ASR upload skipped`);
    this.name = 'VoiceNoteConversionError';
  }
}

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
    const statuses = value?.statuses;

    // Delivery status updates (sent / delivered / read / failed) arrive as
    // value.statuses[]. Correlate them to review_requests via meta_message_id
    // and reflect real delivery state (previously these were silently dropped,
    // so traders were told requests were "received" even when they failed).
    if (statuses && statuses.length) {
      console.log(`📥 [${requestId}] Received ${statuses.length} delivery status update(s)`);
      try {
        for (const status of statuses) {
          await handleMetaDeliveryStatus(status, requestId);
        }
      } catch (statusErr) {
        // Never throw on status processing — Meta expects 200 to stop retries.
        console.error(`❌ [${requestId}] Delivery status handler error:`, statusErr);
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Ignore other non-message events (anything without messages or statuses)
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

    // `to` was the business number in the legacy flow — now unused (Meta uses phone number ID), keep as null for compat
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
        // Keep processing after the response via waitUntil (Vercel)
        waitUntil(processPostWorkflow(from, undefined));
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
        // Keep processing after the response via waitUntil (Vercel)
        waitUntil(processReviewWorkflow(from, undefined));
        return NextResponse.json({ status: 'processing' });
      }

      // WhatsApp connection: "CONNECT:<userId>" links the sender's number to the
      // user's account so trial/quota checks can run on WhatsApp flows.
      const connectMatch = body.match(/CONNECT[:=]\s*([0-9a-fA-F-]{36})/);
      if (connectMatch && connectMatch[1]) {
        try {
          const userId = connectMatch[1];
          // Store the sender's number in a consistent +<digits> format so
          // lookups and unique constraints always see the same string.
          const digitsOnly = from.replace(/\D/g, '').replace(/^00/, '');
          const normalizedPhone = `+${digitsOnly}`;

          // Guard against stale CONNECT links: verify the auth account still
          // exists before writing a profile row (FK: profiles.id → auth.users).
          let authUserData: { created_at?: string } | null = null;
          try {
            const { data: authUser, error: authErr } = await (supabase.auth.admin as any).getUserById(userId);
            if (authErr) {
              console.error('❌ connect getUserById error:', authErr.message);
            }
            authUserData = authUser?.user ?? null;
          } catch (authErr) {
            console.error('❌ connect getUserById threw:', authErr);
          }
          if (!authUserData) {
            return await sendWhatsappText(
              from,
              '⚠️ Your Neerzy session has changed. Please open the Neerzy dashboard, log in again, and tap "Connect with WhatsApp".',
              undefined
            );
          }

          // Re-bind this phone: clear it from any other profile row (stale
          // links from earlier accounts or different number formats).
          const { error: clearErr } = await supabase
            .from('profiles')
            .update({ phone: null, updated_at: new Date().toISOString() })
            .neq('id', userId)
            .or(`phone.eq.${normalizedPhone},phone.eq.${digitsOnly},phone.eq.${from}`);
          if (clearErr) {
            console.warn('⚠️ connect phone re-bind clear failed, trying delete:', clearErr.message);
            await supabase
              .from('profiles')
              .delete()
              .neq('id', userId)
              .or(`phone.eq.${normalizedPhone},phone.eq.${digitsOnly},phone.eq.${from}`);
          }

          // Fetch existing profile so we never reset a one-time trial.
          // If the query errors (e.g., trial_started_at column missing in this
          // project), we treat the profile as unknown and skip trial anchoring.
          const { data: existingProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('id, trial_started_at')
            .eq('id', userId)
            .maybeSingle();

          const upsertPayload: Record<string, any> = {
            id: userId,
            phone: normalizedPhone,
            gbp_connected: true,
            updated_at: new Date().toISOString(),
          };

          // If no profile row exists yet (Google/email signups have none),
          // anchor the trial to the auth account's creation date instead of
          // NOW(), so an old account doesn't get a fresh 30-day trial.
          if (!profileErr && !existingProfile) {
            upsertPayload.trial_started_at = authUserData.created_at || new Date().toISOString();
          }

          const { error: linkErr } = await supabase.from('profiles').upsert(upsertPayload, { onConflict: 'id' });
          if (linkErr) {
            console.error('❌ connect upsert failed:', linkErr.code, linkErr.message);
            // Retry with a minimal payload (no trial columns) so the WhatsApp
            // number still gets linked even if the schema is missing columns.
            const { error: retryErr } = await supabase
              .from('profiles')
              .upsert(
                { id: userId, phone: normalizedPhone, gbp_connected: true, updated_at: new Date().toISOString() },
                { onConflict: 'id' }
              );
            if (retryErr) {
              console.error('❌ connect minimal upsert failed:', retryErr.code, retryErr.message);
              const errTag = retryErr.code ? ` (DB error ${retryErr.code})` : '';
              return await sendWhatsappText(
                from,
                `⚠️ Could not link your WhatsApp number to your account.${errTag} Please try again or contact support.`,
                undefined
              );
            }
          }
          // Wipe stale drafts left by a previous account on this number so the
          // freshly-linked account starts clean — orphaned drafts can't resurface
          // as "No active draft found" or inflate quota counts. (pending_posts is
          // keyed by user_phone text, so a deleted account's rows survive.)
          try {
            const { error: wipeErr } = await supabase
              .from('pending_posts')
              .delete()
              .eq('user_phone', from)
              .eq('status', 'draft');
            if (wipeErr) {
              console.warn('⚠️ connect stale draft cleanup failed:', wipeErr.message);
            } else {
              console.log(`🧹 Cleared stale WhatsApp drafts for ${from}`);
            }
          } catch (wipeErr) {
            console.warn('⚠️ connect stale draft cleanup threw:', wipeErr);
          }

          userIdCache.delete(from);
          console.log(`✅ Linked WhatsApp number ${from} to user ${userId}`);
          return await sendWhatsappText(from, '✅ *WhatsApp connected to your Neerzy account!*', undefined);
        } catch (connectErr) {
          console.error('❌ Failed to link WhatsApp number:', connectErr);
        }
      }

      // Check if message matches customer name and phone details: e.g. "Mike +15552221617"
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

          // 🔒 GLM-ASR hard 30s lock — reject longer voice notes before calling the API
          const estSeconds = estimateAudioSeconds(buffer, mimeType);
          if (estSeconds !== null && estSeconds > ASR_MAX_SECONDS) {
            console.warn(`🎙️ Voice note too long (${estSeconds.toFixed(1)}s > ${ASR_MAX_SECONDS}s), rejected`);
            return await sendWhatsappText(
              from,
              `🎙️ *Voice notes must be ${ASR_MAX_SECONDS} seconds or less.*\n\nPlease send a shorter voice note, or type your description as a text message.`,
              to
            );
          }

          // 🎙️ GLM-ASR only accepts .wav/.mp3 — WhatsApp voice notes are OGG/Opus,
          // so decode to WAV first (pure WASM, no ffmpeg needed on serverless).
          // If conversion fails we fail fast: uploading the original OGG is a
          // guaranteed 400 from Z.AI, so we skip the API call and let the catch
          // block send the trader a friendly retry message instead.
          const wav = await convertOggOpusToWav(buffer, mimeType);
          if (!wav) {
            throw new VoiceNoteConversionError(
              `mime=${mimeType || 'unknown'}, size=${buffer.byteLength}B`
            );
          }
          const asrFile: File = new File([wav.wav], 'audio.wav', { type: 'audio/wav' });
          console.log(
            `🎙️ OGG/Opus → WAV converted (${wav.seconds.toFixed(1)}s, ${wav.wav.byteLength} bytes)`
          );
          console.log(`🎙️ ASR upload: ${asrFile.name} (${asrFile.type}, ${asrFile.size} bytes)`);

          const transcription = await getTranscriptionClient().audio.transcriptions.create({
            file: asrFile,
            model: DEFAULT_ASR_MODEL,
          });
          console.log('✅ Transcribed:', transcription.text);
          const voiceText = transcription.text;

          await saveDraft(from, { voice_note: voiceText });
          return await sendWhatsappText(
            from,
            `✅ *Voice note received & saved!* 🎙️\n\n_Transcribed: ${voiceText.length > 80 ? voiceText.substring(0, 80) + '...' : voiceText}_\n\nNow type *POST* to generate your GMB post.`,
            to
          );
        } catch (err: any) {
          if (err instanceof VoiceNoteConversionError) {
            // Conversion failed before any GLM-ASR call was made — log the real
            // cause (mime/size are in the message) so the server log is accurate.
            console.warn('⚠️', err.message);
          } else {
            console.error("❌ GLM-ASR Transcription Failed:", err);
            console.error('   Status:', err?.status, '| Error body:', JSON.stringify(err?.error || err?.message || err).substring(0, 300));
          }
          // Don't clobber a description the trader already saved — only flag the
          // failure when the draft has nothing usable yet.
          try {
            const { data: existingDraft } = await supabase
              .from('pending_posts')
              .select('voice_note')
              .eq('user_phone', from)
              .eq('status', 'draft')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            const currentNote = (existingDraft?.voice_note || '').trim();
            const hasRealDescription =
              !!currentNote && currentNote !== '[Voice note transcription failed]';
            if (!hasRealDescription) {
              await saveDraft(from, { voice_note: '[Voice note transcription failed]' });
            }
          } catch (dbErr) {
            console.warn('⚠️ Could not inspect draft before transcription-failure save:', dbErr);
          }
          return await sendWhatsappText(
            from,
            `⚠️ *Voice note received but couldn't be transcribed.*\n\nPlease send a shorter voice note (${ASR_MAX_SECONDS}s or less), or type your description as a text message.`,
            to
          );
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

  // Primary identity: auth-linked profiles table (what the dashboard uses for
  // plan/quota/trial checks). This is the source of truth for trial state.
  const digits = phone.replace(/\D/g, '');
  const withPlus = `+${digits}`;

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id')
    .or(`phone.eq.${phone},phone.eq.${withPlus},phone.eq.${digits}`)
    .order('updated_at', { ascending: false })
    .limit(1);
  const profile = profileRows?.[0] ?? null;

  if (profile?.id) {
    userIdCache.set(phone, profile.id);
    return profile.id;
  }

  // Legacy public users table fallback
  const { data: userRows } = await supabase
    .from('users')
    .select('id')
    .or(`phone.eq.${phone},phone.eq.${withPlus},phone.eq.${digits}`)
    .order('updated_at', { ascending: false })
    .limit(1);
  const userData = userRows?.[0] ?? null;

  if (userData?.id) {
    userIdCache.set(phone, userData.id);
    return userData.id;
  }

  // Auth-level fallback: Supabase auth users created via OTP carry the phone.
  try {
    const { data: authByPhone } = await (supabase.auth.admin as any).getUserByPhone(phone);
    if (authByPhone?.user?.id) {
      userIdCache.set(phone, authByPhone.user.id);
      return authByPhone.user.id;
    }
  } catch (phoneErr) {
    // getUserByPhone may not exist on this client — safe to ignore.
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
      const insertPayload: Record<string, any> = {
        user_phone: phone,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        images: [],
        status: 'draft'
      };
      if (userId) insertPayload.user_id = userId;
      const { error: insertErr } = await supabase.from('pending_posts').insert(insertPayload);
      if (insertErr) {
        console.error('❌ saveDraft customer insert failed:', insertErr.message);
        if (userId) {
          const { error: retryErr } = await supabase.from('pending_posts').insert({
            user_phone: phone,
            customer_name: data.customerName,
            customer_phone: data.customerPhone,
            images: [],
            status: 'draft'
          });
          if (retryErr) console.error('❌ saveDraft customer insert retry (no user_id) failed:', retryErr.message);
        }
      }
    } else {
      const updatePayload: Record<string, any> = {
        customer_name: data.customerName,
        customer_phone: data.customerPhone
      };
      if (userId) updatePayload.user_id = userId;
      const { error: updateErr } = await supabase.from('pending_posts').update(updatePayload).eq('id', existing.id);
      if (updateErr) {
        console.error('❌ saveDraft customer update failed:', updateErr.message);
        if (userId) {
          const { error: retryErr } = await supabase.from('pending_posts').update({
            customer_name: data.customerName,
            customer_phone: data.customerPhone
          }).eq('id', existing.id);
          if (retryErr) console.error('❌ saveDraft customer update retry (no user_id) failed:', retryErr.message);
        }
      }
    }
  }

  // Save voice_note (job details/description)
  if (data.voice_note) {
    if (!existing) {
      const insertPayload: Record<string, any> = {
        user_phone: phone,
        voice_note: data.voice_note,
        status: 'draft'
      };
      if (userId) insertPayload.user_id = userId;
      const { error: insertErr } = await supabase.from('pending_posts').insert(insertPayload);
      if (insertErr) {
        console.error('❌ saveDraft voice_note insert failed:', insertErr.message);
        if (userId) {
          const { error: retryErr } = await supabase.from('pending_posts').insert({
            user_phone: phone,
            voice_note: data.voice_note,
            status: 'draft'
          });
          if (retryErr) console.error('❌ saveDraft voice_note insert retry (no user_id) failed:', retryErr.message);
        }
      }
    } else {
      const updatePayload: Record<string, any> = { voice_note: data.voice_note };
      if (userId) updatePayload.user_id = userId;
      const { error: updateErr } = await supabase.from('pending_posts').update(updatePayload).eq('id', existing.id);
      if (updateErr) {
        console.error('❌ saveDraft voice_note update failed:', updateErr.message);
        if (userId) {
          const { error: retryErr } = await supabase.from('pending_posts').update({ voice_note: data.voice_note }).eq('id', existing.id);
          if (retryErr) console.error('❌ saveDraft voice_note update retry (no user_id) failed:', retryErr.message);
        }
      }
    }
  }

  // Save image URL
  if (data.imageUrl) {
    if (!existing) {
      const insertPayload: Record<string, any> = {
        user_phone: phone,
        images: [data.imageUrl],
        status: 'draft'
      };
      if (userId) insertPayload.user_id = userId;
      const { error: insertErr } = await supabase.from('pending_posts').insert(insertPayload);
      if (insertErr) {
        console.error('❌ saveDraft image insert failed:', insertErr.message);
        if (userId) {
          const { error: retryErr } = await supabase.from('pending_posts').insert({
            user_phone: phone,
            images: [data.imageUrl],
            status: 'draft'
          });
          if (retryErr) console.error('❌ saveDraft image insert retry (no user_id) failed:', retryErr.message);
        }
      }
    } else {
      const currentImages = existing.images || [];
      const updatePayload: Record<string, any> = { images: [...currentImages, data.imageUrl] };
      if (userId) updatePayload.user_id = userId;
      const { error: updateErr } = await supabase.from('pending_posts').update(updatePayload).eq('id', existing.id);
      if (updateErr) {
        console.error('❌ saveDraft image update failed:', updateErr.message);
        if (userId) {
          const { error: retryErr } = await supabase.from('pending_posts').update({ images: [...currentImages, data.imageUrl] }).eq('id', existing.id);
          if (retryErr) console.error('❌ saveDraft image update retry (no user_id) failed:', retryErr.message);
        }
      }
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
    // Growth/Agency users get Google + Facebook + Instagram. Free/Pro stay on
    // Google-only. Agency traders are detected by phone and get the same 3-post
    // flow with per-trader (30/month, 3/day) + agency pool (300/month, 30/day) caps.
    let growthTier = false;
    const userIdForQuota = await getUserIdByPhone(phone);
    const agencyCtx = await getAgencyByClientPhone(phone);
    if (!userIdForQuota && !agencyCtx) {
      console.warn(`⚠️ [trial-check post] Could not resolve user for phone ${phone} — skipping quota/trial check`);
    }

    // ── Agency trader path: per-trader + agency-pool caps ──
    if (agencyCtx) {
      growthTier = true; // traders always get the GMB + FB + IG 3-post flow
      try {
        // Mark connected on the first successful POST so the agency dashboard
        // shows the trader's live status.
        await supabase.from('agency_clients').update({ status: 'connected' }).eq('id', agencyCtx.clientId);

        const cycleStartIso = getCycleStartIso(agencyCtx.agencyAnchor);

        // 1) Per-trader caps: 30 posts/month, 3/day
        const traderUsage = await countAgencyTraderPosts(phone, cycleStartIso);
        if (traderUsage.total >= AGENCY_TRADER.posts) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Trader post limit reached.*\n\nThis trader has used ${traderUsage.total}/30 posts this month. Please contact your agency.`,
            fromNumber
          );
        }
        if (traderUsage.daily >= AGENCY_TRADER.postsDaily) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Daily post limit reached.*\n\nThis trader has used ${traderUsage.daily}/3 posts today. Try again tomorrow.`,
            fromNumber
          );
        }

        // 2) Agency pool caps: 300 posts/month, 30/day across all traders
        const pool = await countAgencyPoolPosts(agencyCtx.agencyUserId, cycleStartIso);
        if (pool.total >= AGENCY_POOL.posts) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Agency post pool reached.*\n\nYour agency has used ${pool.total}/300 posts this month. Please contact your agency.`,
            fromNumber
          );
        }
        if (pool.daily >= AGENCY_POOL.postsDaily) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Agency daily pool reached.*\n\nYour agency has used ${pool.daily}/30 posts today. Try again tomorrow.`,
            fromNumber
          );
        }
      } catch (agencyErr) {
        console.warn('⚠️ Could not check agency post quota:', agencyErr);
      }
    }

    // ── Standard user path ──
    if (!agencyCtx && userIdForQuota) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('selected_plan, plan_started_at, trial_started_at, created_at')
          .eq('id', userIdForQuota)
          .maybeSingle();

        const planTier = profileData?.selected_plan || 'free';
        const quota = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
        const trialStart = profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at;
        console.log(`[trial-check post] phone=${phone} user=${userIdForQuota} plan=${planTier} trialStart=${trialStart} daysLeft=${trialStart ? getRemainingDays(trialStart, quota.trialDays) : 'n/a'}`);

        // Tier-based reply: Growth/Agency/Unlimited → send FB + IG posts after the Google post.
        if (planTier === 'growth' || planTier === 'agency' || planTier === 'unlimited') growthTier = true;

        if (quota.trialDays > 0 && trialStart && getRemainingDays(trialStart, quota.trialDays) <= 0) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Your 30-day free trial has ended.*\n\nUpgrade to continue posting.`,
            fromNumber
          );
        }

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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Business context (real name, category, location) for SEO/AEO/GEO enrichment
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const businessCtx: PostPromptContext = { businessName: 'Local Business' };
    let gbpLink = 'https://business.google.com/';
    try {
      const { data: business } = await supabase
        .from('business_profiles')
        .select('business_name, google_place_id, address, category')
        .eq('user_phone', phone)
        .maybeSingle();

      if (business) {
        businessCtx.businessName = business.business_name || 'Local Business';
        businessCtx.category = business.category || null;
        businessCtx.locationHint = business.address || null;

        if (business.business_name) {
          gbpLink = `https://www.google.com/search?q=${encodeURIComponent(business.business_name)}`;
        } else if (business.google_place_id) {
          gbpLink = `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`;
        }
      }
    } catch (dbErr) {
      console.warn('⚠️ Could not fetch business context:', dbErr);
    }

    // AI Generation — grounded, SEO/AEO/GEO-enriched prompt (still anti-hallucination)
    // A voice note that failed to transcribe (or a stray one-word ack like "yes")
    // must NOT become the "job description" — otherwise the model produces a
    // generic post unrelated to the actual work. Treat those as no description and
    // let the prompt ground itself in the business category/location only.
    const rawDescription = (draft.voice_note || '').trim();
    const hasUsableDescription = isUsableJobDescription(rawDescription);
    const jobDescription = hasUsableDescription ? rawDescription : '';
    const { system, user } = buildPostPrompt(businessCtx, { jobDescription, hasImage: true });
    const aiResponse = await chatWithFallback({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }, { priority: growthTier });

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
    const postType = parsed.postType || '';
    const qaQuestion = parsed.qaQuestion || '';
    const qaAnswer = parsed.qaAnswer || '';

    // One clean, copy-paste-ready block (no labels, no markdown noise)
    const cleanPost = buildCleanPost(headline, bodyText, cta, hashtags);

    const postTextMessage = `✅ *Post Ready — copy the text below:*

${cleanPost}`;

    await sendWhatsappText(phone, postTextMessage, fromNumber);

    // Optional guidance (kept OUTSIDE the copyable block): GBP post type + bonus Q&A
    const guidanceBits: string[] = [];
    if (postType) guidanceBits.push(`📂 *On Google, select post type:* ${postType}`);
    if (qaQuestion && qaAnswer) guidanceBits.push(`💬 *Bonus — answer this Q&A on your Google listing:*\n\nQ: ${qaQuestion}\nA: ${qaAnswer}`);
    if (guidanceBits.length) {
      await sendWhatsappText(phone, guidanceBits.join('\n\n'), fromNumber);
    }

    const gbpMessage = `🌐 *Open GBP directly to paste & publish:*
${gbpLink}

(Paste the copied text above and select the saved photos)`;
    await sendWhatsappText(phone, gbpMessage, fromNumber);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Quick steps: images are already saved in the phone gallery + open Google.
    // (No web image link — the trader keeps the photos sent in the chat.)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const actionMessage = `🖼️ *Images:* your photos are already saved in your phone's gallery — select them when publishing on Google.

🌐 *Open Google to publish:*

${gbpLink}

📌 *Steps:* copy the text above → paste on Google → add your saved photos → publish.
Type *DONE* when published.`;

    await sendWhatsappText(phone, actionMessage, fromNumber);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // GROWTH / AGENCY (tier-based): send Facebook + Instagram posts so the
    // trader receives 3 clearly-separated posts — 1 Google (above),
    // 2 Facebook, 3 Instagram. Free/Pro flow is untouched.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (growthTier) {
      try {
        const social = await generateSocialContent({
          jobTopic: jobDescription || parsed.headline || draft.customer_name || 'a recently completed job',
          businessName: businessCtx.businessName || 'My Business',
          businessCategory: businessCtx.category || 'Local Service',
          priority: growthTier,
        });

        const fbText = `${social.facebook.postText}\n\n${social.facebook.hashtags}`.trim();
        const igText = `${social.instagram.caption}\n\n${social.instagram.hashtags}`.trim();

        // Persist FB + IG content so dashboard history + analytics can show them.
        try {
          const { error: saveErr } = await supabase
            .from('pending_posts')
            .update({ social_facebook: fbText, social_instagram: igText })
            .eq('id', draft.id);
          if (saveErr) console.warn('⚠️ Could not save social content to pending_posts:', saveErr.message);
        } catch (saveErr) {
          console.warn('⚠️ Could not save social content to pending_posts:', saveErr);
        }

        const fbMessage = `✅ *Post 2 of 3 — FACEBOOK*\nCopy the text below:\n\n${fbText}\n\n📌 *Steps:* copy above → open Facebook → paste → tap Post.\n(Use the photos already saved in your gallery above.)`;
        await sendWhatsappText(phone, fbMessage, fromNumber);

        const igMessage = `✅ *Post 3 of 3 — INSTAGRAM*\nCopy the caption below:\n\n${igText}\n\n📌 *Steps:* copy above → open Instagram → add your photo → paste → tap Share.\n(Use the photos already saved in your gallery above.)`;
        await sendWhatsappText(phone, igMessage, fromNumber);

        console.log('🎉 Growth user received all 3 posts (Google + Facebook + Instagram):', phone);
      } catch (socialErr: any) {
        console.warn('⚠️ Growth social content failed (Google post already sent):', socialErr?.message || socialErr);
        await sendWhatsappText(
          phone,
          `ℹ️ *Facebook & Instagram posts couldn't be generated this time.*\n\nYour Google post above is ready ✅ — you can regenerate all 3 posts anytime by sending the job again and typing *POST*.`,
          fromNumber
        );
      }
    }

    // When no usable job description was available, tell the trader the post was
    // grounded only in their business profile — a generic post shouldn't silently
    // look like it described the job.
    if (!hasUsableDescription) {
      await sendWhatsappText(
        phone,
        `ℹ️ *Post was generated without your job description.*\n\nYour voice note or description wasn't readable, so this post only references your business. Send your description as a text message, then type *POST* to regenerate it with the real job details.`,
        fromNumber
      );
    }

    return;

  } catch (error: any) {
    console.error('❌ handleGeneratePost error:', error);
    return await sendWhatsappText(phone, `❌ Error: ${error.message}\n\nPlease try again.`, fromNumber);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Review-request workflow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Insert a review_requests row for delivery tracking.
 *
 * Returns the new row's id, or null if it could not be saved. Uses
 * `.select('id')` so a failed insert is DETECTED instead of silently passing —
 * a bare `.insert()` reports success even when the row never lands.
 *
 * If the insert fails because the 20260902 migration columns
 * (`meta_message_id` / `last_error`) are missing on this database, the row is
 * retried with a legacy payload so tracking still works: Meta's async
 * delivery-status callbacks then match the row by phone number (status
 * 'sent') instead of the wamid, and the "NOT delivered" notification still
 * fires. Logs loudly and returns null if the row genuinely can't be saved.
 */
async function insertReviewTrackingRow(payload: Record<string, any>): Promise<string | null> {
  try {
    const { data: inserted, error: insertErr } = await supabase
      .from('review_requests')
      .insert(payload)
      .select('id')
      .maybeSingle();

    if (!insertErr && inserted?.id) {
      return inserted.id as string;
    }

    const errMsg = insertErr?.message || String(insertErr || '');
    console.error('⚠️ Failed to insert review_requests row:', insertErr);

    const missingMigrationColumns =
      /PGRST204|could not find|does not exist|unknown column/i.test(errMsg) &&
      /meta_message_id|last_error/i.test(errMsg);

    if (!missingMigrationColumns) {
      return null;
    }

    console.warn(
      '⚠️ meta_message_id/last_error columns missing on this database (20260902 migration not applied). ' +
      'Retrying insert without them so delivery-status callbacks can still match the row by phone.'
    );
    const legacyPayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'meta_message_id' || key === 'last_error') continue;
      legacyPayload[key] = value;
    }

    const { data: retried, error: retryErr } = await supabase
      .from('review_requests')
      .insert(legacyPayload)
      .select('id')
      .maybeSingle();

    if (retryErr) {
      console.error('⚠️ Legacy retry insert also failed:', retryErr);
      return null;
    }
    return retried?.id ? (retried.id as string) : null;
  } catch (err) {
    console.error('⚠️ Failed to insert review_requests row:', err);
    return null;
  }
}

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
        "⚠️ *No customer phone number found.*\n\nPlease send the customer's name and phone number first.\n\nExample: _Mike +15552221617_",
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
    const agencyCtxReview = await getAgencyByClientPhone(phone);
    const userIdForPublish = await getUserIdByPhone(phone);
    if (!userIdForPublish && !agencyCtxReview) {
      console.warn(`⚠️ [trial-check review] Could not resolve user for phone ${phone} — skipping quota/trial check`);
    }

    // ── Agency trader review caps: 30/month + 3/day per trader, plus the agency
    //    pool (300/month, 30/day) shared across all traders. ──
    if (agencyCtxReview) {
      try {
        await supabase.from('agency_clients').update({ status: 'connected' }).eq('id', agencyCtxReview.clientId);

        const cycleStartIso = getCycleStartIso(agencyCtxReview.agencyAnchor);
        const traderReviews = await countAgencyTraderReviews(phone, cycleStartIso);
        if (traderReviews.total >= AGENCY_TRADER.reviews) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Trader review limit reached.*\n\nThis trader has used ${traderReviews.total}/30 review requests this month. Please contact your agency.`,
            fromNumber
          );
        }
        if (traderReviews.daily >= AGENCY_TRADER.reviewsDaily) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Daily review limit reached.*\n\nThis trader has used ${traderReviews.daily}/3 review requests today. Try again tomorrow.`,
            fromNumber
          );
        }

        const phonesPool = await getAgencyClientPhones(agencyCtxReview.agencyUserId);
        const poolReviews = await countAgencyPoolReviews(agencyCtxReview.agencyUserId, phonesPool, cycleStartIso);
        if (poolReviews.total >= AGENCY_POOL.reviews) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Agency review pool reached.*\n\nYour agency has used ${poolReviews.total}/300 review requests this month. Please contact your agency.`,
            fromNumber
          );
        }
        if (poolReviews.daily >= AGENCY_POOL.reviewsDaily) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Agency daily review pool reached.*\n\nYour agency has used ${poolReviews.daily}/30 review requests today. Try again tomorrow.`,
            fromNumber
          );
        }
      } catch (agencyRevErr) {
        console.warn('⚠️ Could not check agency review quota:', agencyRevErr);
      }
    }

    // ── Standard user path ──
    if (!agencyCtxReview && userIdForPublish) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('selected_plan, plan_started_at, trial_started_at, created_at')
          .eq('id', userIdForPublish)
          .maybeSingle();

        const planTier = profileData?.selected_plan || 'free';
        const quota = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
        const trialStart = profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at;
        console.log(`[trial-check review] phone=${phone} user=${userIdForPublish} plan=${planTier} trialStart=${trialStart} daysLeft=${trialStart ? getRemainingDays(trialStart, quota.trialDays) : 'n/a'}`);

        if (quota.trialDays > 0 && trialStart && getRemainingDays(trialStart, quota.trialDays) <= 0) {
          return await sendWhatsappText(
            phone,
            `⚠️ *Your 30-day free trial has ended.*\n\nUpgrade to send more review requests.`,
            fromNumber
          );
        }

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
        "⚠️ *The customer phone number matches your own number.*\n\nPlease send the correct customer's name and phone number.\n\nExample: _Mike +15552221617_",
        fromNumber
      );
    }

    console.log(`📤 Sending review link to CUSTOMER: ${customerName} at ${targetCustomerPhone} (trader: ${phone})`);

    let messageSentVia = 'whatsapp';
    let messageSuccess = false;
    let metaMessageId: string | null = null;
    let lastSendError: string | null = null;

    try {
      // Step 1: Try approved template first
      const templateName = process.env.META_TEMPLATE_REVIEW_REQUEST || 'review_request';
      const templateResult = await sendMetaTemplate({
        to: targetCustomerPhone,
        templateName,
        languageCode: "en",
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: customerName },
            { type: "text", text: businessName },
            { type: "text", text: reviewLink },
          ]
        }],
      });
      metaMessageId = templateResult.messages?.[0]?.id || null;
      console.log('✅ Review request TEMPLATE sent! Message ID:', metaMessageId);
      messageSentVia = 'whatsapp_template';
      messageSuccess = true;

    } catch (templateError: any) {
      console.error('❌ Template failed:', templateError.message);
      console.error('   This usually means template is not approved yet in Meta Business Manager.');
      lastSendError = templateError?.message || 'Template send failed';

      // Step 2: FALLBACK - Send free-form text within 24h window
      console.log('📩 FALLBACK: Attempting free-form WhatsApp message...');
      try {
        const fallbackText = `Hi ${customerName}! 👋\n\nThank you for choosing ${businessName}! We'd really appreciate it if you could leave us a quick review.\n\n🔗 Review link: ${reviewLink}\n\nIt helps us grow! 🙏`;

        const fallbackResult = await sendMetaText({
          to: targetCustomerPhone,
          body: fallbackText
        });

        const fallbackMsgId = fallbackResult.messages?.[0]?.id;
        if (fallbackMsgId) metaMessageId = fallbackMsgId;
        console.log('✅ FALLBACK MESSAGE SENT successfully! Message ID:', fallbackMsgId);
        console.log(`💡 Note: Free-form messages work when customers contacted you within last 24 hours.`);
        messageSentVia = 'whatsapp_fallback';
        messageSuccess = true;

      } catch (fallbackError: any) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        console.error('   Both delivery methods failed. Check your Meta access token and phone number.');
        lastSendError = fallbackError?.message || 'Free-form fallback send failed';
        messageSuccess = false;
      }
    }

    if (!messageSuccess) {
      // Both the approved template AND the free-form fallback failed at the
      // API level. Surface the real reason to the trader (the outer catch
      // sends it as an error message) instead of a generic one-liner, and
      // leave the pending post in 'generated'/'draft' so the trader can retry
      // with DONE. We deliberately don't log a review_requests row here: a
      // 'failed' row would consume the trader's review quota and block retries.
      const failureReason = (lastSendError || 'Unknown error')
        .replace(/^Meta WhatsApp API Error(?: \(\d+\))?:\s*/, '')
        .trim();
      throw new Error(
        `WhatsApp could not deliver the review request to ${customerName}. ` +
        (failureReason && failureReason !== 'Unknown error' ? `Reason: ${failureReason} ` : '') +
        'The customer may not be on WhatsApp, or has not messaged you recently. ' +
        'Ask them to send you a WhatsApp message first, then type *DONE* to resend.'
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Insert review_requests row for dashboard tracking/stats
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // This row is what lets Meta's async delivery-status callbacks reach the
    // trader later — e.g. a *failed* status for a customer who is NOT on
    // WhatsApp triggers the "NOT delivered" notification. If this insert ever
    // silently failed (the old code never confirmed the row landed), no record
    // existed to correlate the wamid, so the failure was never surfaced.
    // insertReviewTrackingRow() detects insert failures and falls back to a
    // legacy payload if the migration columns are missing on this database.
    const messageText = `Hi ${customerName}! 👋\n\nThank you for choosing ${businessName}! We'd really appreciate it if you could leave us a quick review. It helps us grow!\n\n🔗 Review link: ${reviewLink}`;
    const businessId = business?.id || null;
    const trackingRowId = await insertReviewTrackingRow({
      user_id: userIdForPublish || null,
      agency_client_phone: agencyCtxReview ? phone : null,
      business_id: businessId,
      customer_name: customerName,
      customer_phone: targetCustomerPhone,
      message_text: messageText,
      review_link: reviewLink,
      status: 'sent',
      sent_via: messageSentVia,
      meta_message_id: metaMessageId,
      sent_at: new Date().toISOString(),
    });

    if (trackingRowId) {
      console.log(`📝 Inserted review_requests row ${trackingRowId} for ${customerName} (user: ${userIdForPublish || 'unknown'}) via ${messageSentVia}`);
    } else {
      console.error('⚠️ review_requests row could NOT be saved — delivery status callbacks will not be able to notify the trader for this request.');
    }

    // Mark the row after successful send + logging.
    // BUG FIX: only mark 'published' when this row is an actual GMB post (has
    // generated content or images). A review-request-only row (customer details
    // with no photos/post content) must NOT count toward the post quota —
    // marking it 'published' previously blocked the trader's very first POST
    // with "Daily post limit reached" on the free plan. 'review_sent' is a
    // terminal status: not counted as a post, not reusable as a draft, and not
    // matched again by the 'generated'/'draft' lookups above (no duplicate sends).
    const isActualPost = Boolean(
      (post.google_post && String(post.google_post).trim()) ||
      (Array.isArray(post.images) && post.images.length > 0)
    );
    await supabase.from('pending_posts').update({
      status: isActualPost ? 'published' : 'review_sent',
      user_id: userIdForPublish
    }).eq('id', post.id);

    // Always send confirmation to the trader since we verified it's a real customer
    const customerCC = extractCountryCode(targetCustomerPhone);
    const customerFlag = getCountryFlag(customerCC);
    const confirmMessage = `✅ *Review request sent to ${customerName}!*\n\n📱 Sent to: ${customerFlag} ${targetCustomerPhone}\n🔗 Here is the review link:\n\n${reviewLink}\n\n_You'll get a delivery confirmation once WhatsApp confirms delivery._\n_Done! Workflow complete._ ✅`;
    await sendWhatsappText(phone, confirmMessage, fromNumber);

    if (!trackingRowId) {
      await sendWhatsappText(
        phone,
        `⚠️ *Heads up:* the review request was sent to WhatsApp, but Neerzy couldn't save the delivery-tracking record (database error), so delivery confirmations may not arrive. Please try again or check that migration 20260902 was applied.`,
        fromNumber
      );
    }

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
    // Convert {key:value} vars to Meta-style components
    const parameters = Object.entries(vars || {}).map(([, value]) => ({
      type: "text" as const,
      text: String(value),
    }));
    const result = await sendMetaTemplate({
      to,
      templateName,
      languageCode: "en",
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
// Meta delivery status callbacks (value.statuses[])
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function handleMetaDeliveryStatus(status: any, requestId: string) {
  const wamid = status?.id;
  const statusName = status?.status; // "sent" | "delivered" | "read" | "failed"
  const recipientId = status?.recipient_id || '';

  if (!wamid || !statusName) {
    console.log(`📭 [${requestId}] Status update without id/status, skipping`);
    return;
  }
  // Only reflect terminal outcomes we track. "sent"/"read" are informational.
  if (statusName !== 'delivered' && statusName !== 'failed') {
    console.log(`📥 [${requestId}] Status ${statusName} (wamid ${wamid}) is informational, no state change`);
    return;
  }

  // 1) Primary match: the wamid we saved when sending the request
  const { data: rows } = await supabase
    .from('review_requests')
    .select('id, user_id, customer_name, customer_phone, status, review_link, last_error')
    .eq('meta_message_id', wamid)
    .limit(1);
  let row = rows?.[0] || null;

  // 2) Legacy fallback: rows sent before meta_message_id existed — match by
  //    recipient phone (only the newest still-"sent" request for that customer).
  if (!row && recipientId) {
    const digits = recipientId.replace(/\D/g, '');
    const withPlus = `+${digits}`;
    const { data: legacyRows } = await supabase
      .from('review_requests')
      .select('id, user_id, customer_name, customer_phone, status, review_link, last_error')
      .or(`customer_phone.eq.${recipientId},customer_phone.eq.${withPlus},customer_phone.eq.${digits}`)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1);
    row = legacyRows?.[0] || null;
    if (row) {
      // Backfill the wamid so any later statuses (read) match reliably too.
      await supabase.from('review_requests').update({ meta_message_id: wamid }).eq('id', row.id);
    }
  }

  if (!row) {
    console.log(`📭 [${requestId}] No review_requests row for wamid ${wamid}, skipping`);
    return;
  }

  if (statusName === 'delivered') {
    const { error: updErr } = await supabase
      .from('review_requests')
      .update({ status: 'delivered', last_error: null })
      .eq('id', row.id);
    if (updErr) console.error(`❌ [${requestId}] Failed to mark review request ${row.id} delivered:`, updErr.message);
    else console.log(`✅ [${requestId}] Review request ${row.id} marked DELIVERED`);
    await notifyTraderOfDelivery(row, 'delivered', wamid);
  } else {
    const err = status?.errors?.[0];
    const errDetail =
      err?.error_data?.details ||
      err?.message ||
      err?.title ||
      'Unknown delivery error';
    const errCode = err?.code ? ` [${err.code}]` : '';
    const fullDetail = `${errDetail}${errCode}`;
    // A WhatsApp delivery failure means this request still needs to go out —
    // mirror the dashboard device-link fallback so chat history and analytics
    // show the manual_link state, while keeping the real reason in last_error.
    const { error: updErr } = await supabase
      .from('review_requests')
      .update({ status: 'manual_fallback', sent_via: 'manual_link', last_error: fullDetail })
      .eq('id', row.id);
    if (updErr) console.error(`❌ [${requestId}] Failed to mark review request ${row.id} manual_fallback:`, updErr.message);
    else console.log(`❌ [${requestId}] Review request ${row.id} marked MANUAL FALLBACK (${errDetail})`);
    await notifyTraderOfDelivery(row, 'failed', wamid, fullDetail);
  }
}

/** Resolve the trader's WhatsApp phone from a review_requests.user_id. */
async function getPhoneByUserId(userId: string): Promise<string | null> {
  if (!userId) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', userId)
    .maybeSingle();
  if (profile?.phone) return profile.phone;
  // Legacy public users table fallback
  const { data: legacy } = await supabase
    .from('users')
    .select('phone')
    .eq('id', userId)
    .maybeSingle();
  return legacy?.phone || null;
}

/** Notifies the trader when WhatsApp confirms (or fails) delivery. */
async function notifyTraderOfDelivery(row: any, outcome: 'delivered' | 'failed', wamid: string, detail?: string) {
  if (!row?.user_id) return;
  try {
    const traderPhone = await getPhoneByUserId(row.user_id);
    if (!traderPhone) {
      console.log(`⚠️ No trader phone found for user ${row.user_id} — cannot notify delivery status (wamid ${wamid})`);
      return;
    }
    const customerName = (row.customer_name || 'your customer').replace(/[\n\r]+/g, ' ').trim();
    if (outcome === 'delivered') {
      await sendWhatsappText(
        traderPhone,
        `✅ *Review request delivered to ${customerName}!*\n\n_WhatsApp confirmed the review request was delivered._`,
        undefined
      );
    } else {
      const reason = detail ? `\n\n_Reason: ${detail}_` : '';
      if (row.review_link) {
        // The trader has a review link — hand them the exact copy-paste message
        // to send via SMS/WhatsApp from their own phone instead of relying on Meta.
        let businessName = '';
        try {
          const { data: biz } = await supabase
            .from('business_profiles')
            .select('business_name')
            .eq('user_phone', traderPhone)
            .maybeSingle();
          businessName = biz?.business_name || '';
        } catch (bizErr: any) {
          console.warn('⚠️ Failed to load business name for manual-fallback message:', bizErr?.message || bizErr);
        }
        await sendWhatsappText(
          traderPhone,
          `⚠️ *Review request NOT delivered to ${customerName}.*${reason}\n\nThey may not be on WhatsApp.\n\n📋 *Copy this message and send it to ${customerName} via SMS from your phone:*\n\nHi ${customerName}, thanks for choosing ${businessName || 'us'} today! Could you take 30 seconds to leave us a Google review? ${row.review_link}`,
          undefined
        );
      } else {
        // Legacy rows may predate the review_link column — keep the older guidance.
        await sendWhatsappText(
          traderPhone,
          `⚠️ *Review request NOT delivered to ${customerName}.*\n\nWhatsApp reported the message could not be delivered.${reason}\n\nThey may not be on WhatsApp. Ask them to send you a WhatsApp message first, then resend the request.`,
          undefined
        );
      }
    }
  } catch (err: any) {
    console.error('⚠️ Failed to notify trader of delivery status:', err?.message || err);
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