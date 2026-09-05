import { NextResponse } from "next/server";
import { chatWithFallback } from "@/lib/openai";
import { matchFAQ, isNeerzyRelated, OFF_TOPIC_RESPONSE } from "@/lib/neerzy-faq";
import { checkRateLimit, blockClient } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Neerzy AI Agent - /api/chat
//
// Guardrails:
//   1. Rate limit: up to CHAT_MAX_PER_MINUTE messages per minute per IP.
//      Exceeding the cap rejects the request AND locks the IP for 1 hour.
//   2. Off-topic (non-Neerzy) messages are blocked at ZERO token cost. After
//      OFF_TOPIC_BLOCK_THRESHOLD consecutive off-topic messages the IP is also
//      locked for 1 hour.
//   3. Common Neerzy questions are answered instantly from the static FAQ
//      database (matchFAQ) - ZERO API cost. The LLM only runs as fallback.
//   4. The LLM must emit the "OFF_TOPIC" sentinel for anything outside its
//      scope; the route discards those replies and returns OFF_TOPIC_RESPONSE.
// ---------------------------------------------------------------------------

const CHAT_ENDPOINT = "chat";
const CHAT_MAX_PER_MINUTE = 10; // legit users can ask up to 10 questions/min
const CHAT_WINDOW_MS = 60_000;
const CHAT_BLOCK_MS = 3_600_000; // 1-hour lock
const OFF_TOPIC_BLOCK_THRESHOLD = 3;
const OFF_TOPIC_TRACK_TTL_MS = 3_600_000;
const MAX_HISTORY_MESSAGES = 12; // token safety: never resend the full transcript
const MAX_MESSAGE_CHARS = 2_000;

// The Master Prompt turning the AI into an accurate, Neerzy-only sales agent.
// Facts below mirror src/lib/plans.ts (the single source of truth) - keep in sync.
const SYSTEM_PROMPT = `
You are the official Product Expert and Sales Assistant for "Neerzy".
Your tone is friendly, helpful, concise, and conversion-focused.

ACCURATE FACTS ABOUT NEERZY (do not invent, guess, or "correct" any of these):
- What it is: A SaaS platform that automatically updates a business's Google Business Profile (Maps) and SEO website using AI.
- How it works: A local business owner finishes a job, snaps a photo or records a short voice note, and submits it via WhatsApp. Neerzy's AI instantly turns it into an SEO-optimised post that is published to their Google Business Profile and their auto-generated Neerzy website.
- Pricing (monthly, USD):
  1. Free Plan: $0/month. 5 posts per month (max 1/day), 5 review requests per month (max 1/day), Google post + website generation, and the 30-day free trial.
  2. Pro Plan: $39/month. 25 posts per month (2/day), 25 review requests per month (2/day), WhatsApp workflow, custom domain support, AI captions & voice notes, basic analytics.
  3. Growth Plan: $79/month. 60 posts per month (4/day), 60 review requests per month (4/day), Facebook + Instagram content, priority processing, advanced analytics, review tracking dashboard.
  4. Agency Plan: $199/month. Up to 10 traders (each connects their own WhatsApp), 300 posts + 300 review requests per month (30 per trader), 3 posts/day per trader, Google + Facebook + Instagram posts for every trader, agency overview dashboard, priority processing & support.
- Free Trial: the Free Plan includes a 30-day free trial; no credit card required to start.
- Domain: there is a one-time $19 registration fee at signup for the custom domain of the Neerzy website.
- Cancellation: users can cancel anytime; no contracts, no lock-in.
- Who it's for: plumbers, HVAC, electricians, roofers, handymen, dentists, and any local service business.
- Support: support@neerzy.com.

**STRICT RULES:**
1. You may ONLY discuss Neerzy, local business marketing, Google Business Profile, SEO, review management, and the Neerzy platform.
2. If the user asks ANYTHING outside those topics (weather, sports, math, coding, general knowledge, jokes, poems, current events, celebrities, etc.), reply with ONLY the single line "OFF_TOPIC" and nothing else. No explanation, no small talk. The platform replaces it with the standard off-topic message.
3. Never answer a Neerzy fact you are unsure about - say you will check with the team and direct the user to support@neerzy.com instead of guessing.
4. Your primary goal is to help users understand Neerzy and convert them to sign up at /onboarding.

**AGENT TOOLS:**
You have a tool named 'check_domain_availability' that performs a REAL registration lookup. If a user asks whether a specific domain is available, call it with the domain (e.g. "austinplumbing.com").
- If the tool reports available === true, celebrate briefly and immediately generate this Markdown link: [Click here to claim YOUR_DOMAIN and start your 30-Day Free Trial!](/onboarding)
- If the tool reports available === false, tell the user it is already registered and offer to check another one.
- If available is null (could not verify), do NOT claim it is available - say you could not verify right now and they can confirm during onboarding.
`;

