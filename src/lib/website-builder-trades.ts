// src/lib/website-builder-trades.ts
//
// Single source of truth for the per-trade website-builder landing pages:
//   /website-builder/plumber · /electrician · /hvac · /roofing · /handyman
//   /dentist · /grocery · /hardware · /mechanic · /local-services
//
// WHY THESE PAGES EXIST: the main /website-builder page targets "website
// builder for google business profile" — a phrase almost nobody types. Owners
// search for their own trade ("website for plumbers"), so each trade gets its
// own page with its own headline, angle and FAQs.
//
// Two rules that keep this honest and maintainable:
//   1. Only SEO/marketing words live here. Everything a customer would SEE on
//      the finished website (services, highlights, photos, colours) is read
//      from the real locked template in src/lib/site-templates.ts at render
//      time, so a landing page can never promise something the builder does
//      not produce.
//   2. Money claims are quoted from src/lib/website.ts by the page component
//      (free build · $19 domain · 90 days free hosting · live sync on paid
//      plans), never retyped per trade.
//
// The `local-services` slug deliberately maps to the `generic` template: a
// visitor searching "local business website builder" gets a real page, while
// the template id stays meaningful in code and no URL is ever called "generic".

import type { TemplateId } from "@/lib/template-looks";

export type TradeLanding = {
  /** URL segment under /website-builder/. Must be unique. */
  slug: string;
  /** The locked trade template this page shows off (src/lib/site-templates.ts). */
  templateId: TemplateId;
  /** H1 — plural and human: "Website Builder for Plumbers". */
  h1: string;
  /** Absolute <title>. */
  metaTitle: string;
  /** Meta description (~120-155 chars). */
  metaDescription: string;
  /** The trade-specific problem, in the owner's world. One short paragraph. */
  problem: string;
  /** Why their existing Google Business Profile is already the hard part. */
  whyProfile: string;
  /** Three questions this trade actually asks. */
  faqs: { q: string; a: string }[];
  /** Base keyword phrases for the page's <meta name="keywords">. */
  keywords: string[];
};

