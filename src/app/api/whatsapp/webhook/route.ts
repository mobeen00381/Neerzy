import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import twilio from 'twilio';

// ✅ Use correct server-side env vars from your .env
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// GET - Health Check / Verification
export async function GET(req: Request) {
  return new NextResponse('OK', { status: 200 });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Parse parameters from the inbound Twilio form-encoded payload
    const from = (formData.get('From') as string)?.replace('whatsapp:', '') || '';
    const to = (formData.get('To') as string) || '';
    const body = (formData.get('Body') as string) || '';
    const numMedia = parseInt(formData.get('NumMedia') as string || '0', 10);
    const mediaUrl0 = formData.get('MediaUrl0') as string;
    const mediaContentType0 = formData.get('MediaContentType0') as string;

    if (!from) return NextResponse.json({});

    console.log(`📥 Message from ${from} to ${to}: "${body}" (Media: ${numMedia})`);

    let savedType = 'Message';
    let customInstructions = 'Send more photos or type *POST* when ready.';

    if (body) {
      const text = body.toUpperCase().trim();

      if (text === 'POST') {
        return await handleGeneratePost(from, to);
      }

      if (text === 'DONE') {
        return await handleSendReview(from, to);
      }

      // Check if message matches customer name and phone details: e.g. "John Doe +1234567890"
      const phoneMatch = body.match(/(\+?\d{10,15})/);

      if (phoneMatch) {
        const name = body.replace(phoneMatch[1], '').trim() || 'Customer';
        const formattedCustPhone = formatToE164(phoneMatch[1], from);
        const postState = await saveDraft(from, { customerName: name, customerPhone: formattedCustPhone });
        savedType = 'Customer detail for review link';
        if (postState === 'generated') {
          customInstructions = `Type *DONE* to send the review link to ${name} now.`;
        } else {
          customInstructions = `Type *DONE* to send the review link immediately, or send photos/voice notes to create a post.`;
        }
      } else {
        await saveDraft(from, { voice_note: body });
        savedType = 'Description';
      }
    }

    if (mediaUrl0 && numMedia > 0) {
      if (mediaContentType0 && mediaContentType0.includes('audio')) {
        console.log('🎙️ Received Voice Note:', mediaUrl0);
        try {
          const headers: HeadersInit = {};
          if (mediaUrl0.includes('api.twilio.com') && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
          }
          const audioResponse = await fetch(mediaUrl0, { headers });
          if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio from Twilio: ${audioResponse.status}`);
          }
          const buffer = await audioResponse.arrayBuffer();
          
          if (!process.env.OPENAI_API_KEY) {
            console.warn("No OPENAI_API_KEY, mocking voice note transcription");
            await saveDraft(from, { voice_note: "[Voice Note] Update recorded via WhatsApp" });
            savedType = 'Voice Note';
          } else {
            const transcription = await openai.audio.transcriptions.create({
              file: await (async () => {
                const f = new File([buffer], "audio.ogg", { type: mediaContentType0 });
                return f;
              })(),
              model: "whisper-1",
            });
            
            console.log('✅ Transcribed:', transcription.text);
            await saveDraft(from, { voice_note: transcription.text });
            savedType = 'Voice Note';
          }
        } catch (err) {
          console.error("❌ Whisper Transcription Failed:", err);
          await saveDraft(from, { voice_note: "[Voice note transcription failed]" });
          savedType = 'Voice Note';
        }
      } else {
        console.log('💾 Saving image draft:', mediaUrl0);
        await saveDraft(from, { imageUrl: mediaUrl0 });
        savedType = 'Photo';
      }
    }

    return await sendTwilioMessage(from, `✅ *${savedType} saved.*\n\n${customInstructions}`, to);

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function saveDraft(phone: string, data: any): Promise<string> {
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
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        images: [],
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({
        customer_name: data.customerName,
        customer_phone: data.customerPhone
      }).eq('id', existing.id);
    }
  }

  // Save voice_note (job details/description)
  if (data.voice_note) {
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        voice_note: data.voice_note,
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({
        voice_note: data.voice_note
      }).eq('id', existing.id);
    }
  }

  if (data.imageUrl) {
    const newImages = existing?.images ? [...existing.images, data.imageUrl] : [data.imageUrl];
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        images: newImages,
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({ images: newImages }).eq('id', existing.id);
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
      return await sendTwilioMessage(phone, "⚠️ *No active draft found.*\n\nSend details or photos first, then type *POST*.", fromNumber);
    }

    if (!draft.images?.length) {
      return await sendTwilioMessage(phone, "⚠️ *No images found.*\n\nSend photos first, then type *POST*.", fromNumber);
    }

    console.log('📊 Found draft with', draft.images.length, 'images. Generating post...');

    // AI Generation via OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Create a Google Post for ${draft.customer_name || 'Client'}. Job details: ${draft.voice_note || 'Completed successfully'}.
        Format:
        HEADLINE: (max 40 chars)
        BODY: (max 250 chars)
        CTA: (short)
        HASHTAGS: (3 max)`
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
        await sendTwilioMedia(phone, imagesToSend[i], `📸 Photo ${i+1}/${imagesToSend.length}`, fromNumber);
      } catch (mediaError) {
        console.error('❌ Media send error:', mediaError);
      }
    }

    // Notice about images download
    await sendTwilioMessage(phone, `📸 *Photos are sent above. Tap and save them directly to your phone's gallery!*`, fromNumber);

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

    await sendTwilioMessage(phone, formattedPostText, fromNumber);

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
    await sendTwilioMessage(phone, gbpMessage, fromNumber);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Send fallback link to Dashboard directly
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.neerzy.com';
    if (appUrl.includes('vercel.app')) {
      appUrl = 'https://www.neerzy.com';
    }
    appUrl = appUrl.replace(/\/$/, '');

    const actionMessage = `👉 *Or manage via Dashboard:*
${appUrl}/dashboard

Type *DONE* when published.`;

    return await sendTwilioMessage(phone, actionMessage, fromNumber);

  } catch (error: any) {
    console.error('❌ handleGeneratePost error:', error);
    return await sendTwilioMessage(phone, `❌ Error: ${error.message}\n\nPlease try again.`, fromNumber);
  }
}

