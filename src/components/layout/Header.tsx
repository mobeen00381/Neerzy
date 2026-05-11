import Link from "next/link";
import { Button } from "../ui/Button";
import { ThemeToggle } from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-500 rounded-lg p-1.5 shadow-sm">
              <span className="text-white font-black text-xl leading-none block">S</span>
            </div>
            <span className="inline-block font-bold text-xl text-slate-900 dark:text-white tracking-tight">Neerzy</span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link
              href="/"
              className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:inline-block">
            <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-blue-500 font-medium">Log in</Button>
          </Link>
          <Link href="/onboarding">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-all font-medium">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