/** Best-effort in-memory tracker of consecutive off-topic messages per IP. */
const offTopicCounts = new Map<string, { count: number; resetAt: number }>();

function trackOffTopic(ip: string): boolean {
  const now = Date.now();
  const rec = offTopicCounts.get(ip);
  if (!rec || now > rec.resetAt) {
    offTopicCounts.set(ip, { count: 1, resetAt: now + OFF_TOPIC_TRACK_TTL_MS });
    return false;
  }
  const count = rec.count + 1;
  offTopicCounts.set(ip, { count, resetAt: rec.resetAt });
  return count >= OFF_TOPIC_BLOCK_THRESHOLD;
}

function resetOffTopic(ip: string): void {
  offTopicCounts.delete(ip);
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isOffTopicReply(content: string | null | undefined): boolean {
  return !!content && content.trim().toUpperCase().startsWith("OFF_TOPIC");
}

/** Final safety gate: a non-Neerzy reply never reaches the visitor. */
function gateReply(content: string | null | undefined): string {
  if (isOffTopicReply(content)) return OFF_TOPIC_RESPONSE;
  return (content || "").trim() || "I didn't quite catch that — could you rephrase?";
}

function sanitizeDomain(raw: string): string | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(/[/?#]/)[0];
  if (!cleaned || cleaned.length > 253 || !/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Cached IANA RDAP bootstrap map: tld -> authoritative registry base URL.
 * The bootstrap is fetched once per serverless instance and reused.
 */
const rdapBaseCache = new Map<string, string | null>();
let rdapBootstrapPromise: Promise<Record<string, string>> | null = null;

async function loadRdapBootstrap(): Promise<Record<string, string>> {
  if (!rdapBootstrapPromise) {
    rdapBootstrapPromise = (async () => {
      const tldToBase: Record<string, string> = {};
      try {
        const res = await fetch("https://data.iana.org/rdap/dns.json", {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(6_000),
        });
        if (res.ok) {
          const data: any = await res.json();
          for (const svc of data.services || []) {
            const urls: string[] = svc[1] || [];
            const base = urls[0];
            if (base) {
              for (const tld of svc[0] || []) tldToBase[String(tld).toLowerCase()] = base;
            }
          }
        }
      } catch {
        // bootstrap unavailable -> secondary sources below still work
      }
      return tldToBase;
    })();
  }
  return rdapBootstrapPromise;
}

async function resolveRdapBase(tld: string): Promise<string | null> {
  const key = tld.toLowerCase();
  if (rdapBaseCache.has(key)) return rdapBaseCache.get(key) ?? null;
  let base: string | null = null;
  try {
    base = (await loadRdapBootstrap())[key] || null;
  } catch {
    base = null;
  }
  rdapBaseCache.set(key, base);
  return base;
}

/**
 * Real domain availability check via the public RDAP protocol.
 * RDAP 404 => not registered (available). 200 => registered.
 *
 * Tries, in order:
 *   1. the authoritative registry RDAP server for the TLD (IANA bootstrap)
 *   2. rdap.org (IANA redirector)
 *   3. Verisign directly for .com / .net
 */
async function checkDomainAvailability(raw: string) {
  const domain = sanitizeDomain(raw);
  if (!domain) {
    return {
      domain: raw.toLowerCase().slice(0, 253),
      available: null,
      message: "That doesn't look like a valid domain - please try e.g. austinplumbing.com",
    };
  }

  const dot = domain.lastIndexOf(".");
  const tld = dot === -1 ? "" : domain.slice(dot + 1);
  const registryBase = await resolveRdapBase(tld);

  const candidates = [
    registryBase,
    "https://rdap.org",
    tld === "com" || tld === "net" ? "https://rdap.verisign.com/com/v1" : null,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate.replace(/\/$/, "")}/domain/${encodeURIComponent(domain)}`, {
        headers: {
          accept: "application/rdap+json",
          "user-agent": "NeerzyAI-Chat/1.0 (support@neerzy.com)",
        },
        signal: AbortSignal.timeout(6_000),
        redirect: "follow",
      });
      if (res.status === 404) {
        return {
          domain,
          available: true,
          message: `${domain} is not registered - it appears available to register for the $19 domain fee at signup.`,
        };
      }
      if (res.status === 200) {
        return { domain, available: false, message: `${domain} is already registered.` };
      }
      // 403/429/other - try the next source
    } catch {
      // network error - try the next source
    }
  }

  return {
    domain,
    available: null,
    message: `Couldn't verify ${domain} right now - please confirm during onboarding.`,
  };
}


export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    // Rate limit FIRST: 10/min per IP, exceed -> reject + 1-hour lock.
    const rate = await checkRateLimit({
      ip,
      endpoint: CHAT_ENDPOINT,
      max: CHAT_MAX_PER_MINUTE,
      windowMs: CHAT_WINDOW_MS,
      blockMs: CHAT_BLOCK_MS,
    });

    if (!rate.allowed) {
      const locked = rate.reason === "blocked";
      const waitMs = (rate.blockedUntil ?? rate.resetAt) - Date.now();
      const retryAfterSeconds = Math.max(1, Math.ceil(waitMs / 1000));
      const mins = Math.ceil(retryAfterSeconds / 60);

      return NextResponse.json(
        {
          error: locked
            ? `You've sent too many messages, so chat is paused for about ${mins} minute${mins === 1 ? "" : "s"}. This protects our systems from bugs or overload. For urgent help, email support@neerzy.com.`
            : "Chat is briefly busy - please try again in a few seconds.",
          locked,
          retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await req.json().catch(() => null);
    const messages = body?.messages;
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m?.role === "user");
    const userMessage = String(lastUserMessage?.content ?? "").trim().slice(0, MAX_MESSAGE_CHARS);

    // TIER 1: Static FAQ match - instant, zero tokens.
    const faqAnswer = matchFAQ(userMessage);
    if (faqAnswer) {
      resetOffTopic(ip);
      console.log(`OK /api/chat FAQ hit (${ip}) - zero-token answer`);
      return NextResponse.json({ reply: faqAnswer });
    }

    // TIER 2: Topic gate - block off-topic at zero tokens.
    if (!isNeerzyRelated(userMessage)) {
      const shouldLock = trackOffTopic(ip);
      if (shouldLock) {
        resetOffTopic(ip);
        await blockClient(ip, CHAT_ENDPOINT, CHAT_BLOCK_MS);
        console.warn(`LOCK ${ip} locked 1h after ${OFF_TOPIC_BLOCK_THRESHOLD} consecutive off-topic messages`);
      } else {
        console.log(`BLOCKED off-topic (${ip}): "${userMessage.slice(0, 60)}"`);
      }
      return NextResponse.json({ reply: OFF_TOPIC_RESPONSE });
    }
    resetOffTopic(ip);

    // TIER 3: AI model (token-consuming) - only for real Neerzy questions.
    if (!userMessage) {
      return NextResponse.json({
        reply: "Hi! Ask me anything about Neerzy - pricing, how it works, reviews, or Google Business Profile.",
      });
    }

    const history = messages
      .filter((m: any) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_MESSAGE_CHARS) }));

    const conversation: any[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history];

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "check_domain_availability",
          description: "Checks whether a specific website domain is already registered (real RDAP lookup).",
          parameters: {
            type: "object" as const,
            properties: {
              domain: { type: "string", description: "The domain to check, e.g. 'austinplumbing.com'" },
            },
            required: ["domain"],
          },
        },
      },
    ];

    // Attempt AI completion - gracefully handle models that don't support tool calling.
    let replyMessage: any;
    try {
      const completion = await chatWithFallback({ messages: conversation, tools, tool_choice: "auto" });
      replyMessage = completion.choices[0].message;
    } catch (toolError: any) {
      console.warn(`Tool calling failed, retrying without tools:`, toolError?.message || toolError);
      const fallbackCompletion = await chatWithFallback({ messages: conversation });
      return NextResponse.json({ reply: gateReply(fallbackCompletion.choices[0].message.content) });
    }

    // Tool execution path (real domain availability check).
    if (replyMessage.tool_calls?.length) {
      const toolCall = replyMessage.tool_calls[0] as any;
      if (toolCall.function?.name === "check_domain_availability") {
        let requestedDomain = "";
        try {
          requestedDomain = String((JSON.parse(toolCall.function.arguments || "{}") as any).domain || "");
        } catch {
          requestedDomain = "";
        }

        const toolResult = await checkDomainAvailability(requestedDomain);
        console.log(`Domain check "${requestedDomain}" ->`, toolResult);

        conversation.push(replyMessage); // assistant tool-call message
        conversation.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });

        const secondCompletion = await chatWithFallback({ messages: conversation });
        return NextResponse.json({ reply: gateReply(secondCompletion.choices[0].message.content) });
      }
    }

    return NextResponse.json({ reply: gateReply(replyMessage.content) });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to generate chat response" }, { status: 500 });
  }
}




