import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from "@/lib/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
);

function getOpenAI() {
  return getOpenAIClient();
}

// DB-backed rate limiter (safe for serverless — state persists across invocations)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP
const ENDPOINT = 'posts/create';

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  try {
    // Cleanup stale entries (older than 1 hour) — fire-and-forget, don't block on it
    void supabase.from('rate_limits').delete().lt('created_at', new Date(now.getTime() - 3600_000).toISOString());

    // Find an active window for this IP + endpoint
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('id, request_count, window_start')
      .eq('ip_address', ip)
      .eq('endpoint', ENDPOINT)
      .gt('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) {
      // No active window — create one
      await supabase.from('rate_limits').insert({
        ip_address: ip,
        endpoint: ENDPOINT,
        request_count: 1,
        window_start: now.toISOString()
      });
      return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now.getTime() + RATE_LIMIT_WINDOW_MS };
    }

    if (existing.request_count >= RATE_LIMIT_MAX) {
      // Rate limited
      const resetAt = new Date(existing.window_start).getTime() + RATE_LIMIT_WINDOW_MS;
      return { allowed: false, remaining: 0, resetAt };
    }

    // Increment counter
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);

    return { allowed: true, remaining: RATE_LIMIT_MAX - (existing.request_count + 1), resetAt: new Date(existing.window_start).getTime() + RATE_LIMIT_WINDOW_MS };
  } catch (err) {
    // Fail-closed: if the rate limiter DB is unreachable, deny the request.
    // This endpoint is public + unauthenticated, so security takes priority
    // over availability. A legitimate user hitting a rare DB blip can retry;
    // an abuser hitting an intentional DB stress cannot.
    console.error('Rate limiter DB error (failing closed):', err);
    return { allowed: false, remaining: 0, resetAt: now.getTime() + RATE_LIMIT_WINDOW_MS };
  }
}

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("x-real-ip") || 
               "unknown";
    const rateCheck = await checkRateLimit(ip);
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0"
          }
        }
      );
    }

    const { token, type, content, isDemoMessage } = await req.json();

    // 1. Verify user — require a valid DB token, no hardcoded bypass
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("quickpost_token", token)
      .single();
      
    if (userError || !userData) {
      console.warn(`⚠️ Invalid quickpost token attempt from IP: ${ip}`);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    
    const userId = userData.id;

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
        model: DEFAULT_OPENAI_MODEL,
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