async function handleSendReview(phone: string, fromNumber?: string) {
  try {
    // 1. Try to find the last generated post
    const { data: generatedPost } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('user_phone', phone)
      .eq('status', 'generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Try to find the last draft post that has customer details (so they can send directly)
    const { data: draftPost } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('user_phone', phone)
      .eq('status', 'draft')
      .not('customer_phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let post = null;
    if (generatedPost && draftPost) {
      const genTime = new Date(generatedPost.created_at).getTime();
      const draftTime = new Date(draftPost.created_at).getTime();
      post = genTime >= draftTime ? generatedPost : draftPost;
    } else {
      post = generatedPost || draftPost;
    }

    if (!post) {
      return await sendTwilioMessage(phone, "⚠️ *No pending generated post or review draft found.*", fromNumber);
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
      return await sendTwilioMessage(phone, "⚠️ *No Google Business Profile connected.* Please connect your GBP first at https://www.neerzy.com/onboarding", fromNumber);
    }

    // Mark post as published
    await supabase.from('pending_posts').update({ status: 'published' }).eq('id', post.id);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. Send Review Request
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const businessName = business?.business_name || 'Your Connected Business';
    const rawCustomerPhone = post.customer_phone || phone; // Fallback to self-send if missing
    const targetCustomerPhone = formatToE164(rawCustomerPhone, phone);
    const customerName = (post.customer_name || 'Customer').replace(/[\n\r]+/g, ' ').trim();
    
    // Send the approved Twilio WhatsApp Template to prevent Error 63016 (no session window)
    const templateSid = process.env.TWILIO_TEMPLATE_REVIEW_REQUEST || 'HX36dc564715671fad2b3617c795984ee2';
    const templateVars = {
      "1": customerName,
      "2": businessName,
      "3": reviewLink
    };

    // Use the billing-enabled toll-free number for sending the template review request to prevent Error 63020
    let billingFrom = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+18338872999';
    if (!billingFrom.startsWith('whatsapp:')) {
      billingFrom = `whatsapp:${billingFrom}`;
    }

    await sendTwilioTemplate(targetCustomerPhone, templateSid, templateVars, billingFrom);

    // If it's a real customer (not sending to yourself), send a confirmation to the merchant
    const cleanCustomerPhone = targetCustomerPhone.replace(/\D/g, '');
    const cleanMerchantPhone = phone.replace(/\D/g, '');
    const isSelfSend = cleanCustomerPhone === cleanMerchantPhone || (cleanCustomerPhone.length >= 8 && cleanMerchantPhone.endsWith(cleanCustomerPhone.slice(-8)));

    if (!isSelfSend) {
      const confirmMessage = `✅ *Review request sent to ${customerName}!*\n\n🔗 Review link: ${reviewLink}`;
      await sendTwilioMessage(phone, confirmMessage, fromNumber);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ handleSendReview error:', error);
    return await sendTwilioMessage(phone, `❌ Error: ${error.message}`, fromNumber);
  }
}

async function sendTwilioMessage(to: string, text: string, fromNumber?: string) {
  try {
    // Check both TWILIO_PHONE_NUMBER and TWILIO_WHATSAPP_NUMBER for env robustness
    const defaultFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917';
    const from = fromNumber || defaultFrom;
    console.log('📤 Sending message to:', to, 'from:', from);
    
    const message = await twilioClient.messages.create({
      from: from,
      to: `whatsapp:${to}`,
      body: text
    });
    
    console.log('✅ Message sent! SID:', message.sid);
    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error: any) {
    console.error('❌ sendTwilioMessage error:', error.message);
    throw error;
  }
}

async function sendTwilioTemplate(to: string, sid: string, vars: any, fromNumber?: string) {
  try {
    const defaultFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917';
    const from = fromNumber || defaultFrom;
    console.log('📤 Sending template SID:', sid, 'to:', to, 'from:', from);
    
    const message = await twilioClient.messages.create({
      from: from,
      to: `whatsapp:${to}`,
      contentSid: sid,
      contentVariables: JSON.stringify(vars)
    });
    
    console.log('✅ Template sent! SID:', message.sid);
  } catch (error: any) {
    console.error('❌ sendTwilioTemplate error:', error.message);
    throw error;
  }
}

async function sendTwilioMedia(to: string, url: string, caption: string, fromNumber?: string) {
  try {
    const defaultFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917';
    const from = fromNumber || defaultFrom;
    console.log('📤 Sending media:', url, 'from:', from);
    
    const message = await twilioClient.messages.create({
      from: from,
      to: `whatsapp:${to}`,
      body: caption,
      mediaUrl: [url]
    });
    
    console.log('✅ Media sent! SID:', message.sid);
  } catch (error: any) {
    console.error('❌ sendTwilioMedia error:', error.message);
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

function formatToE164(rawPhone: string, merchantPhone: string): string {
  // Clean all non-digit characters except leading +
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Extract merchant's country code if available
  let merchantCountryCode = '92'; // default to Pakistan (since Neerzy is PK/Traders focused)
  if (merchantPhone.startsWith('+')) {
    const match = merchantPhone.match(/^\+(\d{1,4})/);
    if (match) {
      merchantCountryCode = match[1];
    }
  }
  
  // Handle leading 0 (common in local dialing formats like 0300... in PK, 07... in UK, etc.)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // If the cleaned number already starts with the country code (without the +)
  if (cleaned.startsWith(merchantCountryCode)) {
    return `+${cleaned}`;
  }
  
  // Otherwise, prepend the merchant's country code
  return `+${merchantCountryCode}${cleaned}`;
}
