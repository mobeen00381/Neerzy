import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Neerzy",
  description: "Learn how Neerzy helps local traders grow their business online without complex software. Mission-driven marketing for plumbers, electricians, and HVAC.",
  alternates: {
    canonical: 'https://www.neerzy.com/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
