import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSiteByHost, getSitePosts } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = await getSiteByHost(host);
  const name = site?.content?.businessName || "Our business";
  return {
    title: `${name} | News & Recent Jobs`,
    description: `The latest jobs and updates from ${name}.`,
  };
}

export default async function SiteBlogPage() {
  const host = (await headers()).get("host");
  const site = await getSiteByHost(host);
  if (!site) notFound();

  const posts = await getSitePosts(site.user_id, 30);
  const c = site.content || {};
  const primary: string = c.palette?.primary || "#0F5C4D";

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-black text-lg">{c.businessName || "Home"}</Link>
          {c.phone && (
            <a href={`tel:${String(c.phone).replace(/[^\d+]/g, "")}`} className="px-4 py-2 rounded-xl text-white text-sm font-black" style={{ backgroundColor: primary }}>
              📞 Call
            </a>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-2">Latest updates</h1>
        <p className="text-slate-500 mb-10">Recent jobs and news from {c.businessName}.</p>

        {posts.length === 0 ? (
          <p className="text-slate-400 font-semibold">No updates yet — check back soon.</p>
        ) : (
          <div className="space-y-8">
            {posts.map((p, i) => (
              <article key={i} className="border-b border-slate-100 pb-8">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} className="w-full h-64 object-cover rounded-2xl mb-4" loading="lazy" />
                )}
                <h2 className="text-xl font-black">{p.title}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {new Date(p.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                {p.text && <p className="text-slate-600 mt-3 leading-relaxed whitespace-pre-line">{p.text}</p>}
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="px-4 py-8 border-t border-slate-100 text-center text-xs text-slate-400 font-semibold">
        <Link href="/" className="hover:underline">← Back to home</Link>
      </footer>
    </div>
  );
}
