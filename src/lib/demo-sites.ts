import type { TemplateId } from "./template-looks";
import { TRADE_SITE_TEMPLATES } from "./site-templates";

/**
 * The 10 demo businesses behind the shareable template links.
 *
 * Fictional but plausible: real city coordinates, real postal-code ranges for
 * that city, invented names and phone numbers (555 exchange). Used by
 * `/site/templates` (gallery) and `/site/templates/[trade]` (full page).
 *
 * Nothing here is ever copied onto a trader's own site — a trader's content
 * comes from `website-builder.ts` (Google Business Profile + AI copy).
 */

export type DemoReview = { author: string; rating: number; text: string; time: string };

export type DemoSite = {
  trade: TemplateId;
  businessName: string;
  tagline: string;
  hero: { headline: string; subheadline: string };
  services: { title: string; description: string }[];
  about: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  geo: { lat: number; lng: number };
  mapUrl: string;
  rating: number;
  userRatingsTotal: number;
  reviews: DemoReview[];
  hours: string[];
  hoursSpec: { dayOfWeek: string; opens: string; closes: string }[];
  photos: string[];
  beforeAfter: { before: string; after: string; caption: string; alt: string }[];
  serviceAreas: { postalCodes: string[]; localities: string[]; radiusKm: number };
  seo: { title: string; description: string };
  keywords: string[];
};

/** Mon-Sat spec shared by the demos (Sunday closed). */
export const DEMO_HOURS_SPEC = [
  { dayOfWeek: "Monday", opens: "07:30", closes: "17:30" },
  { dayOfWeek: "Tuesday", opens: "07:30", closes: "17:30" },
  { dayOfWeek: "Wednesday", opens: "07:30", closes: "17:30" },
  { dayOfWeek: "Thursday", opens: "07:30", closes: "17:30" },
  { dayOfWeek: "Friday", opens: "07:30", closes: "17:30" },
  { dayOfWeek: "Saturday", opens: "08:00", closes: "13:00" },
];

export const DEMO_HOURS = [
  "Monday: 7:30 AM – 5:30 PM",
  "Tuesday: 7:30 AM – 5:30 PM",
  "Wednesday: 7:30 AM – 5:30 PM",
  "Thursday: 7:30 AM – 5:30 PM",
  "Friday: 7:30 AM – 5:30 PM",
  "Saturday: 8:00 AM – 1:00 PM",
  "Sunday: Closed",
];

/** Fake but valid-looking US number (555 exchange). */
const tel = (n: string) => `+1 555 01${n}`;

