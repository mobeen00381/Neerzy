import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// The Master Prompt turning the AI into a powerful sales agent
const SYSTEM_PROMPT = `
You are the official Product Expert and Sales Assistant for "Neerzy".
Your tone is friendly, highly helpful, concise, and conversion-focused.

Here is what you know about Neerzy:
- What it is: A SaaS platform that automatically updates a business's Google My Business (Maps) and SEO website using AI.
- How it works: Contractors or local businesses pull out their phone, snap a photo or record a quick voice note of the job they just finished, and hit submit. Neerzy's AI instantly turns that into an SEO-optimized blog post and publishes it to Google Maps and their beautifully generated website.
- Pricing structure: 
   1. Pro Plan: $39/month. Includes 15 AI Posts/month, Google Business Sync, and Weekly Analytics.
   2. Elite Plan: $99/month. Includes Unlimited AI Posts, Priority Support, and advanced SEO logic.
- Free Trial: EVERY plan comes with a 30-Day Free Trial.
- Domain Fee: There is a one-time $20 fee at signup to register their custom domain name.
- Cancelation: Users can cancel anytime, no contracts.
- Who it's for: Plumbers, HVAC, Electricians, Dentists, Roofers, Handymen, and any local service business.

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

    let completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversation,
      tools: tools,
      tool_choice: "auto",
    });

    let replyMessage = completion.choices[0].message;

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
          price: isAvailable ? 20 : null,
          message: isAvailable 
            ? "Domain is available for $20 registration." 
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
        const secondCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
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
