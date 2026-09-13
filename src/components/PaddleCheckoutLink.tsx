"use client";

import { useEffect } from "react";
import { getPaddleClient } from "@/lib/paddle-client";

/**
 * Makes Paddle **checkout links** work wherever they land.
 *
 * Checkout URLs produced by our APIs look like
 * `https://www.neerzy.com/?_ptxn=txn_…`, and Paddle.js opens the overlay for such
 * a link only when it is initialized on the page that loads it. That's why a
 * dashboard "Buy" click used to bounce the trader to the home page with no
 * checkout. The dashboard now opens the overlay directly; this component covers
 * every remaining entry point (an emailed link, a redirect, a bookmarked tab).
 *
 * Cost when unused: zero — Paddle.js is only fetched when `_ptxn` is present.
 */
export default function PaddleCheckoutLink() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).get("_ptxn")) return;
    getPaddleClient();
  }, []);

  return null;
}
