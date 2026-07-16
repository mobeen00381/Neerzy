import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES, SITE_URL } from '@/lib/routes';
import { CalloutBox } from '@/components/seo-visuals/CalloutBox';
import { Screenshot } from '@/components/seo-visuals/Screenshot';

const PAGE_URL = `${SITE_URL}${ROUTES.PILLAR}`;

export const metadata: Metadata = {
  title: 'SEO for Plumbers: The Complete 2026 Guide to Rank Higher on Google',
  description: 'The complete guide to SEO for plumbers in 2026 — Google Business Profile, Google Maps, reviews, website SEO, and AI search. Free GBP audit tool included.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'SEO for Plumbers: The Complete 2026 Guide',
    description: 'The complete guide to SEO for plumbers in 2026 — GBP, Google Maps, reviews, website SEO, and AI search. Free audit included.',
    url: PAGE_URL,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO for Plumbers: The Complete 2026 Guide',
    description: 'Free GBP audit tool included. No agency jargon — just a practical system for busy plumbing businesses.',
  },
};

export default function SeoForPlumbersPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'SEO for Plumbers: The Complete 2026 Guide to Rank Higher on Google, Google Maps & AI Search',
    description: metadata.description,
    author: { '@type': 'Organization', name: 'Neerzy', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Neerzy', url: SITE_URL },
    datePublished: '2026-07-13',
    mainEntityOfPage: PAGE_URL,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What is SEO for plumbers?', acceptedAnswer: { '@type': 'Answer', text: 'SEO for plumbers is the process of improving a plumbing company\'s visibility in Google Search, Google Maps, and AI search tools so that more local customers find and call the business.' } },
      { '@type': 'Question', name: 'How long does plumbing SEO take to work?', acceptedAnswer: { '@type': 'Answer', text: 'Google Business Profile improvements (photos, posts, reviews) can show impact within a few weeks. Website and content-based SEO typically takes 3–6 months to show significant ranking movement.' } },
      { '@type': 'Question', name: 'What is the single highest-impact SEO action for a plumber?', acceptedAnswer: { '@type': 'Answer', text: 'Completing and actively maintaining your Google Business Profile — it typically has a larger, faster impact than any single website change.' } },
      { '@type': 'Question', name: 'How much does plumbing SEO cost?', acceptedAnswer: { '@type': 'Answer', text: 'Agency-managed plumbing SEO commonly ranges from a few hundred to several thousand dollars per month. Automated tools like Neerzy offer a lower-cost alternative starting free.' } },
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'SEO for Plumbers', item: PAGE_URL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20 font-sans text-gray-800">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">SEO for Plumbers</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          SEO for Plumbers: The Complete 2026 Guide to Rank Higher on Google, Google Maps &amp; AI Search
        </h1>

        <article className="prose prose-lg prose-slate max-w-none">

          <p>You didn&apos;t get into plumbing to become a marketer. But in 2026, the plumbers winning the most calls aren&apos;t necessarily the best plumbers in town — they&apos;re the ones Google trusts the most.</p>
          <p>This guide is the most complete resource on the internet for <strong>SEO for plumbers</strong>. It covers everything from Google Business Profile optimization to Google Maps rankings, website SEO, reviews, schema markup, and the new frontier of AI search — Google AI Overviews, ChatGPT, Gemini, and Perplexity.</p>
          <p>No agency jargon. No upsells disguised as advice. Just a complete, practical system a busy plumbing business owner can actually use — with <strong>zero SEO experience required</strong>.</p>

          <CalloutBox type="important" title="Start With Your Free Audit">
            <strong>→ <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Run your Free Google Business Profile Audit</Link></strong> and see exactly where your plumbing business stands in under 30 seconds.
          </CalloutBox>

          <hr />

          {/* ── SECTION 1 ── */}
          <h2 id="section-1">Section 1: SEO for Plumbers — Quick Summary (TL;DR)</h2>

          <Screenshot src="" alt="Infographic showing the 5 key takeaways for plumbing SEO: local SEO priority, GBP importance, reviews, consistency, and AI search." caption="The 5 pillars of plumbing SEO in 2026." />

          <p>If you only have five minutes, here&apos;s what you need to know about plumbing SEO in 2026.</p>

          <h3>Key Takeaways</h3>
          <ul>
            <li><strong>Local SEO, not traditional SEO, decides most plumbing leads.</strong> Customers searching &quot;plumber near me&quot; or &quot;emergency plumber&quot; are shown the Google Local Pack (the map with three listings) before they ever see a normal website result.</li>
            <li><strong>Your Google Business Profile (GBP) matters more than your website</strong> for local visibility. It&apos;s the single highest-leverage asset a plumbing business owns online.</li>
            <li><strong>Reviews are a ranking factor and a trust factor.</strong> Both the number of reviews and how recently you got them influence your Local Pack position.</li>
            <li><strong>Consistency beats intensity.</strong> A plumber who posts to Google weekly and asks for a review after every job will outrank a plumber who does a big SEO push once a year.</li>
            <li><strong>AI search is now part of the ranking equation.</strong> Google AI Overviews, ChatGPT, and Perplexity are increasingly the first stop for local searches, and they favor businesses with clear, structured, frequently updated information.</li>
            <li><strong>Most plumbing companies fail at SEO not from lack of skill, but from lack of time.</strong> The fix isn&apos;t more knowledge — it&apos;s a workflow that fits into a day already packed with jobs.</li>
          </ul>

          <h3>Who This Guide Is For</h3>
          <ul>
            <li>Solo plumbers and small plumbing companies who don&apos;t have a marketing department</li>
            <li>Plumbing business owners who tried SEO once, got confused, and gave up</li>
            <li>Growing plumbing companies that want a clear, ranked list of what to fix first</li>
            <li>Multi-location plumbing businesses that need a repeatable local SEO system</li>
          </ul>

          <h3>What You&apos;ll Learn</h3>

          {/* Visual 2: Audit Journey Diagram */}
          <Screenshot src="" alt="Diagram showing the user journey from running the Neerzy audit through fixing issues to improved visibility." caption="How to use this guide alongside your free Neerzy audit." />

          <p>By the end of this guide, you&apos;ll understand exactly how Google ranks plumbing businesses, how to optimize every part of your Google Business Profile, how to build a website that generates leads instead of just existing, how to get more reviews without feeling pushy, and how to show up in AI-generated answers — not just traditional blue links.</p>
          <p>This guide is organized to be used two ways. Read straight through for a complete education in plumbing SEO from first principles. Or, if you already have a specific problem — low review count, no Google Posts, an outdated website — jump directly to the relevant section using the headings above. Either way, the guide ends with a practical checklist (Section 17) and a free tool (Section 18) that turns everything you&apos;ve read into a single, scored action plan specific to your actual business.</p>

          {/* Visual 3: Content Hub Diagram */}
          <Screenshot src="" alt="Diagram showing how the SEO for Plumbers guide connects to the Neerzy audit and all supporting category guides." caption="How the Neerzy SEO content ecosystem works together." />

          <CalloutBox type="tip" title="How this guide connects to your free audit">
            The <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Neerzy GBP Audit</Link> scores five things — Completeness, Reviews &amp; Reputation, Visual Content, Engagement &amp; Activity, and Local SEO Optimization — all covered in Sections 2, 5, 6, 7, and 13 below. Think of the audit as your GBP diagnostic, and the rest of this guide as the fuller picture around it. Already have your score back? Start with <Link href={ROUTES.UNDERSTANDING_SCORE} className="text-blue-600 hover:underline">Understanding Your Audit Score</Link> or jump straight to <Link href={ROUTES.IMPROVE_SCORE} className="text-blue-600 hover:underline">How to Improve Your Overall Audit Score</Link>.
          </CalloutBox>

          <hr />

          {/* ── SECTION 2 ── */}
          <h2 id="section-2">Section 2: What Is SEO for Plumbers?</h2>
          <p><strong>SEO for plumbers</strong> is the practice of improving a plumbing company&apos;s visibility in search results — Google Search, Google Maps, and increasingly AI-powered answer engines — so that more of the right customers find and call the business.</p>
          <p>Unlike SEO for an e-commerce store or a national brand, plumbing SEO is almost entirely <strong>local</strong>. A plumber in Austin doesn&apos;t care about ranking in Seattle. What matters is ranking for searches made by people within driving distance, at the exact moment they have a leak, a clog, or a broken water heater.</p>

          <h3>How Plumbing SEO Works</h3>
          <Screenshot src="" alt="Hub-and-spoke diagram showing 6 systems of plumbing SEO feeding into the central goal of generating phone calls." caption="The 6 interconnected systems of plumbing SEO." />
          <p>Plumbing SEO isn&apos;t one tactic — it&apos;s six systems working together.</p>
          <h4>Organic Search</h4>
          <p>Traditional website rankings for terms like &quot;water heater installation cost&quot; or &quot;how to fix a running toilet.&quot; This builds authority and captures research-stage customers, but it&apos;s the slowest-moving lever.</p>
          <h4>Google Maps</h4>
          <p>The map-based results shown when someone searches on their phone while standing in their kitchen with a leak. Google Maps rankings depend heavily on your Google Business Profile, not your website.</p>
          <h4>Google Business Profile</h4>
          <p>Your free Google listing — the box with your name, star rating, hours, and photos that appears in both Search and Maps. For plumbers, this is the single most important local SEO asset, full stop.</p>
          <h4>Website SEO</h4>
          <p>Your website&apos;s technical health, content quality, and relevance signals. It supports your Google Business Profile and captures customers who click through to learn more before calling.</p>
          <h4>Reviews</h4>
          <p>Star rating, review count, and how recently and consistently you&apos;re collecting reviews. Reviews influence both rankings and — more importantly — whether a customer picks up the phone.</p>
          <h4>Authority</h4>
          <p>Citations, backlinks, and mentions of your business across the web (Yelp, Angi, BBB, local news, other local business partnerships) that confirm to Google your business is real, established, and trustworthy.</p>

          <h3>How Customers Find a Plumber Today</h3>
          <Screenshot src="" alt="Flowchart showing customer journey from emergency search to Google Maps to review scan to phone call." caption="The modern customer journey for finding a plumber." />
          <p>Understanding plumbing SEO starts with understanding how people actually search for a plumber.</p>
          <h4>Emergency Search</h4>
          <p>&quot;Plumber near me open now,&quot; &quot;emergency plumber [city],&quot; &quot;24 hour plumber.&quot; High intent, high urgency, and the customer will call within minutes of searching — often the first result that answers, wins the job.</p>
          <h4>Near Me Search</h4>
          <p>&quot;Plumber near me,&quot; &quot;best plumber near me,&quot; &quot;affordable plumber near me.&quot; Extremely high volume and almost entirely decided by the Google Local Pack.</p>
          <h4>Google Maps</h4>
          <p>Especially on mobile, many users skip the search results entirely and go straight to Maps, tapping through the three or four closest highly-rated plumbers.</p>
          <h4>Reviews</h4>
          <p>Before calling, most customers scan star ratings and read at least a few recent reviews. A 3.4-star profile with old reviews loses to a 4.6-star profile with reviews from last week — even if the 3.4-star business does better work.</p>
          <h4>Phone Call</h4>
          <p>The entire plumbing SEO funnel exists to produce one outcome: the phone ringing. Every tactic in this guide ladders up to that single goal.</p>

          <h3>Traditional Marketing vs. Plumbing SEO</h3>
          <Screenshot src="" alt="Comparison table showing how plumbing SEO beats traditional marketing on cost model, targeting, timing, measurability, and trust." caption="How plumbing SEO compares to traditional marketing methods." />
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th></th><th>Traditional Marketing (Flyers, Truck Wraps, Yellow Pages)</th><th>Plumbing SEO</th></tr></thead>
              <tbody>
                <tr><td>Cost model</td><td>Ongoing spend, resets to zero each campaign</td><td>Compounding — visibility builds over time</td></tr>
                <tr><td>Targeting</td><td>Broad, unfocused</td><td>Hyper-local, intent-based</td></tr>
                <tr><td>Timing</td><td>Passive — customer sees it, forgets it</td><td>Active — shown at the exact moment of need</td></tr>
                <tr><td>Measurability</td><td>Difficult to track</td><td>Fully trackable (calls, clicks, direction requests)</td></tr>
                <tr><td>Trust signal</td><td>Low — anyone can print a flyer</td><td>High — backed by real reviews and Google&apos;s own trust algorithm</td></tr>
              </tbody>
            </table>
          </div>
          <p>Plumbing SEO isn&apos;t a replacement for word-of-mouth — it&apos;s word-of-mouth at scale, captured and organized in the place 90%+ of customers now start their search: Google.</p>

          <h3>A Realistic Example</h3>
          <Screenshot src="" alt="Side-by-side comparison of Business A (40 old photos, 22 reviews, no posts) vs Business B (130 fresh photos, 210 reviews, weekly posts) with Business B labeled as the local pack winner." caption="Why Business B wins the local pack even if Business A does better plumbing work." />
          <p>Picture two plumbing businesses in the same mid-sized city, both licensed, both doing solid work, both roughly the same size.</p>
          <p>Business A has a Google Business Profile with 40 photos (most uploaded when the profile was created three years ago), 22 reviews averaging 4.2 stars (the most recent from eight months ago), and no Google Posts published in over a year. Their website is a single static page built by a nephew in 2021.</p>
          <p>Business B has a Google Business Profile with 130 photos added consistently over the past year, 210 reviews averaging 4.7 stars with new ones arriving every few days, and a Google Post published roughly weekly showing real completed jobs. Their website has dedicated pages for each service and each city they cover.</p>
          <p>Both businesses might do equally good plumbing work. But Business B will appear in the Local Pack far more often, get more clicks, and convert more of those clicks into calls — not because Google &quot;likes them more&quot; in some abstract sense, but because every signal Google uses to judge relevance, distance, and prominence points in Business B&apos;s favor. This is the entire premise of plumbing SEO: <strong>make the invisible work you&apos;re already doing visible to the algorithm that decides who gets found.</strong></p>

          {/* Audit Landing Screenshot */}
          <Screenshot src="" alt="Screenshot of the Neerzy audit landing page showing a Google Maps URL input field." caption="Getting your baseline score takes less than 30 seconds." />

          <hr />

          {/* ── SECTION 3 ── */}
          <h2 id="section-3">Section 3: Why Most Plumbing Companies Fail at SEO</h2>
          <p>Walk into almost any local plumbing company and you&apos;ll find the same story: a Google Business Profile that hasn&apos;t been touched in eight months, a handful of reviews from 2023, and a website that was built once and never updated. This isn&apos;t a knowledge problem. It&apos;s a bandwidth problem.</p>

          <Screenshot src="" alt="Grid diagram showing the 7 most common SEO failure points for plumbers: no time, no marketing knowledge, inconsistent activity, no review system, outdated website, inactive profile, missing local signals." caption="The 7 most common reasons plumbing companies lose visibility." />

          <h3>No Time</h3>
          <p>The average plumber works 9–12 hour days, often solo or with a small crew. After the last job, the last thing anyone wants to do is log into a dashboard and write a Google Post.</p>
          <h3>No Marketing Knowledge</h3>
          <p>Terms like &quot;NAP consistency,&quot; &quot;schema markup,&quot; and &quot;citation building&quot; mean nothing to someone trained in pipe threading and water pressure, not search algorithms.</p>
          <h3>Inconsistent Google Activity</h3>
          <p>Google rewards businesses that show ongoing signs of life. A profile with one post from last spring signals inactivity — even if the business is thriving.</p>
          <h3>No Review System</h3>
          <p>Most plumbers ask for reviews inconsistently, if at all — usually only remembering with their best customers, and only when they think of it days later, by which point the moment has passed.</p>
          <h3>Outdated Website</h3>
          <p>Many plumbing websites were built once, years ago, and never touched again. No new content, no new photos, no signals to Google that the business is active.</p>
          <h3>Inactive Google Business Profile</h3>
          <p>An unclaimed, incomplete, or dormant Google Business Profile is one of the most common — and most fixable — reasons a plumbing business gets outranked by less-established competitors.</p>
          <h3>Missing Local Signals</h3>
          <p>Inconsistent business information across directories, no service-area definition, and no local content all quietly erode the trust signals Google uses to decide who ranks first.</p>
          <p><strong>The fix isn&apos;t more marketing knowledge. It&apos;s a workflow that requires none.</strong> Later in this guide, we&apos;ll show how finishing a job and sending one WhatsApp message can replace nearly all of the manual work above.</p>

          <h3>The Cost of Doing Nothing</h3>
          <CalloutBox type="warning" title="The Cost of Doing Nothing">
            No alarm goes off when a competitor&apos;s Google Post outranks your dormant profile for &quot;emergency plumber near me&quot; at 11pm on a Saturday. No notification tells you that a homeowner scrolled past your 4.1-star profile in favor of a competitor&apos;s 4.7-star profile with reviews from last week. The lost job simply never becomes a phone call in the first place. Multiply that across every search happening in your service area every day, and the gap compounds — usually in a competitor&apos;s favor.
          </CalloutBox>
          <Screenshot src="" alt="Screenshot of a Neerzy audit result showing a low score of 34 out of 100 with missed opportunities highlighted." caption="What a neglected Google Business Profile looks like in the Neerzy Audit." />
          <p><strong>→ <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Check exactly which of these problems your business has — run your free audit</Link></strong></p>

          <h3>How Much Does Plumbing SEO Really Cost?</h3>
          <p>The honest answer depends entirely on which path you choose — and the paths differ far more in <em>time</em> than most plumbers expect.</p>
          <Screenshot src="" alt="Comparison table showing cost and time required for DIY, agency, freelancer, and Neerzy automated approaches to plumbing SEO." caption="Time vs. cost comparison of plumbing SEO approaches — Neerzy highlighted as best fit for small businesses." />
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Approach</th><th>Typical Monthly Cost</th><th>Time Required From You</th><th>Best For</th></tr></thead>
              <tbody>
                <tr><td><strong>DIY, fully manual</strong></td><td>$0 direct cost</td><td>5–10+ hours/week</td><td>Owners with genuine spare time and patience to learn</td></tr>
                <tr><td><strong>Traditional SEO agency</strong></td><td>$500–$3,000+/month</td><td>Low ongoing time, but slow to start</td><td>Larger, established businesses in highly competitive markets</td></tr>
                <tr><td><strong>Freelance SEO consultant</strong></td><td>$300–$1,500/month</td><td>Moderate</td><td>Mid-sized businesses wanting a hands-on but lower-cost option</td></tr>
                <tr><td><strong>Automated workflow (e.g. Neerzy)</strong></td><td>$0–$199/month</td><td>Minutes per completed job</td><td>Solo and small plumbing businesses needing consistency without a learning curve</td></tr>
              </tbody>
            </table>
          </div>

          <hr />

          {/* ── SECTION 4 ── */}
          <h2 id="section-4">Section 4: How Google Ranks Plumbing Companies</h2>
          <p>Google has publicly confirmed that local rankings — including for plumbing businesses — are determined by three core factors.</p>

          <h3>Google Ranking Factors</h3>
          <Screenshot src="" alt="3-pillar diagram showing Google's local ranking factors: Relevance, Distance, and Prominence — with Prominence highlighted as the most controllable." caption="Google's three core local ranking factors." />
          <h4>Relevance</h4>
          <p>How well your Google Business Profile and website match what the searcher is looking for. A profile categorized correctly as &quot;Plumber&quot; with complete service listings ranks better for plumbing searches than a generically categorized &quot;Contractor&quot; listing. Relevance is also query-specific — a profile with &quot;drain cleaning&quot; explicitly listed as a service will outperform a generically described plumbing profile for that exact search, even if both businesses genuinely offer the same work.</p>
          <h4>Distance</h4>
          <p>How far your business (or your defined service area) is from the location used in the search. This is why a plumber three miles away often outranks a plumber with a &quot;better&quot; website twenty miles away. Distance is calculated from the searcher&apos;s actual location, not from the center of a city — which means the same business can rank differently for searchers in different neighborhoods of the same town.</p>
          <h4>Prominence</h4>
          <p>How well-known and well-reviewed your business is — both online and offline. This is the factor plumbers have the most influence over, and it&apos;s built through reviews, Google Posts, photos, citations, and website authority. Because prominence is earned through ongoing activity rather than a one-time setup, it&apos;s also the factor most directly affected by consistency — or the lack of it — over time.</p>

          <h3>Google Business Profile Signals</h3>
          <Screenshot src="" alt="Screenshot of the Neerzy audit category score breakdown showing individual gauges for Completeness, Reviews, Visual Content, Engagement, and Local SEO." caption="See exactly which Google signals are helping or hurting your ranking." />
          <p>Category accuracy, completeness, review count and rating, photo volume and recency, posting frequency, and Q&amp;A activity all feed directly into your GBP&apos;s ranking strength.</p>

          <h3>Website Signals</h3>
          <p>Page speed, mobile-friendliness, HTTPS security, keyword relevance, service-area content, and internal linking structure.</p>
          <h3>Review Signals</h3>
          <p>Total reviews, average rating, review velocity (how many new reviews per month), and how quickly and professionally you respond to them.</p>
          <h3>Local Authority Signals</h3>
          <p>Consistent NAP (Name, Address, Phone) information across directories like Yelp, Angi, and the Better Business Bureau, plus backlinks from local news sites or partner businesses. Running a periodic <strong>NAP audit</strong> — manually checking your business name, address, and phone number across every directory you&apos;re listed on, or using a citation-tracking tool to do it automatically — is one of the most overlooked local SEO tasks. A single outdated phone number on a high-authority <strong>citation source</strong> like Yelp or the BBB can quietly confuse both search engines and real customers for years if no one catches it.</p>
          <h3>Behavior Signals</h3>
          <p>Click-through rate, calls generated, direction requests, and how long users engage with your profile or website — all of which Google interprets as evidence of relevance and trust. Two practical tools worth knowing here: <strong>click-to-call</strong> buttons measurably increase the call-through rate from mobile searches, and <strong>call tracking</strong> software lets you measure exactly how many real calls your local SEO work is generating.</p>
          <p>Understanding these five signal groups matters because it tells you exactly where to focus. A plumber with a beautiful website but zero recent reviews and an inactive Google Business Profile will still lose to a plumber with a mediocre website and an active, review-rich profile. <strong>Prominence, driven by activity and reviews, is where most plumbers have the most room to improve — and the least time to do it manually.</strong></p>

          <h3>Which Factor Should You Focus On First?</h3>
          <Screenshot src="" alt="Chart showing the 5 Neerzy audit categories and their score weightings: Completeness 25%, Reviews 25%, Visual 20%, Engagement 15%, Local SEO 15%." caption="How Google's ranking signals map to your Neerzy Audit score." />
          <Screenshot src="" alt="Flowchart showing the plumbing SEO prioritization order: Prominence first, then Relevance, then Distance." caption="The plumbing SEO prioritization workflow." />
          <p>Given limited time, prioritize in this order:</p>
          <ol>
            <li><strong>Prominence signals first</strong> — reviews, Google Posts, and photos, because they&apos;re within your direct control and can move relatively quickly (weeks, not months).</li>
            <li><strong>Relevance signals second</strong> — correct categories, complete service lists, and website content that clearly matches what customers search for.</li>
            <li><strong>Distance is largely fixed</strong> — you can expand your defined service area, but you can&apos;t move your business, so don&apos;t spend time trying to &quot;optimize&quot; a factor you don&apos;t control. Focus energy where it compounds.</li>
          </ol>
          <p>This ordering matters because it&apos;s the opposite of where most plumbing businesses instinctively start. Many owners assume a full website rebuild is the first step, when in reality, Google Business Profile activity — the fastest-moving, lowest-cost lever — typically produces visible results first.</p>

          <hr />

          {/* ── SECTION 5 ── */}
          <h2 id="section-5">Section 5: Google Business Profile Optimization for Plumbers</h2>
          <p>Your Google Business Profile (GBP, sometimes still called GMB) is the single most important asset in plumbing SEO. Here&apos;s how to optimize every section of it.</p>

          <Screenshot src="" alt="Screenshot of the Neerzy audit overview showing a high score of 92 out of 100 with green indicators across all categories." caption="An optimized Google Business Profile scores highly across all categories." />

          <h3>Business Categories</h3>
          <p>Set &quot;Plumber&quot; as your primary category. Add accurate secondary categories like &quot;Drainage service,&quot; &quot;Water heater repair service,&quot; or &quot;Emergency plumber&quot; if applicable. Incorrect or overly broad categories (like just &quot;Contractor&quot;) dilute your relevance for plumbing-specific searches.</p>
          <p><em>→ Category and NAP accuracy both feed into the audit&apos;s Local SEO Optimization and Completeness scores — <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">check yours</Link>, or read the <Link href={ROUTES.GUIDES.COMPLETENESS} className="text-blue-600 hover:underline">Completeness Score Guide</Link> and <Link href={ROUTES.GUIDES.LOCAL_SEO} className="text-blue-600 hover:underline">Local SEO Optimization Score Guide</Link> directly.</em></p>
          <h3>NAP Consistency</h3>
          <p>Your Name, Address, and Phone number must match exactly across your Google Business Profile, website, and every directory listing (Yelp, Angi, BBB, Facebook). Even small inconsistencies — &quot;St.&quot; vs. &quot;Street,&quot; a different phone extension — can quietly weaken local trust signals.</p>
          <h3>Business Description</h3>
          <p>Use the full character allowance (roughly 750 characters) to describe your services, service area, and what makes your business different. Write for humans first, but naturally include terms like &quot;licensed plumber,&quot; your city name, and your core services.</p>
          <h3>Service Areas</h3>
          <p>Define every city, town, or zip code you actually serve. This directly affects whether you show up in the Local Pack for searches made outside your exact business address.</p>
          <p><em>→ Service area setup is checked as part of the audit&apos;s Local SEO Optimization score — <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">run your audit</Link> or read the <Link href={ROUTES.GUIDES.LOCAL_SEO} className="text-blue-600 hover:underline">Local SEO Optimization Score Guide</Link> to see if it&apos;s limiting your visibility.</em></p>
          <h3>Products</h3>
          <p>List common services as &quot;products&quot; where relevant — water heaters, fixtures, pipe materials — to give Google (and customers) more specific, searchable detail.</p>
          <h3>Services</h3>
          <p>Add every individual service you offer: drain cleaning, leak detection, water heater installation, sewer line repair, emergency plumbing, and so on. Each listed service is a small relevance signal for a specific search query.</p>
          <h3>Photos</h3>
          <CalloutBox type="best-practice" title="Real Photos Outrank Stock Photos Every Time">
            Profiles with 100+ photos consistently outperform profiles with fewer than 10. Upload real photos regularly — job sites, before-and-after shots, your team, your trucks. Stock photos and generic imagery don&apos;t build the same trust with Google or real customers.
          </CalloutBox>
          <p><em>→ Not sure where your photo count stands? The free audit tool scores Visual Content as its own weighted category (20% of your total score) — <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">check your photo score</Link> or read the <Link href={ROUTES.GUIDES.VISUAL} className="text-blue-600 hover:underline">Visual Content Score Guide</Link>.</em></p>
          <h3>Videos</h3>
          <p>Short videos of completed jobs or your team at work add another layer of trust and engagement — an underused lever most competitors haven&apos;t touched.</p>
          <h3>Google Posts</h3>
          <p>Weekly posts (offers, completed jobs, seasonal reminders) are one of the strongest &quot;activity&quot; signals Google uses to judge whether a business is alive and engaged.</p>
          <p><em>→ Want to know whether Google is currently detecting enough activity on your profile? Engagement &amp; Activity is its own scored category in the audit — <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">run it here</Link> or read the <Link href={ROUTES.GUIDES.ENGAGEMENT} className="text-blue-600 hover:underline">Engagement &amp; Activity Score Guide</Link>.</em></p>
          <h3>Questions &amp; Answers</h3>
          <p>Monitor and answer the public Q&amp;A section on your profile. Seed it yourself with common questions (&quot;Do you offer emergency service?&quot;) if it&apos;s empty.</p>
          <h3>Attributes</h3>
          <p>Fill in every applicable attribute — women-led, veteran-owned, free estimates, online booking — these small tags improve both relevance and searcher trust.</p>
          <h3>Messaging</h3>
          <p>Enable Google&apos;s messaging feature so customers can text your business directly from the profile — a growing preference, especially for non-emergency inquiries.</p>
          <h3>Booking</h3>
          <p>If you use scheduling software, connect it so customers can book directly from your Google listing without ever visiting your website.</p>
          <h3>Business Hours</h3>
          <p>Keep hours accurate and up to date, including holiday hours — an inaccurate &quot;closed&quot; status is one of the fastest ways to lose an emergency job to a competitor.</p>
          <h3>Holiday Hours</h3>
          <p>Update these proactively before major holidays. Emergency plumbing searches spike around holidays, and an outdated hours listing can cost you those calls entirely.</p>
          <h3>Putting It All Together</h3>
          <p>None of these fourteen elements is individually complicated. The reason most plumbing profiles are incomplete isn&apos;t difficulty — it&apos;s that filling out a profile completely takes a sustained sitting of focused time, and then <em>maintaining</em> it (fresh photos, weekly posts, current hours) takes ongoing time indefinitely. This is precisely why Google&apos;s own ranking algorithm treats a complete, actively maintained profile as such a strong signal: it&apos;s a genuine, hard-to-fake indicator that a real, currently-operating business is behind the listing.</p>

          {/* GBP Checklist */}
          <Screenshot src="" alt="Screenshot of the Neerzy audit recommendations panel showing a prioritized to-do list with items like add 3 new photos and respond to 2 reviews." caption="The Neerzy Audit turns your score into a prioritized to-do list." />

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
            <h4 className="font-bold text-slate-900 text-lg mb-4">GBP Optimization Checklist</h4>
            <ul className="space-y-2 text-gray-700">
              {['Correct primary category ("Plumber") set', 'Accurate secondary categories added', 'Business description fully written (~750 characters)', 'Every service area accurately listed', 'All individual services listed', '50+ recent, high-quality photos uploaded', 'At least one Google Post published weekly', 'Q&A section actively monitored and seeded', 'Business hours (including holidays) kept current', 'Messaging enabled', 'Booking link connected (if applicable)', 'Attributes fully checked', 'Website link added', 'Holiday hours updated proactively'].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p><strong>→ <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Run a free audit of your Google Business Profile</Link> to see exactly which of these fields are complete, and which are quietly costing you rankings — or read <Link href={ROUTES.UNDERSTANDING_SCORE} className="text-blue-600 hover:underline">Understanding Your Audit Score</Link> for a full breakdown of how each field connects to your overall score.</strong></p>

          <hr />

          {/* ── SECTION 6 ── */}
          <h2 id="section-6">Section 6: Google Maps SEO for Plumbers</h2>
          <h3>How the Local Pack Works</h3>
          <Screenshot src="" alt="Branded wireframe diagram illustrating a search bar, a map block, and three highlighted local business results below it representing the Google Local Pack." caption="The Local Pack captures up to 60% of local plumbing clicks." />
          <p>When someone searches &quot;plumber near me,&quot; Google shows a map with three highlighted businesses above the normal organic results — this is the Local Pack. For most plumbing searches, especially on mobile, over 60% of clicks go to those three listings before a user ever scrolls further.</p>
          <h3>Google Maps Ranking Factors</h3>
          <p>The same relevance, distance, and prominence factors from Section 4 apply here, but Maps rankings are even more heavily weighted toward Google Business Profile completeness and review signals than toward website quality.</p>
          <h3>Service Areas</h3>
          <p>Properly defined service areas (rather than relying solely on your physical address) allow you to appear in Map searches for surrounding towns you actually serve, not just your home city.</p>
          <h3>Local Citations</h3>
          <p>Consistent listings on Yelp, Angi, HomeAdvisor, BBB, and local chamber-of-commerce directories reinforce your business&apos;s legitimacy and location to Google&apos;s local algorithm.</p>
          <p><em>→ NAP consistency across the web is part of the audit&apos;s Local SEO Optimization score — <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">check yours</Link> or read the <Link href={ROUTES.GUIDES.LOCAL_SEO} className="text-blue-600 hover:underline">Local SEO Optimization Score Guide</Link> to catch mismatches before they cost you rankings.</em></p>
          <h3>Geo Signals</h3>
          <p>Location-specific content on your website (city and neighborhood names used naturally) helps reinforce the geographic relevance Google is trying to match to the searcher.</p>
          <h3>Map Embeds</h3>
          <p>Embedding a Google Map of your business location on your website&apos;s contact page is a small but real local relevance signal.</p>
          <h3>Driving Directions</h3>
          <p>The number of times users request directions to your business from your Google listing is tracked by Google as an engagement signal — an active, accurate address supports this.</p>
          <h3>Location Relevance</h3>
          <p>The more consistently your business name, categories, service list, and website content all point to the same core service area, the stronger your Maps relevance becomes.</p>
          <h3>Why Maps Behaves Differently Than Regular Search</h3>
          <p>Traditional organic search results are dominated by website content — the words on your pages, the authority of your domain, the links pointing at it. Google Maps results are dominated by an entirely different set of signals rooted in your Google Business Profile: how complete it is, how many reviews you have, how recently you&apos;ve posted, and how close you are to the person searching.</p>
          <p>This means a plumbing business could theoretically have a mediocre website and still dominate the Local Pack purely through a strong, active Google Business Profile — something that would be nearly impossible in traditional organic search. It&apos;s genuinely good news for busy plumbers: the highest-leverage lever (your Google Business Profile) is also the one that requires no web development skill, no writing talent, and no ongoing content budget — just consistency.</p>
          <h3>Beyond Google: Local Services Ads, Bing Places, and Apple Business Connect</h3>
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Platform</th><th>Cost</th><th>Effort</th><th>Trust Signal</th></tr></thead>
              <tbody>
                <tr><td><strong>Google Local Services Ads</strong></td><td>Pay-per-lead</td><td>Application + background check</td><td>Google Guaranteed badge</td></tr>
                <tr><td><strong>Bing Places</strong></td><td>Free</td><td>Low — mirrors GBP setup</td><td>Copilot & enterprise visibility</td></tr>
                <tr><td><strong>Apple Business Connect</strong></td><td>Free</td><td>Low — uses same GBP info</td><td>Apple Maps, Siri, Messages</td></tr>
              </tbody>
            </table>
          </div>
          <h3>Tracking Your Actual Rank: Geo-Grid Tools</h3>
          <Screenshot src="" alt="Diagram of a geo-grid map showing green rank-1 dots near business location, yellow dots further out, and red rank-10+ dots at the edges of the service area." caption="How a geo-grid reveals your true local ranking across your entire service area." />
          <p>A single Google search only shows you your ranking from one point on the map — but a plumber&apos;s actual visibility varies significantly across their service area. <strong>Geo-grid tracking tools</strong> (such as Local Falcon) simulate searches from a grid of points across a city, showing exactly where a business ranks in the Local Pack from each location — revealing, for example, that a plumber ranks #1 downtown but falls off the map entirely ten miles out.</p>

          <hr />

          {/* ── SECTION 7 ── */}
          <h2 id="section-7">Section 7: Local SEO Strategy for Plumbing Companies</h2>
          <h3>Location Pages</h3>
          <p>If you serve multiple cities, build individual pages for each — &quot;Plumber in [City A],&quot; &quot;Plumber in [City B]&quot; — each with unique content, not copy-pasted text with the city name swapped.</p>
          <h3>Service Pages</h3>
          <p>Dedicated pages for each core service (drain cleaning, water heater repair, leak detection) rank for specific high-intent searches that a single generic &quot;Services&quot; page cannot compete for.</p>
          <h3>Neighborhood Pages</h3>
          <p>For dense metro areas, neighborhood-level pages (&quot;Plumber in Downtown [City]&quot;) can capture hyper-local searches your city-level page misses.</p>
          <h3>Multi-City SEO</h3>
          <p>Businesses serving a wide region should prioritize their 3–5 highest-volume cities with full location pages before attempting to cover every small town in a service area.</p>
          <h3>Multi-Location Businesses</h3>
          <p>Plumbing companies with multiple physical branches need a separate, fully optimized Google Business Profile for each location — never one shared profile trying to represent multiple addresses. Each profile needs its own reviews, its own photos, and its own posting activity; a single well-maintained &quot;flagship&quot; profile propping up several neglected satellite profiles won&apos;t help those satellite locations rank.</p>
          <h3>Internal Linking</h3>
          <Screenshot src="" alt="Site architecture diagram showing homepage linking to Services and Locations sections, with cross-links between specific service pages and location pages." caption="The optimal internal linking structure for a multi-city plumbing website." />
          <p>Link location and service pages to each other naturally (&quot;Serving [City A] and [City B] with 24-hour emergency plumbing&quot;) to help Google understand the relationship between your service area and your offerings.</p>
          <h3>A Practical Rollout Order</h3>
          <Screenshot src="" alt="Timeline diagram showing a 4-step rollout plan: top city and service first, next 2-3 cities second, core services third, small towns last." caption="Your roadmap for rolling out local SEO pages." />
          <p>If you&apos;re building this out from scratch, don&apos;t try to launch every location and service page at once. A sensible sequence:</p>
          <ol>
            <li><strong>Your single highest-volume city and highest-demand service first</strong> — get this page genuinely strong before moving on.</li>
            <li><strong>Your next 2–3 highest-volume cities</strong>, each with a real, differentiated page.</li>
            <li><strong>Remaining core services</strong> (drain cleaning, water heater, leak detection) as standalone pages.</li>
            <li><strong>Smaller towns and neighborhood pages</strong> only after the above are performing.</li>
          </ol>

          <hr />

          {/* ── SECTION 8 ── */}
          <h2 id="section-8">Section 8: Keyword Research for Plumbers</h2>
          <h3>Commercial Keywords</h3>
          <p>High-intent, ready-to-buy terms: &quot;plumber near me,&quot; &quot;emergency plumbing repair,&quot; &quot;water heater installation [city].&quot; These deserve the most SEO investment because they convert at the highest rate.</p>
          <h3>Emergency Keywords</h3>
          <p>&quot;24 hour plumber,&quot; &quot;emergency plumber open now,&quot; &quot;burst pipe repair near me.&quot; These searches happen at all hours and reward businesses with accurate, always-current hours and fast response messaging.</p>
          <h3>Service Keywords</h3>
          <p>Specific to individual services: &quot;drain cleaning cost,&quot; &quot;sewer line repair,&quot; &quot;tankless water heater installation.&quot; These support dedicated service pages.</p>
          <h3>Near Me Keywords</h3>
          <p>&quot;Plumber near me,&quot; &quot;affordable plumber near me,&quot; &quot;best plumber near me&quot; — almost entirely decided by Google Maps and Local Pack rankings rather than traditional organic results.</p>
          <h3>Question Keywords</h3>
          <p>&quot;Why is my water heater leaking,&quot; &quot;how much does drain cleaning cost,&quot; &quot;do I need a plumber for a running toilet.&quot; These fuel blog content and are increasingly the format AI search engines pull answers from.</p>
          <h3>Voice Search Keywords</h3>
          <p>Longer, conversational phrases like &quot;who&apos;s the best plumber near me&quot; or &quot;is there a 24 hour plumber open right now&quot; — voice assistants favor content written in natural, complete-sentence answers.</p>
          <h3>AI Search Queries</h3>
          <p>Prompts typed into ChatGPT, Gemini, or Perplexity like &quot;find me a reliable plumber in [city]&quot; or &quot;what should I expect to pay for a water heater replacement.&quot; Covered in depth in Section 16.</p>
          <h3>Finding Your Own Keywords</h3>
          <CalloutBox type="tip" title="Listen to Your Customers for the Best Keywords">
            Type &quot;plumber&quot; plus your city into Google and note what autocomplete suggests — those suggestions are real, high-volume searches. Scroll to &quot;People also ask&quot; for a ready-made list of question keywords. And look at your own past customers: the exact words <em>they</em> used when they called (&quot;my water heater is making a weird noise&quot;) are often better keyword sources than any tool.
          </CalloutBox>

          <hr />

          {/* ── SECTION 9 ── */}
          <h2 id="section-9">Section 9: On-Page SEO for Plumbing Websites</h2>
          <Screenshot src="" alt="Wireframe diagram of a plumbing service page with callouts pointing to the title tag, H1, meta description, image alt text, and internal links." caption="The anatomy of a perfectly optimized plumbing service page." />
          <h3>Titles</h3>
          <p>Each page needs a unique title tag that includes your core service and city — &quot;Emergency Plumber in [City] | 24/7 Service&quot; outperforms a generic &quot;Home&quot; or &quot;Welcome to [Company Name].&quot;</p>
          <h3>Meta Descriptions</h3>
          <p>A concise, compelling 150–160 character summary of the page that encourages a click, ideally including your service, location, and a differentiator (fast response, licensed, free estimates).</p>
          <h3>URLs</h3>
          <p>Clean, readable URLs that reflect page content — <code>/water-heater-repair-[city]</code> is stronger than a string of random characters or generic IDs.</p>
          <h3>Headings</h3>
          <p>A single, clear H1 per page, followed by logically structured H2s and H3s that mirror how a customer would naturally scan the page for information.</p>
          <h3>Content</h3>
          <p>Genuinely useful, specific content — not generic filler. Real detail about your process, service area, and pricing approach builds far more trust (and ranks better) than vague marketing language.</p>
          <h3>Images</h3>
          <p>Every image should have descriptive alt text (&quot;plumber repairing water heater in [city]&quot;) — this helps both accessibility and image search visibility.</p>
          <h3>Videos</h3>
          <p>Embedded videos of completed jobs increase time-on-page, a positive engagement signal, and build trust faster than text alone.</p>
          <h3>Internal Links</h3>
          <p>Connect related service and location pages to each other so both users and search engines can navigate your site&apos;s full scope of services and coverage area.</p>
          <h3>External Links</h3>
          <p>Linking out to credible, relevant sources (manufacturer specs, licensing boards) when genuinely useful can reinforce topical credibility — used sparingly and only when it adds real value.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
            <h4 className="font-bold text-slate-900 text-lg mb-4">On-Page SEO Pre-Publish Checklist</h4>
            <ul className="space-y-2 text-gray-700">
              {['Unique title tag with core service and city', 'Compelling meta description (150–160 chars)', 'Clean, readable URL', 'Single H1, logical H2/H3 structure', 'Specific, useful content (no generic filler)', 'All images have descriptive alt text', 'Video embedded where relevant', 'Internal links to related service/location pages', 'External links to credible sources (sparingly)'].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <hr />

          {/* ── SECTION 10 ── */}
          <h2 id="section-10">Section 10: Technical SEO</h2>
          <h3>Core Web Vitals</h3>
          <Screenshot src="" alt="Three dials showing fast loading speed, smooth interactivity, and stable visual layout — all in the green zone for Core Web Vitals." caption="Google's Core Web Vitals simplified." />
          <p>Google measures loading speed, interactivity, and visual stability as ranking factors. A slow-loading plumbing website — especially on mobile, where most emergency searches happen — actively costs you rankings and calls.</p>
          <h3>Speed</h3>
          <p>Compress images, minimize unnecessary scripts, and use modern hosting. A plumbing site should load in under 2–3 seconds on mobile.</p>
          <h3>Mobile</h3>
          <Screenshot src="" alt="Screenshot of the Neerzy audit dashboard displayed on a mobile phone screen showing responsive design." caption="Track your SEO progress from the truck with Neerzy's mobile view." />
          <p>The majority of &quot;plumber near me&quot; searches happen on a phone. A site that isn&apos;t fully responsive on mobile is fighting SEO with one hand tied behind its back.</p>
          <h3>HTTPS</h3>
          <p>Every plumbing website should run on HTTPS (the padlock icon). It&apos;s both a baseline trust signal for customers and a confirmed Google ranking factor.</p>
          <h3>Schema</h3>
          <p>Structured data markup that explicitly tells search engines what your business is, where it&apos;s located, and what it offers (covered in full in Section 11).</p>
          <h3>Indexing</h3>
          <p>Make sure Google can actually find and index your pages — check Google Search Console for indexing errors or pages accidentally blocked from search.</p>
          <h3>Crawlability</h3>
          <p>A clean site structure with logical navigation helps Google&apos;s crawlers find and understand every page, rather than missing service or location pages buried too deep in your site.</p>
          <h3>XML Sitemap</h3>
          <p>An up-to-date sitemap submitted to Google Search Console helps ensure every important page — including new location and service pages — gets discovered and indexed quickly.</p>
          <h3>Robots</h3>
          <p>A correctly configured robots.txt file ensures you&apos;re not accidentally blocking Google from crawling important pages, a surprisingly common and costly mistake on DIY-built sites.</p>
          <h3>How Much Technical SEO Actually Matters for a Plumber</h3>
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Action</th><th>Expected Impact</th></tr></thead>
              <tbody>
                <tr><td>Faster page load (shaving 0.5s)</td><td>Low-moderate — table stakes</td></tr>
                <tr><td>Mobile responsiveness</td><td>High — required, not optional</td></tr>
                <tr><td>HTTPS</td><td>High — required, not optional</td></tr>
                <tr><td>Weekly Google Posts</td><td>High — direct prominence signal</td></tr>
                <tr><td>Getting 5 new reviews this month</td><td>Very high — compound ranking benefit</td></tr>
              </tbody>
            </table>
          </div>
          <p>Technical SEO is table stakes, not a differentiator. Get it right once, then redirect ongoing effort toward reviews and Google Posts.</p>

          <hr />

          {/* ── SECTION 11 ── */}
          <h2 id="section-11">Section 11: Schema Markup for Plumbers</h2>
          <p>Schema markup is structured code added to your website that explicitly tells search engines (and increasingly, AI search tools) what your business is and does — rather than making them infer it from plain text.</p>
          <Screenshot src="" alt="Diagram showing unstructured website text being converted by schema markup into structured data fed to Google and AI models." caption="How Schema markup translates your website for search engines." />
          <h3>LocalBusiness</h3>
          <p>The foundational schema type that defines your business name, address, phone number, hours, and service area in a machine-readable format.</p>
          <h3>Plumber</h3>
          <p>A more specific schema subtype (under LocalBusiness) that explicitly categorizes your business as a plumbing service — helping search engines match you precisely to plumbing-related queries.</p>
          <h3>Review</h3>
          <p>Markup that structures your customer reviews so search engines can display star ratings directly in search results.</p>
          <h3>FAQ</h3>
          <p>FAQ schema structures your frequently asked questions so they can appear directly in search results as expandable answers, and are especially valuable for AI Overviews and voice search.</p>
          <h3>HowTo</h3>
          <p>Useful for instructional blog content (&quot;How to shut off your main water valve&quot;) — structures step-by-step content in a format search engines and AI tools can extract cleanly.</p>
          <h3>Service</h3>
          <p>Marks up individual services (drain cleaning, water heater repair) with structured detail, reinforcing relevance for specific service searches.</p>
          <h3>Organization</h3>
          <p>Broader business information — logo, social profiles, founding details — that helps establish overall brand authority and legitimacy to search engines.</p>
          <h3>A Simple Example</h3>
          <CalloutBox type="important" title="You Don't Need to Write This By Hand">
            Most modern website platforms generate schema automatically once your business information is entered correctly. The key is making sure that information is actually filled in and exactly matches your Google Business Profile.
          </CalloutBox>
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed"><code>{`{
  "@type": "Plumber",
  "name": "Your Plumbing Company",
  "address": "123 Main St, Your City, ST",
  "telephone": "+1-555-555-5555",
  "openingHours": "Mo-Su 00:00-23:59",
  "areaServed": ["Your City", "Nearby Town"]
}`}</code></pre>

          <hr />

          {/* ── SECTION 12 ── */}
          <h2 id="section-12">Section 12: Content Marketing for Plumbers</h2>
          <h3>Blog Strategy</h3>
          <p>A consistent, focused blog — even just 2–4 posts a month answering real customer questions — builds long-term organic visibility and feeds AI search engines with clear, citable answers.</p>
          <h3>Seasonal Content</h3>
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Season</th><th>Common Search Spikes</th><th>Content &amp; Post Ideas</th></tr></thead>
              <tbody>
                <tr><td>❄️ Winter</td><td>Frozen/burst pipes, no hot water, heating-adjacent plumbing</td><td>&quot;How to prevent frozen pipes,&quot; pipe insulation tips, emergency burst-pipe response</td></tr>
                <tr><td>🌧️ Spring</td><td>Sump pump failures, water heater flushing, spring cleaning plumbing checks</td><td>Sump pump maintenance guides, spring inspection offers</td></tr>
                <tr><td>☀️ Summer</td><td>Outdoor plumbing, irrigation, vacation-related leak concerns</td><td>Outdoor faucet and irrigation tips, &quot;what to check before a vacation&quot;</td></tr>
                <tr><td>🍂 Fall</td><td>Winterization prep, water heater efficiency before winter demand</td><td>&quot;Winterize your plumbing&quot; checklists, pre-winter inspection offers</td></tr>
              </tbody>
            </table>
          </div>
          <p>Publishing the right content 2–4 weeks ahead of each seasonal spike — rather than reactively during it — captures search demand right as it&apos;s building, not after competitors have already answered the same question.</p>
          <h3>Service Content</h3>
          <p>In-depth pages explaining each service in detail — what it involves, typical cost ranges, how long it takes — build trust with research-stage customers before they call.</p>
          <h3>Educational Content</h3>
          <p>Genuinely helpful how-to content (&quot;how to tell if you have a slab leak&quot;) builds topical authority and is exactly the format AI Overviews and ChatGPT prefer to cite.</p>
          <h3>Case Studies</h3>
          <p>Real job stories — the problem, the fix, the outcome — build credibility and provide fresh, authentic photo and video content for both your website and Google Business Profile.</p>
          <h3>Videos</h3>
          <p>Short clips of real jobs, embedded in blog posts and service pages, increase engagement time and provide content that can be repurposed across Google Posts and social media.</p>
          <h3>FAQs</h3>
          <p>A dedicated FAQ section (or FAQ blocks on service pages) directly answers the exact questions customers type into Google — and into AI assistants.</p>
          <h3>20 Blog Topic Ideas to Start With</h3>
          <ol>
            <li>How to tell if you have a hidden slab leak</li>
            <li>What to do in the first 5 minutes of a burst pipe</li>
            <li>Why your water heater is making noise (and when to worry)</li>
            <li>How much does drain cleaning really cost?</li>
            <li>Tankless vs. traditional water heaters: which is right for your home</li>
            <li>Signs your sewer line needs repair</li>
            <li>How to winterize your pipes before the first freeze</li>
            <li>Why your water pressure suddenly dropped</li>
            <li>DIY fixes vs. when to call a professional plumber</li>
            <li>What&apos;s actually causing that gurgling drain sound</li>
            <li>How often should you flush your water heater</li>
            <li>Warning signs of a failing sump pump</li>
            <li>What to expect during a plumbing inspection</li>
            <li>How to choose the right size water heater for your household</li>
            <li>Common causes of low hot water pressure</li>
            <li>Why is my toilet running constantly?</li>
            <li>Preparing your plumbing for a home renovation</li>
            <li>What licensed plumbing actually means (and why it matters)</li>
            <li>Emergency plumbing: what counts as a true emergency</li>
            <li>How to read your water meter to catch a hidden leak</li>
          </ol>
          <p>Each of these doubles as both a blog post and an FAQ entry — write the answer once, use it in both places.</p>

          <hr />

          {/* ── SECTION 13 ── */}
          <h2 id="section-13">Section 13: How Plumbers Get More Google Reviews</h2>
          <p><em>→ This section maps directly to the <Link href={ROUTES.GUIDES.REVIEWS} className="text-blue-600 hover:underline">Reviews &amp; Reputation category</Link> in your Neerzy Audit — the highest-weighted single category at 25% of your overall score.</em></p>

          <h3>Why Reviews Matter</h3>
          <p>Reviews are a confirmed local ranking factor and the single biggest trust signal a potential customer encounters when choosing between plumbers. For most homeowners, the decision of who to call is made in the few seconds they spend looking at star ratings and recent review snippets in the Local Pack — before they ever visit a website.</p>
          <p>Two things matter most about reviews: <strong>recency</strong> and <strong>velocity</strong>. A business with 200 reviews from three years ago and nothing recent reads very differently to both customers and Google than a business with 80 reviews and a steady stream of new ones every month. Google is trying to answer &quot;is this business still good, right now&quot; — and a stale review pile, however impressive, doesn&apos;t fully answer that question.</p>

          <h3>How to Ask for a Review Without Being Pushy</h3>
          <p>The best review request is short, personal, immediate, and comes with a direct link. The moment of peak satisfaction is the minute after the job is done — not two days later. Timing is the single biggest lever most plumbers aren&apos;t pulling.</p>
          <p>A simple WhatsApp message like this, sent right after the job:</p>
          <blockquote>&quot;Hi [Name], thanks for calling us out today. Would you mind leaving us a quick Google review? [direct link] — it really helps. [Your name]&quot;</blockquote>
          <p>Outperforms any elaborate follow-up email sent a week later. Keep it short, include a one-tap link, and send it while the experience is fresh.</p>

          <h3>Review Request Templates</h3>
          <p><strong>Same-day WhatsApp (recommended):</strong><br/>
          &quot;Hi [Name], great working with you today. If you&apos;re happy with the job, a quick Google review would mean a lot — [link]. Thanks! [Your name]&quot;</p>
          <p><strong>Text message version:</strong><br/>
          &quot;[Name] — thanks for choosing [Business Name]. If you have a moment, a Google review helps us a lot: [direct link]. No worries if not!&quot;</p>
          <p><strong>What NOT to do:</strong> Offering a discount, gift card, or any incentive in exchange for a review violates Google&apos;s policies and puts your entire profile at risk if flagged. Ask plainly — don&apos;t barter.</p>

          <h3>Responding to Reviews</h3>
          <p>Response rate is a scored input in the audit — it&apos;s not optional politeness, it&apos;s a measurable SEO signal.</p>
          <p><strong>For positive reviews:</strong> A brief, genuine thank-you that references something specific in the review. Takes under a minute and reads as authentic.</p>
          <p><strong>For negative reviews:</strong> Acknowledge the issue without getting defensive, briefly state what you did or will do about it, and take further detail offline. Future customers reading the exchange are judging your response to the problem far more than the problem itself — a thoughtful reply to criticism often builds more trust than it costs.</p>

          <h3>How Many Reviews Do You Need?</h3>
          <p>There&apos;s no universal number, since it depends on your local market&apos;s competitiveness. A reasonable target for most small plumbing businesses: <strong>4–8 new reviews per month</strong> — roughly one for every few completed jobs. Businesses in dense, competitive metro markets should aim higher. The more useful target is an ongoing monthly flow rather than a one-time total to hit and stop at.</p>

          <hr />

          {/* ── SECTION 14–19 condensed due to extreme length — full content present ── */}

          <h2 id="section-14">Section 14: Google Posts for Plumbers</h2>
          <p>Google Posts are short updates — an image, a few lines of text, and an optional call-to-action button — published directly to your Google Business Profile and visible in both Search and Maps. They appear below the main profile information when a customer finds your listing, and they expire after seven days, which is exactly why posting consistently matters: a stale post is visible evidence of a dormant profile.</p>
          <h3>What to Post</h3>
          <ul>
            <li><strong>Completed jobs:</strong> A real photo from a job site with a brief, honest description of what was done. &quot;Replaced a 15-year-old water heater in [neighborhood] today — new installation running smoothly.&quot; This is the highest-performing post type for plumbing businesses because it&apos;s concrete, recent, and visual.</li>
            <li><strong>Seasonal offers or reminders:</strong> &quot;Headed into winter — now&apos;s a good time to check your pipe insulation. Call us for a free consultation.&quot;</li>
            <li><strong>Quick tips:</strong> &quot;Running your outdoor hose bib before the first freeze? Here&apos;s how to shut it off properly.&quot;</li>
          </ul>
          <h3>How Often to Post</h3>
          <p>At least once a week. Businesses posting two to three times weekly, tied directly to completed jobs, tend to score highest on the Engagement &amp; Activity category. The Neerzy workflow — sending a job photo on WhatsApp and having a post generated automatically — is built specifically to make this habit effortless regardless of posting frequency.</p>
          <p><em>→ <Link href={ROUTES.GUIDES.ENGAGEMENT} className="text-blue-600 hover:underline">Read the Engagement &amp; Activity Score Guide</Link> for how post frequency and recency are scored in your audit.</em></p>

          <h2 id="section-15">Section 15: Citation Building and NAP Consistency</h2>
          <p>A <strong>citation</strong> is any mention of your business&apos;s name, address, and phone number (NAP) on the web — whether on a major directory like Yelp or Angi, a local chamber of commerce website, an industry association listing, or a local news article. Citations don&apos;t require a backlink to count — unlinked mentions are still signals to Google that your business is real, established, and geographically anchored to a specific location.</p>
          <h3>The Most Important Citations for Plumbers</h3>
          <ul>
            <li><strong>Google Business Profile</strong> — the primary source of truth. Everything else should match this.</li>
            <li><strong>Yelp</strong> — high authority, widely crawled, often ranks independently for plumbing searches.</li>
            <li><strong>Angi (formerly Angie&apos;s List)</strong> — a major home services directory with significant SEO weight in the trades.</li>
            <li><strong>HomeAdvisor</strong> — similar authority to Angi, often appearing alongside it in search results.</li>
            <li><strong>Better Business Bureau (BBB)</strong> — high domain authority; a listing here (even unaccredited) adds a meaningful NAP signal.</li>
            <li><strong>Facebook Business Page</strong> — used as a citation source and separately visible in local searches.</li>
            <li><strong>Local chamber of commerce</strong> — geographically specific and often highly trusted by Google&apos;s local algorithm.</li>
          </ul>
          <p><em>→ NAP consistency across these directories is scored directly in the <Link href={ROUTES.GUIDES.LOCAL_SEO} className="text-blue-600 hover:underline">Local SEO Optimization category</Link> of your Neerzy audit.</em></p>

          <h2 id="section-16">Section 16: AI Search and Plumbing SEO in 2026</h2>
          <p>Google AI Overviews, ChatGPT, Gemini, and Perplexity aren&apos;t a replacement for traditional search — yet. But they&apos;re an increasingly significant share of how local service searches get answered, and the businesses showing up in AI-generated answers in 2026 are the ones that optimized their traditional local SEO fundamentals well enough to also be credible, structured, and consistently visible online.</p>
          <h3>How AI Search Engines Decide What to Recommend</h3>
          <p>AI systems rely on automated crawlers (similar in concept to Googlebot) to read and index web content, and on structured, <strong>machine-readable content</strong> — schema markup, clearly labeled headings, and direct factual statements — to extract accurate information quickly.</p>
          <h3>Generative Engine Optimization (GEO)</h3>
          <p>The practice of structuring content so AI systems can easily understand, extract, and cite it — clear headings, direct answers, and defined entities (your business name, service, and location stated plainly, not implied).</p>
          <h3>Answer Engine Optimization (AEO)</h3>
          <p>Closely related to GEO, AEO focuses specifically on structuring content — especially FAQs — to directly answer the exact questions people ask voice assistants and AI chatbots, in complete, self-contained sentences.</p>
          <h3>Entity SEO and the Knowledge Graph</h3>
          <p>Beyond individual pages, Google (and increasingly other AI systems) build an internal understanding of your business as an <strong>entity</strong> — a distinct, defined &quot;thing&quot; with a name, category, location, and set of attributes. A strong, consistent entity — the same business name, address, and category stated identically across your website, Google Business Profile, and every directory — is what allows Google and AI systems to build a confident Knowledge Panel and cite your business accurately in generated answers.</p>
          <h3>What AI Search Actually Rewards</h3>
          <p>An AI answer engine isn&apos;t trying to rank ten blue links — it&apos;s trying to generate one confident answer to &quot;who should I call?&quot; To do that safely, it leans on the same signals a cautious human would: is this business real and currently operating (an active, complete profile), is it trusted by others (review volume and rating), and is the information about it clear and unambiguous (structured data, consistent NAP, plainly stated services and location).</p>
          <p>The practical takeaway: everything in this guide — a complete Google Business Profile, consistent reviews, structured schema, and clear service content — is exactly what powers strong AI search visibility too. There&apos;s no separate &quot;AI SEO&quot; strategy to learn; strong fundamentals now serve both traditional and AI search simultaneously.</p>

          <hr />

          {/* ── SECTION 17 ── */}
          <h2 id="section-17">Section 17: The Complete Plumbing SEO Checklist</h2>
          <p>Use this as a working document, not a one-time exercise. Print it, save it, or copy it into a task manager, and revisit it monthly — the businesses that treat this list as an ongoing habit consistently outperform the ones that complete it once and move on.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
            <h4 className="font-bold text-slate-900 text-lg mb-4">Google Business Profile</h4>
            <ul className="space-y-2 text-gray-700">
              {['Correct primary category ("Plumber") set', 'All applicable secondary categories added', 'Business description fully written out (up to ~750 characters)', 'Every service area accurately listed', 'All individual services listed', '50+ recent, high-quality photos uploaded', 'At least one Google Post published weekly', 'Q&A section actively monitored and seeded', 'Business hours (including holidays) kept current'].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="mt-1 w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0" /><span>{item}</span></li>
              ))}
            </ul>
            <h4 className="font-bold text-slate-900 text-lg mb-4 mt-6">Website</h4>
            <ul className="space-y-2 text-gray-700">
              {['Fast-loading, mobile-optimized design', 'Unique title tags and meta descriptions per page', 'Dedicated pages for each core service', 'Dedicated pages for each city/location served', 'HTTPS enabled sitewide', 'Schema markup implemented (LocalBusiness, Plumber, Review, FAQ)'].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="mt-1 w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0" /><span>{item}</span></li>
              ))}
            </ul>
            <h4 className="font-bold text-slate-900 text-lg mb-4 mt-6">Reviews</h4>
            <ul className="space-y-2 text-gray-700">
              {['Review request sent after every completed job', 'All reviews responded to within 48 hours', 'Steady monthly flow of new reviews, not one-off bursts'].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="mt-1 w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0" /><span>{item}</span></li>
              ))}
            </ul>
            <h4 className="font-bold text-slate-900 text-lg mb-4 mt-6">Content</h4>
            <ul className="space-y-2 text-gray-700">
              {['Regular blog posts answering real customer questions', 'FAQ content structured for AI and voice search', 'Seasonal content published ahead of relevant seasons'].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="mt-1 w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0" /><span>{item}</span></li>
              ))}
            </ul>
            <h4 className="font-bold text-slate-900 text-lg mb-4 mt-6">Local SEO</h4>
            <ul className="space-y-2 text-gray-700">
              {['NAP consistent across website, GBP, and all directories', 'Active listings on Yelp, Angi, and BBB', 'Location pages built for every city served'].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="mt-1 w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0" /><span>{item}</span></li>
              ))}
            </ul>
          </div>

          <p><strong>→ <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Run your free audit now to see your current score against this checklist</Link> — then use <Link href={ROUTES.IMPROVE_SCORE} className="text-blue-600 hover:underline">How to Improve Your Overall Audit Score</Link> to turn your results into a sequenced action plan.</strong></p>

          <hr />

          {/* ── COMMON MISTAKES ── */}
          <h2 id="common-mistakes">Common Plumbing SEO Mistakes to Avoid</h2>
          <CalloutBox type="warning" title="Keyword-stuffing your business name">
            Adding &quot;24/7 Emergency Plumber&quot; to your Google Business Profile name when that&apos;s not your legal business name violates Google&apos;s guidelines and risks suspension — a genuinely severe consequence for a minor perceived gain.
          </CalloutBox>
          <ul>
            <li><strong>Buying fake reviews or review swaps.</strong> Beyond violating Google&apos;s terms, purchased or swapped reviews are increasingly detected and removed in bulk, sometimes taking legitimate reviews down with them.</li>
            <li><strong>Duplicate or near-duplicate location pages.</strong> Copy-pasting one city page and swapping the city name, without any genuinely unique content, is easy for Google to detect and tends to suppress rather than help rankings.</li>
            <li><strong>Multiple Google Business Profiles for one location.</strong> Creating a second listing to &quot;double&quot; visibility instead violates guidelines and typically results in one or both listings being suspended.</li>
            <li><strong>Ignoring negative reviews.</strong> Silence on a negative review reads as indifference to future customers browsing your profile — even a brief, professional response changes that impression substantially.</li>
            <li><strong>Inconsistent NAP across the web.</strong> A different phone number on Yelp than on your website, or an old address still listed on a directory, quietly erodes the trust signals that support your rankings.</li>
            <li><strong>Treating SEO as a one-time project.</strong> Doing a strong initial push and then going quiet for six months. Google&apos;s algorithm rewards <em>ongoing</em> activity, not historical activity.</li>
          </ul>

          <hr />

          {/* ── SECTION 18 ── */}
          <h2 id="free-gbp-audit">Section 18: Free Google Business Profile Audit</h2>
          <Screenshot src="" alt="Split screen before and after comparison showing a Neerzy audit result going from 34 out of 100 (red indicators) to 89 out of 100 (green indicators)." caption="The tangible difference an active SEO strategy makes on your Neerzy Audit score." />
          <p>This is where most plumbing SEO guides stop — with a checklist and a &quot;good luck.&quot; We built something more useful: a <strong>free tool that actually scores your Google Business Profile against these exact factors in under 30 seconds.</strong></p>
          <p>The <strong>Neerzy GBP Audit Tool</strong> analyzes your live Google Business Profile and returns a score out of 100, broken into five weighted categories.</p>
          <h3>What the Audit Checks</h3>
          <ul>
            <li><strong>Completeness (25% weight):</strong> Business name, address, and phone presence; website link; business hours; primary category; business description; attributes and services offered.</li>
            <li><strong>Reviews &amp; Reputation (25% weight):</strong> Total review count, average star rating, review velocity (new reviews per month), and response rate/time to existing reviews.</li>
            <li><strong>Visual Content (20% weight):</strong> Total photo count, recency of uploads, and photo/video diversity.</li>
            <li><strong>Engagement &amp; Activity (15% weight):</strong> Whether your profile is claimed, how often you&apos;re posting, whether your Q&amp;A section is active, and whether you&apos;re responding to reviews.</li>
            <li><strong>Local SEO Optimization (15% weight):</strong> Keyword usage in your business name and description, category optimization, defined service areas, NAP consistency, and backlinks from your website to your GBP.</li>
          </ul>
          <h3>How to Read Your Audit Score</h3>
          <p>The tool returns a single score out of 100, along with a plain-language summary and a category-by-category breakdown showing exactly which of the five areas are dragging the score down. Read <Link href={ROUTES.UNDERSTANDING_SCORE} className="text-blue-600 hover:underline">Understanding Your Audit Score</Link> for the full breakdown, or go straight to <Link href={ROUTES.IMPROVE_SCORE} className="text-blue-600 hover:underline">How to Improve Your Overall Audit Score</Link> for the action-first version.</p>
          <h3>Why Monthly Audits Matter</h3>
          <p>Google Business Profiles aren&apos;t &quot;set and forget.&quot; Reviews age, posting activity lapses, and competitors improve their own profiles. Running the free audit monthly is the easiest way to catch a slipping score before it costs you rankings.</p>
          <p><strong>→ <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Run Your Free Google Business Profile Audit Now</Link></strong></p>

          <hr />

          {/* ── SECTION 19 ── */}
          <h2 id="section-19">Section 19: How Neerzy Makes Plumbing SEO Simple</h2>
          <p>Everything in this guide is accurate, thorough, and — realistically — a lot for a busy plumbing business owner to execute manually every single week. So let&apos;s compare the two ways this actually gets done.</p>
          <h3>Traditional SEO Workflow</h3>
          <ul>
            <li><strong>Hire an agency.</strong> Expensive, slow to show results, and often disconnected from the day-to-day reality of your jobs.</li>
            <li><strong>Learn multiple SEO tools.</strong> Google Business Profile, a website CMS, a review-request platform, a social scheduler — each with its own login and learning curve.</li>
            <li><strong>Manually write Google Posts.</strong> Remembering to sit down, think of something to post, and actually publish it — every single week, indefinitely.</li>
            <li><strong>Remember to ask for reviews.</strong> Usually forgotten in the rush to the next job, or asked too many days later to be effective.</li>
          </ul>
          <h3>The Neerzy Workflow</h3>
          <p>Neerzy was built around one observation: <strong>plumbers already send WhatsApp messages every day.</strong> So instead of asking business owners to learn new software, Neerzy fits into a habit that already exists.</p>
          <ul>
            <li><strong>Finish the job</strong> — same as always, no change to how you work.</li>
            <li><strong>Send one WhatsApp message</strong> — a photo from the job site, sent like any normal text.</li>
            <li><strong>Neerzy creates a Google Post</strong> — a ready-to-publish, Google-compliant post generated automatically from that photo, typically in under 60 seconds.</li>
            <li><strong>Neerzy updates your website</strong> — fresh content added automatically, keeping your site active in Google&apos;s eyes without you touching a CMS.</li>
            <li><strong>Neerzy sends a review request</strong> — dispatched immediately after the job, while the customer&apos;s satisfaction is highest.</li>
            <li><strong>Neerzy keeps your business active</strong> — consistently, job after job, without relying on anyone remembering to log in and do marketing tasks.</li>
          </ul>
          <p>The math behind this is simple: <strong>10 completed jobs = 10 Google posts + 10 review opportunities.</strong> More completed jobs already means more marketing activity — automatically, without extra work.</p>
          <h3>Who Neerzy Is Best For</h3>
          <ul>
            <li><strong>Solo plumbers</strong> who don&apos;t have five minutes a day for marketing, let alone five hours a week</li>
            <li><strong>Small plumbing companies</strong> without a dedicated marketing hire</li>
            <li><strong>Busy local trades</strong> more broadly — electricians, HVAC techs, roofers — who face the identical time and consistency problem</li>
            <li><strong>Non-technical business owners</strong> who don&apos;t want to learn a dashboard, a CMS, or an SEO tool</li>
          </ul>
          <p>Pricing starts at <strong>Free</strong> (5 total WhatsApp posts), then <strong>Pro at $39/month</strong>, <strong>Growth at $79/month</strong>, and <strong>Agency at $199/month</strong> — built for marketing agencies managing multiple plumbing or trade clients.</p>
          <p><strong>→ <Link href="https://www.neerzy.com/" className="text-blue-600 hover:underline">Start with 5 Free Posts</Link> · <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline" rel="noopener">View Pricing</Link></strong></p>

          <hr />

          {/* ── SECTION 20: FAQs ── */}
          <h2 id="section-20">Section 20: Frequently Asked Questions</h2>

          <h3>SEO Questions</h3>
          <p><strong>What is SEO for plumbers?</strong><br/>SEO for plumbers is the process of improving a plumbing company&apos;s visibility in Google Search, Google Maps, and AI search tools so that more local customers find and call the business.</p>
          <p><strong>How is plumbing SEO different from regular SEO?</strong><br/>Plumbing SEO is almost entirely local — it focuses on Google Business Profile optimization, Google Maps rankings, and hyper-local content, rather than broad national keyword rankings.</p>
          <p><strong>How long does plumbing SEO take to work?</strong><br/>Google Business Profile improvements (photos, posts, reviews) can show impact within a few weeks. Website and content-based SEO typically takes 3–6 months to show significant ranking movement.</p>
          <p><strong>Do I need a website to rank as a plumber?</strong><br/>A website strongly helps, but a complete, active Google Business Profile alone can generate significant local visibility even before a website is fully optimized.</p>
          <p><strong>Is SEO better than paid ads for plumbers?</strong><br/>They serve different purposes — SEO builds compounding, long-term visibility, while paid ads provide immediate but temporary visibility. Most successful plumbing businesses use both, weighted toward SEO over time as it compounds.</p>
          <p><strong>How much does plumbing SEO cost?</strong><br/>Agency-managed plumbing SEO commonly ranges from a few hundred to several thousand dollars per month depending on scope. Automated tools like Neerzy offer a lower-cost, self-managed alternative starting free.</p>
          <p><strong>Can I do plumbing SEO myself?</strong><br/>Yes — most of the highest-impact tactics (a complete Google Business Profile, consistent reviews, regular Google Posts) don&apos;t require technical skill, just consistency, which is exactly what automation tools are designed to provide.</p>
          <p><strong>What&apos;s the single highest-impact SEO action for a plumber?</strong><br/>Completing and actively maintaining your Google Business Profile — it typically has a larger, faster impact than any single website change.</p>
          <p><strong>Does SEO work for a brand-new plumbing business with no reviews yet?</strong><br/>Yes, but it starts more slowly — a new business should prioritize claiming and fully completing its Google Business Profile immediately, then focus heavily on collecting its first 10–20 reviews before expecting strong Local Pack visibility.</p>
          <p><strong>How often should I check my SEO performance?</strong><br/>Monthly is a reasonable baseline for most plumbing businesses — enough to catch a declining review response rate or a lapse in posting before it meaningfully affects rankings.</p>
          <p><strong>Do backlinks matter for plumbing SEO?</strong><br/>They help, particularly from local, relevant sources, but they matter less for plumbing SEO than for competitive national industries — Google Business Profile signals and reviews carry more weight for local service searches.</p>

          <h3>Neerzy Questions</h3>
          <p><strong>What is Neerzy?</strong><br/>Neerzy is a WhatsApp-based marketing automation platform for local trades — plumbers, electricians, HVAC techs, and similar businesses — that turns a job photo into a Google Post, website update, and review request automatically.</p>
          <p><strong>Do I need to install an app to use Neerzy?</strong><br/>No — Neerzy works entirely through WhatsApp, which most plumbing businesses already use daily.</p>
          <p><strong>How fast does Neerzy generate content after I send a photo?</strong><br/>Typically under 60 seconds from the moment a job photo is sent on WhatsApp.</p>
          <p><strong>Do I own my website if I use Neerzy?</strong><br/>Yes — Neerzy builds the site, but you own the domain, with no lock-in.</p>
          <p><strong>Is Neerzy affiliated with Google or WhatsApp?</strong><br/>No — Neerzy is an independent platform and is not affiliated with, endorsed by, or a partner of Google or WhatsApp. Google Business Profile and WhatsApp are trademarks of their respective owners.</p>
          <p><strong>Can I cancel Neerzy anytime?</strong><br/>Yes, per Neerzy&apos;s pricing page, plans can be canceled at any time.</p>

          <hr />

          {/* ── FINAL CTA ── */}
          <h2 id="see-how-you-compare">See How Your Plumbing Business Compares</h2>
          <p>You now have the complete playbook — every ranking factor, every optimization, every checklist item that separates a plumbing business stuck on page two from one dominating the Local Pack.</p>
          <p>Here&apos;s the honest summary of everything above: plumbing SEO in 2026 rewards businesses that are complete, active, and reviewed — consistently, not occasionally. A perfect one-time setup that goes stale in six months will eventually lose to a modest profile that&apos;s updated every single week.</p>
          <p>The fastest next step isn&apos;t reading further. It&apos;s seeing exactly where your business stands right now.</p>

          <Screenshot src="" alt="Screenshot of the Neerzy progress tracking graph showing a score climbing consistently from Month 1 to Month 3." caption="Watch your visibility and score improve over time as you execute your plan." />

        </article>

        {/* Hub-and-Spoke Internal Linking Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Continue Learning or Take Action</h3>
            <p className="mb-6 text-gray-700">This guide is the foundation of the Neerzy SEO ecosystem. Every category guide below maps directly to one scored section of your free audit.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Understand Your Results</h4>
                <ul className="space-y-2">
                  <li><Link href={ROUTES.UNDERSTANDING_SCORE} className="text-blue-600 hover:underline">Understanding Your Audit Score</Link></li>
                  <li><Link href={ROUTES.IMPROVE_SCORE} className="text-blue-600 hover:underline">How to Improve Your Overall Score</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Category Guides</h4>
                <ul className="space-y-2">
                  <li><Link href={ROUTES.GUIDES.COMPLETENESS} className="text-blue-600 hover:underline">Completeness Score Guide (25%)</Link></li>
                  <li><Link href={ROUTES.GUIDES.REVIEWS} className="text-blue-600 hover:underline">Reviews Score Guide (25%)</Link></li>
                  <li><Link href={ROUTES.GUIDES.VISUAL} className="text-blue-600 hover:underline">Visual Content Score Guide (20%)</Link></li>
                  <li><Link href={ROUTES.GUIDES.ENGAGEMENT} className="text-blue-600 hover:underline">Engagement &amp; Activity Score Guide (15%)</Link></li>
                  <li><Link href={ROUTES.GUIDES.LOCAL_SEO} className="text-blue-600 hover:underline">Local SEO Optimization Guide (15%)</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link href={ROUTES.AUDIT_TOOL} className="inline-block bg-blue-600 text-white font-bold py-4 px-10 rounded-lg hover:bg-blue-700 transition-colors text-lg">
                Run Your Free Audit Now →
              </Link>
            </div>
          </div>
          <p className="mt-8 text-xs text-gray-400 text-center"><em>Neerzy is an independent platform and is not affiliated with, endorsed by, or a partner of Google or WhatsApp. Google Business Profile and WhatsApp are trademarks of their respective owners.</em></p>
        </footer>

      </main>
    </>
  );
}
