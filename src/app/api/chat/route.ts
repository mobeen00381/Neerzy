import { NextResponse } from "next/server";
import { chatWithFallback } from "@/lib/openai";
import { matchFAQ, isNeerzyRelated, OFF_TOPIC_RESPONSE } from "@/lib/neerzy-faq";

// The Master Prompt turning the AI into a powerful sales agent
// STRICT: Neerzy-only, sales-focused, no off-topic answers
const SYSTEM_PROMPT = `
You are the official Product Expert and Sales Assistant for "Neerzy".
Your tone is friendly, highly helpful, concise, and conversion-focused.

Here is what you know about Neerzy:
- What it is: A SaaS platform that automatically updates a business's Google Business Profile (Maps) and SEO website using AI.
- How it works: Contractors or local businesses pull out their phone, snap a photo or record a quick voice note of the job they just finished, and hit submit. Neerzy's AI instantly turns that into an SEO-optimized blog post and publishes it to Google Maps and their beautifully generated website.
- Pricing structure:
   1. Free Plan: $0/month. Includes 5 posts total, 1 post/day, Google post generation, website updates, review requests, and a 30-day free trial.
   2. Pro Plan: $39/month. Includes 25 posts/month, 2 posts/day, WhatsApp workflow, custom domain support, AI captions & voice notes, basic analytics.
   3. Growth Plan: $79/month. Includes 60 posts/month, 4 posts/day, social content (Facebook + Instagram), priority processing, advanced analytics, multi-location support.
   4. Agency Plan: $199/month. Includes 250 posts/month, up to 10 clients, white-label workflow, team access, bulk tools, priority support.
- Free Trial: The Free Plan comes with a 30-Day Free Trial.
- Domain Fee: There is a one-time $19 fee at signup to register their custom domain name.
- Cancellation: Users can cancel anytime, no contracts.
- Who it's for: Plumbers, HVAC, Electricians, Dentists, Roofers, Handymen, and any local service business.

**STRICT RULES:**
1. You are ONLY allowed to discuss topics related to Neerzy, local business marketing, Google Business Profile, SEO, review management, and the Neerzy platform.
2. If a user asks ANYTHING outside of these topics (weather, sports, math, coding, general knowledge), you MUST politely decline with:
   "I'm specialized in helping with Neerzy and local business marketing. For other questions, please check with a general assistant."
3. Never generate code, answer trivia, or discuss non-business topics.
4. Your primary goal is to help users understand Neerzy and convert them to sign up.

**AGENT TOOLS ENABLED:**
You have access to a tool called 'check_domain_availability'. If a user asks about a specific domain (e.g., "Is austinplumbing.com available?"), you MUST call this tool.
IF the tool returns that the domain is 'available', you should playfully celebrate and IMMEDIATELY generate a Markdown hyperlink directing them to the checkout!
Markdown format: [Click here to claim YOUR_DOMAIN and start your 30-Day Free Trial!](/onboarding)

Your goal: Answer questions concisely. Use tools natively. Push users to the /onboarding link.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Extract the latest user message
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
    const userMessage = lastUserMessage?.content || "";

    // ─────────────────────────────────────────────────────
    // TIER 1: Static FAQ Match (Zero tokens)
    // ─────────────────────────────────────────────────────
    const faqAnswer = matchFAQ(userMessage);
    if (faqAnswer) {
      return NextResponse.json({ reply: faqAnswer });
    }

    // ─────────────────────────────────────────────────────
    // TIER 2: Topic Gate (Zero tokens)
    // ─────────────────────────────────────────────────────
    if (!isNeerzyRelated(userMessage)) {
      return NextResponse.json({ reply: OFF_TOPIC_RESPONSE });
    }

    // ─────────────────────────────────────────────────────
    // TIER 3: AI Model (Token-consuming)
    // ─────────────────────────────────────────────────────

    // Prepare full conversation including system prompt
    let conversation: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    // Define the tools
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "check_domain_availability",
          description: "Checks if a specific website domain name is available for purchase.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "The domain name to check, e.g., 'austinplumbing.com'",
              },
            },
            required: ["domain"],
          },
        },
      }
    ];

    // Attempt AI completion — gracefully handle models that don't support tool calling
    let replyMessage;
    try {
      const completion = await chatWithFallback({
        messages: conversation,
        tools: tools,
        tool_choice: "auto",
      });
      replyMessage = completion.choices[0].message;
    } catch (toolError: any) {
      // If tool calling fails (e.g., model doesn't support it), retry without tools
      console.warn(`⚠️ Tool calling failed, retrying without tools:`, toolError.message);
      const fallbackCompletion = await chatWithFallback({
        messages: conversation,
      });
      const fallbackReply = fallbackCompletion.choices[0].message.content || "I didn't quite catch that.";
      return NextResponse.json({ reply: fallbackReply });
    }

    // Check if the AI wants to call a tool
    if (replyMessage.tool_calls && replyMessage.tool_calls.length > 0) {
      const toolCall = replyMessage.tool_calls[0] as any;
      if (toolCall.function.name === "check_domain_availability") {
        const args = JSON.parse(toolCall.function.arguments);
        const requestedDomain = args.domain.toLowerCase();
        
        console.log(`🤖 Agent executing tool: check_domain_availability for ${requestedDomain}`);

        // Mock Tool Execution (In production, this queries Namecheap/GoDaddy API)
        // Simulated logic: any domain with 'taken' in the name is unavailable, otherwise available.
        const isAvailable = !requestedDomain.includes("taken");
        
        const toolResult = {
          domain: requestedDomain,
          available: isAvailable,
          price: isAvailable ? 19 : null,
          message: isAvailable 
            ? "Domain is available for $19 registration." 
            : "Domain is taken."
        };

        // Standard tool callback injection
        conversation.push(replyMessage as any); // Append the assistant's tool-call message
        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });

        // Run the AI again with the fed-back data
        const secondCompletion = await chatWithFallback({
          messages: conversation,
        });

        const finalReply = secondCompletion.choices[0].message.content || "Sorry, I had trouble finalizing that thought!";
        return NextResponse.json({ reply: finalReply });
      }
    }

    // Normal text reply if no tools called
    return NextResponse.json({ reply: replyMessage.content || "I didn't quite catch that." });
    
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to generate chat response" }, { status: 500 });
  }
}
