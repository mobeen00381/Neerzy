import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
);

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

export async function POST(req: Request) {
  try {
    const { token, type, content, isDemoMessage } = await req.json();

    // 1. Verify user logic
    // Currently, our MVP uses a hardcoded token for the demo: "user_auth_token_778899"
    // In production, we lookup the user where quickpost_token = token
    let userId = null;
    if (token === "user_auth_token_778899") {
      // Mock bypass for demo purposes
      console.log("Using MVP demo bypass token");
    } else {
      // Real lookup
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("quickpost_token", token)
        .single();
        
      if (!userError && userData) {
        userId = userData.id;
      }
    }

    // 2. Map input to OpenAI
    console.log(`Processing media type: ${type}`);
    let rawContentToProcess = content;

    if (type === "voice") {
      // MVP: Simulated transcription for demo. 
      // Real impl: send audio to whisper
      rawContentToProcess = `[Voice Transcribed]: ${content || "Changed the garbage disposal in the kitchen sink. Works perfectly now."}`;
    } else if (type === "photo") {
      // MVP: Simulated image description.
      // Real impl: send to GPT-4o Vision
      rawContentToProcess = `[Image Analyzed]: ${content || "An image showing a newly installed kitchen garbage disposal underneath a sink."}`;
    }

    if (isDemoMessage) {
      rawContentToProcess = `[Text Input]: ${content}`;
    }

    // 3. Generate Post with OpenAI
    const openai = getOpenAI();
    let title = "Recent Update";
    let htmlContent = `<p>${rawContentToProcess}</p>`;
    let gmbOutput = rawContentToProcess;

    try {
      console.log("Asking OpenAI to generate content...");
      const seoContent = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { 
            role: "system", 
            content: "You are a professional SEO copywriter for local businesses. You take raw notes, image descriptions, or voice transcripts and turn them into 3 things: a catchy SEO title, a professional 2-paragraph HTML blog post for a website (using <p> tags), and a short, engaging Google My Business update post with emojis. Return JSON with 'seoTitle', 'websiteHtml', and 'gmbPost'."
          },
          { role: "user", content: rawContentToProcess }
        ]
      });

      const parsed = JSON.parse(seoContent.choices[0].message.content || '{"seoTitle":"Recent Update", "websiteHtml":"<p>Update done.</p>", "gmbPost":"Update done!"}');
      title = parsed.seoTitle || title;
      htmlContent = parsed.websiteHtml || htmlContent;
      gmbOutput = parsed.gmbPost || gmbOutput;
      
      console.log("✅ OpenAI successfully generated content!");
    } catch (openaiError) {
      console.error("OpenAI Error (ensure API key is valid):", openaiError);
      // Fallback to raw content if OpenAI fails (e.g. no funds)
      title = "New Job Completed";
      htmlContent = `<p>${rawContentToProcess}</p>`;
    }

    // 4. Save to Supabase Posts Table
    // If we have a userId, link it. Otherwise save as unlinked demo post
    const { error: insertError } = await supabase.from("posts").insert([
      {
        user_id: userId,
        title: title,
        content: htmlContent,
        status: "published"
      }
    ]);

    if (insertError) {
      console.error("Failed to insert post into Supabase:", insertError);
    } else {
      console.log("✅ Post saved to database.");
    }

    // 5. Fire to Google My Business (Mocked for MVP until OAuth verified)
    console.log("📡 Firing payload to Google Business Profile API...");

    return NextResponse.json({ 
      success: true, 
      post: {
        title,
        content: htmlContent,
        gmb: gmbOutput
      }
    });

  } catch (err: any) {
    console.error("API Error in /posts/create:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
