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

    if (!from) return NextResponse.json({});

    console.log(`📥 Message from ${from} to ${to}: "${body}" (Media: ${numMedia})`);

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
        await saveDraft(from, { customerName: name, customerPhone: phoneMatch[1] });
      } else {
        await saveDraft(from, { voice_note: body });
      }
    }

    if (mediaUrl0 && numMedia > 0) {
      console.log('💾 Saving image draft:', mediaUrl0);
      await saveDraft(from, { imageUrl: mediaUrl0 });
    }

    return await sendTwilioMessage(from, "✅ *Saved.*\n\nSend more photos or type *POST* when ready.", to);

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function saveDraft(phone: string, data: any) {
  const { data: existing } = await supabase
    .from('pending_posts')
    .select('id, images, customer_phone')
    .eq('user_phone', phone)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

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
    // MESSAGE 1: Send the full AI post text directly in WhatsApp
    // User can long-press to copy — NO redirect to any page
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const fullPostText = `📋 *COPY THIS POST:*\n\n*${parsed.headline}*\n\n${parsed.body}\n\n${parsed.cta}\n\n${parsed.hashtags}\n\n_👆 Long press this message → Copy_`;

    await sendTwilioMessage(phone, fullPostText, fromNumber);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MESSAGE 2: Send Images as WhatsApp media (user saves directly to gallery)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const imagesToSend = draft.images.slice(0, 5);
    for (let i = 0; i < imagesToSend.length; i++) {
      try {
        await sendTwilioMedia(phone, imagesToSend[i], `📸 Photo ${i+1}/${imagesToSend.length} — Tap to save to gallery`, fromNumber);
      } catch (mediaError) {
        console.error('❌ Media send error:', mediaError);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MESSAGE 3: Image download links + GBP post link
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const appUrl = 'https://neerzy.com';

    // Image download links
    const imageDownloadLinks = imagesToSend.map((img: string, i: number) =>
      `${appUrl}/api/download-image?url=${encodeURIComponent(img)}&name=neerzy-photo-${i + 1}.jpg`
    );

    // GBP post link — use Google Business Profile dashboard (always works)
    let gbpLink = 'https://business.google.com/';
    try {
      const { data: business } = await supabase
        .from('business_profiles')
        .select('google_place_id')
        .eq('user_phone', phone)
        .maybeSingle();

      if (business?.google_place_id) {
        // Direct link to Google Maps listing (user can click "Add update" from there)
        gbpLink = `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`;
      }
    } catch (dbErr) {
      console.warn('⚠️ Could not fetch GBP link:', dbErr);
    }

    // Build links message
    let linksMessage = `✅ *Your post is ready!*\n\n`;
    linksMessage += `🖼️ *Download Images:*\n`;
    imageDownloadLinks.forEach((link: string, i: number) => {
      linksMessage += `Photo ${i + 1}: ${link}\n`;
    });
    linksMessage += `\n🌐 *Open Google Business Profile:*\n${gbpLink}\n\n`;
    linksMessage += `📌 *Steps:*\n1. Copy the post text above\n2. Save photos from chat\n3. Tap GBP link → Add Update → Paste & Upload\n\n`;
    linksMessage += `✅ Type *DONE* when published to send review request to your customer.`;

    return await sendTwilioMessage(phone, linksMessage, fromNumber);

  } catch (error: any) {
    console.error('❌ handleGeneratePost error:', error);
    return await sendTwilioMessage(phone, `❌ Error: ${error.message}\n\nPlease try again.`, fromNumber);
  }
}

async function handleSendReview(phone: string, fromNumber?: string) {
  try {
    const { data: post } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('user_phone', phone)
      .eq('status', 'generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!post?.customer_phone) {
      return await sendTwilioMessage(phone, "⚠️ *No pending generated post found.*", fromNumber);
    }

    // 🔍 Dynamic Lookup: Find this business profile's actual connected Google Maps review link
    let reviewLink = 'https://g.page/r/your-review-link';
    try {
      const { data: business } = await supabase
        .from('business_profiles')
        .select('review_link')
        .eq('user_phone', phone)
        .maybeSingle();

      if (business?.review_link) {
        reviewLink = business.review_link;
        console.log(`✅ Loaded connected Google review link: "${reviewLink}"`);
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to load dynamic review link from business_profiles, using default fallback.', dbError);
    }

    // Send Review Request Template using dynamic review link
    await sendTwilioTemplate(post.customer_phone, process.env.TWILIO_TEMPLATE_REVIEW_REQUEST!, {
      '1': post.customer_name || 'Customer',
      '2': reviewLink
    }, fromNumber);

    await supabase.from('pending_posts').update({ status: 'published' }).eq('id', post.id);

    return await sendTwilioMessage(phone, `✅ *Review sent to ${post.customer_name}!*`, fromNumber);

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
