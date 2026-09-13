"use client";

import React, { useCallback, useRef, useState } from "react";

/**
 * Draggable before/after comparison slider — one of the locked trader-site
 * blocks (see the trade templates in `src/lib/site-templates.ts`).
 *
 * Interaction contract:
 *   • mouse / touch / pen — drag anywhere on the image (pointer events)
 *   • keyboard            — focus the handle, ← / → move 2%, Home/End jump
 *
 * The two photos are always the trader's OWN job photos when they have a
 * suitable pair; stock pairs are only used as placeholders on template demos
 * and on sites that have not connected Google Business Profile yet.
 */

type Props = {
  before: string;
  after: string;
  /** Caption under the slider (e.g. "Blocked drain cleared in 40 minutes"). */
  caption?: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Accessible description of what the two photos show. */
  alt?: string;
  /** Corner rounding in px — part of the trade's visual language. */
  radius?: number;
  className?: string;
};

export default function BeforeAfterSlider({
  before,
  after,
  caption,
  beforeLabel = "Before",
  afterLabel = "After",
  alt = "Before and after",
  radius = 24,
  className = "",
}: Props) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    moveTo(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    moveTo(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPos((p) => Math.max(0, p - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPos((p) => Math.min(100, p + step));
    } else if (e.key === "Home") {
      e.preventDefault();
      setPos(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setPos(100);
    }
  };

  return (
    <figure className={`m-0 ${className}`}>
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative w-full overflow-hidden select-none touch-none cursor-ew-resize bg-slate-900"
        style={{ borderRadius: radius, aspectRatio: "16 / 10" }}
      >
        {/* AFTER — full width underneath, so the "after" work is always visible */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={after}
          alt={`${alt} — after`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        {/* BEFORE — clipped to the left of the handle (clip-path, so the photo
            keeps the frame's exact dimensions at any screen width) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        {/* Labels */}
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
          {beforeLabel}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-900">
          {afterLabel}
        </span>

        {/* Handle — also the keyboard control for assistive tech */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${alt} — drag to compare before and after`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="absolute top-0 bottom-0 w-11 -ml-5.5 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.45)]" />
          <span className="relative w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-900 font-black text-sm">
            ⇆
          </span>
        </div>
      </div>

      {caption && (
        <figcaption className="mt-3 text-sm text-slate-500 font-semibold">{caption}</figcaption>
      )}
    </figure>
  );
}
