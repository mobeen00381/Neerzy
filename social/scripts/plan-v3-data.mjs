// =============================================================
// Neerzy 30-Day FB/IG Content Plan v3 - single source of truth.
// Consumed by:
//   social/scripts/build-plan-v3.mjs  (writes plan-v3.md + the xlsx)
//   reel/build-reels.mjs              (writes public/reel-dayNN.html)
//   reel/reel-data.mjs                (per-day reel scene specs)
// v3 keeps the v2 structure and plain-language voice, refreshed for
// the new features: synced website builder, flat $19 domain + local
// TLDs, the 4 GBP audit sub-scores, review asks by WhatsApp/SMS/link,
// no-WhatsApp onboarding, service-area support, and trade guides.
// Plain ASCII only - the repo has a history of mojibake with smart
// quotes and typographic dashes.
// =============================================================

const H =
  '#Neerzy #LocalTrades #SmallBusinessOwner #GrowYourBusiness #HomeServices';

export const PLAN = [
  {
    day: 1,
    date: 'Sep 28, 2026',
    weekday: 'Monday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Recap / Re-Intro',
    hook: 'Neerzy is live - here is the short version',
    caption:
      'In case you missed it: finish a job, send one photo (WhatsApp or the app link), and Neerzy turns it into a ready-to-post Google update, a customer review request, and a fresh entry on your website. You still tap post - we just do the writing. Your first 30 days include 5 posts and 5 review requests, free, no card needed.',
    tags: H + ' #Plumber #Electrician #WhatsAppBusiness #LocalSEO #GoogleBusinessProfile',
    cta: 'Start free - link in bio.',
    visual:
      'Clean brand graphic, logo + "Still live. Still free to start." over green background.',
    time: '8:00 AM',
  },
  {
    day: 2,
    date: 'Sep 29, 2026',
    weekday: 'Tuesday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Pain Point',
    hook: 'Tired after work? So is your marketing',
    caption:
      'You fix pipes, wires, and roofs all day. By the time you are home, posting online is the last thing you want to do. Send Neerzy one job photo and we write the Google post, the review request, and the website update for you. You just tap to send it.',
    tags: H + ' #TradesLife #WorkLifeBalance #SmallBusinessMarketing #WhatsAppBusiness',
    cta: 'See how easy it is - link in bio.',
    visual:
      'Tired tradesperson in a van at day end, phone in hand, text overlay builds the story.',
    time: '6:30 PM',
  },
  {
    day: 3,
    date: 'Sep 30, 2026',
    weekday: 'Wednesday',
    platform: 'FB & IG',
    format: 'Carousel Post (4 slides)',
    pillar: 'How It Works',
    hook: 'How Neerzy works, in 4 simple steps',
    caption:
      'Slide 1: Finish your job. Slide 2: Send one job photo - WhatsApp, or the app link if you prefer. Slide 3: Neerzy writes your Google, Facebook and Instagram posts, ready to paste and tap. Slide 4: We send your customer a review request the moment you are done - WhatsApp, SMS, or a link. No dashboards. No writer\'s block.',
    tags: H + ' #GoogleBusinessProfile #LocalSEO #TradesBusiness #ContentMadeForYou',
    cta: 'Swipe through, then start free - link in bio.',
    visual:
      '4 clean slides, one icon per step (camera, phone, laptop, star), matching site icons.',
    time: '9:00 AM',
  },
  {
    day: 4,
    date: 'Oct 01, 2026',
    weekday: 'Thursday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Education / Tip',
    hook: 'The best time to ask for a review? Right now.',
    caption:
      'Happy customers forget to leave a review a week later. Right after the job, while they are smiling at your work, they say yes almost every time. Reply DONE in your Neerzy chat and the review request goes out that second - by WhatsApp, SMS, or a plain link if that suits your customer better. No forgetting, no awkward follow-up calls.',
    tags: H + ' #CustomerReviews #GoogleReviews #ReputationManagement',
    cta: 'Learn how review requests work - link in bio.',
    visual:
      'Clock graphic showing "right after the job" next to a smiling customer icon and a star.',
    time: '11:00 AM',
  },
  {
    day: 5,
    date: 'Oct 02, 2026',
    weekday: 'Friday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Feature Spotlight',
    hook: 'Reply DONE. Review request sent.',
    caption:
      'Watch this: job finished, message sent, you reply DONE - and your customer gets a friendly review request right away. They can get it on WhatsApp, by SMS, or by link. No spreadsheets. No sticky notes. No remembering. Every time. Your first 5 review requests are free.',
    tags: H + ' #ReviewRequest #WhatsAppBusiness #SmallBusinessTips',
    cta: 'Get your first 5 review requests free - link in bio.',
    visual:
      'Screen-recording style: "DONE" sent, then a mock review request arriving on the customer phone - WhatsApp, SMS and link shown.',
    time: '7:00 PM',
  },
  {
    day: 6,
    date: 'Oct 03, 2026',
    weekday: 'Saturday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Engagement',
    hook: 'Which one are you today?',
    caption:
      'A) "I will post online later" (you never do). B) "I do not even know what a Google Business Profile is." C) "I forgot to ask for a review again." Comment your letter below - no judgement, that is exactly why we built Neerzy.',
    tags: H + ' #SmallBusinessLife #Plumber #Electrician #Roofer',
    cta: 'Comment your letter below.',
    visual: 'Fun 3-panel meme graphic, playful, brand colors.',
    time: '5:00 PM',
  },
  {
    day: 7,
    date: 'Oct 04, 2026',
    weekday: 'Sunday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Trust',
    hook: 'We will never fake a review for you.',
    caption:
      'Some tools promise fast reviews by breaking Google\'s rules. Neerzy does not. We ask every customer, the honest way, right after the job - real people, real reviews, no shortcuts. Your reputation is worth more than that.',
    tags: H + ' #TrustAndSafety #GoogleCompliant #HonestBusiness #LocalSEO',
    cta: 'Read how we keep it fair - link in bio.',
    visual: 'Simple checkmark graphic: "Real reviews. Real customers. Every time."',
    time: '10:00 AM',
  },
  {
    day: 8,
    date: 'Oct 05, 2026',
    weekday: 'Monday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Feature Spotlight',
    hook: 'Your job photo, turned into a Google post',
    caption:
      'Take a photo of the job you just finished. Send it to Neerzy. In under a minute you have a Google post ready to publish - helping new customers find you while the job is still fresh. That same photo also keeps your website looking alive.',
    tags: H + ' #GooglePosts #LocalSEO #TradesLife',
    cta: 'Try it free with your next job - link in bio.',
    visual:
      'Before/after job photo, then a quick screen capture of the ready-to-post Google update.',
    time: '8:30 AM',
  },
  {
    day: 9,
    date: 'Oct 06, 2026',
    weekday: 'Tuesday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Pain Point',
    hook: 'Your best work is invisible if nobody sees it online.',
    caption:
      'You did an amazing job today. But if your Google page has not been touched in months, new customers scroll right past you. It is not your fault - you are busy working, not marketing. Neerzy gives you the words, ready to post, the same day.',
    tags: H + ' #LocalSEO #GoogleBusinessProfile #TradesBusiness',
    cta: 'Stop being invisible online - link in bio.',
    visual:
      'Split-screen: "Quiet Google page" vs "Active Google page" with visibility icons.',
    time: '12:00 PM',
  },
  {
    day: 10,
    date: 'Oct 07, 2026',
    weekday: 'Wednesday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Free Tool',
    hook: 'Free tool: check your Google Business score in 30 seconds',
    caption:
      'Type your business name into our free Google Score tool and get a score out of 100 in about 30 seconds. You also see the four things we grade: how complete your profile is, your reviews, how active you are, and the quality of your photos. Then you get the exact fixes to make. No signup, no cost - just answers.',
    tags: H + ' #GoogleBusinessProfile #FreeTool #LocalSEO #SmallBusinessTips',
    cta: 'Check your score free - link in bio.',
    visual:
      'Screen recording of typing a business name into the audit tool, the score circle appearing, then the four sub-scores.',
    time: '9:30 AM',
  },
  {
    day: 11,
    date: 'Oct 08, 2026',
    weekday: 'Thursday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Education / Tip',
    hook: 'Why photos matter more than you think',
    caption:
      'Google shows customers your photos before they read a word about you. A page with 5 old photos looks closed. A page with fresh, regular photos looks busy and trusted. It is also one of the four things our free score tool grades - photos count, every single time.',
    tags: H + ' #GoogleBusinessProfile #LocalSEOTips #TradesBusiness #Photography',
    cta: 'Let Neerzy turn your job photos into posts - link in bio.',
    visual:
      'Side-by-side: sparse Google profile vs photo-rich one, checkmark on the rich one.',
    time: '6:00 PM',
  },
  {
    day: 12,
    date: 'Oct 09, 2026',
    weekday: 'Friday',
    platform: 'FB & IG',
    format: 'Carousel Post (5 slides)',
    pillar: 'New Feature',
    hook: 'Your website now stays in sync with your Google profile',
    caption:
      'Slide 1: Search your business name. Slide 2: Your site preview builds itself from your live Google profile - real name, address, hours, photos and reviews. Slide 3: Building and previewing are free, and changes sync as your profile changes. Slide 4: Pick from templates built for your trade, with domain endings made for it. Slide 5: Publish on your own domain, $19 once, registered in your name - first 90 days of hosting free. It is your site, not a rented page.',
    tags: H + ' #WebsiteBuilder #SmallBusinessWebsite #GoogleBusinessProfile #OwnYourBusiness',
    cta: 'Preview your free website - link in bio.',
    visual:
      '5 clean slides walking through search, live preview, sync, template, publish - matching the website builder UI.',
    time: '10:30 AM',
  },
  {
    day: 13,
    date: 'Oct 10, 2026',
    weekday: 'Saturday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Brand Story',
    hook: 'Why we built Neerzy',
    caption:
      'We watched hardworking traders lose customers to bigger companies - not because their work was worse, but because their Google page was quiet. Neerzy exists so skilled traders can compete fairly, without hiring an agency and without learning new software.',
    tags: H + ' #MissionDriven #SmallBusinessSupport #FairCompetition',
    cta: 'Join traders growing with Neerzy - link in bio.',
    visual:
      'Founder-style voiceover or text over b-roll of tradespeople at work, warm tone, green palette.',
    time: '7:30 PM',
  },
  {
    day: 14,
    date: 'Oct 11, 2026',
    weekday: 'Sunday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Engagement',
    hook: 'What eats up most of your time after a job?',
    caption:
      'A) Posting online  B) Chasing reviews  C) Updating the website  D) All of it! Tell us in the comments - we built Neerzy to fix exactly this.',
    tags: H + ' #SmallBusinessOwner #TradesLife #Poll',
    cta: 'Vote in the comments.',
    visual: 'Simple 4-option poll graphic in brand colors.',
    time: '1:00 PM',
  },
  {
    day: 15,
    date: 'Oct 12, 2026',
    weekday: 'Monday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'New Feature',
    hook: 'Your trade in the web address. Yours to keep.',
    caption:
      'A website you actually own, starting with the name. Your domain is $19 once, registered in your name, with first-year hosting free for the first 90 days. Pick an ending that says what you do - plumbing, electrical, roofing and more - so the link itself tells customers they are in the right place. No setup fee. Nothing hidden. Nothing you do not own.',
    tags: H + ' #OwnYourBusiness #SmallBusinessWebsite #Domains #LocalSEO',
    cta: 'See domains made for your trade - link in bio.',
    visual:
      'Bold text graphic showing example domain endings for plumbers, electricians and roofers, with a padlock "registered in your name" badge.',
    time: '9:00 AM',
  },
  {
    day: 16,
    date: 'Oct 13, 2026',
    weekday: 'Tuesday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Education / Tip',
    hook: 'What even IS a Google Business Profile?',
    caption:
      'It is the box that pops up on Google Maps with your name, hours, phone number, photos and reviews. It is often the FIRST thing a customer sees about you - before your website, before anything. Our free score tool grades four parts of it: profile completeness, reviews, activity, and photos. Check yours free.',
    tags: H + ' #GoogleBusinessProfile #LocalSEOExplained #GoogleMaps',
    cta: 'Check yours free with our Google Score tool - link in bio.',
    visual:
      'Screen capture of a Google Maps result, arrows pointing to name, photos and reviews, then the 4-score breakdown.',
    time: '11:30 AM',
  },
  {
    day: 17,
    date: 'Oct 14, 2026',
    weekday: 'Wednesday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Social Proof Style',
    hook: 'A day in the life of a trader using Neerzy',
    caption:
      '7am: Fix a leaking pipe. 11am: Send one job photo. 11:01am: Google, Facebook and Instagram posts are written and ready - one tap each to publish, the review request is already sent, and your website has the new job on it. 5pm: Home for dinner, no laptop needed.',
    tags: H + ' #DayInTheLife #Plumber #TradesLife #WhatsAppBusiness',
    cta: 'Make your day this simple - link in bio.',
    visual:
      'Timeline-style graphic with the 4 timestamps and matching icons.',
    time: '4:00 PM',
  },
  {
    day: 18,
    date: 'Oct 15, 2026',
    weekday: 'Thursday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Offer',
    hook: 'Your first 30 days: 5 posts + 5 review requests, free',
    caption:
      'Try Neerzy risk-free. Send your first job photos and get ready-to-post Google, Facebook and Instagram updates plus review requests - free for your first 30 days, no card needed. You can build and preview your website free too. See the difference before you decide anything.',
    tags: H + ' #FreeTrial #SmallBusinessOffer #WhatsAppBusiness',
    cta: 'Start your 30 free days - link in bio.',
    visual:
      'Bright reel: 30 DAYS FREE animation with a gift-box icon opening to the Neerzy logo.',
    time: '6:00 PM',
  },
  {
    day: 19,
    date: 'Oct 16, 2026',
    weekday: 'Friday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'New Feature',
    hook: 'Written for your trade, not for "businesses"',
    caption:
      'Plumber, electrician, roofer, locksmith, HVAC - there is a page and a free guide written for exactly what you do, in words that sound like you. And if you work across a service area instead of one address, that is supported too: search your business the way customers see it and we will pick it up. Marketing advice that finally speaks your language.',
    tags: H + ' #Plumber #Electrician #Roofer #Locksmith #HVAC #ServiceAreaBusiness',
    cta: 'Find your trade guide - link in bio.',
    visual:
      'Grid of trade icons with a "your trade, your words" headline, plus a small service-area map graphic.',
    time: '8:00 AM',
  },
  {
    day: 20,
    date: 'Oct 17, 2026',
    weekday: 'Saturday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Fun / Relatable',
    hook: 'Before Neerzy vs. after Neerzy',
    caption:
      'Before: Google page untouched since 2023, 3 reviews, stressed owner. After: fresh posts every week, reviews rolling in, website in sync, owner relaxing with coffee. Same business. Same skill. Just less stress.',
    tags: H + ' #BeforeAndAfter #SmallBusinessOwner #Relatable',
    cta: 'Make the switch - link in bio.',
    visual:
      'Split-screen comedic transition: messy desk and stressed face to relaxed coffee scene, quick cuts, trending audio.',
    time: '5:30 PM',
  },
  {
    day: 21,
    date: 'Oct 18, 2026',
    weekday: 'Sunday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Trust',
    hook: 'Built with trust in mind, not shortcuts',
    caption:
      'Everything Neerzy writes follows Google\'s rules. No fake reviews. No spam. No tricks - every review request goes to every customer, not just the happy-looking ones. Just real content from your real jobs, published the right way.',
    tags: H + ' #GoogleCompliant #HonestMarketing #TrustAndSafety',
    cta: 'Learn how we keep it fair - link in bio.',
    visual:
      'Checklist graphic: Google-compliant, you control every post, no fake reviews, you own your data.',
    time: '10:00 AM',
  },
  {
    day: 22,
    date: 'Oct 19, 2026',
    weekday: 'Monday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Free Tool',
    hook: 'Would your Google page pass this test?',
    caption:
      'We check 4 things: how complete your profile is, your reviews, how active you are, and your photos. Type your business name into our free Google Score tool and get your score in about 30 seconds, with the fixes ranked for you. Most traders are surprised by their number.',
    tags: H + ' #GoogleBusinessProfile #FreeAuditTool #LocalSEO',
    cta: 'Get your free score now - link in bio.',
    visual:
      'Screen-record the tool: search a real business, reveal the score circle (e.g. 66/100) then the 4 sub-scores.',
    time: '9:00 AM',
  },
  {
    day: 23,
    date: 'Oct 20, 2026',
    weekday: 'Tuesday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Education / Tip',
    hook: 'What does "review response rate" mean?',
    caption:
      'It just means: how many happy customers actually leave a review after the job. A low number means happy customers are being forgotten. A high number means more trust, more calls, more work. Neerzy sends the ask the moment you are done - you just have to reply DONE.',
    tags: H + ' #CustomerReviews #LocalSEOExplained #SmallBusinessTips',
    cta: 'Boost your review response rate - link in bio.',
    visual:
      'Bar-graph graphic: "low response rate" vs "high response rate" with a star icon.',
    time: '12:30 PM',
  },
  {
    day: 24,
    date: 'Oct 21, 2026',
    weekday: 'Wednesday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'New Feature',
    hook: 'Do not use WhatsApp? You can still use Neerzy.',
    caption:
      'Sign up with email or Google and the business is yours - no WhatsApp needed. Send jobs from the quick-post link instead, and review requests can go out by SMS or by a plain link your customer just taps. Same result, your choice of tools. Nobody should have to learn new software to get found.',
    tags: H + ' #NoWhatsAppNeeded #SmallBusinessTools #SMSMarketing #LocalSEO',
    cta: 'Pick the way that suits you - link in bio.',
    visual:
      'Three-way graphic: WhatsApp icon, SMS icon and link icon, all pointing to the Neerzy logo, with "no WhatsApp required" headline.',
    time: '11:00 AM',
  },
  {
    day: 25,
    date: 'Oct 22, 2026',
    weekday: 'Thursday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Engagement',
    hook: 'Be honest: when did you last check your Google page?',
    caption:
      'A) Today  B) This week  C) This month  D) Honestly... I cannot remember. Drop your answer below. No shame - that is exactly the gap Neerzy was built to close.',
    tags: H + ' #HonestQuestion #LocalSEO #SmallBusinessOwner',
    cta: 'Comment your answer below.',
    visual: 'Playful 4-option graphic with a calendar icon.',
    time: '2:00 PM',
  },
  {
    day: 26,
    date: 'Oct 23, 2026',
    weekday: 'Friday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Feature Spotlight',
    hook: 'No apps. No dashboards. No tech skills. Really.',
    caption:
      'You do not have to learn new software to grow online. If you can send a message, you already know how to use Neerzy. Prefer no WhatsApp at all? Sign in with email or Google, post from the quick-post link, and send review asks by SMS or link. That is the whole point - marketing that fits into your day.',
    tags: H + ' #NoTechSkillsNeeded #SmallBusinessTools #TradesLife',
    cta: 'It really is this simple - link in bio.',
    visual:
      'Tradesperson typing a message on their regular phone, everyday setting, then the SMS and link options shown.',
    time: '8:00 AM',
  },
  {
    day: 27,
    date: 'Oct 24, 2026',
    weekday: 'Saturday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Feature Spotlight',
    hook: 'Search your business. See your website. Free.',
    caption:
      'Type your business name into Neerzy and watch your website build itself from your real Google profile - your name, address, hours, photos and reviews, already filled in. It stays in sync as your profile changes, and it is just a preview until you publish it on your own domain. Try it on your own business.',
    tags: H + ' #WebsiteBuilder #GoogleBusinessProfile #SmallBusinessWebsite',
    cta: 'Try the free preview - link in bio.',
    visual:
      'Screen recording: typing a business name, selecting it, watching the site preview populate live, then the sync badge.',
    time: '6:30 PM',
  },
  {
    day: 28,
    date: 'Oct 25, 2026',
    weekday: 'Sunday',
    platform: 'IG (Reel)',
    format: 'Reel',
    pillar: 'Education / Tip',
    hook: 'The 5-minute window that gets you more reviews',
    caption:
      'Right after you finish a job, your customer is at their happiest. That is the best 5 minutes to ask for a review - not next week, not "later". Reply DONE in Neerzy and that window gets caught every single time, on WhatsApp, by SMS, or by link.',
    tags: H + ' #CustomerReviews #LocalSEOTips #GoogleReviews',
    cta: 'Never miss the window again - link in bio.',
    visual:
      'Countdown graphic: clock ticking from 5 minutes next to a happy customer icon, then a star pops up.',
    time: '6:30 PM',
  },
  {
    day: 29,
    date: 'Oct 26, 2026',
    weekday: 'Monday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Trust',
    hook: 'What happens after your first 30 days?',
    caption:
      'Your first 30 days include 5 posts and 5 review requests, free. After that, posting and review requests pause until you choose a plan - but nothing you built disappears. Your website stays online, your audit score stays saved, and picking back up takes one tap. Plans start at $39/month.',
    tags: H + ' #Transparency #SmallBusinessOwner #NoSurprises',
    cta: 'See our plans - link in bio.',
    visual:
      'Simple, calm graphic: a paused icon next to "your work is saved, not deleted" text.',
    time: '11:00 AM',
  },
  {
    day: 30,
    date: 'Oct 27, 2026',
    weekday: 'Tuesday',
    platform: 'FB & IG',
    format: 'Feed Post',
    pillar: 'Big CTA',
    hook: 'Your next completed job could bring your next customer',
    caption:
      'You have seen how it works: one job photo becomes a ready-to-post Google, Facebook and Instagram update, a review request, and a fresh line on your website. Your first 30 days are free - 5 posts, 5 review requests, no card. Send your next job photo and try it.',
    tags: H + ' #StartToday #SmallBusinessGrowth #WhatsAppBusiness',
    cta: 'Start free - link in bio, today.',
    visual:
      'Bold closing graphic matching the homepage banner, green gradient background, CTA button.',
    time: '9:00 AM',
  },
];
