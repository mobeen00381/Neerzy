import { NextResponse } from "next/server";
import { postToGMB } from "@/lib/gmb";
import { createClient } from "@supabase/supabase-js";
import { chatWithFallback, getTranscriptionClient, DEFAULT_ASR_MODEL, ASR_MAX_SECONDS } from "@/lib/openai";
import { estimateAudioSeconds } from "@/lib/audio-duration";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    // Parse Meta WhatsApp webhook JSON payload
    const data = await req.json();
    const messages = data?.entry?.[0]?.changes?.[0]?.value?.messages;
    const contacts = data?.entry?.[0]?.changes?.[0]?.value?.contacts;
    
    if (!messages?.length) {
      console.log('📡 Non-message event, ignoring');
      return NextResponse.json({ status: 'ok' });
    }
    
    const message = messages[0];
    const from = message?.from || '';
    const bodyText = message?.text?.body || '';
    const messageType = message?.type || 'text';

    // Handle media (image/audio)
    let mediaUrl = '';
    let mediaType = '';
    if (['image', 'audio', 'video', 'document'].includes(messageType) && message[messageType]) {
      const mediaId = message[messageType]?.id;
      mediaType = message[messageType]?.mime_type || messageType;
      if (mediaId) {
        const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || '';
        mediaUrl = `https://graph.facebook.com/v22.0/${mediaId}`;
      }
    }

    const numMedia = mediaUrl ? 1 : 0;

    console.log(`📡 [WhatsApp Webhook] Received from ${from}. Media files: ${numMedia}`);

    // STEP 0: Identify User by Phone Number
    const cleanPhone = from; // Meta already sends clean number without prefix

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_phone", cleanPhone)
      .single();

    if (userError || !user) {
      console.warn(`⚠️ [WhatsApp] User not found for number: ${cleanPhone}`);
      let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.neerzy.com';
      if (appUrl.includes('vercel.app')) {
        appUrl = 'https://www.neerzy.com';
      }
      appUrl = appUrl.replace(/\/$/, '');

      const registerMessage = `Welcome to Neerzy! 👷‍♂️ It looks like your number isn't registered yet. \n\nPlease log in to your dashboard at ${appUrl}/login and add your phone number in settings to start posting!`;
      
      // Meta uses JSON, not TwiML XML
      return NextResponse.json({ message: registerMessage });
    }

    console.log(`👤 Found user: ${user.email} (${user.business_name})`);

    let rawContent = bodyText || "";

    // STEP 1: Process Audio (Voice Notes) or Images

    if (numMedia > 0) {
      console.log(`Processing media: ${mediaType} from ${mediaUrl}`);

      if (mediaType.includes("audio")) {
        // --- VOICE NOTE LOGIC (GLM-ASR) ---
        try {
          // Download audio from Meta
          const headers: HeadersInit = {};
          if (process.env.META_WHATSAPP_ACCESS_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}`;
          }
          const audioResponse = await fetch(mediaUrl, { headers });
          const buffer = await audioResponse.arrayBuffer();
          
          // 🔒 GLM-ASR hard 30s lock — reject longer voice notes before calling the API
          const estSeconds = estimateAudioSeconds(buffer, mediaType);
          if (estSeconds !== null && estSeconds > ASR_MAX_SECONDS) {
            console.warn(`🎙️ Voice note too long (${estSeconds.toFixed(1)}s > ${ASR_MAX_SECONDS}s), rejected`);
            rawContent = `[Voice note too long — max ${ASR_MAX_SECONDS}s]`;
          } else {
            const transcription = await getTranscriptionClient().audio.transcriptions.create({
              file: new File([buffer], "audio.ogg", { type: mediaType }),
              model: DEFAULT_ASR_MODEL,
            });
            rawContent = `[Transcribed Voice Note]: ${transcription.text}`;
            console.log("✅ Voice Note Transcribed:", transcription.text);
          }
        } catch (err) {
          console.error("❌ GLM-ASR Transcription Failed:", err);
          rawContent = `[Voice Note received but failed to transcribe]`;
        }
        
      } else if (mediaType.includes("image")) {
        // --- IMAGE RECOGNITION LOGIC (Vision) ---
        try {
          const response = await chatWithFallback({
            messages: [
              { role: "user", content: [
                  { type: "text", text: "Describe this image in detail. What local service job is being performed? Focus on technical details of the work done." },
                  { type: "image_url", image_url: { url: mediaUrl } }
                ]
              }
            ]
          }, { vision: true });
          rawContent = `[Image Analysis]: ${response.choices[0].message.content || ""}`;
          console.log("✅ Image Analyzed by Vision AI.");
        } catch (err) {
          console.error("❌ Vision AI Failed:", err);
          rawContent = `[Image received but failed to analyze]`;
        }
      }
    }

    if (!rawContent || rawContent.length < 5) {
      return NextResponse.json({ message: "We couldn't read that! Please send a voice note, photo, or at least 5 characters of text describing your job." }, { status: 400 });
    }

    // STEP 2: Generate SEO & GMB Optimized Content
    console.log("🤖 Generating SEO & GMB content...");
    
    const seoContent = await chatWithFallback({
      response_format: { type: "json_object" },
      messages: [
        { 
          role: "system", 
          content: `You are an expert local SEO copywriter. You turn raw notes/images into:
1. A catchy SEO Title.
2. Professional website HTML (2-3 paragraphs with <p> tags).
3. A short, engaging Google My Business post with emojis.
Return JSON: {"seoTitle": "...", "websiteHtml": "...", "gmbPost": "..."}`
        },
        { role: "user", content: `Business Name: ${user.business_name}. Service Type: ${user.service_type}. Content: ${rawContent}` }
      ]
    });

    const contentData = JSON.parse(seoContent.choices[0].message.content || "{}");
    const { seoTitle, websiteHtml, gmbPost } = contentData;

    // STEP 3: Publish to Website (Supabase) & GMB
    console.log("💾 Saving post to database...");
    
    const { data: postData, error: postError } = await supabase.from("posts").insert([
      {
        user_id: user.id,
        title: seoTitle || "New Project Update",
        content: websiteHtml || `<p>${rawContent}</p>`,
        status: "published"
      }
    ]).select().single();

    if (postError) {
      console.error("❌ Failed to save post:", postError);
    } else {
      console.log("✅ Post saved successfully.");
    }

    // STEP 4: Fire to Google My Business API
    if (user.gmb_refresh_token && user.gmb_location_id) {
      try {
        console.log("📡 Publishing to Google Business Profile...");
        await postToGMB(user.gmb_refresh_token, user.gmb_location_id, gmbPost || rawContent);
        console.log("✅ GMB Post Published!");
      } catch (gmbErr) {
        console.error("❌ GMB Publishing Failed:", gmbErr);
      }
    } else {
      console.warn("⚠️ GMB not connected for this user. Skipping GMB post.");
    }

    // STEP 5: Reply to User on WhatsApp
    const replyMessage = `Boom! 🚀 We just updated your website and Google My Business.\n\n*SEO Title:* ${seoTitle}\n\n*GMB Post:* ${gmbPost}\n\nView it live: ${user.domain}/blog`;

    return NextResponse.json({ message: replyMessage });

  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    return NextResponse.json({ message: "Oops, something went wrong processing your update." }, { status: 500 });
  }
}
