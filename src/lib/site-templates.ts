/**
 * LOCKED trade website templates (Part 2 — trader sites).
 *
 * Ten full-page, trade-specific layouts. Every template renders the same locked
 * block set — hero · highlights · services · about · before/after · gallery ·
 * service areas · Google map · reviews · hours · FAQ · quote — but each trade
 * gets its own section ORDER, palette (from `template-looks.ts`), visual
 * language (radius / caps / header treatment) and fallback copy.
 *
 * SEO / AEO / GEO rules baked in here:
 *   • exactly one <h1> (hero), <h2> per block, <h3> per card
 *   • every image gets descriptive alt text (trade + place + business)
 *   • FAQ answers are self-contained, quotable 40–60 word answers
 *   • service-area copy names real towns AND postal codes inside 10 km
 *   • stock photos are PLACEHOLDERS ONLY — see `STOCK_NOTE`
 */

import { TEMPLATE_LOOKS, type TemplateId } from "./template-looks";

/** Stock photos are Unsplash CDN (commercial licence, hotlink-safe). */
export const STOCK_NOTE =
  "Stock photos are placeholders for templates and demos only. Once a trader " +
  "connects Google Business Profile, `syncWebsitePhotosForUser` replaces them " +
  "with their own job photos; manually uploaded photos always win.";

