import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GMB Audit Report | Neerzy",
  description: "Your Google Business Profile audit report with health score, optimization gaps, and AI recommendations to improve your local search visibility.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function GmbReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
