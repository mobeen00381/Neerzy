import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '..', 'content', 'guides');

// Correct metadata from the original page.tsx files (read during investigation)
const patches = {
  'completeness-score-guide.mdx': {
    title: "How to Improve Your Google Business Profile Completeness Score | Neerzy",
    meta_description: "Completeness makes up 25% of your Google Business Profile audit score — and it's the fastest category to fix. Here's exactly what's checked and how to raise it today.",
  },
  'reviews-score-guide.mdx': {
    title: 'How to Improve Your Google Reviews Score: A Complete Guide for Plumbers | Neerzy',
    meta_description: "Reviews & Reputation make up 25% of your Google Business Profile audit score. Here's exactly how it's calculated and how to raise it — with templates, timing, and common mistakes.",
  },
  'visual-content-score-guide.mdx': {
    title: 'How to Improve Your Google Business Profile Visual Content Score | Neerzy',
    meta_description: "Visual Content makes up 20% of your Google Business Profile audit score. Here's exactly what's checked — photo count, recency, diversity, video — and how to raise it.",
  },
  'engagement-score-guide.mdx': {
    title: 'How to Improve Your Google Business Profile Engagement & Activity Score | Neerzy',
    meta_description: "Engagement & Activity makes up 15% of your Google Business Profile audit score. Here's what's checked — posts, Q&A, review responses — and how to raise it.",
  },
  'local-seo-optimization-score-guide.mdx': {
    title: 'How to Improve Your Google Business Profile Local SEO Optimization Score | Neerzy',
    meta_description: "Local SEO Optimization makes up 15% of your Google Business Profile audit score. Here's what's checked — keywords, categories, service areas, NAP consistency — and how to fix it.",
  },
  'understanding-your-gbp-audit-score.mdx': {
    title: "Understanding Your Google Business Profile Audit Score | Neerzy",
    meta_description: "A complete breakdown of Neerzy's free GBP audit score — what Completeness, Reviews, Visual Content, Engagement, and Local SEO Optimization actually measure, and how to improve each one.",
  },
  'improve-your-audit-score.mdx': {
    title: 'How to Improve Your Overall Google Business Profile Audit Score | Neerzy',
    meta_description: "Got your audit score back? Here's how to figure out what to fix first, how long it takes, and which guide to read next based on your lowest category.",
  },
  'seo-for-plumbers.mdx': {
    title: 'SEO for Plumbers: The Complete 2026 Guide to Rank Higher on Google',
    meta_description: 'The complete guide to SEO for plumbers in 2026 — Google Business Profile, Google Maps, reviews, website SEO, and AI search. Free GBP audit tool included.',
  },
  'seo-for-electricians.mdx': {
    title: 'SEO for Electricians: The Complete 2026 Guide to Rank Higher on Google, Google Maps & AI Search',
    meta_description: 'The complete guide to SEO for electricians in 2026 — Google Business Profile, Google Maps, reviews, AI search, and website SEO. Free GBP audit tool included.',
  },
  'locksmith-seo.mdx': {
    title: 'Locksmith SEO: The Complete 2026 Guide to Winning the Local Pack, Google Maps & AI Search',
    meta_description: 'The complete guide to locksmith SEO in 2026 — why "locksmith near me" is a Google Business Profile battle, not a content battle, and exactly how to win it. Free GBP audit included.',
  },
};

function yamlString(value) {
  // If the string contains single quotes, use double-quoted YAML with escapes
  if (value.includes("'")) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return `'${value}'`;
}

for (const [file, patch] of Object.entries(patches)) {
  const filePath = path.join(contentDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`NOT FOUND: ${file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace title line
  content = content.replace(
    /^title:.*$/m,
    `title: ${yamlString(patch.title)}`
  );

  // Replace meta_description line
  content = content.replace(
    /^meta_description:.*$/m,
    `meta_description: ${yamlString(patch.meta_description)}`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`PATCHED: ${file}`);
}

console.log('Done!');