export const DEMO_SITES: Record<TemplateId, DemoSite> = {
  plumber: {
    trade: "plumber",
    businessName: "Harbour Plumbing Co.",
    tagline: "Emergency plumbing in Seattle",
    hero: {
      headline: "Emergency plumber in Seattle — leaks fixed today",
      subheadline:
        "Burst pipes, blocked drains and water heater repairs across Seattle. Fixed-price quotes, 60-minute emergency response, tidy work guaranteed.",
    },
    services: [],
    about:
      "Harbour Plumbing Co. is a family-run plumbing business working across Seattle and the surrounding neighbourhoods. Every job is quoted before we start, we protect your floors, and we photograph anything we find behind the walls so you can see the problem for yourself.",
    phone: tel("42"),
    email: "hello@harbourplumbing.example",
    address: "412 Western Ave",
    city: "Seattle",
    region: "WA",
    postalCode: "98101",
    geo: { lat: 47.6062, lng: -122.3321 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Harbour+Plumbing+Co+Seattle",
    rating: 4.9,
    userRatingsTotal: 186,
    reviews: [
      {
        author: "Dan R.",
        rating: 5,
        text: "Burst pipe at 6am, on site by 7 and water off within the hour. Clear price, no fuss.",
        time: "2 weeks ago",
      },
      {
        author: "Priya M.",
        rating: 5,
        text: "Replaced our old water heater and left the utility room cleaner than they found it.",
        time: "1 month ago",
      },
      {
        author: "Tomas L.",
        rating: 4,
        text: "Fair quote for a blocked drain, explained what caused it instead of just selling a repair.",
        time: "2 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["98101", "98104", "98109", "98121", "98122", "98134", "98144", "98199"],
      localities: ["Seattle", "Belltown", "Capitol Hill", "Queen Anne", "Magnolia", "Sodo"],
      radiusKm: 10,
    },
    seo: {
      title: "Emergency Plumber Seattle | Harbour Plumbing Co.",
      description:
        "Emergency plumbing in Seattle: leak repairs, blocked drains, water heaters. Fixed-price quotes and 60-minute response. Call today.",
    },
    keywords: [
      "emergency plumber Seattle",
      "blocked drain Seattle",
      "water heater repair Seattle",
      "plumber near me",
    ],
  },
  hvac: {
    trade: "hvac",
    businessName: "Northline Heating & Air",
    tagline: "Heating & cooling in Denver",
    hero: {
      headline: "Heating & cooling that just works — Denver",
      subheadline:
        "Air conditioning repair, furnace servicing and heat pump installation across Denver. Maintenance plans that stop breakdowns before they happen.",
    },
    services: [],
    about:
      "Northline Heating & Air services and installs heating and cooling systems across Denver. We size equipment properly for your home, explain the options in plain English, and keep the work area clean from arrival to handover.",
    phone: tel("77"),
    email: "service@northlinehvac.example",
    address: "1550 Blake St",
    city: "Denver",
    region: "CO",
    postalCode: "80202",
    geo: { lat: 39.7392, lng: -104.9903 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Northline+Heating+and+Air+Denver",
    rating: 4.8,
    userRatingsTotal: 142,
    reviews: [
      {
        author: "Alicia B.",
        rating: 5,
        text: "AC died during the heatwave — fixed the same afternoon and billed exactly the quoted price.",
        time: "3 weeks ago",
      },
      {
        author: "Grant H.",
        rating: 5,
        text: "Explained why our old furnace was costing so much and showed the energy maths. No hard sell.",
        time: "1 month ago",
      },
      {
        author: "Mia K.",
        rating: 4,
        text: "Reliable maintenance plan, filters always changed and reminders come on time.",
        time: "3 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["80202", "80203", "80205", "80206", "80209", "80211", "80218", "80223"],
      localities: ["Denver", "LoDo", "Capitol Hill", "RiNo", "Cherry Creek", "Highland"],
      radiusKm: 10,
    },
    seo: {
      title: "HVAC Repair & Installation Denver | Northline Heating & Air",
      description:
        "Denver HVAC specialists: air conditioning repair, furnace service, heat pumps and maintenance plans. Book a service or get a free quote.",
    },
    keywords: ["AC repair Denver", "furnace service Denver", "heat pump installation Denver", "HVAC maintenance"],
  },
  electrician: {
    trade: "electrician",
    businessName: "Voltworks Electrical",
    tagline: "Licensed electricians in Portland",
    hero: {
      headline: "Licensed electricians in Portland — tested & certified",
      subheadline:
        "Fuse board upgrades, rewires, EV chargers and fault-finding across Portland. Every job tested, certified and documented before we leave site.",
    },
    services: [],
    about:
      "Voltworks Electrical is a licensed electrical contractor covering Portland and the surrounding districts. We test every circuit we touch, label what we install, and hand over certificates so your insurance and warranty paperwork is always complete.",
    phone: tel("35"),
    email: "jobs@voltworks.example",
    address: "1020 NW Marshall St",
    city: "Portland",
    region: "OR",
    postalCode: "97209",
    geo: { lat: 45.5152, lng: -122.6784 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Voltworks+Electrical+Portland",
    rating: 4.9,
    userRatingsTotal: 118,
    reviews: [
      {
        author: "Rebecca T.",
        rating: 5,
        text: "Traced a fault two other electricians missed and documented the fix. Certificate arrived by email.",
        time: "1 week ago",
      },
      {
        author: "Owen P.",
        rating: 5,
        text: "EV charger installed tidily, load check done properly and the cable route looks factory-fitted.",
        time: "1 month ago",
      },
      {
        author: "Sofia D.",
        rating: 5,
        text: "Full rewire on a 1920s house, on schedule, and they cleaned up every day.",
        time: "2 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["97209", "97205", "97210", "97212", "97214", "97217", "97227", "97232"],
      localities: ["Portland", "Pearl District", "Alberta Arts", "Hawthorne", "Northwest", "Sellwood"],
      radiusKm: 10,
    },
    seo: {
      title: "Emergency Electrician Portland | Voltworks Electrical",
      description:
        "Licensed Portland electricians: fuse board upgrades, rewires, EV charger installation and fault finding. Tested and certified. Call today.",
    },
    keywords: ["electrician Portland", "fuse board replacement Portland", "EV charger installer Portland", "rewiring"],
  },
  roofing: {
    trade: "roofing",
    businessName: "Apex Roofing Tampa",
    tagline: "Storm-ready roofing in Tampa",
    hero: {
      headline: "Storm damage? Tampa roofers on site this week",
      subheadline:
        "Leak repairs, full re-roofs and insurance-ready inspection reports across Tampa. Emergency tarping within 48 hours and a fixed written price.",
    },
    services: [],
    about:
      "Apex Roofing Tampa has repaired and replaced roofs across Hillsborough County since 2009. Every roof is photographed before, during and after the work, and we prepare the documentation insurers ask for as part of the job.",
    phone: tel("58"),
    email: "quotes@apexroofingtampa.example",
    address: "807 N Tampa St",
    city: "Tampa",
    region: "FL",
    postalCode: "33602",
    geo: { lat: 27.9506, lng: -82.4572 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Apex+Roofing+Tampa",
    rating: 4.7,
    userRatingsTotal: 203,
    reviews: [
      {
        author: "Marcus J.",
        rating: 5,
        text: "Tarps on within hours of the storm and the insurance report did all the work for our claim.",
        time: "2 weeks ago",
      },
      {
        author: "Elena V.",
        rating: 4,
        text: "Re-roof finished in four days as promised, and the garden was cleared of every offcut.",
        time: "2 months ago",
      },
      {
        author: "Chuck W.",
        rating: 5,
        text: "Found the leak two other roofers couldn't and fixed it properly rather than patching.",
        time: "4 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["33602", "33603", "33605", "33606", "33609", "33611", "33616", "33629"],
      localities: ["Tampa", "Ybor City", "Hyde Park", "Seminole Heights", "Westshore", "Ballast Point"],
      radiusKm: 10,
    },
    seo: {
      title: "Roof Repair & Replacement Tampa | Apex Roofing",
      description:
        "Tampa roofing contractor: storm damage repair, leak detection, re-roofs and insurance reports. Emergency tarping and free drone surveys.",
    },
    keywords: ["roof repair Tampa", "roof replacement Tampa", "storm damage roofing Tampa", "gutter repair"],
  },
  handyman: {
    trade: "handyman",
    businessName: "Two Hands Austin",
    tagline: "Handyman in Austin",
    hero: {
      headline: "One handyman. A whole to-do list — Austin",
      subheadline:
        "Shelves, doors, flat-pack, fencing and small repairs across Austin. Send a list, get one price, come home to it finished.",
    },
    services: [],
    about:
      "Two Hands Austin is a one-van handyman service covering Austin and the surrounding neighbourhoods. Customers send a list when they book, and everything on it is finished in a single visit with the right fixings, tools and tidy-up included.",
    phone: tel("19"),
    email: "book@twohandsaustin.example",
    address: "1300 S Congress Ave",
    city: "Austin",
    region: "TX",
    postalCode: "78704",
    geo: { lat: 30.2672, lng: -97.7431 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Two+Hands+Austin",
    rating: 5.0,
    userRatingsTotal: 96,
    reviews: [
      {
        author: "Hannah S.",
        rating: 5,
        text: "Eight jobs off my list in half a day and everything was level, sealed and cleaned up.",
        time: "5 days ago",
      },
      {
        author: "Diego M.",
        rating: 5,
        text: "Re-hung a gate that two other people had bodged. Solid and still perfect months later.",
        time: "3 weeks ago",
      },
      {
        author: "Lucy A.",
        rating: 5,
        text: "Built the whole play set in an afternoon and took all the packaging away with him.",
        time: "2 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["78704", "78701", "78702", "78703", "78705", "78745", "78751", "78756"],
      localities: ["Austin", "South Congress", "Downtown", "East Austin", "Hyde Park", "Rosedale"],
      radiusKm: 10,
    },
    seo: {
      title: "Handyman Austin TX | Two Hands Austin",
      description:
        "Austin handyman for shelves, doors, flat-pack assembly, fencing and small repairs. One visit, one price, all tools supplied. Book today.",
    },
    keywords: ["handyman Austin", "flat pack assembly Austin", "fence repair Austin", "odd jobs Austin"],
  },
  dentist: {
    trade: "dentist",
    businessName: "Brightline Dental Studio",
    tagline: "Family dental care in San Diego",
    hero: {
      headline: "Gentle dental care for San Diego families",
      subheadline:
        "Check-ups, hygiene, whitening and emergency appointments in San Diego. Calm rooms, clear prices and a team that explains everything first.",
    },
    services: [],
    about:
      "Brightline Dental Studio is a family dental practice in San Diego focused on prevention and comfort. Every appointment begins with a conversation, and you always receive a written treatment plan with costs before any treatment starts.",
    phone: tel("64"),
    email: "reception@brightlinedental.example",
    address: "2450 Kettner Blvd",
    city: "San Diego",
    region: "CA",
    postalCode: "92101",
    geo: { lat: 32.7157, lng: -117.1611 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Brightline+Dental+Studio+San+Diego",
    rating: 4.9,
    userRatingsTotal: 274,
    reviews: [
      {
        author: "Nina F.",
        rating: 5,
        text: "First dentist visit in years without anxiety. They explained every step before they did it.",
        time: "1 week ago",
      },
      {
        author: "Paul O.",
        rating: 5,
        text: "Emergency appointment for a broken tooth the same morning, and the cost was agreed upfront.",
        time: "1 month ago",
      },
      {
        author: "Grace L.",
        rating: 5,
        text: "Both kids seen together, in and out in 40 minutes, no fuss at all.",
        time: "2 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["92101", "92102", "92103", "92104", "92106", "92109", "92110", "92113"],
      localities: ["San Diego", "Little Italy", "Hillcrest", "North Park", "Point Loma", "Pacific Beach"],
      radiusKm: 10,
    },
    seo: {
      title: "Dentist San Diego | Brightline Dental Studio",
      description:
        "Family dentist in San Diego: check-ups, hygiene, whitening, crowns and emergency appointments. Gentle care, clear prices. Book online today.",
    },
    keywords: ["dentist San Diego", "dental check-up San Diego", "emergency dentist San Diego", "teeth whitening"],
  },
  grocery: {
    trade: "grocery",
    businessName: "Cedar Street Market",
    tagline: "Local grocery in Chicago",
    hero: {
      headline: "Fresh produce every morning in Chicago",
      subheadline:
        "Fruit, veg, bakery and everyday essentials from Cedar Street Market — delivered to nearby postcodes or ready for collection in 30 minutes.",
    },
    services: [],
    about:
      "Cedar Street Market is a family-run grocery shop in Chicago supplied by growers and bakers in the region. Fruit and vegetables arrive every morning, bread is baked daily, and anything not sold by closing time is reduced rather than kept for tomorrow.",
    phone: tel("83"),
    email: "orders@cedarstreetmarket.example",
    address: "735 W Cedar St",
    city: "Chicago",
    region: "IL",
    postalCode: "60610",
    geo: { lat: 41.8781, lng: -87.6298 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Cedar+Street+Market+Chicago",
    rating: 4.8,
    userRatingsTotal: 311,
    reviews: [
      {
        author: "Yusuf A.",
        rating: 5,
        text: "Ordered on WhatsApp at 8am, delivery by 10am, and the veg was better than the supermarket.",
        time: "4 days ago",
      },
      {
        author: "Karen D.",
        rating: 5,
        text: "Veg box every week now. Fresh, local and they tell you where everything came from.",
        time: "3 weeks ago",
      },
      {
        author: "Ben C.",
        rating: 4,
        text: "Tiny shop but brilliant stock — they ordered in the flour I needed and called me next day.",
        time: "2 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["60610", "60611", "60614", "60622", "60642", "60654", "60657", "60661"],
      localities: ["Chicago", "River North", "Old Town", "Lincoln Park", "Wicker Park", "Fulton Market"],
      radiusKm: 10,
    },
    seo: {
      title: "Local Grocery Delivery Chicago | Cedar Street Market",
      description:
        "Fresh fruit and veg, bakery and essentials delivered same day across Chicago. Order on WhatsApp or collect in 30 minutes. Local suppliers.",
    },
    keywords: ["grocery delivery Chicago", "greengrocer Chicago", "veg box Chicago", "fresh produce near me"],
  },
  hardware: {
    trade: "hardware",
    businessName: "Blackstone Trade Supplies",
    tagline: "Hardware & building supplies in Phoenix",
    hero: {
      headline: "Trade counter & hardware open from 6:30 am — Phoenix",
      subheadline:
        "Fixings, power tools, timber, plumbing, paint and electrical in stock. Cut to size, loaded to your van and priced for the trade.",
    },
    services: [],
    about:
      "Blackstone Trade Supplies is an independent hardware and building supplies store in Phoenix serving local trades and households. If something isn't on the shelf we order it in for the next working day and message you the moment it lands.",
    phone: tel("51"),
    email: "counter@blackstonetrade.example",
    address: "2140 W Grand Ave",
    city: "Phoenix",
    region: "AZ",
    postalCode: "85009",
    geo: { lat: 33.4484, lng: -112.074 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Blackstone+Trade+Supplies+Phoenix",
    rating: 4.6,
    userRatingsTotal: 158,
    reviews: [
      {
        author: "Ray N.",
        rating: 5,
        text: "Open at 6:30 sharp, cutting list done before 7 and loaded straight into the truck. Saves me an hour a day.",
        time: "1 week ago",
      },
      {
        author: "Dana P.",
        rating: 5,
        text: "Staff actually know their fixings. Told me the right anchor for a hollow block instead of guessing.",
        time: "1 month ago",
      },
      {
        author: "Steve R.",
        rating: 4,
        text: "Trade account set up same morning and the statement lands like clockwork.",
        time: "3 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["85009", "85004", "85007", "85017", "85019", "85031", "85034", "85035"],
      localities: ["Phoenix", "Downtown", "Maryvale", "Encanto", "Alhambra", "Southwest Phoenix"],
      radiusKm: 10,
    },
    seo: {
      title: "Hardware Store & Trade Counter Phoenix | Blackstone Trade Supplies",
      description:
        "Phoenix hardware store and trade counter: fixings, power tools, timber cut to size, plumbing and paint. Trade accounts and same-day van delivery.",
    },
    keywords: ["hardware store Phoenix", "trade counter Phoenix", "building supplies Phoenix", "timber cut to size"],
  },
  mechanic: {
    trade: "mechanic",
    businessName: "Torque Lane Garage",
    tagline: "Independent garage in Nashville",
    hero: {
      headline: "Independent garage in Nashville — all makes welcome",
      subheadline:
        "Servicing, brakes, diagnostics, clutches and tyres in Nashville. Written quotes, honest findings and no work started without your approval.",
    },
    services: [],
    about:
      "Torque Lane Garage is an independent workshop in Nashville fixing cars properly rather than quickly. You get photographs of anything we find, a price agreed before work starts, and the replaced parts kept for you to inspect.",
    phone: tel("23"),
    email: "workshop@torquelane.example",
    address: "920 4th Ave S",
    city: "Nashville",
    region: "TN",
    postalCode: "37210",
    geo: { lat: 36.1627, lng: -86.7816 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Torque+Lane+Garage+Nashville",
    rating: 4.8,
    userRatingsTotal: 167,
    reviews: [
      {
        author: "Carla B.",
        rating: 5,
        text: "Quoted less than the dealer, showed me the worn discs and did it the same day.",
        time: "6 days ago",
      },
      {
        author: "Nate W.",
        rating: 5,
        text: "Diagnosed an intermittent fault that had beaten two other garages. Honest about the cost too.",
        time: "1 month ago",
      },
      {
        author: "Priya S.",
        rating: 4,
        text: "Serviced and stamped without affecting my warranty. Booking by WhatsApp was easy.",
        time: "2 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["37210", "37201", "37203", "37204", "37206", "37209", "37212", "37219"],
      localities: ["Nashville", "East Nashville", "Germantown", "The Gulch", "Berry Hill", "Wedgewood"],
      radiusKm: 10,
    },
    seo: {
      title: "Car Service & Repairs Nashville | Torque Lane Garage",
      description:
        "Nashville independent garage: car servicing, brakes, diagnostics, clutches and tyres for all makes. Written quotes and 12-month repair warranty.",
    },
    keywords: ["car service Nashville", "brake repair Nashville", "car diagnostics Nashville", "clutch replacement"],
  },
  generic: {
    trade: "generic",
    businessName: "Ridgeline Local Services",
    tagline: "Local services in Atlanta",
    hero: {
      headline: "Trusted local service in Atlanta — quoted before we start",
      subheadline:
        "Repairs, installations and inspections across Atlanta. Friendly, insured and always on time, with a clear price before any work begins.",
    },
    services: [],
    about:
      "Ridgeline Local Services is a small Atlanta business that works on word of mouth. We answer the phone, arrive inside the agreed window, quote clearly in writing, and stand behind everything we finish.",
    phone: tel("07"),
    email: "hello@ridgelinelocal.example",
    address: "88 Auburn Ave NE",
    city: "Atlanta",
    region: "GA",
    postalCode: "30303",
    geo: { lat: 33.749, lng: -84.388 },
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Ridgeline+Local+Services+Atlanta",
    rating: 4.9,
    userRatingsTotal: 134,
    reviews: [
      {
        author: "Maria G.",
        rating: 5,
        text: "Quoted in writing, arrived when they said and the finish was better than I expected.",
        time: "1 week ago",
      },
      {
        author: "Trev D.",
        rating: 5,
        text: "Handled a job two other companies wouldn't touch. Clear pricing and no drama.",
        time: "3 weeks ago",
      },
      {
        author: "Aisha K.",
        rating: 5,
        text: "Photos of the work sent by WhatsApp the same day. Very easy to deal with.",
        time: "2 months ago",
      },
    ],
    hours: DEMO_HOURS,
    hoursSpec: DEMO_HOURS_SPEC,
    photos: [],
    beforeAfter: [],
    serviceAreas: {
      postalCodes: ["30303", "30306", "30308", "30309", "30310", "30312", "30316", "30318"],
      localities: ["Atlanta", "Midtown", "Old Fourth Ward", "Grant Park", "West End", "East Atlanta"],
      radiusKm: 10,
    },
    seo: {
      title: "Trusted Local Services Atlanta | Ridgeline Local Services",
      description:
        "Local repairs, installations and inspections across Atlanta. Free written quotes, insured work, on-time arrival windows. Call or message today.",
    },
    keywords: ["local services Atlanta", "trusted local business Atlanta", "free quotes Atlanta", "local repair service"],
  },
};

// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Demo content assembly — the exact `websites.content` shape
//  the renderer + schema builder expect, so demos exercise the
//  same code path as a real trader site.
// ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Shareable demo URL for a trade. */
export function demoUrlFor(trade: TemplateId): string {
  return `https://www.neerzy.com/site/templates/${trade}`;
}

export type DemoBundle = {
  demo: DemoSite;
  def: (typeof TRADE_SITE_TEMPLATES)[TemplateId];
  content: any;
};

export function demoBundleFor(trade: TemplateId): DemoBundle {
  const demo = DEMO_SITES[trade];
  const def = TRADE_SITE_TEMPLATES[trade];

  const content = {
    businessName: demo.businessName,
    tagline: demo.tagline,
    hero: demo.hero,
    about: demo.about,
    // Template fallback services when the demo doesn't override them.
    services: demo.services.length ? demo.services : def.services,
    faqs: def.faqs,
    phone: demo.phone,
    email: demo.email,
    address: demo.address,
    city: demo.city,
    region: demo.region,
    postalCode: demo.postalCode,
    country: "US",
    geo: demo.geo,
    mapUrl: demo.mapUrl,
    rating: demo.rating,
    userRatingsTotal: demo.userRatingsTotal,
    reviews: demo.reviews,
    hours: demo.hours,
    hoursSpec: demo.hoursSpec,
    // Real photos would go in `photos`; demos only carry stock placeholders.
    photos: [] as string[],
    stockPhotos: def.gallery,
    beforeAfter: def.beforeAfter,
    serviceAreas: {
      ...demo.serviceAreas,
      center: demo.geo,
      fetchedAt: "2026-01-01T00:00:00.000Z",
      source: "google-geocode",
    },
    seo: demo.seo,
    keywords: demo.keywords,
    areaServed: `${demo.city}, ${demo.region}`,
    priceRange: def.priceRange,
    palette: def.palette,
    templateId: trade,
    templateName: def.name,
    domain: "demo.neerzy.com",
    generatedAt: "2026-01-01T00:00:00.000Z",
    seoLocked: true,
    demo: true,
  };

  return { demo, def, content };
}
