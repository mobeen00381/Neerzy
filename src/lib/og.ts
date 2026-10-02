// Shared Open Graph / Twitter card image for Neerzy marketing pages.
// Relative URL on purpose: the root layout sets `metadataBase`
// (https://www.neerzy.com), which Next resolves into absolute og:image URLs.

export const DEFAULT_OG_IMAGE = {
  url: "/og-images/neerzy-main.jpg",
  width: 1200,
  height: 630,
  alt: "Neerzy | Turn Every Job into More Calls via WhatsApp",
} as const;
