import { getSiteByHost, normalizeHost } from "@/lib/site-data";

export const dynamic = "force-dynamic";

/** Per-domain sitemap for a trader's website. */
export async function GET(req: Request) {
  const host = req.headers.get("host");
  const site = await getSiteByHost(host);
  if (!site) return new Response("Not found", { status: 404 });

  const base = `https://${normalizeHost(host)}`;
  const paths = ["/", "/blog"];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths
      .map(
        (p) =>
          `  <url>\n    <loc>${base}${p}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
