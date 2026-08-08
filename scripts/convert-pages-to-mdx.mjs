/**
 * Converts existing page.tsx files into /content/guides/*.mdx
 * Handles both full pages (seo-for-plumbers, seo-for-electricians, locksmith-seo)
 * and SeoGuideLayout-wrapped pages (completeness-score-guide, etc.)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'src', 'app');
const contentDir = path.join(root, 'content', 'guides');

if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

const routes = [
  { slug: 'seo-for-plumbers', path: 'seo-for-plumbers/page.tsx' },
  { slug: 'seo-for-electricians', path: 'seo-for-electricians/page.tsx' },
  { slug: 'locksmith-seo', path: 'locksmith-seo/page.tsx' },
  { slug: 'completeness-score-guide', path: 'completeness-score-guide/page.tsx' },
  { slug: 'reviews-score-guide', path: 'reviews-score-guide/page.tsx' },
  { slug: 'visual-content-score-guide', path: 'visual-content-score-guide/page.tsx' },
  { slug: 'engagement-score-guide', path: 'engagement-score-guide/page.tsx' },
  { slug: 'local-seo-optimization-score-guide', path: 'local-seo-optimization-score-guide/page.tsx' },
  { slug: 'understanding-your-gbp-audit-score', path: 'understanding-your-gbp-audit-score/page.tsx' },
  { slug: 'improve-your-audit-score', path: 'improve-your-audit-score/page.tsx' },
];

function extractReturnContent(source) {
  // Find the return statement - everything between the last 'return (' and the matching ')'
  const returnMatch = source.match(/return\s*\(\s*$/m);
  if (!returnMatch) return null;
  
  const startIdx = returnMatch.index + returnMatch[0].length;
  
  // Find matching closing paren by counting
  let depth = 1;
  let endIdx = startIdx;
  for (let i = startIdx; i < source.length; i++) {
    if (source[i] === '(') depth++;
    if (source[i] === ')') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  
  if (endIdx === startIdx) {
    // Fallback: try to find the end of the function
    endIdx = source.length - 1;
  }
  
  return source.substring(startIdx, endIdx).trim();
}

function extractBodyFromFragment(source) {
  // source is the return content which starts with <> and ends with </>
  // Strip outer <> and </> if present
  let body = source.trim();
  
  // Remove leading <> or <React.Fragment> and trailing </> or </React.Fragment>
  body = body.replace(/^<>|^<React\.Fragment>/g, '');
  body = body.replace(/<\/>|<\/React\.Fragment>$/g, '');
  body = body.trim();
  
  return body;
}

function jsxToMdx(jsx) {
  let mdx = jsx;
  
  // Replace HTML entities that MDX handles differently
  mdx = mdx.replace(/'/g, "'");
  mdx = mdx.replace(/&/g, "&");
  mdx = mdx.replace(/"/g, '"');
  mdx = mdx.replace(/</g, '<');
  mdx = mdx.replace(/>/g, '>');
  
  // Replace Next.js Link with MDX-friendly a tags (our custom component will handle these)
  // Keep <Link> tags - they're handled by the custom components map
  
  // Replace JSX comments with MDX comments
  mdx = mdx.replace(/\{\/\*\s*─+\s*([^*]+)\s*─+\s*\*\/\}/g, '{/* $1 */}');
  
  return mdx.trim();
}

function extractMetadata(source) {
  // Extract title and description from metadata
  const titleMatch = source.match(/title:\s*['"]([^'"]+)['"]/);
  const descMatch = source.match(/description:\s*['"]([^'"]+)['"]/);
  const dateMatch = source.match(/datePublished:\s*['"]([^'"]+)['"]/);
  
  return {
    title: titleMatch ? titleMatch[1] : '',
    meta_description: descMatch ? descMatch[1] : '',
    date: dateMatch ? dateMatch[1] : '2026-07-13',
  };
}

