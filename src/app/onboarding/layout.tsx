import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connect Your Business | Neerzy",
  description: "Set up your Google Business Profile connection to start automating your local marketing with Neerzy.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
