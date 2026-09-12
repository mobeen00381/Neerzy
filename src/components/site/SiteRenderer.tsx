import React from "react";

/**
 * Part 2 — Trader website renderer.
 *
 * Renders a complete website from the JSON stored in websites.content:
 * hero · trust bar · services · about · hours · gallery · reviews ·
 * latest job updates (auto-fed by the WhatsApp → website_posts pipeline).
 *
 * Theming comes from the template palette (TEMPLATE_REGISTRY) that the
 * builder picked for the trader's trade.
 */

type Props = {
  content: any;
  posts?: any[];
  preview?: boolean;
};

function telHref(phone: string) {
  return `tel:${(phone || "").replace(/[^\d+]/g, "")}`;
}
function waHref(phone: string, businessName: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(`Hi ${businessName}! I found you online and would like a quote.`);
  return digits ? `https://wa.me/${digits}?text=${text}` : "";
}

export default function SiteRenderer({ content, posts = [], preview = false }: Props) {
  const c = content || {};
  const primary: string = c.palette?.primary || "#0F5C4D";
  const secondary: string = c.palette?.secondary || "#0A2E22";
  const businessName: string = c.businessName || "Your Business";
  const phone: string = c.phone || "";
  const reviews: any[] = Array.isArray(c.reviews) ? c.reviews : [];
  const photos: string[] = Array.isArray(c.photos) ? c.photos : [];
  const services: any[] = Array.isArray(c.services) ? c.services : [];
  const hours: string[] = Array.isArray(c.hours) ? c.hours : [];
  const faqs: any[] = Array.isArray(c.faqs) ? c.faqs : [];
  // Image hero (design.md §4 "Trader site blocks"): the trader's own photo —
  // hero image if set, otherwise their first gallery photo (Google/WhatsApp).
  // Only when neither exists does the hero fall back to a palette gradient.
  const heroImage: string = c.heroImage || photos[0] || "";
  const wa = waHref(phone, businessName);

  return (
    <div
      className="site-root min-h-screen bg-white text-slate-900 font-sans"
      style={
        {
          // Palette as CSS vars so the image hero + block separators below
          // stay in the trader's chosen template colours.
          "--site-primary": primary,
          "--site-secondary": secondary,
        } as React.CSSProperties
      }
    >
      {preview && (
        <div className="bg-amber-400 text-amber-950 text-center text-xs font-black py-2 px-4">
          👀 Preview — this is how your website looks. It goes live on your domain automatically.
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black shrink-0"
              style={{ backgroundColor: primary }}
            >
              {businessName.charAt(0).toUpperCase()}
            </span>
            <span className="font-black text-lg truncate">{businessName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {phone && (
              <a
                href={telHref(phone)}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-black"
                style={{ backgroundColor: primary }}
              >
                📞 Call Now
              </a>
            )}
            <a href="#contact" className="hidden sm:inline-block px-4 py-2.5 rounded-xl text-sm font-black border border-slate-200">
              Get a Quote
            </a>
          </div>
        </div>
      </header>

      {/* Hero — image hero (design.md §4 "Trader site blocks").
          A real job photo always wins over a flat colour block; when the
          trader has no photo yet, the palette gradient stands in. */}
      <section
        className={`site-hero${heroImage ? " has-photo" : ""}`}
        style={{ backgroundColor: primary }}
      >
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="site-hero-img"
            src={heroImage}
            alt={`${businessName} — recent work`}
            loading="lazy"
          />
        ) : null}
        <div className="site-hero-scrim" aria-hidden="true" />
        <div className="max-w-5xl mx-auto site-hero-body">
          {c.tagline && (
            <p className="text-xs font-black uppercase tracking-widest mb-3 text-white/85">
              {c.tagline}
            </p>
          )}
          <h1 className="text-3xl md:text-5xl font-black leading-tight max-w-3xl text-white drop-shadow-sm">
            {c.hero?.headline || businessName}
          </h1>
          {c.hero?.subheadline && (
            <p className="mt-4 text-lg max-w-2xl text-white/90">{c.hero.subheadline}</p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            {phone && (
              <a
                href={telHref(phone)}
                className="px-6 py-3.5 rounded-2xl bg-white font-black shadow-lg"
                style={{ color: secondary }}
              >
                📞 Call {phone}
              </a>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl text-white font-black bg-[#25D366]"
              >
                💬 WhatsApp Us
              </a>
            )}
            {c.reviewLink && (
              <a
                href={c.reviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl font-black border-2 border-white/50 text-white"
              >
                ⭐ Leave a Review
              </a>
            )}
          </div>

          {/* Trust bar — one job, part of the hero block */}
          {(c.rating || c.userRatingsTotal) && (
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
              <span className="text-amber-400 text-lg leading-none">★</span>
              <span>
                {c.rating ? `${c.rating} rating` : "Highly rated"}
                {c.userRatingsTotal ? ` · ${c.userRatingsTotal} reviews` : ""}
              </span>
              {c.address && <span className="hidden md:inline text-white/70">· {c.address}</span>}
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section id="services" className="site-block px-4 py-14">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-1">What we do</h2>
            <p className="text-slate-500 mb-8">Friendly, professional service you can count on.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((s: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-white">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black mb-3"
                    style={{ backgroundColor: primary }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-black text-lg">{s.title}</h3>
                  {s.description && <p className="text-slate-500 text-sm mt-1">{s.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {c.about && (
        <section id="about" className="site-block px-4 py-14" style={{ backgroundColor: `${secondary}08` }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-4">About {businessName}</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{c.about}</p>
          </div>
        </section>
      )}

      {/* Hours */}
      {hours.length > 0 && (
        <section id="hours" className="site-block px-4 py-14">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-4">Opening hours</h2>
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
              {hours.map((h: string, i: number) => (
                <li key={i} className="px-5 py-3 text-sm font-semibold text-slate-700 bg-white">
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Gallery */}
      {photos.length > 0 && (
        <section id="gallery" className="site-block px-4 py-14" style={{ backgroundColor: `${primary}0A` }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-6">Our work</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={p}
                  alt={`${businessName} work ${i + 1}`}
                  className="w-full h-40 md:h-52 object-cover rounded-2xl border border-white shadow-sm"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section id="reviews" className="site-block px-4 py-14">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-6">What customers say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.slice(0, 3).map((r: any, i: number) => (
                <blockquote key={i} className="p-5 rounded-2xl border border-slate-200 bg-white">
                  <div className="text-amber-500 mb-2">{"★".repeat(Math.max(1, Math.min(5, r.rating || 5)))}</div>
                  <p className="text-slate-600 text-sm leading-relaxed">“{r.text}”</p>
                  <footer className="mt-3 text-xs font-black text-slate-400 uppercase tracking-wider">
                    {r.author} {r.time ? `· ${r.time}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Latest updates (auto-fed by Neerzy posts) */}
      {posts.length > 0 && (
        <section id="updates" className="site-block px-4 py-14" style={{ backgroundColor: `${secondary}08` }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-2">Latest updates</h2>
            <p className="text-slate-500 mb-8">Fresh from the jobs we&apos;ve completed.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {posts.map((p: any, i: number) => (
                <article key={i} className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.title || "Recent job"} className="w-full h-40 object-cover" loading="lazy" />
                  )}
                  <div className="p-5">
                    <h3 className="font-black">{p.title || "Recent job"}</h3>
                    {p.text && <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{p.text}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ — AEO: visible answers AI assistants can quote (open by default) */}
      {faqs.length > 0 && (
        <section id="faq" className="site-block px-4 py-14">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-6">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqs.map((f: any, i: number) => (
                <details key={i} open className="group rounded-2xl border border-slate-200 bg-white p-5">
                  <summary className="font-black cursor-pointer list-none flex items-center justify-between gap-3">
                    <span>{f.q}</span>
                    <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <p className="mt-3 text-slate-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="px-4 py-16" style={{ backgroundColor: secondary }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-2xl md:text-3xl font-black">Get a free quote today</h2>
          {c.address && <p className="mt-3 text-white/80">{c.address}</p>}
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            {phone && (
              <a href={telHref(phone)} className="px-6 py-3.5 rounded-2xl bg-white font-black" style={{ color: secondary }}>
                📞 {phone}
              </a>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-[#25D366] text-white font-black"
              >
                💬 WhatsApp
              </a>
            )}
            {c.mapUrl && (
              <a
                href={c.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl border-2 border-white/40 text-white font-black"
              >
                📍 Directions
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-semibold">
          <span>© {new Date().getFullYear()} {businessName}</span>
          <span>
            Website by{" "}
            <a href="https://www.neerzy.com" className="font-black text-slate-500 hover:underline" target="_blank" rel="noopener noreferrer">
              Neerzy
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

