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

export const SITE_URL = 'https://neerzy.com';

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
