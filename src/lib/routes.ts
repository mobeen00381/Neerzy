export const ROUTES = {
  PILLAR: '/seo-for-plumbers',
  AUDIT_TOOL: '/gmb-audit-tool',
  WEBSITE_BUILDER: '/website-builder',
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
 * The "Powered by Neerzy" credit shown in the footer of every trader website
 * (live domains, previews and the demo template pages).
 *
 * It deliberately points at the FREE WEBSITE PREVIEW flow rather than the
 * homepage: the only people who read a plumber's footer and click "Neerzy" are
 * other local business owners — exactly the visitor who should be typing their
 * own business name into the builder. The UTM tags let the funnel attribute
 * signups that arrived from a customer's site.
 *
 * Single source of truth so TradeSiteTemplate (current layout) and SiteRenderer
 * (legacy layout) can never drift apart.
 */
export const POWERED_BY_URL = `${SITE_URL}${ROUTES.WEBSITE_BUILDER}?utm_source=customer-site&utm_medium=footer&utm_campaign=powered-by-neerzy`;

/**
 * True for paths that belong to a TRADER'S own website rather than the Neerzy
 * marketing site: `/site` (their live site on their own domain), `/site/preview/*`
 * and `/site/blog`. Those pages must render with NO Neerzy chrome — header,
 * footer and support chat are marketing furniture and would leak our branding,
 * navigation and Organization schema into a customer's domain.
 *
 * `/site/templates` itself (the gallery) is deliberately NOT matched - it is a
 * Neerzy marketing page. The individual demo pages /site/templates/<trade> DO
 * render the full trader site with its own header/footer, so Header and Footer
 * additionally hide on them via isTemplateDemoPath().
 */
export function isTraderSitePath(pathname?: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/site' ||
    pathname.startsWith('/site/preview') ||
    pathname.startsWith('/site/blog')
  );
}

/**
 * True for the shareable template demo pages /site/templates/<trade> (all ten
 * trades). They render the full TradeSiteTemplate with the trader's own header
 * and footer, so the Neerzy marketing header/footer must NOT stack on top of
 * them (that produced a double header and a double footer). The gallery index
 * /site/templates itself is still a Neerzy marketing page and keeps the chrome.
 */
export function isTemplateDemoPath(pathname?: string | null): boolean {
  if (!pathname) return false;
  return /^\/site\/templates\/[^/]+/i.test(pathname);
}
