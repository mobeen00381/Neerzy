import type { MetadataRoute } from 'next';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { getAllGuides, type GuideFrontmatter } from '@/lib/mdx';
import { SITE_URL } from '@/lib/routes';

/**
 * Main-site sitemap, generated at build time. This file replaces the old
 * static public/sitemap.xml so the sitemap can no longer drift from the pages
 * that actually exist — every guide in content/guides is included
 * automatically, with no edit needed here.
 *
 * Two rules, carried over from that static file:
 * 1. Never list a URL that redirects. /gmb-checker 301s to /gmb-audit-tool,
 *    and Google reports redirecting sitemap entries as errors instead of
 *    recrawling the real page. Nothing listed below is a redirect source.
 * 2. lastmod must be the day the page actually changed, never a blanket
 *    "bump everything" date. A sitemap that cries wolf gets its dates ignored.
 *
 * /gmb-audit-tool carries lastmod 2026-09-15 on purpose: that is when its
 * hardcoded AggregateRating ("4.9 from 127 reviews") was replaced with schema
 * that only emits once real reviews are published. The fresh date is what
 * nudges the recrawler to drop the stale star snippet from the SERP.
 *
 * Every loc is built from SITE_URL (https://www.neerzy.com), so an apex or
 * http:// URL cannot be emitted by construction.
 */

type Entry = MetadataRoute.Sitemap[number];

/** Hand-maintained marketing pages. Dates mirror the previous static file. */
const STATIC_PAGES: Entry[] = [
  { url: `${SITE_URL}/`, lastModified: '2026-09-16', changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/gmb-audit-tool`, lastModified: '2026-09-15', changeFrequency: 'weekly', priority: 0.9 },
  { url: `${SITE_URL}/pricing`, lastModified: '2026-09-11', changeFrequency: 'monthly', priority: 0.8 },
  { url: `${SITE_URL}/blog`, lastModified: '2026-09-02', changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/contact`, lastModified: '2026-09-02', changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/about`, lastModified: '2026-07-19', changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/terms`, lastModified: '2026-05-26', changeFrequency: 'yearly', priority: 0.5 },
  { url: `${SITE_URL}/privacy-policy`, lastModified: '2026-05-26', changeFrequency: 'yearly', priority: 0.5 },
  { url: `${SITE_URL}/cookies`, lastModified: '2026-05-26', changeFrequency: 'yearly', priority: 0.3 },
  // Website builder cluster, added 2026-09-25 together with its ten trade pages.
  { url: `${SITE_URL}/website-builder`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.9 },
  { url: `${SITE_URL}/website-builder/plumber`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/electrician`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/hvac`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/roofing`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/handyman`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/dentist`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/grocery`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/hardware`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/mechanic`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/website-builder/local-services`, lastModified: '2026-09-25', changeFrequency: 'monthly', priority: 0.7 },
];

/**
 * lastmod for a guide. `dateModified` is the guide's own "last edited" field
 * and matches the "day the page actually changed" rule; `date` is the
 * publication date and the fallback. If a guide ever ships without either, we
 * fall back to the file's last git commit date rather than inventing "today".
 */
function guideLastModified(slug: string, frontmatter: GuideFrontmatter): string | undefined {
  const declared = frontmatter.dateModified ?? frontmatter.date;
  if (declared) return String(declared).slice(0, 10);

  try {
    const file = path.join(process.cwd(), 'content', 'guides', `${slug}.mdx`);
    const committed = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      encoding: 'utf-8',
    }).trim();
    return committed || undefined;
  } catch {
    // No git metadata (e.g. a tarball build): omit lastmod instead of guessing.
    return undefined;
  }
}

/** Guide (blog/SEO article) pages, generated from content/guides/*.mdx. */
function guideEntries(): Entry[] {
  return getAllGuides().map(({ slug, frontmatter }) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: guideLastModified(slug, frontmatter),
    changeFrequency: 'monthly' as const,
    priority: frontmatter.guideType === 'pillar' ? 0.8 : 0.7,
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [...STATIC_PAGES, ...guideEntries()];

  // Structural guarantee: a duplicate loc is a sitemap error, so fail the
  // build loudly instead of shipping one.
  const seen = new Set<string>();
  for (const { url } of entries) {
    if (seen.has(url)) throw new Error(`Duplicate sitemap URL: ${url}`);
    seen.add(url);
  }

  return entries;
}
