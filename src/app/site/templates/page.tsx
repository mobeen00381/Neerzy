import type { Metadata } from "next";
import Link from "next/link";
import { TEMPLATE_IDS } from "@/lib/template-looks";
import { TRADE_SITE_TEMPLATES } from "@/lib/site-templates";

/**
 * Template gallery — the shareable list of all ten trade sites:
 *   /site/templates/plumber … /site/templates/generic
 *
 * Deliberately `noindex`: these are marketing demos of the SAME locked layout
 * with fictional businesses. Indexing ten near-identical pages would risk a
 * doorway-page flag, so they are shareable by link only. The real trader sites
 * (custom domains, real content) stay fully indexable.
 */

export const metadata: Metadata = {
  title: "10 trade website templates | Neerzy",
  description:
    "See all ten Neerzy trade website templates — plumber, electrician, HVAC, roofing, handyman, dentist, grocery, hardware, mechanic and general local services.",
  alternates: { canonical: "https://www.neerzy.com/site/templates" },
  robots: { index: false, follow: true },
};

const LOCKED_BLOCKS = [
  "Photo hero",
  "Services (4–6)",
  "Before & after slider",
  "4-image gallery",
  "Service areas (postcodes)",
  "Google map",
  "Reviews",
  "Opening hours",
  "FAQ",
  "Quote CTA",
  "Footer NAP",
];

export default function TemplateGalleryPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Neerzy templates
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">
          Ten trade website templates
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Every template ships the same locked block set, tuned per trade — colour, headings,
          section order and copy. Tap any trade to open the full live demo.
        </p>

        <ul className="mt-6 flex flex-wrap gap-2 list-none p-0">
          {LOCKED_BLOCKS.map((b) => (
            <li
              key={b}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
            >
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEMPLATE_IDS.map((id) => {
            const def = TRADE_SITE_TEMPLATES[id];
            const look = def.palette;
            const hero = def.gallery[0];
            return (
              <Link
                key={id}
                href={`/site/templates/${id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                style={{ borderTopWidth: 6, borderTopColor: look.primary }}
              >
                <span className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hero}
                    alt={`${def.name} template preview — ${def.tradeLabel}`}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="block p-5">
                  <span className="block text-xs font-black uppercase tracking-wider" style={{ color: look.primary }}>
                    {def.tradeLabel}
                  </span>
                  <span className="mt-1 block text-lg font-black text-slate-900">{def.name}</span>
                  <span className="mt-2 block text-sm text-slate-500">
                    {def.hero.headline}
                  </span>
                  <span className="mt-3 block text-sm font-black text-slate-900 group-hover:underline">
                    View live demo →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-xs text-slate-400">
          Demos use placeholder photography and fictional business details. Your own site is
          generated automatically from your Google Business Profile.
        </p>
      </div>
    </main>
  );
}
