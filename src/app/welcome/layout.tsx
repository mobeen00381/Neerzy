import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to Neerzy!",
  description: "You're almost ready. Connect your Google Business Profile and install the Neerzy app to get started.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
