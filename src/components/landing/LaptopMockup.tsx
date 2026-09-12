"use client";

import type { CSSProperties } from "react";
import { MapPinIcon, StarIcon } from "@/components/ui/Icons";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

// ────────────────────────────────────────────────────────────────
// Shared laptop device mockup — the DESKTOP view of the same demo
// website shown in <PhoneMockup>.
//
// design.md §4 "Device mockups": device frames are shared components,
// reusing the same device tokens. The screen renders real product UI
// (nav · image hero with scrim · service strip · review strip) driven by
// the caller's palette, so picking a colour way repaints BOTH devices.
//
// Illustrative example per design.md §10: "Smith Plumbing & Heating",
// Austin TX — one consistent fictional business (decorative markup).
// ────────────────────────────────────────────────────────────────

export interface LaptopMockupProps {
  /** Domain shown in the browser bar. */
  domain?: string;
  /** Trade palette for this look (from TEMPLATE_LOOKS). */
  palette: { primary: string; secondary: string };
  businessName?: string;
  tagline?: string;
  location?: string;
  services?: string[];
  rating?: string;
  heroImage?: string;
  className?: string;
}

export default function LaptopMockup({
  domain = "smithplumbingandheating.com",
  palette,
  businessName = "Smith Plumbing & Heating",
  tagline = "Fast, honest plumbing work — trusted by families across Austin.",
  location = "Austin, TX · 24/7 call-outs",
  services = ["Emergency Repairs", "Water Heaters", "Drain Cleaning"],
  rating = "5.0",
  heroImage = "/images/plumber_job_photo.png",
  className = "",
}: LaptopMockupProps) {
  return (
    <div className={`laptop-stage ${className}`.trim()}>
      <div className="laptop-lid">
        <div className="laptop-bezel">
          <span className="laptop-camera" aria-hidden="true" />
          <div
            className="laptop-screen"
            style={
              {
                "--lp-primary": palette.primary,
                "--lp-secondary": palette.secondary,
              } as CSSProperties
            }
          >
            {/* Browser bar */}
            <div className="laptop-bar">
              <span className="laptop-dot" />
              <span className="laptop-dot" />
              <span className="laptop-dot" />
              <span className="laptop-url">{domain}</span>
            </div>

            {/* Site nav */}
            <div className="laptop-nav">
              <span className="laptop-brand">
                <span className="laptop-mark">{businessName.charAt(0)}</span>
                Smith Plumbing
              </span>
              <span className="laptop-links">
                <span>Services</span>
                <span>Reviews</span>
                <span>Contact</span>
              </span>
              <span className="laptop-nav-cta">Call Now</span>
            </div>

            {/* Desktop image hero */}
            <div className="laptop-hero">
              {heroImage && (
                // Illustrative job photo — decorative inside a device mockup.
                // eslint-disable-next-line @next/next/no-img-element
                <img className="laptop-hero-img" src={heroImage} alt="" loading="lazy" />
              )}
              <div className="laptop-hero-scrim" aria-hidden="true" />
              <div className="laptop-hero-body">
                <span className="laptop-eyebrow">
                  <MapPinIcon size={9} />
                  {location}
                </span>
                <strong className="laptop-hero-name">{businessName}</strong>
                <span className="laptop-hero-tagline">{tagline}</span>
                <span className="laptop-actions">
                  <span className="laptop-btn">Call Now</span>
                  <span className="laptop-btn is-ghost">
                    <WhatsAppIcon size={9} />
                    WhatsApp
                  </span>
                </span>
              </div>
            </div>

            {/* Service strip */}
            <div className="laptop-strip">
              {services.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>

            {/* Review strip */}
            <div className="laptop-review">
              <span className="laptop-stars">
                <StarIcon size={9} />
                {rating}
              </span>
              <span className="laptop-quote">
                &ldquo;Arrived in 40 minutes and fixed it first time.&rdquo; — David R.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Base + notch */}
      <div className="laptop-base" aria-hidden="true">
        <span className="laptop-notch" />
      </div>
    </div>
  );
}
