import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Twilio sends form-data, not JSON
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const from = (formData.get('From') as string)?.replace('whatsapp:', '') || '';
    const bodyText = (formData.get('Body') as string) || '';
    const numMedia = parseInt(formData.get('NumMedia') as string || '0', 10);
    const mediaUrl = formData.get('MediaUrl0') as string;
    
    if (!from) return NextResponse.json({});

    console.log('📥 Received from:', from);
    console.log('📝 Body:', bodyText);
    console.log('🖼️ Media:', numMedia > 0 ? mediaUrl : 'None');

    // -------------------------------------------------------
    // INTENT 1: TEXT COMMANDS & SAVES
    // -------------------------------------------------------
    if (bodyText) {
      const textUpper = bodyText.toUpperCase().trim();

      if (textUpper === 'POST') {
        return await handleGeneratePost(from);
      }

      if (textUpper === 'DONE') {
        return await handleSendReview(from);
      }

      // Save customer info: "Mike +923..."
      const phoneMatch = bodyText.match(/(\+?\d{10,15})/);
      if (phoneMatch) {
        const name = bodyText.replace(phoneMatch[1], '').trim() || 'Customer';
        await saveDraft(from, {
          customerName: name,
          customerPhone: phoneMatch[1]
        });
      } else {
        await saveDraft(from, { voice_note: bodyText });
      }
    }

    // -------------------------------------------------------
    // INTENT 2: IMAGE SAVE
    // -------------------------------------------------------
    if (mediaUrl && numMedia > 0) {
      // Twilio media URLs need auth to download, but we can store them directly
      // For simplicity, we store the Twilio media URL
      await saveDraft(from, { imageUrl: mediaUrl });
    }

    // Confirmation Reply
    return await sendTwilioMessage(from, "✅ *Saved.*\n\nSend more photos or type *POST* when ready.");

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Save to Supabase
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

// Generate Post
async function handleGeneratePost(phone: string) {
  const { data: draft } = await supabase
    .from('pending_posts')
    .select('*')
    .eq('user_phone', phone)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!draft || !draft.images?.length) {
    return await sendTwilioMessage(phone, "⚠️ *No images found.*\n\nSend photos first, then type *POST*.");
  }

  // AI Call
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Create Google Post for ${draft.customer_name || 'Client'}. Job details/description: ${draft.voice_note || 'Job completed successfully'}.
      Format:
      HEADLINE: (max 40 chars)
      BODY: (max 250 chars)
      CTA: (short)
      HASHTAGS: (3 max)`
    }]
  });

  const postContent = aiResponse.choices[0].message.content || '';
  const parsed = parsePostContent(postContent);

  await supabase.from('pending_posts').update({
    google_post: postContent,
    status: 'generated'
  }).eq('id', draft.id);

  // Send Template
  await sendTwilioTemplate(phone, process.env.TWILIO_TEMPLATE_POST_READY!, {
    '1': parsed.headline,
    '2': parsed.body,
    '3': parsed.cta,
    '4': parsed.hashtags
  });

  // Send Images
  for (let i = 0; i < draft.images.length; i++) {
    await sendTwilioMedia(phone, draft.images[i], `📎 Image ${i+1}/${draft.images.length}`);
  }

  return await sendTwilioMessage(phone, `📋 *To Publish:*\n1. Copy text above\n2. Download images\n3. Post to Google\n\n✅ Type *DONE* when published.`);
}

// Send Review
async function handleSendReview(phone: string) {
  const { data: post } = await supabase
    .from('pending_posts')
    .select('*')
    .eq('user_phone', phone)
    .eq('status', 'generated')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!post?.customer_phone) {
    return await sendTwilioMessage(phone, "⚠️ *No pending post found.*");
  }

  await sendTwilioTemplate(post.customer_phone, process.env.TWILIO_TEMPLATE_REVIEW_REQUEST!, {
    '1': post.customer_name || 'Customer',
    '2': 'https://g.page/r/your-review-link'
  });

  await supabase.from('pending_posts').update({ status: 'published' }).eq('id', post.id);

  return await sendTwilioMessage(phone, `✅ *Review sent to ${post.customer_name}!*`);
}

// Helpers
async function sendTwilioMessage(to: string, text: string) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917',
    to: `whatsapp:${to}`,
    body: text
  });
  return NextResponse.json({ success: true });
}

async function sendTwilioTemplate(to: string, sid: string, vars: any) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917',
    to: `whatsapp:${to}`,
    contentSid: sid,
    contentVariables: JSON.stringify(vars)
  });
  return NextResponse.json({ success: true });
}

async function sendTwilioMedia(to: string, url: string, caption: string) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917',
    to: `whatsapp:${to}`,
    body: caption,
    mediaUrl: [url]
  });
  return NextResponse.json({ success: true });
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