export const TRADE_LANDINGS: TradeLanding[] = [
  {
    slug: "plumber",
    templateId: "plumber",
    h1: "Website Builder for Plumbers",
    metaTitle: "Website Builder for Plumbers — Free Preview | Neerzy",
    metaDescription:
      "Turn your Google Business Profile into a plumber's website in under a minute. Free to preview, $19 to publish on your own domain.",
    problem:
      "Plumbing work is emergency work. When a pipe bursts at 7pm someone searches, taps the first plumber who looks real, and calls. If there is no website behind your Google listing, you are the one they scroll past.",
    whyProfile:
      "You have already done the hard part: your Google Business Profile holds your name, address, hours, photos and reviews. Neerzy reads that profile and lays it out as a real plumbing website — no copywriting, no designer, no blank page.",
    faqs: [
      {
        q: "Do I have to write the content myself?",
        a: "No. Your headline, service lines, about text and FAQ answers are generated from your Google Business Profile and your trade, then laid out in the Plumber Pro template. You only edit wording if you want to.",
      },
      {
        q: "Can it show emergency call-outs and my service area?",
        a: "Yes. The plumbing template leads with a call-now button, your hours and the towns and postcodes you cover, so someone standing in a flooded kitchen knows you are local and available.",
      },
      {
        q: "What does the website cost?",
        a: "Building and previewing is free. Publishing is $19 once for your own domain, and hosting is free for the first 90 days, then $10/month. New job photos and reviews keep the site updated automatically on a paid plan.",
      },
    ],
    keywords: [
      "website builder for plumbers",
      "plumber website",
      "plumber website builder",
      "website for plumbers",
      "plumbing website design",
      "emergency plumber website",
    ],
  },
  {
    slug: "hvac",
    templateId: "hvac",
    h1: "Website Builder for HVAC Contractors",
    metaTitle: "Website Builder for HVAC Contractors — Free | Neerzy",
    metaDescription:
      "Build an HVAC website from your Google Business Profile in minutes. Preview free, publish for $19 on your own domain, 90 days of hosting free.",
    problem:
      "Heating and cooling is seasonal and urgent: no heat in January, no air conditioning in July. Customers compare the two or three nearest companies and pick the one that looks established — which means a real website, not just a listing.",
    whyProfile:
      "Your Google Business Profile already shows your rating, your opening hours and the area you cover. Neerzy turns exactly that data into an HVAC website, with repairs, servicing and installations split apart so a customer finds their job in seconds.",
    faqs: [
      {
        q: "Can I show a seasonal offer like a boiler service?",
        a: "Yes. Publish the offer like a normal job post and it appears on your website at the same time as your Google profile, so a seasonal special sits next to your main services. Live sync runs on paid plans.",
      },
      {
        q: "Will it show the areas I cover?",
        a: "The HVAC template lists your towns and postcodes from your Google profile and adds a map centred on your location — useful when someone is choosing between two contractors.",
      },
      {
        q: "I already have a Facebook page. Is a website still worth it?",
        a: "Your Facebook page does not rank in Google search the way your own site can, and you do not own it. This site is built from the same profile data and lives on your own domain, registered in your name.",
      },
    ],
    keywords: [
      "website builder for hvac",
      "hvac website",
      "hvac contractor website",
      "air conditioning website",
      "heating and cooling website builder",
    ],
  },
  {
    slug: "electrician",
    templateId: "electrician",
    h1: "Website Builder for Electricians",
    metaTitle: "Website Builder for Electricians — Free Preview | Neerzy",
    metaDescription:
      "Turn your Google Business Profile into an electrician's website in under a minute. Free to preview, $19 to publish, first 90 days of hosting free.",
    problem:
      "Electrical work splits two ways: the fault you have to attend today, and the rewire or EV charger the customer thinks about for weeks. Both start with a Google search, and both end at the business that looks credible.",
    whyProfile:
      "Neerzy builds your site from your Google Business Profile — your reviews, your hours, the area you serve — then lays it out in the Volt Electric template, with the emergency number and the quote request both one tap away.",
    faqs: [
      {
        q: "Can I separate emergency call-outs from bigger jobs?",
        a: "Yes. The electrical template opens with a call-now button for faults, and keeps a separate quote section for planned work such as rewires, fuse boards, garden lighting and EV chargers.",
      },
      {
        q: "Do you show my reviews?",
        a: "Your Google rating and reviews are built into the site, and new ones appear automatically on a paid plan — the same trust signal customers already see on your listing.",
      },
      {
        q: "Can I match the colours to my van and uniform?",
        a: "Yes. Every template ships with several colour ways you can switch in the dashboard, and you can change your text, photos and services at any time.",
      },
    ],
    keywords: [
      "website builder for electricians",
      "electrician website",
      "electrician website builder",
      "website for electricians",
      "ev charger installer website",
    ],
  },
  {
    slug: "roofing",
    templateId: "roofing",
    h1: "Website Builder for Roofing Contractors",
    metaTitle: "Website Builder for Roofing Contractors — Free | Neerzy",
    metaDescription:
      "Build a roofing website from your Google Business Profile in minutes. Preview free, publish for $19, first 90 days of hosting free.",
    problem:
      "Roofing is a high-value, high-distrust purchase. Homeowners want proof you exist, proof you have done this before, and photos of finished roofs — before they let anyone up a ladder.",
    whyProfile:
      "Your Google Business Profile already carries that proof: your reviews, your photos of completed work, your address. Neerzy lays it out as a roofing website with before-and-after pairs built into the template.",
    faqs: [
      {
        q: "Can I show before-and-after roof photos?",
        a: "Yes — the roofing template includes a draggable before/after block, so a homeowner can see the old covering and the finished roof. Your own photos replace the placeholders automatically.",
      },
      {
        q: "Can Neerzy ask for the review after each job?",
        a: "Yes. Neerzy sends the review request for you once the job is done, and the review then shows on your website and your Google profile.",
      },
      {
        q: "Do I need to be a big company for this?",
        a: "No. Solo roofers and two-van teams are exactly who this is built for. There is nothing to design, and the site is generated from a profile you already have.",
      },
    ],
    keywords: [
      "website builder for roofers",
      "roofing website",
      "roofing contractor website",
      "roofer website builder",
      "roof replacement website",
    ],
  },
  {
    slug: "handyman",
    templateId: "handyman",
    h1: "Website Builder for Handymen",
    metaTitle: "Website Builder for Handymen — Free Preview | Neerzy",
    metaDescription:
      "Turn your Google Business Profile into a handyman website in under a minute. Free to preview, $19 to publish on your own domain.",
    problem:
      "Handyman work is a long list of small jobs, and customers judge you on how organised you look. One page that lists what you actually do beats a dozen photos of a van on Facebook.",
    whyProfile:
      "Neerzy reads your Google Business Profile and turns your list of jobs into a clear services page, with your hours, your area and your reviews already in place.",
    faqs: [
      {
        q: "Can I list lots of different jobs?",
        a: "Yes — the handyman template is built for variety. Flat-pack assembly, shelving, doors, leaks and small repairs each get their own line, so a customer can scan for their job instead of reading your whole life story.",
      },
      {
        q: "Can customers ask for a quote from the site?",
        a: "The contact block takes a tap-to-call or a WhatsApp message with the job details, so a quote request lands on your phone rather than in an inbox you never open.",
      },
      {
        q: "What if I do not have many photos yet?",
        a: "The template starts with trade placeholder photography, and your own photos replace it automatically as you add them from the dashboard.",
      },
    ],
    keywords: [
      "website builder for handymen",
      "handyman website",
      "handyman website builder",
      "website for handyman business",
      "odd job website",
    ],
  },
  {
    slug: "dentist",
    templateId: "dentist",
    h1: "Website Builder for Dentists",
    metaTitle: "Website Builder for Dentists — Free Preview | Neerzy",
    metaDescription:
      "Create a dental practice website from your Google Business Profile in minutes. Preview free, publish for $19, 90 days of hosting free.",
    problem:
      "People choose a dentist on trust and convenience: the opening hours, the distance, and how the practice answers the questions they are quietly worried about — pain, cost, nervous patients.",
    whyProfile:
      "Your Google Business Profile already answers the basics: your address, hours and reviews. Neerzy turns it into a calm, clinical practice website with your treatments and your FAQ answers visible on the page.",
    faqs: [
      {
        q: "Can I list treatments and answer common questions?",
        a: "Yes. The dentist template includes a treatments section and an always-visible FAQ — the same format AI assistants quote when someone asks about treatment or pricing nearby.",
      },
      {
        q: "Will patients find my opening hours instantly?",
        a: "Your hours sit near the top of the site as well as in the footer, matching the hours on your Google profile.",
      },
      {
        q: "Is it suitable if I do not want online booking?",
        a: "Yes. You can keep it simple: tap-to-call, a WhatsApp link and directions. There is no forced booking system to administer.",
      },
    ],
    keywords: [
      "website builder for dentists",
      "dentist website",
      "dental practice website",
      "dental website builder",
      "dentist website design",
    ],
  },
  {
    slug: "grocery",
    templateId: "grocery",
    h1: "Website Builder for Grocery Stores",
    metaTitle: "Website Builder for Grocery Stores — Free Preview | Neerzy",
    metaDescription:
      "Build a grocery store website from your Google Business Profile in minutes. Preview free, publish for $19, first 90 days of hosting free.",
    problem:
      "A shop's hours, delivery options and what is on the shelves are exactly what people search for — and a plain Google listing cannot show all of it.",
    whyProfile:
      "Neerzy takes your store's address, hours and photos from Google and lays them out as a shop website, with a departments block, directions and a call button already in place.",
    faqs: [
      {
        q: "Can I show what we stock or our weekly lines?",
        a: "Yes. The grocery template includes a departments or featured-lines block you can edit from the dashboard, alongside a weekly offer you publish the same way you would post a job.",
      },
      {
        q: "Can customers see delivery or collection details?",
        a: "Add your delivery area and collection hours to the site; the contact block keeps tap-to-call and directions one tap away for shoppers nearby.",
      },
      {
        q: "I run a single shop, not a chain. Does it still work?",
        a: "It is built for exactly that: one local shop with a Google profile, no web designer and no budget for a full rebuild.",
      },
    ],
    keywords: [
      "website builder for grocery stores",
      "grocery store website",
      "local shop website",
      "convenience store website",
      "grocery website builder",
    ],
  },
  {
    slug: "hardware",
    templateId: "hardware",
    h1: "Website Builder for Hardware Stores",
    metaTitle: "Website Builder for Hardware Stores — Free Preview | Neerzy",
    metaDescription:
      "Build a hardware store website from your Google Business Profile in minutes. Preview free, publish for $19, first 90 days of hosting free.",
    problem:
      "Customers ring a hardware shop to ask one question: do you have it in? A website that shows your departments, your trade counter and your hours saves that call — and wins the visit.",
    whyProfile:
      "Neerzy turns your Google Business Profile into a trade-counter website: your address and hours up front, your departments laid out, and directions one tap away.",
    faqs: [
      {
        q: "Can I list departments and stock lines?",
        a: "Yes. The hardware template leads with departments — tools, timber, plumbing, paint, fixings — so a customer can see at a glance whether the trip is worth it.",
      },
      {
        q: "Can I mention a trade counter or account terms?",
        a: "Add it to your about block; it sits next to your opening hours, so trade customers know when to call in rather than order online.",
      },
      {
        q: "Do I need my own stock photography?",
        a: "No. The template starts with placeholder photography, and your own shop photos replace it automatically when you add them.",
      },
    ],
    keywords: [
      "website builder for hardware stores",
      "hardware store website",
      "builder merchant website",
      "trade counter website",
      "diy shop website",
    ],
  },
  {
    slug: "mechanic",
    templateId: "mechanic",
    h1: "Website Builder for Auto Repair Shops",
    metaTitle: "Website Builder for Auto Repair Shops — Free | Neerzy",
    metaDescription:
      "Build a garage website from your Google Business Profile in minutes. Preview free, publish for $19, first 90 days of hosting free.",
    problem:
      "Drivers want three answers: can you fit them in, do you do their job, and is the garage close enough to walk home from. A listing on its own cannot say all three.",
    whyProfile:
      "Your Google profile already has your location, hours and reviews. Neerzy lays it out as a garage website with servicing, diagnostics and repairs clearly separated, plus a contact block for bookings.",
    faqs: [
      {
        q: "Can I split servicing from repairs and diagnostics?",
        a: "Yes. The auto repair template separates servicing, diagnostics and repairs, so a driver finds their job in seconds instead of ringing to ask.",
      },
      {
        q: "Can customers request a booking?",
        a: "The contact block takes a call, a WhatsApp message with their registration and the job, or directions — whichever suits your workshop.",
      },
      {
        q: "Can I show that we are a trusted local garage?",
        a: "Your Google rating and reviews are built into the site, and they refresh automatically on a paid plan.",
      },
    ],
    keywords: [
      "website builder for auto repair shops",
      "garage website",
      "auto repair website",
      "mechanic website builder",
      "car service website",
    ],
  },
  {
    slug: "local-services",
    templateId: "generic",
    h1: "Website Builder for Local Service Businesses",
    metaTitle: "Website Builder for Local Service Businesses | Neerzy",
    metaDescription:
      "Turn your Google Business Profile into a real website for your local service business. Preview free, publish for $19, 90 days of hosting free.",
    problem:
      "If your trade does not have its own template yet, you still should not be starting from a blank page. You already have a Google Business Profile full of real content — it just is not a website.",
    whyProfile:
      "Neerzy reads your profile — name, address, hours, photos, reviews — and generates a clean, fast local-services website you can publish on your own domain.",
    faqs: [
      {
        q: "My trade is not listed. Can I still use Neerzy?",
        a: "Yes. The local services template adapts to any category on your Google Business Profile, from locksmiths and dog walkers to mobile beauty, and you can rename every service line.",
      },
      {
        q: "Can I switch to a dedicated template for my trade later?",
        a: "Yes. You can change the look from the dashboard without rebuilding your content, so you are not starting again if a new template lands.",
      },
      {
        q: "What does it cost?",
        a: "The same for every trade: preview free, $19 once for your own domain, hosting free for 90 days then $10/month, with live sync on a paid plan.",
      },
    ],
    keywords: [
      "website builder for local service businesses",
      "local business website builder",
      "small business website from google",
      "locksmith website",
      "local services website",
    ],
  },
];

/** Page slugs, in display order — used by generateStaticParams and the sitemap. */
export const TRADE_LANDING_SLUGS = TRADE_LANDINGS.map((t) => t.slug);

/** Resolve a URL segment to its landing content (null → 404). */
export function getTradeLanding(slug?: string | null): TradeLanding | null {
  if (!slug) return null;
  const key = slug.toLowerCase().trim();
  return TRADE_LANDINGS.find((t) => t.slug === key) || null;
}
