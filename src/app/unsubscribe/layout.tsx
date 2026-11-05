import type { Metadata } from "next";

/**
 * /unsubscribe metadata: noindex on purpose. Every one of these URLs carries a
 * per-recipient signed token, so it must never be crawled, indexed or shared as
 * a search result.
 */
export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop the Neerzy preview and Google profile tips emails.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
