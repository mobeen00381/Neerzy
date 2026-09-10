import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Custom-domain router (Next.js 16 "proxy" convention).
 *
 * Neerzy hosts every trader website inside this same Next.js app. When a
 * request arrives on a trader's own domain (e.g. austinplumbing.com) we
 * rewrite it to the /site implementation, which resolves the domain in
 * Supabase and renders that trader's website.
 *
 * Requests for Neerzy's own hostnames (neerzy.com, www, vercel previews,
 * localhost) are untouched, so the normal app keeps working.
 */

const APP_HOSTS = new Set([
  "neerzy.com",
  "www.neerzy.com",
  "localhost",
  "127.0.0.1",
]);

function isAppHost(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  if (APP_HOSTS.has(h)) return true;
  if (h.endsWith(".vercel.app")) return true; // previews + dashboard
  if (h.endsWith(".neerzy.com")) return true; // future *.neerzy.com previews
  return false;
}

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const { pathname } = req.nextUrl;

  // Only rewrite real customer-domain traffic.
  if (isAppHost(host)) return NextResponse.next();

  const url = req.nextUrl.clone();

  // SEO files for the trader's domain → served by the /site routes.
  if (pathname === "/sitemap.xml") {
    url.pathname = "/site/sitemap.xml";
    return NextResponse.rewrite(url);
  }
  if (pathname === "/robots.txt") {
    url.pathname = "/site/robots.txt";
    return NextResponse.rewrite(url);
  }

  // Internal paths (API calls from the site, Next internals, assets) stay as-is.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/site") ||
    /\.[a-zA-Z0-9]+$/.test(pathname) // files: /favicon.ico, /logo.png ...
  ) {
    return NextResponse.next();
  }

  url.pathname = `/site${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
