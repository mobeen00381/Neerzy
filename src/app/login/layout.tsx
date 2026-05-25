import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In | Neerzy",
  description: "Log in to your Neerzy account to access your local business marketing dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
