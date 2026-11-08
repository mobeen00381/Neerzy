"use client";

import type { MouseEvent, ReactNode } from "react";

/**
 * CTA that jumps to the free preview widget on /website-builder.
 *
 * The free, no-account preview is the search input inside PreviewWidget
 * (id="preview-search"), so a "See My Free Preview" button must never send the
 * visitor to a login-gated page. The href is a real anchor, so it works with
 * JavaScript disabled and from other pages as /website-builder#preview-search;
 * the click handler only adds what a plain anchor cannot do — scroll the widget
 * into view and put the cursor in the input, ready to type a business name.
 */
export default function PreviewJumpLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const jumpToPreview = (event: MouseEvent<HTMLAnchorElement>) => {
    const input = document.getElementById("preview-search");
    // No widget on this render (should not happen) — let the anchor behave
    // normally rather than swallowing the click.
    if (!(input instanceof HTMLInputElement)) return;

    event.preventDefault();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus({ preventScroll: true });
    window.history.replaceState(null, "", "#preview-search");
  };

  return (
    <a href="#preview-search" className={className} onClick={jumpToPreview}>
      {children}
    </a>
  );
}
