export const ROUTES = {
  PILLAR: '/seo-for-plumbers',
  AUDIT_TOOL: '/gmb-audit-tool',
  UNDERSTANDING_SCORE: '/understanding-your-gbp-audit-score',
  IMPROVE_SCORE: '/improve-your-audit-score',
  GUIDES: {
    COMPLETENESS: '/completeness-score-guide',
    REVIEWS: '/reviews-score-guide',
    VISUAL: '/visual-content-score-guide',
    ENGAGEMENT: '/engagement-score-guide',
    LOCAL_SEO: '/local-seo-optimization-score-guide',
  },
};

/**
 * Canonical origin. MUST stay on the `www` host: every page that hardcodes its
 * canonical (/, /pricing, /terms ...) uses https://www.neerzy.com, and the
 * apex host answers with a redirect to it. A canonical pointing at a
 * redirecting URL is a contradiction, and it is what put
 * https://neerzy.com/... in Google Search Console's "Page with redirect"
 * bucket. Pages built from SITE_URL (blog + all guide routes) inherit the
 * wrong host if this ever drifts back to the apex.
 */
export const SITE_URL = 'https://www.neerzy.com';

/**
 * True for paths that belong to a TRADER'S own website rather than the Neerzy
 * marketing site: `/site` (their live site on their own domain), `/site/preview/*`
 * and `/site/blog`. Those pages must render with NO Neerzy chrome — header,
 * footer and support chat are marketing furniture and would leak our branding,
 * navigation and Organization schema into a customer's domain.
 *
 * `/site/templates` is deliberately NOT matched: the template gallery is a
 * Neerzy marketing page.
 */
export function isTraderSitePath(pathname?: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/site' ||
    pathname.startsWith('/site/preview') ||
    pathname.startsWith('/site/blog')
  );
}
