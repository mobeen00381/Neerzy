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
    <footer style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <img src="/images/logo.svg" alt="Neerzy Logo" className="h-16 w-auto object-contain" />
            <p style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)' }}>
              Take a photo after every job. Neerzy prepares a Google post, website update, and review request — ready to publish in a few taps.
            </p>
            <p style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: 'var(--space-2)' }}>
              <a href="tel:+18338872999" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                <WhatsAppIcon size={16} className="text-[#22C55E]" /> Toll Free: +1 (833) 887-2999
              </a>
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-body-size)' }}>Product</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)' }}>
              <li><Link href="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Features</Link></li>
              <li><Link href="/pricing" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Pricing</Link></li>
              <li><Link href="/gmb-audit-tool" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>GMB Audit Tool</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-body-size)' }}>Company</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)' }}>
              <li><Link href="/about" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>About Us</Link></li>
              <li><Link href="/contact" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-body-size)' }}>Legal</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)' }}>
              <li><Link href="/privacy-policy" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Terms of Service</Link></li>
              <li><Link href="/cookies" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--color-border)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p style={{ fontSize: 'var(--text-small-size)', color: 'var(--color-text-secondary)' }}>
              © {new Date().getFullYear()} Neerzy. All rights reserved.
            </p>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', maxWidth: '400px', textAlign: 'center', lineHeight: 1.3, fontStyle: 'italic' }}>
              Neerzy is an independent platform and is not affiliated with, endorsed by, or a partner of Google or WhatsApp. Google Business Profile and WhatsApp are trademarks of their respective owners.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
