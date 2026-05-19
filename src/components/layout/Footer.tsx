"use client";

import Link from "next/link";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const hideFooter = pathname?.startsWith('/dashboard') || 
                     pathname?.startsWith('/onboarding') || 
                     pathname?.startsWith('/welcome') || 
                     pathname?.startsWith('/login') || 
                     pathname?.startsWith('/signup') ||
                     pathname?.startsWith('/checkout');

  if (hideFooter) return null;
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <img src="/images/logo.svg" alt="Neerzy Logo" className="h-16 w-auto object-contain" />
            <p className="text-sm text-slate-500">
              Done-for-you SEO websites and Google Business management for local service businesses.
            </p>
            <p className="text-sm text-slate-500 font-medium mt-2">
              <a href="tel:+18338872999" className="hover:text-blue-500 transition-colors flex items-center gap-1.5">
                <WhatsAppIcon size={16} className="text-[#25D366]" /> Toll Free: +1 (833) 887-2999
              </a>
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-blue-500 transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-500 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/about" className="hover:text-blue-500 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-500 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/privacy-policy" className="hover:text-[#0F5C4D] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#0F5C4D] transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-[#0F5C4D] transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Neerzy. All rights reserved.
            </p>
            <div className="text-[10px] text-slate-400 max-w-md text-center sm:text-right leading-tight italic">
              Neerzy is an independent platform and is not affiliated with, endorsed by, or a partner of Google or WhatsApp. Google Business Profile and WhatsApp are trademarks of their respective owners.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
