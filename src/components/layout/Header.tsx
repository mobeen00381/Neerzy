import Link from "next/link";
import { Button } from "../ui/Button";
import { ThemeToggle } from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#075E54] backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="Neerzy Logo" className="h-10 w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link
              href="/#features"
              className="flex items-center text-sm font-medium text-white/80 hover:text-[#25D366] transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="flex items-center text-sm font-medium text-white/80 hover:text-[#25D366] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/gmb-audit-tool"
              className="flex items-center text-sm font-medium text-white/80 hover:text-[#25D366] transition-colors"
            >
              GMB Checker
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="hidden sm:inline-block">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 font-medium">Log in</Button>
          </Link>
          <Link href="/pricing#plans">
            <Button className="bg-[#25D366] hover:bg-[#1da851] text-black shadow-md transition-all font-medium border-none rounded-full px-6">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
