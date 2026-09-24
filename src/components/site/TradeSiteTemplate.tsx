import React from "react";
import BeforeAfterSlider from "./blocks/BeforeAfterSlider";
import SiteMap from "./blocks/SiteMap";
import type { SiteSectionId, TradeSiteTemplate, StockPair } from "@/lib/site-templates";
import { POWERED_BY_URL } from "@/lib/routes";

/**
 * Locked trade website layout — the single renderer behind all ten templates
 * (plumber … generic). Blocks are defined once and ordered per trade by
 * `def.sectionOrder`, so every site keeps the same SEO / AEO / GEO contract:
 *
 *   one <h1> (hero) → <h2> per block → <h3> per card
 *   descriptive alt text on every image
 *   real postal codes + towns in the service-area block (build-time data)
 *   keyless Google map centred on the trader's exact location
 *   always-visible FAQ answers (quotable by AI answer engines)
 *   NAP in the footer, identical to the LocalBusiness schema
 */

type Props = {
  content: any;
  posts?: any[];
  preview?: boolean;
  def: TradeSiteTemplate;
  /** Template/demo pages say so, so nobody mistakes them for a real business. */
  demo?: boolean;
};

function telHref(phone: string) {
  return `tel:${(phone || "").replace(/[^\d+]/g, "")}`;
}
function waHref(phone: string, businessName: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(`Hi ${businessName}! I found you online and would like a quote.`);
  return digits ? `https://wa.me/${digits}?text=${text}` : "";
}

