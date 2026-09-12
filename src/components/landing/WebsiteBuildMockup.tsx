"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, StarIcon, SearchIcon, MapPinIcon } from "@/components/ui/Icons";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { PhoneMockup, PhoneSite } from "@/components/landing/PhoneMockup";

// ────────────────────────────────────────────────────────────────
// "Tap one button. Get a real website." — animated story (home page).
//
// Shows the REAL website-build path, end to end, for every trader:
//   1) pick the real business from Google (same search as /onboarding)
//   2) connect WhatsApp (the same CONNECT message the webhook expects)
//   3) choose the name — Neerzy checks availability and marks its pick.
//      "Suggested by Neerzy" simply means the best AVAILABLE name for the
//      business — it is not tied to any country or legal requirement.
//   4) the site builds itself from the Google profile and goes live
//
// Copy mirrors the real product (/onboarding + /api/domains "suggest") so the
// story never promises something the platform doesn't do. Illustrative
// example business per design.md §10: "Smith Plumbing & Heating", Austin TX.
// ────────────────────────────────────────────────────────────────

const CONNECT_TEXT = "Hi Neerzy! I want to connect my WhatsApp profile. CONNECT";
const CONNECTED_TEXT = "✅ WhatsApp connected to your Neerzy account!";

const SCENES = [
  { key: "find", label: "Find your business" },
  { key: "whatsapp", label: "Connect WhatsApp" },
  { key: "domain", label: "Your own name" },
  { key: "build", label: "Website builds" },
] as const;

const STEPS = [
  // 1) Find the real business
  { key: "find-type", scene: "find", ms: 1200 },
  { key: "find-results", scene: "find", ms: 1600 },
  { key: "find-connected", scene: "find", ms: 1300 },
  // 2) Connect WhatsApp
  { key: "wa-sent", scene: "whatsapp", ms: 1600 },
  { key: "wa-connected", scene: "whatsapp", ms: 1700 },
  // 3) Choose the name
  { key: "domain-type", scene: "domain", ms: 1100 },
  { key: "domain-taken", scene: "domain", ms: 1200 },
  { key: "domain-available", scene: "domain", ms: 1700 },
  { key: "domain-picked", scene: "domain", ms: 1900 },
  // 4) Build + go live
  { key: "build-reading", scene: "build", ms: 1100 },
  { key: "build-writing", scene: "build", ms: 1100 },
  { key: "build-look", scene: "build", ms: 1100 },
  { key: "build-live", scene: "build", ms: 3400 },
] as const;

const LAST = STEPS.length - 1;
const STEP_INDEX: Record<string, number> = Object.fromEntries(
  STEPS.map((s, i) => [s.key, i])
);

