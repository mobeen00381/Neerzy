"use client";

import Link from "next/link";
import { Button } from "../ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const hideHeader = pathname?.startsWith('/dashboard') || 
                     pathname?.startsWith('/onboarding') || 
                     pathname?.startsWith('/login') || 
                     pathname?.startsWith('/signup') ||
                     pathname?.startsWith('/checkout');

  if (hideHeader) return null;

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/gmb-audit-tool", label: "GMB Checker" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B3D2E] backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex gap-6 md:gap-10 items-center">
          <Link href="/" className="flex items-center">
            <img src="/images/logo-white.svg" alt="Neerzy Logo" className="h-12 w-auto object-contain" />
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center text-sm font-medium text-white/80 hover:text-[#22C55E] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-md transition-all font-medium border-none rounded-full px-6">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-block">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 font-medium">Log in</Button>
              </Link>
              <Link href="/pricing#plans">
                <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-md transition-all font-medium border-none rounded-full px-6">Get Started</Button>
              </Link>
            </>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B3D2E] shadow-lg">
          <nav className="container mx-auto px-4 sm:px-6 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-3 px-4 rounded-lg text-sm font-medium text-white/80 hover:text-[#22C55E] hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {/* Mobile-only login link */}
            <Link
              href="/login"
              className="block sm:hidden py-3 px-4 rounded-lg text-sm font-medium text-white/80 hover:text-[#22C55E] hover:bg-white/5 transition-colors"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
