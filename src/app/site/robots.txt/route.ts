import { normalizeHost } from "@/lib/site-data";

export const dynamic = "force-dynamic";

/**
 * Per-domain robots.txt for a trader's website.
 * AI crawlers are explicitly welcome — this is what makes trader sites
 * quotable in ChatGPT / Perplexity / Google AI Overviews (GEO).
 */
export async function GET(req: Request) {
  const base = `https://${normalizeHost(req.headers.get("host"))}`;

  const txt =
    `# ${base}\n` +
    `User-agent: *\nAllow: /\n\n` +
    `# AI / answer engines are welcome\n` +
    `User-agent: GPTBot\nAllow: /\n\n` +
    `User-agent: OAI-SearchBot\nAllow: /\n\n` +
    `User-agent: ChatGPT-User\nAllow: /\n\n` +
    `User-agent: PerplexityBot\nAllow: /\n\n` +
    `User-agent: Google-Extended\nAllow: /\n\n` +
    `User-agent: ClaudeBot\nAllow: /\n\n` +
    `Sitemap: ${base}/sitemap.xml\n`;

  return new Response(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