export default function WebsiteBuildMockup() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // Respect prefers-reduced-motion: show the finished story, no animation.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Don't burn timers while the story is off-screen.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setTimeout(() => {
      setStep((s) => (s >= LAST ? 0 : s + 1));
    }, STEPS[step].ms);
    return () => window.clearTimeout(id);
  }, [step, paused, reduced]);

  const shown = reduced ? LAST : step;
  const active = STEPS[shown];
  const at = (key: string) => shown >= (STEP_INDEX[key] ?? 0);

  return (
    <div className="wbm-wrap">
      {/* Scene strip — where we are in the story */}
      <div className="wbm-strip" role="list" aria-label="Website build steps">
        {SCENES.map((s) => (
          <span
            key={s.key}
            role="listitem"
            className={`wbm-strip-item${active.scene === s.key ? " is-active" : ""}`}
          >
            {s.label}
          </span>
        ))}
      </div>

      <div className="wbm-frame" ref={frameRef} aria-hidden="true">
        {/* design.md §4 "Device mockups": the same real-size phone used by
            the founding-offer section, so both stories show one product.
            The device URL pill mirrors the same illustrative domain. */}
        <PhoneMockup
          className="wbm-phone"
          domain={
            at("domain-picked") ? "smithplumbingandheating.com" : "neerzy.com/onboarding"
          }
        >
          <div className="wbm-body">
          {/* ── Scene 1: find the real business ── */}
          {active.scene === "find" && (
            <div className="wbm-scene">
              <p className="wbm-title">Find your business</p>
              <div className="wbm-input">
                <SearchIcon size={13} />
                <span className="wbm-typed">
                  Smith Plumbing &amp; Heating
                  {shown <= STEP_INDEX["find-type"] && <span className="wbm-caret" />}
                </span>
              </div>

              {at("find-results") && (
                <div className="wbm-result">
                  <span className="wbm-result-pin">
                    <MapPinIcon size={12} />
                  </span>
                  <div className="wbm-result-copy">
                    <strong>Smith Plumbing &amp; Heating</strong>
                    <span>Austin, TX · Plumber</span>
                    <span className="wbm-result-rating">
                      <StarIcon size={11} /> 4.9 · 230 reviews
                    </span>
                  </div>
                  <span className={`wbm-cta${at("find-connected") ? " is-done" : ""}`}>
                    {at("find-connected") ? (
                      <>
                        <CheckIcon size={11} /> Connected
                      </>
                    ) : (
                      "Connect"
                    )}
                  </span>
                </div>
              )}

              <p className="wbm-note">Straight from Google — you type nothing else.</p>
            </div>
          )}

          {/* ── Scene 2: connect WhatsApp ── */}
          {active.scene === "whatsapp" && (
            <div className="wbm-scene">
              <p className="wbm-title">One tap connects WhatsApp</p>
              <div className="wbm-chat">
                {at("wa-sent") && (
                  <div className="wbm-bubble is-out">
                    <WhatsAppIcon size={12} />
                    {CONNECT_TEXT}
                  </div>
                )}
                {at("wa-connected") && (
                  <>
                    <div className="wbm-bubble is-in">{CONNECTED_TEXT}</div>
                    <div className="wbm-bubble is-in">
                      Send me a photo after any job — I&apos;ll write the post and update your
                      website. 👍
                    </div>
                  </>
                )}
              </div>
              <p className="wbm-note">No app to download. It works on the phone you already have.</p>
            </div>
          )}

          {/* ── Scene 3: your own name (availability + Neerzy's pick) ── */}
          {active.scene === "domain" && (
            <div className="wbm-scene">
              <p className="wbm-title">Pick your name</p>
              <div className="wbm-input">
                <SearchIcon size={13} />
                <span className="wbm-typed">
                  smithplumbing
                  {shown <= STEP_INDEX["domain-type"] && <span className="wbm-caret" />}
                </span>
              </div>

              {at("domain-taken") && (
                <div className="wbm-row">
                  <span className="wbm-row-name">smithplumbing.com</span>
                  <span className="wbm-badge is-taken">Taken</span>
                </div>
              )}

              {at("domain-available") && (
                <div className={`wbm-row${at("domain-picked") ? " is-picked" : ""}`}>
                  <span className="wbm-row-name">smithplumbingandheating.com</span>
                  <span className="wbm-badge is-available">
                    <CheckIcon size={10} /> Available
                  </span>
                  <span className="wbm-badge is-suggested">
                    <StarIcon size={10} /> Suggested by Neerzy
                  </span>
                </div>
              )}

              {at("domain-picked") && (
                <p className="wbm-note is-good">
                  <CheckIcon size={12} /> Registered to you · Connected to your site
                </p>
              )}

              {/* No country or legal requirement is implied — the badge simply
                  marks the best AVAILABLE name for the business. */}
              <p className="wbm-note">
                Neerzy checks what&apos;s free and marks the best name for your business.
              </p>
            </div>
          )}

          {/* ── Scene 4: build + live ── */}
          {active.scene === "build" && (
            <div className="wbm-scene">
              <p className="wbm-title">Your website builds itself</p>

              {!at("build-live") && (
                <div className="wbm-progress">
                  <span className={`wbm-progress-row${at("build-reading") ? " is-done" : ""}`}>
                    <CheckIcon size={11} /> Reading your Google profile
                  </span>
                  <span className={`wbm-progress-row${at("build-writing") ? " is-done" : ""}`}>
                    <CheckIcon size={11} /> Writing your words
                  </span>
                  <span className={`wbm-progress-row${at("build-look") ? " is-done" : ""}`}>
                    <CheckIcon size={11} /> Picking your look
                  </span>
                </div>
              )}

              {at("build-live") && (
                <>
                  {/* The finished trader website — the same image-hero screen
                      rendered by the real SiteRenderer pipeline, on the device. */}
                  <PhoneSite liveLabel="" />
                  <p className="wbm-note is-good">
                    <CheckIcon size={12} /> Live in under a minute — and it updates after every job.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        </PhoneMockup>
      </div>
    </div>
  );
}
