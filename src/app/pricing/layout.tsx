import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Neerzy",
  description: "Simple marketing for busy local businesses. Choose the right Neerzy plan to grow your business using just WhatsApp.",
  alternates: {
    canonical: 'https://www.neerzy.com/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
