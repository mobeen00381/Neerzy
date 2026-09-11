"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckIcon, ClockIcon, GiftIcon, GlobeIcon } from '@/components/ui/Icons';

// ────────────────────────────────────────────────────────────────
// Founding-member offer slides (home page).
//
// Advertises the early-adopter deal already priced in src/lib/website.ts:
//   • website builder setup fee ($99) WAIVED — kept forever
//   • hosting free for the first 90 days, then $10/month
// and shows a live "days left" countdown until the window closes
// (WEBSITE_EARLY_ADOPTER_ENDS).
//
// The countdown is computed AFTER mount on purpose: the home page can be
// served from cache, so a server-rendered number would go stale, and any
// value rendered on the server would mismatch the client. Until mount the
// chip shows a neutral label instead of a number.
// ────────────────────────────────────────────────────────────────

const AUTO_ADVANCE_MS = 6000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SLIDE_COUNT = 3;

interface OfferSlidesProps {
  /** ISO timestamp when the founding-member (early adopter) window closes. */
  deadline: string;
  /** One-time website setup fee waived for early adopters, in USD. */
  setupPrice: number;
  /** Monthly hosting price after the free window, in USD. */
  hostingPrice: number;
  /** Days of free hosting for early adopters. */
  freeDays: number;
}

export default function OfferSlides({
  deadline,
  setupPrice,
  hostingPrice,
  freeDays,
}: OfferSlidesProps) {
  // null = not computed yet (SSR / pre-mount). 0 = window closed → hide banner.
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Countdown in days, recomputed every minute so an open tab stays correct.
  useEffect(() => {
    const ends = new Date(deadline).getTime();
    const tick = () => {
      // Unparseable deadline → stay null and keep the offer visible, matching
      // the fail-open behaviour of isEarlyAdopterWindowOpen().
      if (!Number.isFinite(ends)) return;
      setDaysLeft(Math.max(0, Math.ceil((ends - Date.now()) / DAY_MS)));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [deadline]);

  // Auto-advance through the slides (paused while the pointer is over the card).
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % SLIDE_COUNT);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  // Window closed — the offer is over, so remove the banner entirely.
  if (daysLeft === 0) return null;

  const countdownLabel =
    daysLeft === null
      ? 'Limited-time offer'
      : daysLeft === 1
        ? '1 day left to claim'
        : `${daysLeft} days left to claim`;

  const slides = [
    {
      key: 'setup',
      icon: <GiftIcon size={18} />,
      title: `Website builder — $${setupPrice} setup waived`,
      body: 'Neerzy reads your Google page, writes the words and puts a real website live on your own name. Founding members never pay the setup fee.',
      chips: [`$${setupPrice} setup → FREE`, 'Yours to keep, forever'],
      cta: 'Build My Website — Free',
    },
    {
      key: 'hosting',
      icon: <GlobeIcon size={18} />,
      title: `Hosting — first ${freeDays} days free`,
      body: `Hosting, security and speed handled for you. Free for the first ${freeDays} days, then one small monthly price. Cancel anytime.`,
      chips: [`${freeDays} days FREE`, `Then $${hostingPrice}/month`],
      cta: 'Claim Founding Member Offer',
    },
    {
      key: 'deadline',
      icon: <ClockIcon size={18} />,
      title: 'Founding-member pricing closes soon',
      body: 'When the countdown reaches zero the window shuts and a website build goes back to full price.',
      chips: [`$${setupPrice} setup + $${hostingPrice}/month after`, 'Early adopters keep it free'],
      cta: 'Lock In Founding Prices',
    },
  ];

  const slide = slides[active];

  const go = (dir: number) => setActive((i) => (i + dir + SLIDE_COUNT) % SLIDE_COUNT);

  return (
    <section className="offer-slider" aria-label="Founding member offer">
      <div className="container">
        <div
          className="offer-slider-card"
          role="group"
          aria-roledescription="carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="offer-slider-top">
            <span className="offer-slider-badge">
              <GiftIcon size={14} />
              Founding members
            </span>
            <span className="offer-slider-countdown" aria-live="polite">
              <ClockIcon size={14} />
              {countdownLabel}
            </span>
          </div>

          <div className="offer-slide" key={slide.key} aria-live="polite">
            <div className="offer-slide-copy">
              <div className="offer-slide-icon">{slide.icon}</div>
              <h3 className="offer-slide-title">{slide.title}</h3>
              <p className="offer-slide-body">{slide.body}</p>
              <ul className="offer-slide-chips">
                {slide.chips.map((chip) => (
                  <li key={chip}>
                    <CheckIcon size={13} />
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="offer-slide-cta">
              <Link href="/pricing#add-ons" className="btn btn-primary">
                {slide.cta}
              </Link>
            </div>
          </div>

          <div className="offer-slider-controls">
            <button
              type="button"
              className="offer-slider-arrow"
              onClick={() => go(-1)}
              aria-label="Previous offer slide"
            >
              ‹
            </button>
            <div className="offer-slider-dots">
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  className={`offer-slider-dot${i === active ? ' is-active' : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`Show offer slide ${i + 1} of ${SLIDE_COUNT}`}
                  aria-current={i === active}
                />
              ))}
            </div>
            <button
              type="button"
              className="offer-slider-arrow"
              onClick={() => go(1)}
              aria-label="Next offer slide"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

