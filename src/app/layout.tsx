// Deployment Trigger: 2026-05-11
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlobalChatWrapper } from "@/components/chat/GlobalChatWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import { initMonitoring } from "@/lib/monitoring";

initMonitoring();

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neerzy | Turn Every Job into More Calls via WhatsApp",
  description: "Send a job photo → we create your Google post, update your website, and send a review request instantly.",
  verification: {
    google: "your_verification_code", // Replace with actual code from Search Console
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.paddle.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <Header />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Footer />
            <GlobalChatWrapper />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
