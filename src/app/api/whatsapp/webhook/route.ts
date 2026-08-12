import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMetaText, sendMetaTemplate, sendMetaMedia } from '@/lib/whatsapp';
import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from '@/lib/openai';
import { PLAN_LIMITS } from '@/lib/plans';

// ✅ Use correct server-side env vars from your .env
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = getOpenAIClient();

const META_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1256240127573258';
const META_VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN || 'neerzy_webhook_verify_2024';

// GET - Meta Webhook Verification
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

export async function POST(req: Request) {
  try {
  // Parse Meta WhatsApp webhook JSON payload
    // Meta sends: { object: "whatsapp_business_account", entry: [{ changes: [{ value: { messages: [...] } }] }] }
    const webhookData = await req.json();
    
    // Extract the message from the webhook payload
    const entry = webhookData?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;
    const contacts = value?.contacts;

    // Ignore non-message events (status updates, etc.)
    if (!messages || !messages.length) {
      console.log('📥 Non-message webhook event, ignoring');
      return NextResponse.json({ status: 'ok' });
    }

    const message = messages[0];
    const from = message?.from || '';
    const body = message?.text?.body || '';
    const messageType = message?.type || 'text';
    
    // Extract media if present (image, video, audio, document)
    let mediaUrl = '';
    let mediaType = '';
    const hasMedia = ['image', 'video', 'audio', 'document'].includes(messageType);
    if (hasMedia && message[messageType]) {
      mediaType = messageType;
      // For media, we get the media ID — we'll need to download it
      const mediaId = message[messageType]?.id;
      if (mediaId) {
        mediaUrl = `https://graph.facebook.com/v22.0/${mediaId}`;
      }
    }

    if (!from) return NextResponse.json({ status: 'ok' });

    console.log(`📥 [Meta WhatsApp] From: ${from}, Type: ${messageType}, Body: "${body.substring(0, 100)}"`);

    // `to` was the business number in Twilio — now unused (Meta uses phone number ID), keep as null for compat
    const to = undefined;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Commands first (POST / DONE)
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
            to
          );
        }
        return await handleGeneratePost(from, to);
      }

      if (text === 'RESET') {
        // Clear all active drafts for this phone
        await supabase.from('pending_posts').update({ status: 'cleared' }).eq('user_phone', from).eq('status', 'draft');
        userIdCache.delete(from); // clear user ID cache
        return await sendWhatsappText(from, '🗑️ *All drafts cleared.*\n\nStart fresh by sending a new photo.', to);
      }

      if (text === 'DONE') {
        return await handleSendReview(from, to);
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
        // Image received — use the download URL directly (Meta serves it with Bearer auth)
        console.log('💾 Saving image draft, media ID:', mediaId);
        await saveDraft(from, { imageUrl: downloadUrl });
        
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
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Cache user_id lookups by phone to avoid repeated DB queries
const userIdCache = new Map<string, string | null>();

async function getUserIdByPhone(phone: string): Promise<string | null> {
  // Check cache first
  const cached = userIdCache.get(phone);
  if (cached !== undefined) return cached;

  // Look up user by phone in auth.users (via raw_user_meta_data or phone column)
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (userData?.id) {
    userIdCache.set(phone, userData.id);
    return userData.id;
  }

  // Fallback: try auth.users table directly
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
        user_id: userId, // link to auth user for quota tracking
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        images: [],
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        user_id: userId // also update in case it was null
      }).eq('id', existing.id);
    }
  }

  // Save voice_note (job details/description)
  if (data.voice_note) {
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        user_id: userId, // link to auth user for quota tracking
        voice_note: data.voice_note,
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({
        voice_note: data.voice_note,
        user_id: userId // also update in case it was null
      }).eq('id', existing.id);
    }
  }

  if (data.imageUrl) {
    const newImages = existing?.images ? [...existing.images, data.imageUrl] : [data.imageUrl];
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        user_id: userId, // link to auth user for quota tracking
        images: newImages,
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({ 
        images: newImages,
        user_id: userId // also update in case it was null
      }).eq('id', existing.id);
    }
  }

  return targetStatus;
}

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
    for (let i = 0; i < imagesToSend.length; i++) {
      try {
        await sendWhatsappMedia(phone, imagesToSend[i], `📸 Photo ${i+1}/${imagesToSend.length}`, fromNumber);
      } catch (mediaError) {
        console.error('❌ Media send error:', mediaError);
      }
    }

    // Notice about images download
    await sendWhatsappText(phone, `📸 *Photos are sent above. Tap and save them directly to your phone's gallery!*`, fromNumber);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Send Post Text directly (User can long-press and copy on WhatsApp)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const lines = postContent.split('\n');
    const extractField = (prefix: string) => {
      const line = lines.find((l: string) => l.toUpperCase().includes(prefix.toUpperCase()));
      return line ? line.replace(new RegExp(`\\*{0,2}${prefix}\\*{0,2}`, 'i'), '').trim() : '';
    };

    const headline = extractField('HEADLINE:') || draft.customer_name || 'New Post';
    const body = extractField('BODY:') || draft.voice_note || '';
    const cta = extractField('CTA:') || '';
    const hashtags = extractField('HASHTAGS:') || '';

    const formattedPostText = `📋 *Copy Post Text below:*

${headline}

${body}

${cta}

${hashtags}`;

    await sendWhatsappText(phone, formattedPostText, fromNumber);

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
    // Send fallback link to Dashboard directly
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Always use production URL for user-facing links
    const appUrl = 'https://www.neerzy.com';

    // WhatsApp requires URLs to be completely on their own line with blank lines around them
    // to be detected as clickable links
    const actionMessage = `✅ *Post Ready!*

*Copy Post:*

${appUrl}/copy/${draft.id}

*Download Images:*

${appUrl}/images/${draft.id}

*Open GBP:*

${gbpLink}

Copy the text, open GBP, paste and publish!
Type *DONE* when published.`;

    return await sendWhatsappText(phone, actionMessage, fromNumber);

  } catch (error: any) {
    console.error('❌ handleGeneratePost error:', error);
    return await sendWhatsappText(phone, `❌ Error: ${error.message}\n\nPlease try again.`, fromNumber);
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

    // If no post with customer_phone, fall back to any generated post (but will require customer_phone below)
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
      // Try exact phone match first
      const { data: exactBusiness } = await supabase
        .from('business_profiles')
        .select('review_link, google_place_id, business_name')
        .eq('user_phone', phone)
        .maybeSingle();

      business = exactBusiness;

      // If no match, get any business profile (user may have different WhatsApp number)
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

    // Mark post as published — also set user_id for quota tracking
    const userIdForPublish = await getUserIdByPhone(phone);
    await supabase.from('pending_posts').update({ 
      status: 'published',
      user_id: userIdForPublish 
    }).eq('id', post.id);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Soft Plan-Quota Check: block sending if trader has hit their plan limits
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (userIdForPublish) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('selected_plan')
          .eq('id', userIdForPublish)
          .maybeSingle();

        const planTier = profileData?.selected_plan || 'free';
        const quota = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

        // Check total quota
        if (quota.totalReviewRequests !== -1) {
          const { count: sentTotal } = await supabase
            .from('review_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userIdForPublish);

          if (sentTotal !== null && sentTotal >= quota.totalReviewRequests) {
            return await sendWhatsappText(
              phone,
              `⚠️ *Review request limit reached.*\n\nYour ${planTier} plan allows ${quota.totalReviewRequests} review requests total. Upgrade to send more.`,
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
    // 3. Send Review Request to the CUSTOMER (never the trader)
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
    
    // Send the approved Twilio WhatsApp Template to prevent Error 63016 (no session window)
    const templateSid = process.env.TWILIO_TEMPLATE_REVIEW_REQUEST || 'HX36dc564715671fad2b3617c795984ee2';
    const templateVars = {
      "1": customerName,
      "2": businessName,
      "3": reviewLink
    };
    // Use the billing-enabled toll-free number for sending the template review request
    await sendWhatsappTemplate(targetCustomerPhone, templateSid, templateVars);

    // Meta WhatsApp templates are reliable — no SMS fallback needed

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
        sent_via: 'whatsapp',
        sent_at: new Date().toISOString(),
      });

      // If insert fails with PGRST204 (missing business_id column in prod),
      // retry without business_id so the row is still recorded for the dashboard
      if (insertErr) {
        const isPGRST204 = (insertErr as any)?.code === 'PGRST204' ||
          (insertErr as any)?.message?.includes('PGRST204') ||
          (insertErr as any)?.message?.includes('Could not find');
        if (isPGRST204 && businessId) {
          console.warn('⚠️ business_id column not found in review_requests — retrying without it');
          const { error: retryErr } = await supabase.from('review_requests').insert({
            user_id: userIdForPublish || null,
            customer_name: customerName,
            customer_phone: targetCustomerPhone,
            message_text: messageText,
            review_link: reviewLink,
            status: 'sent',
            sent_via: 'whatsapp',
            sent_at: new Date().toISOString(),
          });
          if (retryErr) {
            console.error('⚠️ Failed to insert review_requests row (retry):', retryErr);
          } else {
            console.log(`📝 Inserted review_requests row for ${customerName} (user: ${userIdForPublish || 'unknown'})`);
          }
        } else {
          console.error('⚠️ Failed to insert review_requests row:', insertErr);
        }
      } else {
        console.log(`📝 Inserted review_requests row for ${customerName} (user: ${userIdForPublish || 'unknown'})`);
      }
    } catch (insertErr) {
      console.error('⚠️ Failed to insert review_requests row:', insertErr);
      // Non-fatal: the WhatsApp message was already sent
    }

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

async function sendWhatsappText(to: string, text: string, _fromNumber?: string) {
  try {
    const result = await sendMetaText({ to, body: text });
    console.log('✅ Meta WhatsApp text sent! ID:', result.messages?.[0]?.id);
    return NextResponse.json({ success: true, id: result.messages?.[0]?.id });
  } catch (error: any) {
    console.error('❌ sendWhatsappText error:', error.message);
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

function parsePostContent(content: string) {
  const lines = content.split('\n');
  return {
    headline: extractLine(lines, 'HEADLINE:') || 'Great Work!',
    body: extractLine(lines, 'BODY:') || 'Job completed.',
    cta: extractLine(lines, 'CTA:') || 'Contact us!',
    hashtags: extractLine(lines, 'HASHTAGS:') || '#Service'
  };
}

function extractLine(lines: string[], prefix: string) {
  const line = lines.find(l => l.toUpperCase().includes(prefix.toUpperCase()));
  return line ? line.replace(new RegExp(prefix, 'i'), '').trim() : '';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Country Code → Flag Emoji Helper
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getCountryFlag(countryCode: string): string {
  // Map of common country codes to their flag emoji
  const flagMap: Record<string, string> = {
    '1': '🇺🇸',    // US/Canada
    '20': '🇪🇬',   // Egypt
    '27': '🇿🇦',   // South Africa
    '30': '🇬🇷',   // Greece
    '31': '🇳🇱',   // Netherlands
    '32': '🇧🇪',   // Belgium
    '33': '🇫🇷',   // France
    '34': '🇪🇸',   // Spain
    '36': '🇭🇺',   // Hungary
    '39': '🇮🇹',   // Italy
    '40': '🇷🇴',   // Romania
    '41': '🇨🇭',   // Switzerland
    '43': '🇦🇹',   // Austria
    '44': '🇬🇧',   // UK
    '45': '🇩🇰',   // Denmark
    '46': '🇸🇪',   // Sweden
    '47': '🇳🇴',   // Norway
    '48': '🇵🇱',   // Poland
    '49': '🇩🇪',   // Germany
    '51': '🇵🇪',   // Peru
    '52': '🇲🇽',   // Mexico
    '54': '🇦🇷',   // Argentina
    '55': '🇧🇷',   // Brazil
    '56': '🇨🇱',   // Chile
    '57': '🇨🇴',   // Colombia
    '58': '🇻🇪',   // Venezuela
    '60': '🇲🇾',   // Malaysia
    '61': '🇦🇺',   // Australia
    '62': '🇮🇩',   // Indonesia
    '63': '🇵🇭',   // Philippines
    '64': '🇳🇿',   // New Zealand
    '65': '🇸🇬',   // Singapore
    '66': '🇹🇭',   // Thailand
    '81': '🇯🇵',   // Japan
    '82': '🇰🇷',   // South Korea
    '84': '🇻🇳',   // Vietnam
    '86': '🇨🇳',   // China
    '90': '🇹🇷',   // Turkey
    '91': '🇮🇳',   // India
    '92': '🇵🇰',   // Pakistan
    '93': '🇦🇫',   // Afghanistan
    '94': '🇱🇰',   // Sri Lanka
    '95': '🇲🇲',   // Myanmar
    '98': '🇮🇷',   // Iran
    '212': '🇲🇦',  // Morocco
    '213': '🇩🇿',  // Algeria
    '216': '🇹🇳',  // Tunisia
    '218': '🇱🇾',  // Libya
    '220': '🇬🇲',  // Gambia
    '221': '🇸🇳',  // Senegal
    '222': '🇲🇷',  // Mauritania
    '223': '🇲🇱',  // Mali
    '224': '🇬🇳',  // Guinea
    '225': '🇨🇮',  // Cote d'Ivoire
    '226': '🇧🇫',  // Burkina Faso
    '227': '🇳🇪',  // Niger
    '228': '🇹🇬',  // Togo
    '229': '🇧🇯',  // Benin
    '230': '🇲🇺',  // Mauritius
    '231': '🇱🇷',  // Liberia
    '232': '🇸🇱',  // Sierra Leone
    '233': '🇬🇭',  // Ghana
    '234': '🇳🇬',  // Nigeria
    '235': '🇹🇩',  // Chad
    '236': '🇨🇫',  // Central African Republic
    '237': '🇨🇲',  // Cameroon
    '238': '🇨🇻',  // Cape Verde
    '239': '🇸🇹',  // Sao Tome
    '240': '🇬🇶',  // Equatorial Guinea
    '241': '🇬🇦',  // Gabon
    '242': '🇨🇬',  // Congo
    '243': '🇨🇩',  // DR Congo
    '244': '🇦🇴',  // Angola
    '245': '🇬🇼',  // Guinea-Bissau
    '246': '🇮🇴',  // British Indian Ocean
    '248': '🇸🇨',  // Seychelles
    '249': '🇸🇩',  // Sudan
    '250': '🇷🇼',  // Rwanda
    '251': '🇪🇹',  // Ethiopia
    '252': '🇸🇴',  // Somalia
    '253': '🇩🇯',  // Djibouti
    '254': '🇰🇪',  // Kenya
    '255': '🇹🇿',  // Tanzania
    '256': '🇺🇬',  // Uganda
    '257': '🇧🇮',  // Burundi
    '258': '🇲🇿',  // Mozambique
    '260': '🇿🇲',  // Zambia
    '261': '🇲🇬',  // Madagascar
    '262': '🇷🇪',  // Reunion
    '263': '🇿🇼',  // Zimbabwe
    '264': '🇳🇦',  // Namibia
    '265': '🇲🇼',  // Malawi
    '266': '🇱🇸',  // Lesotho
    '267': '🇧🇼',  // Botswana
    '268': '🇸🇿',  // Eswatini
    '269': '🇰🇲',  // Comoros
    '291': '🇪🇷',  // Eritrea
    '297': '🇦🇼',  // Aruba
    '298': '🇫🇴',  // Faroe Islands
    '299': '🇬🇱',  // Greenland
    '350': '🇬🇮',  // Gibraltar
    '351': '🇵🇹',  // Portugal
    '352': '🇱🇺',  // Luxembourg
    '353': '🇮🇪',  // Ireland
    '354': '🇮🇸',  // Iceland
    '355': '🇦🇱',  // Albania
    '356': '🇲🇹',  // Malta
    '357': '🇨🇾',  // Cyprus
    '358': '🇫🇮',  // Finland
    '359': '🇧🇬',  // Bulgaria
    '370': '🇱🇹',  // Lithuania
    '371': '🇱🇻',  // Latvia
    '372': '🇪🇪',  // Estonia
    '373': '🇲🇩',  // Moldova
    '374': '🇦🇲',  // Armenia
    '375': '🇧🇾',  // Belarus
    '376': '🇦🇩',  // Andorra
    '377': '🇲🇨',  // Monaco
    '378': '🇸🇲',  // San Marino
    '380': '🇺🇦',  // Ukraine
    '381': '🇷🇸',  // Serbia
    '382': '🇲🇪',  // Montenegro
    '383': '🇽🇰',  // Kosovo
    '385': '🇭🇷',  // Croatia
    '386': '🇸🇮',  // Slovenia
    '387': '🇧🇦',  // Bosnia
    '389': '🇲🇰',  // North Macedonia
    '420': '🇨🇿',  // Czech
    '421': '🇸🇰',  // Slovakia
    '423': '🇱🇮',  // Liechtenstein
    '500': '🇫🇰',  // Falkland Islands
    '501': '🇧🇿',  // Belize
    '502': '🇬🇹',  // Guatemala
    '503': '🇸🇻',  // El Salvador
    '504': '🇭🇳',  // Honduras
    '505': '🇳🇮',  // Nicaragua
    '506': '🇨🇷',  // Costa Rica
    '507': '🇵🇦',  // Panama
    '509': '🇭🇹',  // Haiti
    '591': '🇧🇴',  // Bolivia
    '592': '🇬🇾',  // Guyana
    '593': '🇪🇨',  // Ecuador
    '594': '🇬🇫',  // French Guiana
    '595': '🇵🇾',  // Paraguay
    '597': '🇸🇷',  // Suriname
    '598': '🇺🇾',  // Uruguay
    '599': '🇨🇼',  // Curacao
    '672': '🇦🇶',  // Antarctica
    '673': '🇧🇳',  // Brunei
    '674': '🇳🇷',  // Nauru
    '675': '🇵🇬',  // Papua New Guinea
    '676': '🇹🇴',  // Tonga
    '677': '🇸🇧',  // Solomon Islands
    '678': '🇻🇺',  // Vanuatu
    '679': '🇫🇯',  // Fiji
    '680': '🇵🇼',  // Palau
    '681': '🇼🇫',  // Wallis and Futuna
    '682': '🇨🇰',  // Cook Islands
    '685': '🇼🇸',  // Samoa
    '686': '🇰🇮',  // Kiribati
    '687': '🇳🇨',  // New Caledonia
    '688': '🇹🇻',  // Tuvalu
    '689': '🇵🇫',  // French Polynesia
    '690': '🇹🇰',  // Tokelau
    '691': '🇫🇲',  // Micronesia
    '692': '🇲🇭',  // Marshall Islands
    '850': '🇰🇵',  // North Korea
    '852': '🇭🇰',  // Hong Kong
    '853': '🇲🇴',  // Macau
    '855': '🇰🇭',  // Cambodia
    '856': '🇱🇦',  // Laos
    '880': '🇧🇩',  // Bangladesh
    '886': '🇹🇼',  // Taiwan
    '960': '🇲🇻',  // Maldives
    '961': '🇱🇧',  // Lebanon
    '962': '🇯🇴',  // Jordan
    '963': '🇸🇾',  // Syria
    '964': '🇮🇶',  // Iraq
    '965': '🇰🇼',  // Kuwait
    '966': '🇸🇦',  // Saudi Arabia
    '967': '🇾🇪',  // Yemen
    '968': '🇴🇲',  // Oman
    '970': '🇵🇸',  // Palestine
    '971': '🇦🇪',  // UAE
    '972': '🇮🇱',  // Israel
    '973': '🇧🇭',  // Bahrain
    '974': '🇶🇦',  // Qatar
    '975': '🇧🇹',  // Bhutan
    '976': '🇲🇳',  // Mongolia
    '977': '🇳🇵',  // Nepal
    '992': '🇹🇯',  // Tajikistan
    '993': '🇹🇲',  // Turkmenistan
    '994': '🇦🇿',  // Azerbaijan
    '995': '🇬🇪',  // Georgia
    '996': '🇰🇬',  // Kyrgyzstan
    '998': '🇺🇿',  // Uzbekistan
  };
  return flagMap[countryCode] || '🌍';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get country code from E.164 number for flag display
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractCountryCode(e164Phone: string): string {
  if (!e164Phone.startsWith('+')) return '';
  const digits = e164Phone.replace(/\D/g, '');
  // Try longest match first (3-digit codes)
  const threeDigit = digits.substring(0, 3);
  const twoDigit = digits.substring(0, 2);
  const oneDigit = digits.substring(0, 1);
  
  // Known 3-digit codes
  const threeDigitCodes = ['212','213','216','218','220','221','222','223','224','225','226','227','228','229','230','231','232','233','234','235','236','237','238','239','240','241','242','243','244','245','246','248','249','250','251','252','253','254','255','256','257','258','260','261','262','263','264','265','266','267','268','269','291','297','298','299','350','351','352','353','354','355','356','357','358','359','370','371','372','373','374','375','376','377','378','380','381','382','383','385','386','387','389','420','421','423','500','501','502','503','504','505','506','507','509','591','592','593','594','595','597','598','599','672','673','674','675','676','677','678','679','680','681','682','685','686','687','688','689','690','691','692','850','852','853','855','856','880','886','960','961','962','963','964','965','966','967','968','970','971','972','973','974','975','976','977','992','993','994','995','996','998'];
  if (threeDigitCodes.includes(threeDigit)) return threeDigit;
  
  // Known 2-digit codes (and single digit)
  const twoDigitCodes = ['20','27','30','31','32','33','34','36','39','40','41','43','44','45','46','47','48','49','51','52','54','55','56','57','58','60','61','62','63','64','65','66','81','82','84','86','90','91','92','93','94','95','98'];
  if (twoDigitCodes.includes(twoDigit)) return twoDigit;
  
  // Single digit (US/Canada)
  if (['1','7'].includes(oneDigit)) return oneDigit;
  
  return twoDigit; // fallback guess
}

function formatToE164(rawPhone: string, merchantPhone: string): string {
  // Clean all non-digit characters except leading +
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  
  // If already has +, assume it's E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Known country codes (ordered longest-first for correct matching)
  const knownCountryCodes = [
    '971', '966', '965', '964', '963', '962', '961', '960', // Middle East
    '994', '993', '992',  // Central Asia
    '977', '975', '974', '973',  // South Asia / Gulf
    '880',  // Bangladesh
    '94',   // Sri Lanka
    '92',   // Pakistan
    '91',   // India
    '90',   // Turkey
    '86',   // China
    '82',   // South Korea
    '81',   // Japan
    '66',   // Thailand
    '65',   // Singapore
    '63',   // Philippines
    '62',   // Indonesia
    '61',   // Australia
    '60',   // Malaysia
    '55',   // Brazil
    '49',   // Germany
    '48',   // Poland
    '47',   // Norway
    '46',   // Sweden
    '45',   // Denmark
    '44',   // UK
    '43',   // Austria
    '41',   // Switzerland
    '39',   // Italy
    '34',   // Spain
    '33',   // France
    '31',   // Netherlands
    '27',   // South Africa
    '20',   // Egypt
    '1',    // US/Canada
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
    // Validate: for Pakistan (92), full number should be 12 digits (92 + 10 digits)
    if (merchantCountryCode === '92' && cleaned.length !== 12) {
      // If too long, the number likely doesn't start with the country code — it's a local number
      if (cleaned.length > 12) {
        // Strip the apparent country code prefix and re-add it
        return `+${merchantCountryCode}${cleaned}`;
      }
    }
    return `+${cleaned}`;
  }
  
  // Otherwise, prepend the merchant's country code
  const result = `+${merchantCountryCode}${cleaned}`;
  
  // Log for debugging
  console.log(`📱 formatToE164: "${rawPhone}" → "${result}" (country code: ${merchantCountryCode}, merchant: ${merchantPhone})`);
  
  return result;
}

