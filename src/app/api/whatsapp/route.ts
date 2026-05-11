import { NextResponse } from "next/server";
import OpenAI from "openai";
import { postToGMB } from "@/lib/gmb";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Lazy OpenAI init — safe for Vercel builds without env vars
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

export async function POST(req: Request) {
  try {
    // Twilio sends data as form-urlencoded
    const formData = await req.formData();
    const from = formData.get("From") as string; // User's WhatsApp number e.g., "whatsapp:+1234567890"
    const bodyText = formData.get("Body") as string; // Any text they typed
    const numMedia = parseInt(formData.get("NumMedia") as string || "0");

    console.log(`📡 [WhatsApp Webhook] Received from ${from}. Media files: ${numMedia}`);

    // STEP 0: Identify User by Phone Number
    // Clean the number from "whatsapp:" prefix
    const cleanPhone = from.replace("whatsapp:", "");

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_phone", cleanPhone)
      .single();

    if (userError || !user) {
      console.warn(`⚠️ [WhatsApp] User not found for number: ${cleanPhone}`);
      const registerMessage = `Welcome to Neerzy! 👷‍♂️ It looks like your number isn't registered yet. \n\nPlease log in to your dashboard at ${process.env.NEXT_PUBLIC_APP_URL}/login and add your phone number in settings to start posting!`;
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${registerMessage}</Message></Response>`, 
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    console.log(`👤 Found user: ${user.email} (${user.business_name})`);

    let rawContent = bodyText || "";

    // STEP 1: Process Audio (Voice Notes) or Images
    const openai = getOpenAI();

    if (numMedia > 0) {
      const mediaUrl = formData.get("MediaUrl0") as string;
      const mediaType = formData.get("MediaContentType0") as string;

      console.log(`Processing media: ${mediaType} from ${mediaUrl}`);

      if (mediaType.includes("audio")) {
        // --- VOICE NOTE LOGIC (Whisper) ---
        try {
          // Download audio from Twilio
          const audioResponse = await fetch(mediaUrl);
          const buffer = await audioResponse.arrayBuffer();
          
          // Whisper expects a file. We can use a File object in recent OpenAI Node SDKs
          const transcription = await openai.audio.transcriptions.create({
            file: await (async () => {
              const f = new File([buffer], "audio.ogg", { type: mediaType });
              return f;
            })(),
            model: "whisper-1",
          });
          
          rawContent = `[Transcribed Voice Note]: ${transcription.text}`;
          console.log("✅ Voice Note Transcribed:", transcription.text);
        } catch (err) {
          console.error("❌ Whisper Transcription Failed:", err);
          rawContent = `[Voice Note received but failed to transcribe]`;
        }
        
      } else if (mediaType.includes("image")) {
        // --- IMAGE RECOGNITION LOGIC (GPT-4o Vision) ---
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "user", content: [
                  { type: "text", text: "Describe this image in detail. What local service job is being performed? Focus on technical details of the work done." },
                  { type: "image_url", image_url: { url: mediaUrl } }
                ]
              }
            ]
          });
          rawContent = `[Image Analysis]: ${response.choices[0].message.content || ""}`;
          console.log("✅ Image Analyzed by Vision AI.");
        } catch (err) {
          console.error("❌ Vision AI Failed:", err);
          rawContent = `[Image received but failed to analyze]`;
        }
      }
    }

    if (!rawContent || rawContent.length < 5) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>We couldn't read that! Please send a voice note, photo, or at least 5 characters of text describing your job.</Message></Response>`, 
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // STEP 2: Generate SEO & GMB Optimized Content
    console.log("🤖 Generating SEO & GMB content...");
    
    const seoContent = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n<Message>${replyMessage}</Message>\n</Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml' }}
    );

  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Oops, something went wrong processing your update.</Message></Response>`, 
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    );
  }
}
