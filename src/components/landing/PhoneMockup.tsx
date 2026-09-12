"use client";

import type { CSSProperties, ReactNode } from "react";
import { MapPinIcon, StarIcon } from "@/components/ui/Icons";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

// ────────────────────────────────────────────────────────────────
// Shared device mockup — a realistic, real-size smartphone frame.
//
// design.md §4 "Device mockups": every section that shows a website on
// a phone renders THIS component. Real iPhone-class proportions
// (390 × 844 aspect, scaled — never stretched), device-frame bezel,
// Dynamic Island, side buttons, iOS status bar and a browser URL pill.
//
// Two exports:
//   • <PhoneMockup>  — the device shell (chrome + URL bar) + screen slot
//   • <PhoneSite>    — the trader-website screen shown inside it
//                      (image hero with scrim, actions, service tiles,
//                       review strip). Reused by both landing sections.
//
// Illustrative example business per design.md §10: "Smith Plumbing &
// Heating", Austin TX — one consistent fictional business.
// ────────────────────────────────────────────────────────────────

/* ── Status bar glyphs (inline — part of the device chrome) ── */

function SignalGlyph() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
      <rect x="0" y="7.5" width="3" height="3.5" rx="1" />
      <rect x="4.5" y="5.5" width="3" height="5.5" rx="1" />
      <rect x="9" y="3" width="3" height="8" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden="true">
      <path d="M7.5 10.6 5.2 8.1a3.5 3.5 0 0 1 4.6 0l-2.3 2.5Z" />
      <path d="M7.5 5.2c1.6 0 3 .6 4.1 1.6l1.5-1.6A8.3 8.3 0 0 0 7.5 3a8.3 8.3 0 0 0-5.6 2.2l1.5 1.6a6 6 0 0 1 4.1-1.6Z" />
      <path d="M7.5 1.4c2.4 0 4.6.9 6.2 2.4L15 2.2A10.6 10.6 0 0 0 7.5 0C4.5 0 1.8 1 .4 2.2l1.3 1.6A8.4 8.4 0 0 1 7.5 1.4Z" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.45" />
      <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
      <path d="M23 4.2v3.6c1-.4 1.4-1.1 1.4-1.8S24 4.6 23 4.2Z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}

/* ── Device shell ── */

interface PhoneMockupProps {
  /** Domain shown in the browser pill (illustrative example business). */
  domain?: string;
  /** Screen content — normally a <PhoneSite />. */
  children: ReactNode;
  /** Lay the device on a premium 3D angle (auto-disabled under 900px via CSS). */
  tilt?: boolean;
  /**
   * Shorter "hero-only" device (390 × 620 instead of 390 × 844) so a mockup
   * shows just the top of the site instead of a full-length page.
   */
  compact?: boolean;
  /** Extra classes for the outer stage (e.g. glow layers). */
  className?: string;
  /** Screen background before the site paints (defaults to white). */
  screenClassName?: string;
}

