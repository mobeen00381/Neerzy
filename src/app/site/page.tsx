import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import SiteRenderer from "@/components/site/SiteRenderer";
import { getSiteByHost, getSitePosts, normalizeHost } from "@/lib/site-data";
import { buildSiteMetadata, buildSiteSchemaGraph } from "@/lib/site-schema";

/**
 * A trader's live website (served on their own custom domain).
 *
 * All SEO / AEO / GEO output comes from `src/lib/site-schema.ts`, which is
 * shared with the template demos so the two can never drift:
 *   • <head> — title/description/keywords, canonical, OG + Twitter card with
 *     the real hero photo, robots: index,follow, geo.position / ICBM
 *   • JSON-LD — LocalBusiness (NAP, geo, hours, services, rating, reviews,
 *     real postal-code areaServed, hasMap) · WebSite · WebPage (speakable) ·
 *     BreadcrumbList · FAQPage
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = await getSiteByHost(host);
  if (!site) return { title: "Not found", robots: { index: false, follow: false } };

  return buildSiteMetadata({
    content: site.content || {},
    url: `https://${normalizeHost(host)}`,
  });
}

export default async function TraderSitePage() {
  const host = (await headers()).get("host");
  const site = await getSiteByHost(host);
  if (!site || !site.preview_ready) notFound();

  const posts = await getSitePosts(site.user_id, 6);
  const content = site.content || {};
  const url = `https://${normalizeHost(host)}`;
  const graph = buildSiteSchemaGraph({ content, url });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <SiteRenderer content={content} posts={posts} />
    </>
  );
}