export default function TradeSiteTemplate({
  content,
  posts = [],
  preview = false,
  def,
  demo = false,
}: Props) {
  const c = content || {};
  const primary: string = c.palette?.primary || def.palette.primary;
  const secondary: string = c.palette?.secondary || def.palette.secondary;
  const { radius, uppercaseHeadings, tintedSections, eyebrowTracking, hero: heroLayout } = def.style;

  const businessName: string = c.businessName || "Your Business";
  const phone: string = c.phone || "";
  const email: string = c.email || "";
  const services: any[] = Array.isArray(c.services) && c.services.length ? c.services : def.services;
  const faqs: any[] = Array.isArray(c.faqs) && c.faqs.length ? c.faqs : def.faqs;
  const hours: string[] = Array.isArray(c.hours) ? c.hours : [];
  const reviews: any[] = Array.isArray(c.reviews) ? c.reviews : [];
  const realPhotos: string[] = Array.isArray(c.photos) ? c.photos : [];
  const stockPhotos: string[] = Array.isArray(c.stockPhotos) ? c.stockPhotos : def.gallery;

  // Image lifecycle: real Google/owner photos always win; stock only fills the gap.
  const gallery: string[] = (realPhotos.length ? realPhotos : stockPhotos).slice(0, 4);
  const heroImage: string = c.heroImage || realPhotos[0] || stockPhotos[0] || "";
  const stockInUse = !realPhotos.length;

  // Before/after pairs: explicit [] hides the block (no suitable photos yet).
  const pairs: StockPair[] = Array.isArray(c.beforeAfter) ? c.beforeAfter : def.beforeAfter;
  const highlights = Array.isArray(c.highlights) && c.highlights.length ? c.highlights : def.highlights;

  const areas =
    c.serviceAreas && Array.isArray(c.serviceAreas.postalCodes) ? c.serviceAreas : null;
  const place: string = c.city || c.areaServed || areas?.localities?.[0] || "";
  const postalCode: string = c.postalCode || areas?.postalCodes?.[0] || "";

  const wa = waHref(phone, businessName);
  const contactHref = email ? `mailto:${email}` : wa || (phone ? telHref(phone) : "#contact");
  const btnRadius = radius ? Math.min(radius, 18) : 2;

  /** SEO: consistent, descriptive alt text across the whole site. */
  const alt = (subject: string) => `${subject} — ${businessName}${place ? ` in ${place}` : ""}`;

  const headingClass = `text-2xl md:text-3xl font-black tracking-tight ${
    uppercaseHeadings ? "uppercase" : ""
  }`;
  const eyebrow = (text: string) => (
    <p
      className="text-[11px] font-black uppercase mb-2"
      style={{ color: primary, letterSpacing: eyebrowTracking }}
    >
      {text}
    </p>
  );

  /** Every non-hero block goes through here, so rhythm + spacing stay locked. */
  const shell = (
    id: SiteSectionId,
    index: number,
    body: React.ReactNode,
    tone?: "plain" | "soft" | "dark"
  ) => {
    const bg =
      tone === "dark"
        ? secondary
        : tone === "soft" || (tintedSections && index % 2 === 1)
          ? `${secondary}0A`
          : "";
    return (
      <section
        key={id}
        id={id === "beforeAfter" ? "before-after" : id}
        className={`site-block px-4 py-14 md:py-16 ${tone === "dark" ? "text-white" : ""}`}
        style={bg ? { backgroundColor: bg } : undefined}
      >
        <div className="max-w-5xl mx-auto">{body}</div>
      </section>
    );
  };

  /** Hero + sticky header CTAs (shared by all three hero layouts). */
  const ctaRow = (align: "left" | "center" = "left") => (
    <div className={`mt-7 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
      {phone && (
        <a
          href={telHref(phone)}
          className="px-6 py-3.5 font-black shadow-lg text-white"
          style={{ backgroundColor: primary, borderRadius: btnRadius }}
        >
          📞 {def.hero.ctaPrimary}
        </a>
      )}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 font-black text-white bg-[#25D366]"
          style={{ borderRadius: btnRadius }}
        >
          💬 {def.hero.ctaSecondary}
        </a>
      )}
      {!phone && !wa && (
        <a
          href="#contact"
          className="px-6 py-3.5 font-black text-white"
          style={{ backgroundColor: primary, borderRadius: btnRadius }}
        >
          {def.hero.ctaPrimary}
        </a>
      )}
    </div>
  );

  const badgeList = (
    <ul className="mt-6 flex flex-wrap gap-2 list-none p-0">
      {def.hero.badges.map((b) => (
        <li
          key={b}
          className="text-xs font-bold px-3 py-1.5 bg-white/12 backdrop-blur-sm border border-white/25 text-white"
          style={{ borderRadius: radius ? Math.min(radius, 14) : 2 }}
        >
          ✓ {b}
        </li>
      ))}
    </ul>
  );

  const trustLine = (c.rating || c.userRatingsTotal || place) && (
    <p className="mt-5 text-sm font-semibold text-white/85">
      {c.rating ? `★ ${c.rating}` : ""}
      {c.userRatingsTotal ? ` from ${c.userRatingsTotal} Google reviews` : ""}
      {c.rating && (place || postalCode) ? " · " : ""}
      {[place, postalCode].filter(Boolean).join(" ")}
    </p>
  );

  const heroHeadline = c.hero?.headline || def.hero.headline;
  const heroSub = c.hero?.subheadline || def.hero.subheadline;
  const heroTagline = c.tagline || `${def.tradeLabel}${place ? ` in ${place}` : ""}`;

  const heroNode = (
    <section
      id="hero"
      className={`site-hero${heroImage ? " has-photo" : ""} px-4`}
      style={{ backgroundColor: primary }}
    >
      {heroLayout === "split-card" ? (
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center py-14 md:py-20">
          <div>
            {eyebrow(heroTagline)}
            <h1 className="text-3xl md:text-4xl font-black leading-tight text-white">{heroHeadline}</h1>
            <p className="mt-4 text-lg text-white/90">{heroSub}</p>
            {ctaRow()}
            {trustLine}
          </div>
          <div className="relative">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt={alt(`${def.tradeLabel} work`)}
                className="w-full h-64 md:h-80 object-cover shadow-2xl border-4 border-white/20"
                style={{ borderRadius: radius }}
                fetchPriority="high"
                decoding="async"
              />
            ) : null}
            {badgeList}
          </div>
        </div>
      ) : heroLayout === "centered" ? (
        <div className="max-w-3xl mx-auto py-14 md:py-20 text-center">
          {eyebrow(heroTagline)}
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-white">{heroHeadline}</h1>
          <p className="mt-4 text-lg text-white/90">{heroSub}</p>
          <div className="flex justify-center">{ctaRow("center")}</div>
          <div className="flex justify-center">{badgeList}</div>
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={alt(`${def.tradeLabel} at work`)}
              className="mt-9 w-full h-56 md:h-80 object-cover shadow-2xl"
              style={{ borderRadius: radius }}
              fetchPriority="high"
              decoding="async"
            />
          ) : null}
        </div>
      ) : (
        <>
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="site-hero-img"
              src={heroImage}
              alt={alt(`${def.tradeLabel} work`)}
              fetchPriority="high"
              decoding="async"
            />
          ) : null}
          <div className="site-hero-scrim" aria-hidden="true" />
          <div className="max-w-5xl mx-auto site-hero-body">
            {eyebrow(heroTagline)}
            <h1 className="text-3xl md:text-5xl font-black leading-tight max-w-3xl text-white drop-shadow-sm">
              {heroHeadline}
            </h1>
            <p className="mt-4 text-lg max-w-2xl text-white/90">{heroSub}</p>
            {ctaRow()}
            {badgeList}
            {trustLine}
          </div>
        </>
      )}
    </section>
  );

  // ── Highlights: hard numbers, one <h3> per stat ──
  const highlightsNode = (
    <>
      {eyebrow(def.hero.badges[0])}
      <h2 className={headingClass}>{def.highlightsHeading}</h2>
      <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4">
        {highlights.slice(0, 4).map((h: any) => (
          <div
            key={h.label}
            className="p-5 bg-white border border-slate-200"
            style={{ borderRadius: radius }}
          >
            <h3 className="text-2xl font-black" style={{ color: primary }}>
              {h.value}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{h.label}</p>
          </div>
        ))}
      </div>
    </>
  );

  // ── Services: the keyword-bearing block, <h3> per service ──
  const servicesNode = (
    <>
      {eyebrow(def.name)}
      <h2 className={headingClass}>{c.serviceHeading || def.serviceHeading}</h2>
      <p className="mt-3 text-slate-500 max-w-2xl">{def.serviceIntro}</p>
      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.slice(0, 6).map((s: any, i: number) => (
          <article
            key={`${s.title}-${i}`}
            className="p-5 bg-white border border-slate-200"
            style={{ borderRadius: radius }}
          >
            <h3 className="font-black text-lg">{s.title}</h3>
            {s.description && (
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{s.description}</p>
            )}
          </article>
        ))}
      </div>
    </>
  );

  // ── About: the paragraph AI assistants quote (id="about" is speakable) ──
  const aboutNode = (
    <>
      {eyebrow(place ? `Serving ${place}` : def.tradeLabel)}
      <h2 className={headingClass}>{def.aboutHeading}</h2>
      <p className="mt-4 text-slate-600 leading-relaxed whitespace-pre-line max-w-3xl">
        {c.about || def.aboutFallback}
      </p>
      {areas && (
        <p className="mt-4 text-sm font-semibold text-slate-500">
          We look after {areas.postalCodes.length} postcodes within {areas.radiusKm} km
          {areas.localities.length ? `, including ${areas.localities.slice(0, 4).join(", ")}` : ""}.
        </p>
      )}
    </>
  );

  // ── Before / after: the block that proves the work (hidden without photos) ──
  const beforeAfterNode = pairs.length === 0 ? null : (
    <>
      {eyebrow(def.tradeLabel)}
      <h2 className={headingClass}>{def.beforeAfterHeading}</h2>
      <p className="mt-3 text-slate-500 max-w-2xl">{def.beforeAfterIntro}</p>
      <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-6">
        {pairs.slice(0, 2).map((p: any, i: number) => (
          <BeforeAfterSlider
            key={`${p.before}-${i}`}
            before={p.before}
            after={p.after}
            caption={p.caption}
            beforeLabel={p.beforeLabel}
            afterLabel={p.afterLabel}
            alt={alt(p.alt || def.beforeAfterHeading)}
            radius={radius}
          />
        ))}
      </div>
      {stockInUse && demo && (
        <p className="mt-4 text-xs text-slate-400 font-semibold">
          Demo photography — real businesses show their own before/after photos here.
        </p>
      )}
    </>
  );

  // ── Gallery: four real job photos with descriptive alt text ──
  const galleryNode = (
    <>
      {eyebrow(place || def.tradeLabel)}
      <h2 className={headingClass}>{c.galleryHeading || def.galleryHeading}</h2>
      <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
        {gallery.map((src: string, i: number) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt={alt(`${def.tradeLabel} project ${i + 1}`)}
            className="w-full h-36 md:h-44 object-cover border border-white shadow-sm"
            style={{ borderRadius: radius }}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
    </>
  );

  // ── Service areas (GEO): the real postcodes inside the 10 km radius ──
  const areasNode = (
    <>
      {eyebrow("Service area")}
      <h2 className={headingClass}>{def.areaHeading}</h2>
      <p className="mt-3 text-slate-500 max-w-2xl">{def.areaIntro}</p>

      {areas ? (
        <>
          <ul className="mt-6 flex flex-wrap gap-2 list-none p-0">
            {areas.postalCodes.map((code: string) => (
              <li
                key={code}
                className="px-3.5 py-2 text-sm font-black bg-white border-2"
                style={{ borderRadius: btnRadius, borderColor: primary, color: primary }}
              >
                {code}
              </li>
            ))}
          </ul>
          {areas.localities.length > 0 && (
            <p className="mt-5 text-slate-600 leading-relaxed">
              <strong className="font-black">{place || "Local"} and nearby:</strong>{" "}
              {areas.localities.join(" · ")}
            </p>
          )}
          <p className="mt-3 text-sm text-slate-500">
            Covering roughly {areas.radiusKm} km around {place || "our base"}
            {postalCode ? ` (${postalCode})` : ""} — usually on site within 30–60 minutes.
          </p>
        </>
      ) : (
        <p className="mt-4 text-slate-600 leading-relaxed">
          {c.areaServed
            ? `We cover ${c.areaServed}${postalCode ? ` (${postalCode})` : ""} and the surrounding neighbourhoods.`
            : "Call or message us with your address and we'll confirm the earliest visit."}
        </p>
      )}
    </>
  );

  // ── Map: keyless Google embed pinned to the trader's exact location ──
  const mapNode = (
    <>
      {eyebrow("Location")}
      <h2 className={headingClass}>{def.mapHeading}</h2>
      <p className="mt-3 mb-7 text-slate-500 max-w-2xl">{def.mapIntro}</p>
      <SiteMap
        lat={c.geo?.lat}
        lng={c.geo?.lng}
        query={postalCode || c.address || place}
        businessName={businessName}
        address={c.address || ""}
        postalCode={postalCode}
        mapUrl={c.mapUrl || ""}
        radius={radius}
        title={alt("location on Google Maps")}
      />
    </>
  );

  // ── Reviews: synced Google reviews + aggregate rating ──
  const reviewsNode = (
    <>
      {eyebrow(c.rating ? `${c.rating} ★ average` : "Verified")}
      <h2 className={headingClass}>{def.reviewsHeading}</h2>
      {c.rating && (
        <p className="mt-3 text-slate-500">
          Rated {c.rating} out of 5 from {c.userRatingsTotal || reviews.length} Google reviews
          {place ? ` in ${place}` : ""}.
        </p>
      )}
      <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.slice(0, 3).map((r: any, i: number) => (
          <blockquote
            key={`${r.author}-${i}`}
            className="p-5 bg-white border border-slate-200"
            style={{ borderRadius: radius }}
          >
            <div className="text-amber-500 mb-2" aria-hidden="true">
              {"★".repeat(Math.max(1, Math.min(5, r.rating || 5)))}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">“{r.text}”</p>
            <footer className="mt-3 text-xs font-black text-slate-400 uppercase tracking-wider">
              {r.author}
              {r.time ? ` · ${r.time}` : ""}
            </footer>
          </blockquote>
        ))}
      </div>
    </>
  );

  // ── Hours: NAP consistency for local search ──
  const hoursNode = (
    <>
      {eyebrow(phone ? `Call ${phone}` : "When we're open")}
      <h2 className={headingClass}>{c.hoursHeading || def.hoursHeading}</h2>
      {hours.length > 0 ? (
        <ul
          className="mt-6 divide-y divide-slate-100 border border-slate-200 overflow-hidden list-none p-0 bg-white"
          style={{ borderRadius: radius }}
        >
          {hours.map((h) => (
            <li key={h} className="px-5 py-3 text-sm font-semibold text-slate-700">
              {h}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-slate-600">
          Opening hours are confirmed when you book — call and we'll tell you the earliest slot.
        </p>
      )}
    </>
  );

  // ── FAQ (AEO): answers are always in the DOM, never behind JS ──
  const faqNode = (
    <>
      {eyebrow("Answers")}
      <h2 className={headingClass}>{def.faqHeading}</h2>
      <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-5">
        {faqs.slice(0, 6).map((f: any, i: number) => (
          <article
            key={`${f.q}-${i}`}
            className="p-5 bg-white border border-slate-200"
            style={{ borderRadius: radius }}
          >
            <h3 className="font-black leading-snug">{f.q}</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">{f.a}</p>
          </article>
        ))}
      </div>
    </>
  );

  // ── Quote / contact: the conversion block ──
  const quoteNode = (
    <>
      <h2 className={`${headingClass} text-white`}>{def.quote.title}</h2>
      <p className="mt-3 max-w-2xl text-white/85">{def.quote.subtitle}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        {phone && (
          <a
            href={telHref(phone)}
            className="px-6 py-3.5 bg-white font-black"
            style={{ color: secondary, borderRadius: btnRadius }}
          >
            📞 {phone}
          </a>
        )}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-[#25D366] text-white font-black"
            style={{ borderRadius: btnRadius }}
          >
            💬 {def.quote.primary}
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="px-6 py-3.5 border-2 border-white/40 text-white font-black"
            style={{ borderRadius: btnRadius }}
          >
            ✉️ {def.quote.secondary}
          </a>
        )}
        {c.mapUrl && (
          <a
            href={c.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 border-2 border-white/40 text-white font-black"
            style={{ borderRadius: btnRadius }}
          >
            📍 Directions
          </a>
        )}
      </div>
      {(c.address || phone) && (
        <p className="mt-6 text-sm text-white/75">
          {[businessName, c.address, postalCode, phone].filter(Boolean).join(" · ")}
        </p>
      )}
    </>
  );

  // ── Latest updates: auto-fed by the WhatsApp → website_posts pipeline ──
  const updatesNode = posts.length ? (
    <>
      {eyebrow("Recent work")}
      <h2 className={headingClass}>Latest jobs & updates</h2>
      <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-5">
        {posts.slice(0, 3).map((p: any, i: number) => (
          <article
            key={`${p.title}-${i}`}
            className="overflow-hidden border border-slate-200 bg-white"
            style={{ borderRadius: radius }}
          >
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt={alt(p.title || "Recent job")}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
            )}
            <div className="p-5">
              <h3 className="font-black">{p.title || "Recent job"}</h3>
              {p.text && <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{p.text}</p>}
            </div>
          </article>
        ))}
      </div>
    </>
  ) : null;

  const headerSolid = def.style.header === "solid";
  const header = (
    <header
      className="sticky top-0 z-20 px-4 py-3 border-b border-black/5"
      style={{ backgroundColor: headerSolid ? secondary : "#ffffff" }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <a href="#hero" className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-9 h-9 flex items-center justify-center font-black shrink-0 text-white"
            style={{ backgroundColor: primary, borderRadius: Math.min(radius, 12) }}
          >
            {businessName.charAt(0).toUpperCase()}
          </span>
          <span
            className={`font-black text-lg truncate ${headerSolid ? "text-white" : "text-slate-900"}`}
          >
            {businessName}
          </span>
        </a>
        <nav
          aria-label="Sections"
          className={`hidden md:flex items-center gap-5 text-sm font-bold ${
            headerSolid ? "text-white/85" : "text-slate-600"
          }`}
        >
          <a href="#services" className="hover:underline">Services</a>
          <a href="#before-after" className="hover:underline">Before &amp; after</a>
          <a href="#gallery" className="hover:underline">Gallery</a>
          <a href="#areas" className="hover:underline">Areas</a>
          <a href="#faq" className="hover:underline">FAQs</a>
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          {phone && (
            <a
              href={telHref(phone)}
              className="px-4 py-2.5 font-black text-white"
              style={{ backgroundColor: primary, borderRadius: btnRadius }}
            >
              📞 <span className="hidden sm:inline">Call now</span>
            </a>
          )}
          <a
            href="#contact"
            className={`hidden sm:inline-block px-4 py-2.5 font-black border ${
              headerSolid ? "border-white/40 text-white" : "border-slate-200 text-slate-900"
            }`}
            style={{ borderRadius: btnRadius }}
          >
            Get a quote
          </a>
        </div>
      </div>
    </header>
  );

  // ── Locked block order for this trade ──
  const blockMap: Record<SiteSectionId, React.ReactNode> = {
    hero: heroNode,
    highlights: highlightsNode,
    services: servicesNode,
    about: aboutNode,
    beforeAfter: beforeAfterNode,
    gallery: galleryNode,
    areas: areasNode,
    map: mapNode,
    reviews: reviewsNode,
    hours: hoursNode,
    faq: faqNode,
    quote: null,
    updates: updatesNode,
  };

  let visibleIndex = 0;
  const blocks: React.ReactNode[] = def.sectionOrder.map((id) => {
    if (id === "quote") {
      return (
        <section
          key="quote"
          id="contact"
          className="site-block px-4 py-16 text-white"
          style={{ backgroundColor: secondary }}
        >
          <div className="max-w-5xl mx-auto">{quoteNode}</div>
        </section>
      );
    }
    const node = blockMap[id];
    if (!node) return null;
    visibleIndex += 1;
    return shell(id, visibleIndex, node);
  });

  // Auto-fed job updates always land just above the footer.
  if (updatesNode) blocks.push(shell("updates", visibleIndex + 1, updatesNode, "soft"));

  return (
    <div
      className="site-root min-h-screen bg-white text-slate-900 font-sans"
      style={
        {
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
      {demo && (
        <div className="bg-slate-900 text-white text-center text-xs font-bold py-2 px-4">
          Template demo for {def.name} — sample content only.{" "}
          <a href="/site/templates" className="underline">
            See all 10 templates
          </a>
        </div>
      )}

      {header}
      {blocks}

      {/* Footer — NAP repeated as visible text, matching the LocalBusiness schema */}
      <footer className="px-4 py-10 border-t border-slate-100">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
          <div>
            <p className="font-black">{businessName}</p>
            {c.address && <p className="mt-2 text-sm text-slate-500">{c.address}</p>}
            {postalCode && <p className="text-sm text-slate-500">{postalCode}</p>}
            {phone && (
              <a href={telHref(phone)} className="mt-2 inline-block text-sm font-black" style={{ color: primary }}>
                {phone}
              </a>
            )}
            {place && (
              <p className="mt-2 text-sm text-slate-500">
                {def.tradeLabel} serving {place} and nearby areas.
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Services</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-500 list-none p-0">
              {services.slice(0, 5).map((s: any) => (
                <li key={s.title}>{s.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Areas</p>
            {areas ? (
              <p className="mt-2 text-sm text-slate-500">
                {areas.postalCodes.join(", ")}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">{c.areaServed || place || "Local area"}</p>
            )}
            <p className="mt-3 text-xs text-slate-400 font-semibold">
              {stockInUse
                ? demo
                  ? "Demo photography"
                  : "Placeholder photography — your own photos replace these automatically."
                : "Photos from our Google Business Profile."}
            </p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-semibold">
          <span>
            © {new Date().getFullYear()} {businessName}
          </span>
          <span>
            Powered by{" "}
            <a
              href={POWERED_BY_URL}
              className="font-black text-slate-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Neerzy
            </a>
            {" · "}
            <a
              href={POWERED_BY_URL}
              className="font-black text-slate-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your free website
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