export function PhoneMockup({
  domain = "smithplumbingandheating.com",
  children,
  tilt = false,
  compact = false,
  className = "",
  screenClassName = "",
}: PhoneMockupProps) {
  return (
    <div
      className={`phone-stage${tilt ? " is-tilted" : ""}${compact ? " is-compact" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="phone-frame">
        {/* Side buttons */}
        <span className="phone-btn phone-btn-volume-up" aria-hidden="true" />
        <span className="phone-btn phone-btn-volume-down" aria-hidden="true" />
        <span className="phone-btn phone-btn-power" aria-hidden="true" />

        <div className="phone-bezel">
          <div className={`phone-screen ${screenClassName}`.trim()}>
            {/* iOS status bar — the Dynamic Island sits over it */}
            <div className="phone-status">
              <span className="phone-status-time">9:41</span>
              <span className="phone-island" aria-hidden="true" />
              <span className="phone-status-icons">
                <SignalGlyph />
                <WifiGlyph />
                <BatteryGlyph />
              </span>
            </div>

            {/* Browser URL pill */}
            <div className="phone-urlbar">
              <span className="phone-url-lock" aria-hidden="true">
                <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor">
                  <path d="M4.5 0A3 3 0 0 0 1.5 3v1H1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-.5V3a3 3 0 0 0-3-3Zm1.5 4H3V3a1.5 1.5 0 0 1 3 0v1Z" />
                </svg>
              </span>
              <span className="phone-url-text">{domain}</span>
            </div>

            <div className="phone-viewport">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Trader website screen ── */

export interface PhoneSiteProps {
  businessName?: string;
  logoText?: string;
  location?: string;
  tagline?: string;
  services?: string[];
  reviewQuote?: string;
  reviewer?: string;
  rating?: string;
  /** Photo for the hero. Falls back to a palette gradient hero. */
  heroImage?: string;
  palette?: { primary: string; secondary: string };
  /** Live-status strip under the tiles (site updates itself). */
  liveLabel?: string;
  /**
   * Compact/hero-only screen: nav + image hero + live strip, without the
   * service tiles or the review card (used by the shorter device mockups).
   */
  heroOnly?: boolean;
}

const SMITH = {
  businessName: "Smith Plumbing & Heating",
  logoText: "Smith Plumbing",
  location: "Austin, TX · 24/7 call-outs",
  tagline: "Fast, honest plumbing work — trusted by families across Austin.",
  services: ["Emergency Repairs", "Water Heaters", "Drain Cleaning"],
  reviewQuote: "Arrived in 40 minutes and fixed it first time.",
  reviewer: "David R. · Google review",
  rating: "5.0",
  heroImage: "/images/plumber_job_photo.png",
  palette: { primary: "#0F5132", secondary: "#0A2E22" },
};

export function PhoneSite(props: PhoneSiteProps = {}) {
  const {
    businessName = SMITH.businessName,
    logoText = SMITH.logoText,
    location = SMITH.location,
    tagline = SMITH.tagline,
    services = SMITH.services,
    reviewQuote = SMITH.reviewQuote,
    reviewer = SMITH.reviewer,
    rating = SMITH.rating,
    heroImage = SMITH.heroImage,
    palette = SMITH.palette,
    liveLabel = "Site live — updates itself after every job",
    heroOnly = false,
  } = props;

  return (
    <div
      className={`phone-site${heroOnly ? " is-hero-only" : ""}`}
      style={
        {
          "--ps-primary": palette.primary,
          "--ps-secondary": palette.secondary,
        } as CSSProperties
      }
    >
      {/* Mini nav */}
      <div className="phone-site-nav">
        <span className="phone-site-brand">
          <span className="phone-site-mark">{logoText.charAt(0)}</span>
          {logoText}
        </span>
        <span className="phone-site-nav-links">
          <span>Services</span>
          <span>Contact</span>
        </span>
      </div>

      {/* Image hero with palette scrim */}
      <div className={`phone-site-hero${heroImage ? " has-photo" : ""}`}>
        {heroImage && (
          // Illustrative job photo — decorative inside a device mockup.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="phone-site-hero-img" src={heroImage} alt="" loading="lazy" />
        )}
        <div className="phone-site-hero-scrim" aria-hidden="true" />
        <div className="phone-site-hero-body">
          <span className="phone-site-eyebrow">
            <MapPinIcon size={10} />
            {location}
          </span>
          <strong className="phone-site-name">{businessName}</strong>
          <span className="phone-site-tagline">{tagline}</span>
          <span className="phone-site-actions">
            <span className="phone-site-btn">Call Now</span>
            <span className="phone-site-btn is-ghost">
              <WhatsAppIcon size={10} />
              WhatsApp
            </span>
          </span>
        </div>
      </div>

      {/* Service tiles + review — hidden on the compact hero-only screen */}
      {!heroOnly && (
        <>
          <div className="phone-site-services">
            {services.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>

          <div className="phone-site-review">
            <span className="phone-site-stars">
              <StarIcon size={10} />
              {rating}
            </span>
            <span className="phone-site-quote">&ldquo;{reviewQuote}&rdquo;</span>
            <span className="phone-site-reviewer">{reviewer}</span>
          </div>
        </>
      )}

      {liveLabel && (
        <div className="phone-site-live">
          <span className="phone-site-live-dot" />
          {liveLabel}
        </div>
      )}
    </div>
  );
}

export default PhoneMockup;