function getPageMetadata(slug) {
  const meta = {
    'seo-for-plumbers': {
      category: 'Local SEO',
      readTime: '35 min read',
      featured: true,
      guideType: 'pillar',
      breadcrumbName: 'SEO for Plumbers',
      schemaArticle: 'SEO for Plumbers: The Complete 2026 Guide to Rank Higher on Google, Google Maps & AI Search',
      schemaFaq: [
        { q: 'What is SEO for plumbers?', a: "SEO for plumbers is the process of improving a plumbing company's visibility in Google Search, Google Maps, and AI search tools so that more local customers find and call the business." },
        { q: 'How long does plumbing SEO take to work?', a: 'Google Business Profile improvements (photos, posts, reviews) can show impact within a few weeks. Website and content-based SEO typically takes 3–6 months to show significant ranking movement.' },
        { q: 'What is the single highest-impact SEO action for a plumber?', a: 'Completing and actively maintaining your Google Business Profile — it typically has a larger, faster impact than any single website change.' },
        { q: 'How much does plumbing SEO cost?', a: 'Agency-managed plumbing SEO commonly ranges from a few hundred to several thousand dollars per month. Automated tools like Neerzy offer a lower-cost alternative starting free.' },
      ],
    },
    'seo-for-electricians': {
      category: 'Local SEO',
      readTime: '22 min read',
      featured: false,
      guideType: 'pillar',
      breadcrumbName: 'SEO for Electricians',
      schemaArticle: 'SEO for Electricians: The Complete 2026 Guide to Rank Higher on Google, Google Maps & AI Search',
      schemaFaq: [
        { q: 'What is SEO for electricians?', a: "SEO for electricians is the process of improving an electrical contracting business's visibility in Google Search, Google Maps, and AI search tools so more local customers find and call the business." },
        { q: 'How is electrician SEO different from plumbing SEO?', a: 'The core mechanics — Google Business Profile, reviews, local citations — are identical. The main difference is search intent split: electrical work divides more evenly between true emergencies and planned projects researched over days, requiring both fast emergency pages and more detailed planned-project content.' },
        { q: 'What is the single highest-impact SEO action for an electrician?', a: 'Completing and actively maintaining the Google Business Profile — typically a larger, faster impact than any single website change.' },
        { q: 'Does Neerzy work for businesses other than electricians?', a: 'Yes — Neerzy is built broadly for local trades, including plumbers, HVAC companies, roofers, and locksmiths, alongside electricians.' },
      ],
      sources: [
        { id: 1, text: 'Search volume estimate from industry analysis of "electrician near me" query data; treat as directional, not exact.' },
        { id: 2, text: 'As reported via Statista survey data on generative AI search usage; figure reflects 2024 reporting and should be treated as directional given how quickly adoption is shifting.' },
      ],
    },
    'locksmith-seo': {
      category: 'Local SEO',
      readTime: '18 min read',
      featured: false,
      guideType: 'pillar',
      breadcrumbName: 'Locksmith SEO',
      schemaArticle: 'Locksmith SEO: The Complete 2026 Guide to Winning the Local Pack, Google Maps & AI Search',
      schemaFaq: [
        { q: 'Why can\'t I just rank #1 for "locksmith near me"?', a: "Because that search returns different results for every searcher based on their real-time location, resolved primarily through Google's Local Pack rather than a single ranking page. The winnable lever is your own Google Business Profile's Local Pack position in your specific area." },
        { q: 'Is locksmith SEO different from plumber or electrician SEO?', a: 'The core mechanics (Google Business Profile, reviews, citations) are identical. The real difference is intent: locksmith search skews more heavily toward true, seconds-long emergencies, which shifts effort further toward GBP completeness and review speed.' },
        { q: 'What\'s the single highest-impact action for a locksmith?', a: 'Completing and actively maintaining the Google Business Profile — more so here than in almost any other trade, since so much demand is decided by Local Pack prominence rather than website content.' },
        { q: 'What is Neerzy?', a: 'A WhatsApp-based marketing automation platform for local trades — locksmiths, plumbers, electricians, and similar businesses — that turns a job photo into a Google Post, website update, and review request automatically.' },
      ],
      sources: [
        { id: 1, text: 'Search volume estimate from keyword research data; treat as directional. Range reported: 300,000–1,508,000/mo depending on methodology.' },
      ],
    },
    'completeness-score-guide': {
      category: 'GBP Audit',
      readTime: '7 min read',
      featured: false,
      guideType: 'category',
    },
    'reviews-score-guide': {
      category: 'Reviews',
      readTime: '9 min read',
      featured: false,
      guideType: 'category',
    },
    'visual-content-score-guide': {
      category: 'GBP Audit',
      readTime: '6 min read',
      featured: false,
      guideType: 'category',
    },
    'engagement-score-guide': {
      category: 'GBP Audit',
      readTime: '7 min read',
      featured: false,
      guideType: 'category',
    },
    'local-seo-optimization-score-guide': {
      category: 'Local SEO',
      readTime: '8 min read',
      featured: false,
      guideType: 'category',
    },
    'understanding-your-gbp-audit-score': {
      category: 'GBP Audit',
      readTime: '8 min read',
      featured: false,
      guideType: 'category',
    },
    'improve-your-audit-score': {
      category: 'GBP Audit',
      readTime: '10 min read',
      featured: false,
      guideType: 'category',
    },
  };
  return meta[slug] || { category: 'GBP Audit', readTime: '5 min read', featured: false, guideType: 'category' };
}

