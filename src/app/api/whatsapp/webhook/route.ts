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

// GET - Health check / verification
export async function GET(req: Request) {
  return new NextResponse('OK', { status: 200 });
}

// POST - Main WhatsApp Handler (Twilio Inbound)
export async function POST(req: Request) {
  try {
    let from = '';
    let textBody = '';
    let mediaUrl = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      from = (body.From || '').replace('whatsapp:', '').trim();
      textBody = body.Body || '';
      mediaUrl = body.MediaUrl0 || '';
    } else {
      const formData = await req.formData();
      from = (formData.get('From') as string || '').replace('whatsapp:', '').trim();
      textBody = formData.get('Body') as string || '';
      mediaUrl = formData.get('MediaUrl0') as string || '';
    }
    
    if (!from) {
      return NextResponse.json({});
    }

    // Handle text messages
    if (textBody) {
      const text = textBody.toUpperCase().trim();

      if (text === 'POST') {
        return await handleGeneratePost(from);
      }

      if (text === 'DONE') {
        return await handleSendReview(from);
      }

      // Save customer info or notes
      await saveDraft(from, { type: 'text', body: textBody });
    }

    // Handle media (images)
    if (mediaUrl) {
      await saveDraft(from, { type: 'image', url: mediaUrl });
    }

    // Confirmation reply
    return await sendTwilioMessage(from, {
      body: "✅ *Saved.*\n\nSend more photos or type *POST* when ready."
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({});
  }
}

// Save draft to database
async function saveDraft(phone: string, data: any) {
  const { data: existing } = await supabase
    .from('pending_posts')
    .select('id, images, customer_phone')
    .eq('user_phone', phone)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data.type === 'text') {
    const textBody = data.text?.body || data.body || '';
    // Extract customer info: "Mike +923006291617"
    const phoneMatch = textBody.match(/(\+?\d{10,15})/);
    if (phoneMatch) {
      const customerName = textBody.replace(phoneMatch[1], '').trim() || 'Customer';
      
      if (!existing) {
        await supabase.from('pending_posts').insert({
          user_phone: phone,
          customer_name: customerName,
          customer_phone: phoneMatch[1],
          images: [],
          status: 'draft'
        });
      } else {
        await supabase.from('pending_posts').update({
          customer_name: customerName,
          customer_phone: phoneMatch[1]
        }).eq('id', existing.id);
      }
    } else {
      // Save text description as a note
      if (!existing) {
        await supabase.from('pending_posts').insert({
          user_phone: phone,
          voice_note: textBody,
          status: 'draft'
        });
      } else {
        await supabase.from('pending_posts').update({
          voice_note: textBody
        }).eq('id', existing.id);
      }
    }
  }
  
  if (data.type === 'image') {
    const newImages = existing?.images ? [...existing.images, data.url] : [data.url];
    
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        images: newImages,
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({
        images: newImages
      }).eq('id', existing.id);
    }
  }

  if (data.type === 'audio') {
    if (!existing) {
      await supabase.from('pending_posts').insert({
        user_phone: phone,
        voice_note: data.url,
        status: 'draft'
      });
    } else {
      await supabase.from('pending_posts').update({
        voice_note: data.url
      }).eq('id', existing.id);
    }
  }
}

// Generate AI Post & Send via Twilio Template
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
    return await sendTwilioMessage(phone, {
      body: "⚠️ *No images found.*\n\nSend photos first, then type *POST*."
    });
  }

  // AI Generation
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Create Google Post for ${draft.customer_name || 'Customer'}'s job. Job details/description: ${draft.voice_note || 'Job completed successfully'}.
      Format:
      HEADLINE: (max 40 chars)
      BODY: (max 250 chars)
      CTA: (short)
      HASHTAGS: (3 max)`
    }]
  });

  const postContent = aiResponse.choices[0].message.content || '';
  const parsed = parsePostContent(postContent);

  // Save generated post
  await supabase.from('pending_posts').update({
    google_post: postContent,
    status: 'generated'
  }).eq('id', draft.id);

  // Send using APPROVED TEMPLATE: neerzy_ai_post_ready
  await sendTwilioTemplate(phone, 
    process.env.TWILIO_TEMPLATE_POST_READY!,
    {
      '1': parsed.headline,
      '2': parsed.body,
      '3': parsed.cta,
      '4': parsed.hashtags
    }
  );

  // Send images as media
  for (let i = 0; i < draft.images.length; i++) {
    await sendTwilioMessage(phone, {
      body: `📎 Image ${i+1}/${draft.images.length}`,
      mediaUrl: [draft.images[i]]
    });
  }

  // Instructions
  return await sendTwilioMessage(phone, {
    body: `📋 *To Publish:*

1. Copy text from template above
2. Download all images (tap each)
3. Open Google Business app
4. Paste + Upload
5. Click "Post"

✅ When done, type *DONE* to send review to ${draft.customer_name}.`
  });
}

// Send Review Request via Twilio Template
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
    return await sendTwilioMessage(phone, {
      body: "⚠️ *No pending post.*\n\nStart a new job first."
    });
  }

  // Send using APPROVED TEMPLATE: neerzy_review_request
  await sendTwilioTemplate(post.customer_phone,
    process.env.TWILIO_TEMPLATE_REVIEW_REQUEST!,
    {
      '1': post.customer_name || 'Customer',
      '2': 'https://g.page/r/your-business-review-link'
    }
  );

  // Mark as published
  await supabase.from('pending_posts').update({
    status: 'published'
  }).eq('id', post.id);

  return await sendTwilioMessage(phone, {
    body: `✅ *Review sent!*

👤 To: ${post.customer_name}
📱 ${post.customer_phone}

🎯 Ready for next job?`
  });
}

// Send regular WhatsApp message
async function sendTwilioMessage(to: string, content: any) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917',
    to: `whatsapp:${to}`,
    ...content
  });
  return NextResponse.json({});
}

// Send template message
async function sendTwilioTemplate(to: string, templateSid: string, variables: any) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917',
    to: `whatsapp:${to}`,
    contentSid: templateSid,
    contentVariables: JSON.stringify(variables)
  });
  return NextResponse.json({});
}

// Helper functions
function parsePostContent(content: string) {
  const lines = content.split('\n');
  return {
    headline: extractLine(lines, 'HEADLINE:') || 'Great Work!',
    body: extractLine(lines, 'BODY:') || 'Job completed successfully.',
    cta: extractLine(lines, 'CTA:') || 'Contact us!',
    hashtags: extractLine(lines, 'HASHTAGS:') || '#Service',
    full: content
  };
}

function extractLine(lines: string[], prefix: string) {
  const line = lines.find(l => l.toUpperCase().includes(prefix.toUpperCase()));
  return line ? line.replace(new RegExp(prefix, 'i'), '').trim() : '';
}