/** Build an Unsplash CDN URL from a photo id. */
export function stock(photoId: string, w = 1600): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&q=80`;
}

export type SiteSectionId =
  | "hero"
  | "highlights"
  | "services"
  | "about"
  | "beforeAfter"
  | "gallery"
  | "areas"
  | "map"
  | "reviews"
  | "hours"
  | "faq"
  | "quote"
  | "updates";

export type StockPair = {
  before: string;
  after: string;
  /** Short, concrete result — doubles as the caption. */
  caption: string;
  /** Accessible description of the pair. */
  alt: string;
  /** Optional labels; Google job photos use "During"/"Finished" instead. */
  beforeLabel?: string;
  afterLabel?: string;
};

export type TradeStyle = {
  /** Corner radius in px for cards / images / buttons. */
  radius: number;
  /** Industrial trades shout in caps; care trades stay sentence-case. */
  uppercaseHeadings: boolean;
  /** Sticky header treatment. */
  header: "solid" | "light";
  /** Hero composition. */
  hero: "full-bleed" | "split-card" | "centered";
  /** Alternate tinted panels between blocks (visual rhythm). */
  tintedSections: boolean;
  /** Letter-spacing for the small eyebrow above headings. */
  eyebrowTracking: string;
};

export type TradeSiteTemplate = {
  id: TemplateId;
  name: string;
  /** Plain trade wording used in titles, alt text and copy. */
  tradeLabel: string;
  /** Singular noun for a person ("plumber", "electrician"). */
  serviceNoun: string;
  /** Locked block order for this trade. */
  sectionOrder: SiteSectionId[];
  style: TradeStyle;
  hero: {
    headline: string;
    subheadline: string;
    badges: string[];
    ctaPrimary: string;
    ctaSecondary: string;
  };
  highlightsHeading: string;
  highlights: { value: string; label: string }[];
  serviceHeading: string;
  serviceIntro: string;
  services: { title: string; description: string }[];
  aboutHeading: string;
  aboutFallback: string;
  beforeAfterHeading: string;
  beforeAfterIntro: string;
  beforeAfter: StockPair[];
  galleryHeading: string;
  gallery: string[];
  areaHeading: string;
  areaIntro: string;
  mapHeading: string;
  mapIntro: string;
  reviewsHeading: string;
  hoursHeading: string;
  faqHeading: string;
  faqs: { q: string; a: string }[];
  quote: { title: string; subtitle: string; primary: string; secondary: string };
  /** schema.org priceRange hint (trust + rich-result signal). */
  priceRange: string;
  /** Base keyword phrases (local modifiers are appended from service areas). */
  keywords: string[];
  /** Fallback palette when content.palette is missing. */
  palette: { primary: string; secondary: string };
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. Plumber — trust first, emergency forward
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PLUMBER: TradeSiteTemplate = {
  id: "plumber",
  name: TEMPLATE_LOOKS.plumber.name,
  tradeLabel: "plumbing",
  serviceNoun: "plumber",
  sectionOrder: [
    "hero", "highlights", "services", "about", "beforeAfter",
    "gallery", "areas", "map", "reviews", "hours", "faq", "quote",
  ],
  style: {
    radius: 20,
    uppercaseHeadings: false,
    header: "light",
    hero: "full-bleed",
    tintedSections: true,
    eyebrowTracking: "0.18em",
  },
  hero: {
    headline: "Emergency plumber — leaks fixed today",
    subheadline:
      "Burst pipes, blocked drains and boiler repairs handled by a local, insured plumber. Free quotes, tidy work, no call-out surprises.",
    badges: ["Same-day call-outs", "Fixed-price quotes", "Work guaranteed"],
    ctaPrimary: "Call now",
    ctaSecondary: "WhatsApp a photo",
  },
  highlightsHeading: "Why neighbours call us first",
  highlights: [
    { value: "60 min", label: "Average emergency arrival" },
    { value: "24/7", label: "Leak & flood line" },
    { value: "12 mo", label: "Parts & labour warranty" },
    { value: "5★", label: "Rated by local customers" },
  ],
  serviceHeading: "Plumbing services",
  serviceIntro: "From a dripping tap to a full bathroom refit — one local plumber for the lot.",
  services: [
    { title: "Emergency Leak Repairs", description: "Burst pipes and active leaks stopped fast, day or night." },
    { title: "Blocked Drains & Toilets", description: "Drain clearing with a camera check when needed." },
    { title: "Boiler & Water Heater Repair", description: "Servicing, repairs and certified replacements." },
    { title: "Tap, Toilet & Valve Fitting", description: "Neat swaps of worn fixtures and shut-off valves." },
    { title: "Bathroom & Kitchen Plumbing", description: "Full first-fix and second-fix plumbing for refits." },
    { title: "Water Pressure & Pipework", description: "Pressure problems traced, re-piped and tested." },
  ],
  aboutHeading: "Your local plumbing team",
  aboutFallback:
    "We are a local, fully insured plumbing business. Every job is quoted before we start, we protect your floors and worktops, and we clear up after ourselves.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "Drag the slider to see what a proper repair looks like.",
  beforeAfter: [
    {
      before: stock("1607472586893-edb57bdc0e39"),
      after: stock("1585704032915-c3400ca199e7"),
      caption: "Corroded supply pipe replaced with new copper — damp patch gone.",
      alt: "Plumbing repair before and after",
    },
    {
      before: stock("1521207418485-99c705420785"),
      after: stock("1552321554-5fefe8c9ef14"),
      caption: "Blocked bathroom drain cleared and resealed the same afternoon.",
      alt: "Blocked drain clearance before and after",
    },
  ],
  galleryHeading: "Recent plumbing jobs",
  gallery: [
    stock("1584622650111-993a426fbf0a", 1200),
    stock("1607472586893-edb57bdc0e39", 1200),
    stock("1552321554-5fefe8c9ef14", 1200),
    stock("1521207418485-99c705420785", 1200),
  ],
  areaHeading: "Plumbers covering your postcode",
  areaIntro:
    "We are based locally and reach most nearby streets within 30 minutes — often faster for emergencies.",
  mapHeading: "Where to find us",
  mapIntro: "Send your postcode and we'll confirm the earliest call-out slot.",
  reviewsHeading: "What local customers say",
  hoursHeading: "Opening hours",
  faqHeading: "Plumbing questions, answered",
  faqs: [
    {
      q: "How much does an emergency plumber cost?",
      a: "Emergency call-outs are quoted at a fixed rate before work begins, including the first hour on site. You get the price in writing on WhatsApp or by phone, so there are no surprise charges when the job is done.",
    },
    {
      q: "How quickly can you get to a burst pipe?",
      a: "We aim to be with you within 60 minutes for burst pipes and flooding inside our service area. Switch off the stopcock and call us straight away — we keep emergency slots free every day.",
    },
    {
      q: "Do you charge for quotes?",
      a: "No. Quotes for planned work such as bathroom refits or boiler replacements are free, with a fixed price agreed before we start. Only emergency call-outs carry the standard attendance fee.",
    },
    {
      q: "Which areas do you cover?",
      a: "We cover our home town and every postcode within about 10 km, including the surrounding suburbs listed on this page. Send your postcode and we will confirm straight away.",
    },
    {
      q: "Is your plumbing work guaranteed?",
      a: "Yes. All repairs carry a 12-month parts and labour warranty, and new installations follow the manufacturer's full warranty. If something we fitted fails, we come back and put it right.",
    },
  ],
  quote: {
    title: "Get a free plumbing quote",
    subtitle: "Send a photo of the problem and we'll reply with a fixed price — usually within the hour.",
    primary: "Send a photo on WhatsApp",
    secondary: "Call the office",
  },
  priceRange: "$$",
  keywords: ["emergency plumber", "blocked drain", "leak repair", "boiler repair", "local plumber"],
  palette: TEMPLATE_LOOKS.plumber.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. HVAC — comfort, reminders, maintenance plans
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HVAC: TradeSiteTemplate = {
  id: "hvac",
  name: TEMPLATE_LOOKS.hvac.name,
  tradeLabel: "heating & air conditioning",
  serviceNoun: "HVAC technician",
  sectionOrder: [
    "hero", "highlights", "services", "about", "beforeAfter",
    "gallery", "map", "areas", "reviews", "hours", "faq", "quote",
  ],
  style: {
    radius: 14,
    uppercaseHeadings: false,
    header: "solid",
    hero: "split-card",
    tintedSections: true,
    eyebrowTracking: "0.16em",
  },
  hero: {
    headline: "Heating & cooling that just works",
    subheadline:
      "Air conditioning, furnace and heat-pump specialists. Repairs today, honest replacement advice, and maintenance plans that stop breakdowns before they happen.",
    badges: ["Repairs within 24 h", "All major brands", "Financing available"],
    ctaPrimary: "Book a service",
    ctaSecondary: "Get a free quote",
  },
  highlightsHeading: "Comfort you can rely on",
  highlights: [
    { value: "24 h", label: "Repair response" },
    { value: "10 yr", label: "Parts warranty on installs" },
    { value: "2×", label: "Yearly maintenance visits" },
    { value: "−20%", label: "Typical energy saving after upgrade" },
  ],
  serviceHeading: "Heating & cooling services",
  serviceIntro: "One team for every season — cooling in summer, heating in winter, air quality all year.",
  services: [
    { title: "Air Conditioning Repair", description: "Diagnostics and same-day fixes for warm or noisy units." },
    { title: "Furnace & Boiler Service", description: "Safety checks, cleaning and part replacement." },
    { title: "System Replacement", description: "Right-sized quotes for new AC and heat pumps." },
    { title: "Heat Pump Installation", description: "Efficient year-round heating and cooling." },
    { title: "Duct Cleaning & Sealing", description: "Breathe easier and stop paying to cool the attic." },
    { title: "Maintenance Plans", description: "Two visits a year, priority booking, no surprise bills." },
  ],
  aboutHeading: "About your local HVAC team",
  aboutFallback:
    "We install and service heating and cooling systems across our local area. We quote before we start, explain your options in plain English, and keep your home clean while we work.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "Old, noisy and expensive — or quiet, efficient and warm. Drag to compare.",
  beforeAfter: [
    {
      before: stock("1581094794329-c8112a89af12"),
      after: stock("1620662736427-b8a198f52a4d"),
      caption: "A 20-year-old condenser replaced with a high-efficiency inverter unit.",
      alt: "Air conditioner replacement before and after",
    },
    {
      before: stock("1558618666-fcd25c85cd64"),
      after: stock("1581091226825-a6a2a5aee158"),
      caption: "Dust-choked return duct cleaned, sealed and rebalanced.",
      alt: "Duct cleaning before and after",
    },
  ],
  galleryHeading: "Recent installations",
  gallery: [
    stock("1620662736427-b8a198f52a4d", 1200),
    stock("1581092160562-40aa08e78837", 1200),
    stock("1558618666-fcd25c85cd64", 1200),
    stock("1581094794329-c8112a89af12", 1200),
  ],
  areaHeading: "Service areas & response times",
  areaIntro:
    "Our vans cover every postcode within roughly 10 km, with same-day slots kept free for no-heat and no-cool calls.",
  mapHeading: "Visit our workshop",
  mapIntro: "Collect filters, book a slot in person, or get directions from your postcode.",
  reviewsHeading: "Reviews from local homes",
  hoursHeading: "Opening hours & emergency cover",
  faqHeading: "HVAC questions, answered",
  faqs: [
    {
      q: "How often should an air conditioner be serviced?",
      a: "Once a year for cooling and once for heating — usually spring and autumn. An annual service keeps efficiency up, catches worn parts early and keeps most manufacturer warranties valid.",
    },
    {
      q: "My heater stopped working — how fast can you come?",
      a: "No-heat and no-cool calls get priority and are usually attended within 24 hours, same day where possible. Call us and we will confirm a time window before we set off.",
    },
    {
      q: "Is it worth replacing an old furnace or AC unit?",
      a: "If your system is over 12 years old, needs frequent repairs, or your energy bills keep climbing, replacement usually pays back. We quote both options side by side so you can compare fairly.",
    },
    {
      q: "Do you offer maintenance plans?",
      a: "Yes. A yearly plan covers two scheduled visits, filter checks, coil cleaning and priority booking during heatwaves and cold snaps, at a lower rate than separate call-outs.",
    },
    {
      q: "Which areas do you cover?",
      a: "We serve our home city and every suburb within about 10 km, listed on this page by postcode. If your code is not shown, call us — we often stretch our radius for full installations.",
    },
  ],
  quote: {
    title: "Book a service or get a quote",
    subtitle: "Tell us what your system is doing and we'll book the first sensible slot.",
    primary: "Book a call-out",
    secondary: "Ask about a new system",
  },
  priceRange: "$$",
  keywords: ["air conditioning repair", "furnace service", "heat pump installation", "duct cleaning", "HVAC maintenance"],
  palette: TEMPLATE_LOOKS.hvac.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. Electrician — safety, certification, high-vis
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ELECTRICIAN: TradeSiteTemplate = {
  id: "electrician",
  name: TEMPLATE_LOOKS.electrician.name,
  tradeLabel: "electrical",
  serviceNoun: "electrician",
  sectionOrder: [
    "hero", "services", "highlights", "about", "beforeAfter",
    "gallery", "areas", "map", "reviews", "hours", "faq", "quote",
  ],
  style: {
    radius: 4,
    uppercaseHeadings: true,
    header: "solid",
    hero: "centered",
    tintedSections: false,
    eyebrowTracking: "0.3em",
  },
  hero: {
    headline: "Safe electrical work, certified and tested",
    subheadline:
      "Rewires, fuse boards, EV chargers and fault-finding by licensed electricians. Every job tested, certified and signed off before we leave.",
    badges: ["Licensed & insured", "Test certificates issued", "Emergency call-outs"],
    ctaPrimary: "Call an electrician",
    ctaSecondary: "Request a quote",
  },
  highlightsHeading: "Certified, tested, documented",
  highlights: [
    { value: "100%", label: "Jobs tested & certified" },
    { value: "1 h", label: "Emergency response target" },
    { value: "5 yr", label: "Workmanship guarantee" },
    { value: "0", label: "Call-outs with hidden extras" },
  ],
  serviceHeading: "Electrical services",
  serviceIntro: "Domestic and light commercial work, from a single socket to a full rewire.",
  services: [
    { title: "Fault Finding & Repairs", description: "Tripping breakers and dead circuits traced fast." },
    { title: "Fuse Board / Panel Upgrades", description: "Modern, compliant boards with surge protection." },
    { title: "Full & Partial Rewires", description: "Older wiring replaced with certified new circuits." },
    { title: "EV Charger Installation", description: "Load-checked, grant-ready home charging points." },
    { title: "Lighting & Sockets", description: "Extra outlets, downlights and outdoor lighting." },
    { title: "Safety Inspections", description: "Condition reports for landlords and buyers." },
  ],
  aboutHeading: "About our electrical team",
  aboutFallback:
    "We are licensed electricians working to current wiring regulations. Every installation is tested and documented, and we explain exactly what we found before any work begins.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "Old, overloaded and unsafe — or new, certified and labelled. Drag to see.",
  beforeAfter: [
    {
      before: stock("1544724569-5f546fd6f2b5"),
      after: stock("1621905251189-08b45d6a269e"),
      caption: "A 1970s fuse board replaced with a fully labelled RCBO consumer unit.",
      alt: "Fuse board replacement before and after",
    },
    {
      before: stock("1473341304170-971dccb5ac1e"),
      after: stock("1605810230434-7631ac76ec81"),
      caption: "DIY junction box removed; circuit rewired, tested and certified.",
      alt: "Electrical fault repair before and after",
    },
  ],
  galleryHeading: "Recent electrical work",
  gallery: [
    stock("1621905251189-08b45d6a269e", 1200),
    stock("1544724569-5f546fd6f2b5", 1200),
    stock("1605810230434-7631ac76ec81", 1200),
    stock("1473341304170-971dccb5ac1e", 1200),
  ],
  areaHeading: "Electrical work in your postcode",
  areaIntro:
    "We cover every postcode within about 10 km of base, with 60-minute emergency targets for power loss and burning smells.",
  mapHeading: "Find our unit",
  mapIntro: "Parts in stock, quotes in person, and directions straight to the workshop.",
  reviewsHeading: "What homeowners say",
  hoursHeading: "Opening hours",
  faqHeading: "Electrical questions, answered",
  faqs: [
    {
      q: "Do I need a certificate for electrical work?",
      a: "Yes for most fixed wiring work. We test the circuit and issue a certificate covering the installation, which you keep for insurance, warranty and future sales — it is included in our quoted price.",
    },
    {
      q: "How much does a fuse board replacement cost?",
      a: "Most domestic fuse board upgrades are completed in a day at a fixed quoted price that includes testing and certification. The final figure depends on circuit count and any remedial work found during testing.",
    },
    {
      q: "Why does my breaker keep tripping?",
      a: "Usually a faulty appliance, water ingress or a damaged cable. We isolate circuits one by one with test equipment to find the real cause instead of resetting the breaker and hoping it holds.",
    },
    {
      q: "Can you install an EV charger at my house?",
      a: "Yes. We check your supply capacity, earth arrangement and cable route first, then install and commission the charger with the protection the regulations require in your country.",
    },
    {
      q: "Which postcodes do you cover?",
      a: "Our electricians cover the town and every postcode within roughly 10 km of it, as listed on this page. For commercial projects we travel further — just ask.",
    },
  ],
  quote: {
    title: "Request an electrical quote",
    subtitle: "Describe the job or send a photo of your fuse board and we'll price it clearly.",
    primary: "Request a quote",
    secondary: "Emergency? Call now",
  },
  priceRange: "$$",
  keywords: ["emergency electrician", "fuse board replacement", "rewiring", "EV charger installation", "electrical inspection"],
  palette: TEMPLATE_LOOKS.electrician.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. Roofing — storm damage, inspections, big-ticket trust
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ROOFING: TradeSiteTemplate = {
  id: "roofing",
  name: TEMPLATE_LOOKS.roofing.name,
  tradeLabel: "roofing",
  serviceNoun: "roofer",
  sectionOrder: [
    "hero", "highlights", "beforeAfter", "services", "about",
    "gallery", "areas", "reviews", "map", "hours", "faq", "quote",
  ],
  style: {
    radius: 8,
    uppercaseHeadings: true,
    header: "solid",
    hero: "full-bleed",
    tintedSections: true,
    eyebrowTracking: "0.24em",
  },
  hero: {
    headline: "Storm damage? Roofers on site this week",
    subheadline:
      "Leak repairs, full re-roofs and insurance-ready inspection reports. Scaffold-safe crews, written warranties and a fixed price before we start.",
    badges: ["Insurance reports", "Emergency tarping", "25-year material warranty"],
    ctaPrimary: "Book an inspection",
    ctaSecondary: "Send roof photos",
  },
  highlightsHeading: "Roofs that survive the weather",
  highlights: [
    { value: "48 h", label: "Emergency tarp turnaround" },
    { value: "25 yr", label: "Material warranty on re-roofs" },
    { value: "10 yr", label: "Workmanship guarantee" },
    { value: "Free", label: "Drone roof inspections" },
  ],
  serviceHeading: "Roofing services",
  serviceIntro: "Repairs, replacements and the paperwork insurers ask for.",
  services: [
    { title: "Leak Detection & Repair", description: "The actual leak found, not just patched." },
    { title: "Full Re-Roofs", description: "Strip, deck repair, membrane and re-tile." },
    { title: "Storm & Hail Damage", description: "Emergency tarping plus a damage report." },
    { title: "Gutters & Downpipes", description: "Clearing, resealing and full replacement." },
    { title: "Flat & Low-Slope Roofing", description: "Warm-roof systems with proper drainage falls." },
    { title: "Roof Inspections", description: "Photo reports for buyers, sellers and insurers." },
  ],
  aboutHeading: "About our roofing crew",
  aboutFallback:
    "We are a local roofing contractor working to manufacturer specifications. We document every roof with photos, quote in writing, and leave your garden cleaner than we found it.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "Storm-battered or brand new — drag the slider to compare.",
  beforeAfter: [
    {
      before: stock("1632759145351-1d592919f522"),
      after: stock("1503387762-592deb58ef4e"),
      caption: "Storm-lifted tiles stripped; new underlay, battens and ridge all refixed.",
      alt: "Storm damaged roof repair before and after",
    },
    {
      before: stock("1541888946425-d81bb19240f5"),
      after: stock("1600585154340-be6161a56a0c"),
      caption: "Failed valley and blocked gutter rebuilt after the downpour.",
      alt: "Roof leak repair before and after",
    },
  ],
  galleryHeading: "Roofs we've repaired",
  gallery: [
    stock("1632759145351-1d592919f522", 1200),
    stock("1541888946425-d81bb19240f5", 1200),
    stock("1600585154340-be6161a56a0c", 1200),
    stock("1503387762-592deb58ef4e", 1200),
  ],
  areaHeading: "Roofing in your postcode",
  areaIntro:
    "Crews cover every postcode within about 10 km. For storm events we triage by safety risk and get to exposed roofs first.",
  mapHeading: "Our yard & office",
  mapIntro: "Sample tiles, drone reports and quotes available in person.",
  reviewsHeading: "Reviews from local homeowners",
  hoursHeading: "Opening hours",
  faqHeading: "Roofing questions, answered",
  faqs: [
    {
      q: "How much does a new roof cost?",
      a: "Most residential re-roofs are quoted per square metre of roof area and include stripping, disposal, new underlay and flashing. We survey the roof first and send a fixed written price with no hidden extras.",
    },
    {
      q: "Will my insurance cover storm damage?",
      a: "Storm, hail and fallen-branch damage is usually covered. We document the damage with dated photos and a written report listing the affected areas so your insurer can assess the claim without a second visit.",
    },
    {
      q: "Can you fix a leak in the rain?",
      a: "Yes. We carry emergency tarps and sealant for temporary weatherproofing, then return in dry conditions to make a permanent repair. Emergency work is prioritised by how much water is entering the roof.",
    },
    {
      q: "How long does a re-roof take?",
      a: "A typical house takes three to five working days once scaffolding is up, depending on roof size and weather. You get a start date in writing and daily updates with photos of the progress.",
    },
    {
      q: "What areas do you cover?",
      a: "We roof across our town and every suburb within about 10 km, listed by postcode on this page. For commercial or multi-unit buildings we travel further — get in touch for a survey.",
    },
  ],
  quote: {
    title: "Get a roofing survey & quote",
    subtitle: "Send photos of the roof from the ground, or ask for a free drone inspection.",
    primary: "Book an inspection",
    secondary: "Emergency tarping",
  },
  priceRange: "$$$",
  keywords: ["roof repair", "roof replacement", "storm damage roofing", "roof leak repair", "gutter replacement"],
  palette: TEMPLATE_LOOKS.roofing.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  5. Handyman — small jobs, one visit, friendly
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HANDYMAN: TradeSiteTemplate = {
  id: "handyman",
  name: TEMPLATE_LOOKS.handyman.name,
  tradeLabel: "handyman",
  serviceNoun: "handyman",
  sectionOrder: [
    "hero", "services", "beforeAfter", "gallery", "highlights",
    "about", "areas", "reviews", "hours", "map", "faq", "quote",
  ],
  style: {
    radius: 18,
    uppercaseHeadings: false,
    header: "light",
    hero: "split-card",
    tintedSections: true,
    eyebrowTracking: "0.16em",
  },
  hero: {
    headline: "One handyman. A whole to-do list.",
    subheadline:
      "Shelves, doors, leaks, flat-pack, fencing — the jobs you keep putting off, done properly in one visit. No job too small.",
    badges: ["Half-day & full-day rates", "All tools supplied", "Fully insured"],
    ctaPrimary: "Book a visit",
    ctaSecondary: "Send your list",
  },
  highlightsHeading: "Small jobs, done properly",
  highlights: [
    { value: "1", label: "Visit for the whole list" },
    { value: "1 hr", label: "Minimum booking, half-hour steps" },
    { value: "100s", label: "Jobs completed locally" },
    { value: "Satisfied", label: "Or we come back free" },
  ],
  serviceHeading: "What we fix, fit & build",
  serviceIntro: "One trusted pair of hands for every odd job around the house and garden.",
  services: [
    { title: "Furniture & Flat-Pack", description: "Wardrobes, beds and desks assembled and levelled." },
    { title: "Shelves, TVs & Pictures", description: "Wall fixing into brick, plasterboard or stud." },
    { title: "Doors, Locks & Handles", description: "Sticking doors, new locks and hardware fitted." },
    { title: "Small Plumbing & Seals", description: "Taps, traps, silicone and basic leak fixes." },
    { title: "Garden & Fencing", description: "Fence panels, gates, decking and shed repairs." },
    { title: "Painting & Patch Repairs", description: "Filling, sanding and touch-up painting." },
  ],
  aboutHeading: "Meet your local handyman",
  aboutFallback:
    "I'm the local handyman customers keep on speed-dial. Send a list, get one price, and come home to it finished — tools, tidy-up and packaging removal included.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "Drag across to see the sort of transformation a single visit gets you.",
  beforeAfter: [
    {
      before: stock("1416879595882-3373a0480b5b"),
      after: stock("1581578731548-c64695cc6952"),
      caption: "Rotting fence panel and gate replaced and re-hung in one afternoon.",
      alt: "Fence and gate repair before and after",
    },
    {
      before: stock("1504148455328-c376907d081c"),
      after: stock("1581092918056-0c4c3acd3789"),
      caption: "Wonky shelf-and-TV wall made straight, secure and cable-tidy.",
      alt: "Wall shelf and TV mounting before and after",
    },
  ],
  galleryHeading: "Odd jobs finished this month",
  gallery: [
    stock("1581578731548-c64695cc6952", 1200),
    stock("1581092918056-0c4c3acd3789", 1200),
    stock("1530124566582-a618bc2615dc", 1200),
    stock("1504148455328-c376907d081c", 1200),
  ],
  areaHeading: "Local handyman coverage",
  areaIntro:
    "I work within about 10 km of home so travel stays cheap and call-backs are quick — postcodes listed below.",
  mapHeading: "Where I'm based",
  mapIntro: "Based locally and on the road most days — postcode gets you a travel-time answer.",
  reviewsHeading: "What customers say",
  hoursHeading: "When I'm available",
  faqHeading: "Handyman questions, answered",
  faqs: [
    {
      q: "What is your minimum charge?",
      a: "There is a one-hour minimum, then time is billed in half-hour blocks. Most small lists finish inside two hours, and you get the estimate before I pick up a tool.",
    },
    {
      q: "Can you do several jobs in one visit?",
      a: "Yes — that is the best way to use a handyman. Send your full list when booking and I will bring the right fixings and tools so everything is finished in a single trip.",
    },
    {
      q: "Do you supply materials?",
      a: "I keep common fixings, sealants and hardware on the van, and add them to the bill at cost with the receipt. For specific fittings, I will tell you exactly what to buy or pick them up for you.",
    },
    {
      q: "Do you take on big jobs?",
      a: "I handle repairs, fitting and assembly rather than full renovations. If a job needs structural work, electrical certification or gas work, I will say so and point you to the right trade.",
    },
    {
      q: "Which areas do you cover?",
      a: "I cover my home town and every postcode within roughly 10 km, as listed on this page. Further out is possible for larger jobs — ask when booking.",
    },
  ],
  quote: {
    title: "Send your to-do list",
    subtitle: "WhatsApp a list or a few photos and I'll send a price and the next free date.",
    primary: "Send my list",
    secondary: "Call or text",
  },
  priceRange: "$$",
  keywords: ["handyman", "flat pack assembly", "fence repair", "odd jobs", "local handyman service"],
  palette: TEMPLATE_LOOKS.handyman.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  6. Dentist — calm, clinical, reassurance first
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DENTIST: TradeSiteTemplate = {
  id: "dentist",
  name: TEMPLATE_LOOKS.dentist.name,
  tradeLabel: "dental care",
  serviceNoun: "dentist",
  sectionOrder: [
    "hero", "highlights", "services", "about", "gallery",
    "beforeAfter", "reviews", "hours", "areas", "map", "faq", "quote",
  ],
  style: {
    radius: 28,
    uppercaseHeadings: false,
    header: "light",
    hero: "centered",
    tintedSections: true,
    eyebrowTracking: "0.14em",
  },
  hero: {
    headline: "Gentle dental care for the whole family",
    subheadline:
      "Check-ups, hygiene, whitening, fillings and emergency appointments. Calm rooms, clear prices, and a team that explains everything before it happens.",
    badges: ["New patients welcome", "Evening appointments", "Emergency slots daily"],
    ctaPrimary: "Book an appointment",
    ctaSecondary: "Call the practice",
  },
  highlightsHeading: "Care you can relax into",
  highlights: [
    { value: "Same day", label: "Emergency appointments" },
    { value: "0%", label: "Payment plans available" },
    { value: "All ages", label: "Nervous patients welcome" },
    { value: "5★", label: "Rated for gentle care" },
  ],
  serviceHeading: "Treatments we provide",
  serviceIntro: "Preventive care first — we only treat what actually needs treating.",
  services: [
    { title: "Check-Ups & X-Rays", description: "Full examination with a written treatment plan." },
    { title: "Hygiene & Cleaning", description: "Scaling, polishing and gum health checks." },
    { title: "Fillings & Restorations", description: "Tooth-coloured fillings that blend in." },
    { title: "Teeth Whitening", description: "Safe, dentist-supervised whitening results." },
    { title: "Crowns, Bridges & Implants", description: "Rebuild strength, function and confidence." },
    { title: "Emergency Dentistry", description: "Pain, swelling and broken teeth seen fast." },
  ],
  aboutHeading: "About our practice",
  aboutFallback:
    "We are a family dental practice focused on prevention and comfort. Every visit starts with a conversation, and you always receive a written plan with costs before treatment begins.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "Drag the handle to compare a couple of treatments we completed recently.",
  beforeAfter: [
    {
      before: stock("1598256989800-fe5f95da9787"),
      after: stock("1588776814546-1ffcf47267a5"),
      caption: "Discoloured front teeth restored with composite bonding in one visit.",
      alt: "Composite bonding before and after",
    },
    {
      before: stock("1629909613654-28e377c37b09"),
      after: stock("1606811841689-23dfddce3e95"),
      caption: "Worn, stained enamel cleaned and rebuilt, then whitened.",
      alt: "Teeth cleaning and whitening before and after",
    },
  ],
  galleryHeading: "Inside the practice",
  gallery: [
    stock("1588776814546-1ffcf47267a5", 1200),
    stock("1629909615184-74f495363b67", 1200),
    stock("1606811841689-23dfddce3e95", 1200),
    stock("1598256989800-fe5f95da9787", 1200),
  ],
  areaHeading: "Patients we look after",
  areaIntro:
    "Families travel to us from every postcode within about 10 km — parking is free and we keep appointments on time.",
  mapHeading: "Find the practice",
  mapIntro: "Parking on site, step-free access, and a five-minute walk from the bus stop.",
  reviewsHeading: "What patients tell us",
  hoursHeading: "Opening hours",
  faqHeading: "Dental questions, answered",
  faqs: [
    {
      q: "How much does a check-up cost?",
      a: "A standard check-up including examination and any necessary X-rays is quoted at a fixed price before you are seen. You receive a written treatment plan with costs, so there are no surprises on the bill.",
    },
    {
      q: "Do you treat nervous patients?",
      a: "Yes — nervous patients are a normal part of our day. We explain each step, agree a stop signal, and can work more gradually across extra visits if that helps you feel comfortable.",
    },
    {
      q: "How often should I have a dental check-up?",
      a: "Most adults are seen every six to twelve months, depending on gum health and past treatment. We recommend your next recall date based on your own risk rather than a fixed rule.",
    },
    {
      q: "Can I be seen for a dental emergency today?",
      a: "We hold emergency slots every working day for severe pain, swelling, or a knocked-out tooth. Call as early as possible and describe the symptoms so we can triage you correctly.",
    },
    {
      q: "Which areas do you cover?",
      a: "We welcome patients from our town and every postcode within roughly 10 km, listed on this page. New patients can usually be booked within the same week.",
    },
  ],
  quote: {
    title: "Book your appointment",
    subtitle: "Request a check-up, hygiene visit or emergency slot and we'll confirm by phone.",
    primary: "Request an appointment",
    secondary: "Call the practice",
  },
  priceRange: "$$",
  keywords: ["dentist", "dental check-up", "teeth whitening", "emergency dentist", "family dental practice"],
  palette: TEMPLATE_LOOKS.dentist.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  7. Grocery — fresh, local, order & collect
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GROCERY: TradeSiteTemplate = {
  id: "grocery",
  name: TEMPLATE_LOOKS.grocery.name,
  tradeLabel: "groceries",
  serviceNoun: "greengrocer",
  sectionOrder: [
    "hero", "highlights", "services", "about", "gallery",
    "areas", "map", "hours", "reviews", "faq", "beforeAfter", "quote",
  ],
  style: {
    radius: 12,
    uppercaseHeadings: false,
    header: "light",
    hero: "split-card",
    tintedSections: true,
    eyebrowTracking: "0.14em",
  },
  hero: {
    headline: "Fresh produce, priced fairly, every morning",
    subheadline:
      "Fruit, veg, bakery, dairy and everyday essentials delivered to nearby streets — or ready for collection in 30 minutes.",
    badges: ["Local suppliers", "Same-day delivery", "Order by WhatsApp"],
    ctaPrimary: "Order for delivery",
    ctaSecondary: "See today's specials",
  },
  highlightsHeading: "Why locals shop with us",
  highlights: [
    { value: "6 am", label: "Fresh stock arrives daily" },
    { value: "30 min", label: "Click & collect ready time" },
    { value: "10 km", label: "Local delivery radius" },
    { value: "Yes", label: "Card, cash & contactless" },
  ],
  serviceHeading: "What we sell & do",
  serviceIntro: "A proper local shop — fresh food, everyday basics and friendly service.",
  services: [
    { title: "Fresh Fruit & Vegetables", description: "Delivered daily, sold loose or by the box." },
    { title: "Bakery & Deli Counter", description: "Fresh bread, pastries and sliced to order." },
    { title: "Everyday Essentials", description: "Milk, eggs, pantry items and household basics." },
    { title: "Weekly Veg Boxes", description: "Seasonal boxes from local growers." },
    { title: "Local Delivery", description: "Same-day drop to nearby postcodes." },
    { title: "Click & Collect", description: "Order ahead, collect without queueing." },
  ],
  aboutHeading: "About our shop",
  aboutFallback:
    "We're a family-run grocery shop supplied by growers and bakers in our own area. If we wouldn't serve it at our table, we don't put it on the shelf.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "From delivery crate to full shelf — the way fresh stock lands every morning.",
  beforeAfter: [
    {
      before: stock("1583258292688-d0213dc5a3a8"),
      after: stock("1542838132-92c53300491e"),
      caption: "Morning delivery unpacked and the produce aisle fully restocked by opening.",
      alt: "Produce shelf restocking before and after",
    },
    {
      before: stock("1543168256-418811576931"),
      after: stock("1604719312566-8912e9227c6a"),
      caption: "Tired display refreshed with this week's seasonal fruit.",
      alt: "Fresh fruit display before and after",
    },
  ],
  galleryHeading: "In store this week",
  gallery: [
    stock("1542838132-92c53300491e", 1200),
    stock("1578916171728-46686eac8d58", 1200),
    stock("1604719312566-8912e9227c6a", 1200),
    stock("1543168256-418811576931", 1200),
  ],
  areaHeading: "Delivery areas & postcodes",
  areaIntro:
    "We deliver free above a small basket minimum to every postcode within about 10 km of the shop.",
  mapHeading: "Visit the shop",
  mapIntro: "Free parking for 30 minutes directly outside, and step-free entry.",
  reviewsHeading: "What shoppers say",
  hoursHeading: "Opening hours",
  faqHeading: "Shopping questions, answered",
  faqs: [
    {
      q: "Do you deliver locally?",
      a: "Yes. We deliver same day to every postcode within about 10 km of the shop, with slots from morning to early evening. Free delivery applies above a small basket minimum.",
    },
    {
      q: "Can I order by WhatsApp?",
      a: "Send a photo of your list or type it out and we will pack it for collection or delivery. You get a message back confirming the price and time before anything is charged.",
    },
    {
      q: "How fresh is your produce?",
      a: "Fresh fruit and vegetables arrive every morning from growers in our area, and bread is baked daily. Anything not sold by closing time is reduced rather than kept for tomorrow.",
    },
    {
      q: "Do you sell local or organic products?",
      a: "We stock produce from nearby farms wherever the season allows, plus a growing organic range that is clearly labelled on the shelf. Ask us and we will tell you exactly where items came from.",
    },
    {
      q: "Which postcodes do you deliver to?",
      a: "All postcodes listed on this page, covering roughly 10 km around the shop. Outside that radius, message us — for larger orders we can often arrange a delivery anyway.",
    },
  ],
  quote: {
    title: "Order for delivery or collection",
    subtitle: "Send your list on WhatsApp and we'll confirm price and a slot within minutes.",
    primary: "Send my list",
    secondary: "Call the shop",
  },
  priceRange: "$",
  keywords: ["greengrocer", "local grocery delivery", "fresh fruit and vegetables", "veg box", "click and collect"],
  palette: TEMPLATE_LOOKS.grocery.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  8. Hardware — industrial, trade counter, stock first
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HARDWARE: TradeSiteTemplate = {
  id: "hardware",
  name: TEMPLATE_LOOKS.hardware.name,
  tradeLabel: "hardware & building supplies",
  serviceNoun: "hardware store",
  sectionOrder: [
    "hero", "highlights", "services", "gallery", "about",
    "beforeAfter", "hours", "areas", "map", "reviews", "faq", "quote",
  ],
  style: {
    radius: 0,
    uppercaseHeadings: true,
    header: "solid",
    hero: "full-bleed",
    tintedSections: true,
    eyebrowTracking: "0.28em",
  },
  hero: {
    headline: "Trade counter & hardware — stocked, sharp, open early",
    subheadline:
      "Fixings, tools, timber, plumbing, paint and electrical. Cut to size, loaded to your van, and priced for the trade — not the hobbyist.",
    badges: ["Open 6:30 am weekdays", "Trade accounts welcome", "Bulk pricing on site"],
    ctaPrimary: "Check stock & hours",
    ctaSecondary: "Open a trade account",
  },
  highlightsHeading: "Built for people who build",
  highlights: [
    { value: "6:30 am", label: "Doors open weekdays" },
    { value: "9,000+", label: "Lines held in stock" },
    { value: "Cut & CNC", label: "Timber cut to size in store" },
    { value: "Same day", label: "Van delivery within 10 km" },
  ],
  serviceHeading: "Departments & services",
  serviceIntro: "Trade-grade stock, real advice, and the cutting, keying and mixing done while you wait.",
  services: [
    { title: "Fixings & Fasteners", description: "Loose or boxed, from 3 mm screws to anchor bolts." },
    { title: "Power Tools & Accessories", description: "Major brands, batteries and consumables on the shelf." },
    { title: "Timber & Sheet Materials", description: "Cut to size on site, edged and loaded for you." },
    { title: "Plumbing & Heating Spares", description: "Common parts for repairs, not just installations." },
    { title: "Paint Mixing & Decorating", description: "Colour matched while you wait." },
    { title: "Key Cutting & Grinding", description: "Keys, blades, chains and sharpening services." },
  ],
  aboutHeading: "About the store",
  aboutFallback:
    "We are an independent hardware and building supplies store serving local trades and households. If we don't have it on the shelf, we order it in and call you the day it lands.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "From seized and unsafe to sorted — drag the handle across.",
  beforeAfter: [
    {
      before: stock("1572981779307-38b8cabb2407"),
      after: stock("1530046339160-ce3e530c7d2f"),
      caption: "Rusted gate hinge and fasteners replaced with galvanised hardware.",
      alt: "Gate hinge replacement before and after",
    },
    {
      before: stock("1590959651373-a3db0f38a961"),
      after: stock("1591696205602-2f950c417cb9"),
      caption: "Blunt and seized tooling cleaned up, sharpened and back in service.",
      alt: "Tool restoration before and after",
    },
  ],
  galleryHeading: "In the store & on site",
  gallery: [
    stock("1530046339160-ce3e530c7d2f", 1200),
    stock("1572981779307-38b8cabb2407", 1200),
    stock("1591696205602-2f950c417cb9", 1200),
    stock("1607400201515-c2c41c07d307", 1200),
  ],
  areaHeading: "Delivery postcodes",
  areaIntro:
    "Van delivery and trade drops across every postcode within about 10 km — order by phone before 2 pm for same-day.",
  mapHeading: "Find the trade counter",
  mapIntro: "Loading bay at the rear, customer parking at the front, forklift on site.",
  reviewsHeading: "What the trade says",
  hoursHeading: "Opening hours",
  faqHeading: "Store questions, answered",
  faqs: [
    {
      q: "What time do you open?",
      a: "The trade counter opens at 6:30 am on weekdays so you can collect before your first job, runs until 5:30 pm, and opens 8 am to 1 pm on Saturdays. Sunday is closed except for pre-arranged bulk collections.",
    },
    {
      q: "Do you cut timber and sheet materials to size?",
      a: "Yes. Bring your cutting list and we will cut timber, ply and board on the panel saw while you wait. The first few cuts are free on full sheets, with a small charge for larger cutting lists.",
    },
    {
      q: "Do you offer trade accounts and bulk pricing?",
      a: "We do. A trade account gives you account pricing, monthly statements and priority delivery slots. Bring proof of business and a reference, and we can usually open the account the same day.",
    },
    {
      q: "Can you deliver to site?",
      a: "Same-day van delivery covers every postcode within about 10 km for orders placed before 2 pm, and larger loads go out on the flatbed. Delivery is free above your account's order threshold.",
    },
    {
      q: "What if an item isn't in stock?",
      a: "We order it in, usually for the next working day, and message you when it lands. Special orders need a deposit, which is credited against the invoice when you collect.",
    },
  ],
  quote: {
    title: "Open a trade account or get a quote",
    subtitle: "Send your materials list and we'll price it, check stock and hold it at the counter.",
    primary: "Send a materials list",
    secondary: "Call the trade counter",
  },
  priceRange: "$$",
  keywords: ["hardware store", "trade counter", "building supplies", "timber cut to size", "fixings and fasteners"],
  palette: TEMPLATE_LOOKS.hardware.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  9. Mechanic — garage, diagnostics, servicing
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MECHANIC: TradeSiteTemplate = {
  id: "mechanic",
  name: TEMPLATE_LOOKS.mechanic.name,
  tradeLabel: "auto repair",
  serviceNoun: "mechanic",
  sectionOrder: [
    "hero", "highlights", "services", "beforeAfter", "gallery",
    "about", "hours", "areas", "map", "reviews", "faq", "quote",
  ],
  style: {
    radius: 6,
    uppercaseHeadings: true,
    header: "solid",
    hero: "full-bleed",
    tintedSections: true,
    eyebrowTracking: "0.26em",
  },
  hero: {
    headline: "Garage you can trust with the keys",
    subheadline:
      "Diagnostics, servicing, brakes, clutches and tyres for every make. Written quotes, honest findings, and no work started without your say-so.",
    badges: ["All makes & models", "MOT-style inspections", "Courtesy car available"],
    ctaPrimary: "Book your car in",
    ctaSecondary: "Ask for a quote",
  },
  highlightsHeading: "Garage standards we keep",
  highlights: [
    { value: "60 min", label: "Diagnostics from arrival" },
    { value: "12 mo", label: "Warranty on repairs" },
    { value: "Fixed", label: "Prices agreed before work" },
    { value: "Free", label: "No-obligation written quotes" },
  ],
  serviceHeading: "Workshop services",
  serviceIntro: "Main dealer capability without the main dealer queue or invoice.",
  services: [
    { title: "Servicing & Oil Changes", description: "Manufacturer-schedule service, logged and stamped." },
    { title: "Brakes & Suspension", description: "Discs, pads, shocks and geometry checks." },
    { title: "Diagnostics & Electrics", description: "Fault codes read and interpreted properly." },
    { title: "Clutch & Gearbox", description: "Clutch replacement and transmission repairs." },
    { title: "Tyres & Wheel Alignment", description: "Fitting, balancing and 4-wheel alignment." },
    { title: "Pre-Purchase Inspections", description: "Buy with a report on the car's real condition." },
  ],
  aboutHeading: "About the workshop",
  aboutFallback:
    "We are an independent garage fixing cars properly, not quickly. You get photos of what we find, a price before we start, and the old parts kept for you to see.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "Worn out or working like new — drag to compare.",
  beforeAfter: [
    {
      before: stock("1580273916550-e323be2ae537"),
      after: stock("1486262715619-67b85e0b08d3"),
      caption: "Scored discs and metal-on-metal pads replaced with new discs and pads.",
      alt: "Brake disc replacement before and after",
    },
    {
      before: stock("1625047509248-ec889cbff17f"),
      after: stock("1504328345606-18bbc8c9d7d1"),
      caption: "Failing clutch and release bearing replaced, pedal back to normal.",
      alt: "Clutch replacement before and after",
    },
  ],
  galleryHeading: "In the workshop",
  gallery: [
    stock("1486262715619-67b85e0b08d3", 1200),
    stock("1504328345606-18bbc8c9d7d1", 1200),
    stock("1625047509248-ec889cbff17f", 1200),
    stock("1621905252507-b35492cc74b4", 1200),
  ],
  areaHeading: "Local drivers we look after",
  areaIntro:
    "Customers come from every postcode within about 10 km. Recovery to the workshop can be arranged in the same area.",
  mapHeading: "Find the garage",
  mapIntro: "Roll-up doors on the high street, parking in front, drop keys at reception.",
  reviewsHeading: "What drivers say",
  hoursHeading: "Opening hours",
  faqHeading: "Garage questions, answered",
  faqs: [
    {
      q: "How much does a full service cost?",
      a: "A full service is quoted from your registration, so the price reflects your make, model and engine. It includes oil, filters and the manufacturer's checklist, and we never add work without your approval first.",
    },
    {
      q: "Can you fix my car today?",
      a: "Many repairs are completed the same day, and we keep diagnostic slots free each morning. Call with your registration and symptoms so we can order any likely parts before you arrive.",
    },
    {
      q: "Do you use genuine parts?",
      a: "We fit manufacturer parts or equivalent-quality alternatives, whichever suits your budget, and we tell you which one is going on before we start. All repairs carry a 12-month warranty.",
    },
    {
      q: "Will repairs affect my manufacturer warranty?",
      a: "No, as long as servicing follows the manufacturer's schedule and uses correct-specification parts and fluids. We log every service and stamp your book to keep your warranty intact.",
    },
    {
      q: "Which areas do you cover?",
      a: "Drivers come to us from all postcodes within roughly 10 km, listed on this page. Within that area we can sometimes collect and return your car — just ask when booking.",
    },
  ],
  quote: {
    title: "Book your car in",
    subtitle: "Send your registration and what it's doing — we'll come back with a price and a slot.",
    primary: "Request a booking",
    secondary: "Call the workshop",
  },
  priceRange: "$$",
  keywords: ["car service", "brake repair", "car diagnostics", "clutch replacement", "local garage"],
  palette: TEMPLATE_LOOKS.mechanic.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  10. Generic — any local service the AI couldn't pin down
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GENERIC: TradeSiteTemplate = {
  id: "generic",
  name: TEMPLATE_LOOKS.generic.name,
  tradeLabel: "local services",
  serviceNoun: "local business",
  sectionOrder: [
    "hero", "services", "highlights", "about", "beforeAfter",
    "gallery", "areas", "map", "reviews", "hours", "faq", "quote",
  ],
  style: {
    radius: 16,
    uppercaseHeadings: false,
    header: "light",
    hero: "full-bleed",
    tintedSections: true,
    eyebrowTracking: "0.18em",
  },
  hero: {
    headline: "Trusted local service, done properly",
    subheadline:
      "Friendly, insured and always on time. Tell us what you need — you'll get a clear price before any work starts.",
    badges: ["Free quotes", "Fully insured", "Local & reliable"],
    ctaPrimary: "Call now",
    ctaSecondary: "Send a message",
  },
  highlightsHeading: "How we work",
  highlights: [
    { value: "Free", label: "No-obligation quotes" },
    { value: "On time", label: "Agreed arrival windows" },
    { value: "Insured", label: "Fully covered work" },
    { value: "Guaranteed", label: "We put things right" },
  ],
  serviceHeading: "What we do",
  serviceIntro: "A short list of the work customers ask us for most often.",
  services: [
    { title: "Repairs & Maintenance", description: "Everyday fixes done properly first time." },
    { title: "Installations", description: "New fittings installed to standard and tested." },
    { title: "Inspections & Reports", description: "Clear findings, photographs and next steps." },
    { title: "Emergency Call-Outs", description: "Priority response when it can't wait." },
    { title: "Planned Improvements", description: "Quoted upgrades scheduled around you." },
    { title: "Advice & Estimates", description: "Straight answers before you commit." },
  ],
  aboutHeading: "About us",
  aboutFallback:
    "We are a small local business that relies on word of mouth. We answer the phone, turn up when we say we will, and quote clearly before starting work.",
  beforeAfterHeading: "Before & after",
  beforeAfterIntro: "Drag the slider to see a recent job from start to finish.",
  beforeAfter: [
    {
      before: stock("1521737604893-d14cc237f11d"),
      after: stock("1521791136064-7986c2920216"),
      caption: "Worn and outdated work brought back to a clean, finished standard.",
      alt: "Recent job before and after",
    },
    {
      before: stock("1497366754035-f200968a6e72"),
      after: stock("1454165804606-c3d57bc86b40"),
      caption: "A finished job photographed on the day we handed it over.",
      alt: "Completed work before and after",
    },
  ],
  galleryHeading: "Recent work",
  gallery: [
    stock("1521791136064-7986c2920216", 1200),
    stock("1497366754035-f200968a6e72", 1200),
    stock("1454165804606-c3d57bc86b40", 1200),
    stock("1556761175-b413da4baf72", 1200),
  ],
  areaHeading: "Areas we cover",
  areaIntro:
    "We work from a local base, so travel is short and call-backs are quick — postcodes listed below.",
  mapHeading: "Find us",
  mapIntro: "Message us your postcode and we'll confirm travel time and the earliest slot.",
  reviewsHeading: "What customers say",
  hoursHeading: "Opening hours",
  faqHeading: "Common questions",
  faqs: [
    {
      q: "Do you give free quotes?",
      a: "Yes. Quotes are free and given in writing before any work starts, so you can compare them properly. Send a photo or two and we can often price the job without a visit.",
    },
    {
      q: "How soon can you start?",
      a: "Most jobs are booked within a few days, and urgent work is prioritised the same day where possible. Call and we will give you a realistic date rather than an optimistic one.",
    },
    {
      q: "Are you insured and qualified?",
      a: "We carry public liability insurance and the relevant qualifications for the work we do. Certificates and proof of insurance are available on request before we begin.",
    },
    {
      q: "How do I pay?",
      a: "Card, bank transfer and cash are all accepted, and larger jobs can be split into a deposit with the balance on completion. You receive an itemised invoice for every job.",
    },
    {
      q: "Which areas do you cover?",
      a: "We cover our town and every postcode within about 10 km, listed on this page. If you are just outside, ask — we often travel a little further for larger jobs.",
    },
  ],
  quote: {
    title: "Get a free quote",
    subtitle: "Send a photo or describe the job and we'll come back with a price and a date.",
    primary: "Send a message",
    secondary: "Call us",
  },
  priceRange: "$$",
  keywords: ["local services", "trusted local business", "free quotes", "reliable service"],
  palette: TEMPLATE_LOOKS.generic.colorPalette,
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Registry + lookup
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const TRADE_SITE_TEMPLATES: Record<TemplateId, TradeSiteTemplate> = {
  plumber: PLUMBER,
  hvac: HVAC,
  electrician: ELECTRICIAN,
  roofing: ROOFING,
  handyman: HANDYMAN,
  dentist: DENTIST,
  grocery: GROCERY,
  hardware: HARDWARE,
  mechanic: MECHANIC,
  generic: GENERIC,
};

/** All trade ids, in picker order. */
export const TRADE_SITE_IDS = Object.keys(TRADE_SITE_TEMPLATES) as TemplateId[];

/**
 * Resolve the template for a stored `content.templateId`.
 * Returns null for unknown/missing ids so `SiteRenderer` can fall back to the
 * legacy generic layout (sites built before the trade templates existed).
 */
export function getTradeSiteTemplate(id: unknown): TradeSiteTemplate | null {
  if (typeof id !== "string") return null;
  const key = id.toLowerCase().trim() as TemplateId;
  return TRADE_SITE_TEMPLATES[key] || null;
}

/** Trade label for a business category (used in schema + copy). */
export function tradeLabelFor(id: unknown, fallback = "local services"): string {
  return getTradeSiteTemplate(id)?.tradeLabel || fallback;
}
