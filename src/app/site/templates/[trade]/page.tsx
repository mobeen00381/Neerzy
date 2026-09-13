import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TradeSiteTemplate from "@/components/site/TradeSiteTemplate";
import { getTradeSiteTemplate, TRADE_SITE_IDS } from "@/lib/site-templates";
import { demoBundleFor, demoUrlFor } from "@/lib/demo-sites";
import { buildSiteMetadata, buildSiteSchemaGraph } from "@/lib/site-schema";
import type { TemplateId } from "@/lib/template-looks";

/**
 * Shareable template demos — one URL per trade:
 *   /site/templates/plumber · /electrician · /hvac · /roofing · /handyman
 *   /dentist · /grocery · /hardware · /mechanic · /generic
 *
 * These render through the SAME components and the SAME schema builder as a
 * real trader site, so what a customer sees here is exactly what they get —
 * only the business details and photography are demos.
 *
 * `noindex, follow`: ten near-identical demo pages must never compete with the
 * real, indexable trader sites on custom domains.
 */

export const dynamic = "force-static";

export function generateStaticParams() {
  return TRADE_SITE_IDS.map((trade) => ({ trade }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trade: string }>;
}): Promise<Metadata> {
  const { trade } = await params;
  const def = getTradeSiteTemplate(trade);
  if (!def) return { title: "Template not found | Neerzy", robots: { index: false, follow: false } };

  const { demo, content } = demoBundleFor(def.id);
  return {
    ...buildSiteMetadata({ content, url: demoUrlFor(def.id), demo: true }),
    title: { absolute: `${def.name} — ${demo.city} trade website template | Neerzy` },
  };
}

export default async function TradeTemplateDemoPage({
  params,
}: {
  params: Promise<{ trade: string }>;
}) {
  const { trade } = await params;
  const def = getTradeSiteTemplate(trade);
  if (!def) notFound();

  const { demo, content } = demoBundleFor(def.id as TemplateId);
  const url = demoUrlFor(def.id);
  const graph = buildSiteSchemaGraph({ content, url, demo: true });

  return (
    <>
      {/* AEO/GEO: same deterministic schema graph a live trader site emits */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <TradeSiteTemplate content={content} posts={[]} def={def} demo />
      <p className="sr-only">
        Demo page for {def.name}, a {def.tradeLabel} website template showing sample business{" "}
        {demo.businessName} in {demo.city}.
      </p>
    </>
  );
}
