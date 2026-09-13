import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteRenderer from "@/components/site/SiteRenderer";
import { getSiteById, getSitePosts } from "@/lib/site-data";
import { buildSiteSchemaGraph } from "@/lib/site-schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Website preview | Neerzy",
  robots: { index: false, follow: false },
};

/**
 * Sneak-peek preview of a built website.
 * Visible from the dashboard (🏗️ Build Website card) and the WhatsApp
 * "Your website is LIVE" message — before DNS finishes propagating.
 *
 * The JSON-LD graph is emitted here too (identical to the live page) so the
 * preview is a faithful mirror of what customers and answer engines will read.
 */
export default async function SitePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const website = await getSiteById(id);
  if (!website) notFound();

  const posts = await getSitePosts(website.user_id, 6);
  const content = website.content || {};
  const url = `https://${website.domain_name || `www.neerzy.com/site/preview/${id}`}`;
  const graph = buildSiteSchemaGraph({ content, url });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <SiteRenderer content={content} posts={posts} preview />
    </>
  );
}
