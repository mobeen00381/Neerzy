import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteRenderer from "@/components/site/SiteRenderer";
import { getSiteById, getSitePosts } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Website preview | Neerzy",
  robots: { index: false, follow: false },
};

/**
 * Sneak-peek preview of a built website.
 * Visible from the dashboard (🏗️ Build Website card) and the WhatsApp
 * "Your website is LIVE" message — before DNS finishes propagating.
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

  return <SiteRenderer content={website.content || {}} posts={posts} preview />;
}