for (const route of routes) {
  const filePath = path.join(appDir, route.path);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${filePath} not found`);
    continue;
  }
  
  const source = fs.readFileSync(filePath, 'utf-8');
  const meta = extractMetadata(source);
  const pageMeta = getPageMetadata(route.slug);
  
  let bodyMd = '';
  
  if (pageMeta.guideType === 'pillar') {
    // Full page format: extract everything inside <main>...</main>
    const mainMatch = source.match(/<main[^>]*>([\s\S]*)<\/main>/);
    if (mainMatch) {
      let body = mainMatch[1];
      // Remove breadcrumb nav block
      body = body.replace(/<nav[^>]*aria-label="Breadcrumb"[\s\S]*?<\/nav>/g, '');
      // Remove the h1 (we add it from frontmatter)
      body = body.replace(/<h1[^>]*>[\s\S]*?<\/h1>/g, '');
      // Remove the outer <article> wrapper since we handle that in template
      body = body.replace(/<article[^>]*>/g, '');
      body = body.replace(/<\/article>/g, '');
      
      // Process the body - convert to MDX
  body = body.replace(/'/g, "'");
  body = body.replace(/&/g, "&");
  body = body.replace(/"/g, '"');
  body = body.replace(/</g, "<");
  body = body.replace(/>/g, ">");
      bodyMd = body.trim();
    }
  } else {
    // Category guide format: extract everything inside <SeoGuideLayout ...>...</SeoGuideLayout>
    const layoutMatch = source.match(/<SeoGuideLayout[\s\S]*?>([\s\S]*?)<\/SeoGuideLayout>/);
    if (layoutMatch) {
      let body = layoutMatch[1];
      body = body.replace(/'/g, "'");
      body = body.replace(/&/g, "&");
      body = body.replace(/"/g, '"');
      bodyMd = body.trim();
    }
  }
  
  // Build frontmatter
  const frontmatter = {
    title: meta.title || route.slug,
    meta_description: meta.meta_description || '',
    category: pageMeta.category,
    date: meta.date || '2026-07-13',
    readTime: pageMeta.readTime,
    featured: pageMeta.featured || false,
    guideType: pageMeta.guideType,
    breadcrumbName: pageMeta.breadcrumbName || '',
  };
  
  // Add type-specific frontmatter
  if (pageMeta.schemaArticle) frontmatter.schemaArticle = pageMeta.schemaArticle;
  if (pageMeta.schemaFaq) frontmatter.schemaFaq = pageMeta.schemaFaq;
  if (pageMeta.sources) frontmatter.sources = pageMeta.sources;
  
  // Resolve ROUTES/SITE_URL references in body MDX
  const routesMap = {
    'ROUTES.PILLAR': '/seo-for-plumbers',
    'ROUTES.AUDIT_TOOL': '/gmb-audit-tool',
    'ROUTES.UNDERSTANDING_SCORE': '/understanding-your-gbp-audit-score',
    'ROUTES.IMPROVE_SCORE': '/improve-your-audit-score',
    'ROUTES.GUIDES.COMPLETENESS': '/completeness-score-guide',
    'ROUTES.GUIDES.REVIEWS': '/reviews-score-guide',
    'ROUTES.GUIDES.VISUAL': '/visual-content-score-guide',
    'ROUTES.GUIDES.ENGAGEMENT': '/engagement-score-guide',
    'ROUTES.GUIDES.LOCAL_SEO': '/local-seo-optimization-score-guide',
    'SITE_URL': 'https://neerzy.com',
    'PAGE_URL': `https://neerzy.com/${route.slug}`,
  };
  
  for (const [key, value] of Object.entries(routesMap)) {
    // Replace {ROUTES.xxx} and {SITE_URL} expressions
    bodyMd = bodyMd.replace(new RegExp(`\\{${key.replace(/\./g, '\\.')}\\}`, 'g'), `"${value}"`);
  }

  // Build the MDX content with YAML-safe frontmatter
  let mdx = '---\n';
  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value === 'string') {
      // YAML-safe: if the string contains single quotes, use double quotes (with YAML escaping),
      // otherwise use single quotes which need no escaping
      if (value.includes("'")) {
        // Double-quoted YAML: escape backslashes and double quotes
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        mdx += `${key}: "${escaped}"\n`;
      } else {
        // Single-quoted YAML: no escapes needed
        mdx += `${key}: '${value}'\n`;
      }
    } else if (typeof value === 'boolean') {
      mdx += `${key}: ${value}\n`;
    } else if (Array.isArray(value) || typeof value === 'object') {
      mdx += `${key}: ${JSON.stringify(value)}\n`;
    }
  }
  mdx += '---\n\n';
  mdx += bodyMd;
  
  const outputPath = path.join(contentDir, `${route.slug}.mdx`);
  fs.writeFileSync(outputPath, mdx, 'utf-8');
  console.log(`WRITTEN: ${outputPath} (${mdx.length} chars)`);
}

console.log('Done!');