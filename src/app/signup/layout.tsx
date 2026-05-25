import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Account | Neerzy",
  description: "Sign up for Neerzy and start growing your local business with WhatsApp marketing automation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
