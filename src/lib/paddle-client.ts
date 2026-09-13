import { initializePaddle, type Paddle } from "@paddle/paddle-js";

/**
 * Client-side Paddle.js bootstrap for the dashboard.
 *
 * WHY THIS EXISTS: the purchase APIs return Paddle **checkout links**
 * (`https://www.neerzy.com/?_ptxn=txn_…`). A link like that only opens a
 * checkout when Paddle.js is *initialized* on the page that loads it — the
 * dashboard never was, so `window.location.href = url` dropped the trader on
 * the marketing home page with no way to pay.
 *
 * Initializing Paddle.js once here lets us open the overlay for that exact
 * transaction, in place, and keeps the transaction server-created (its
 * custom_data carries the userId/domainName the webhook needs).
 */

/** Fired on the window when a Paddle checkout completes. */
export const CHECKOUT_COMPLETED_EVENT = "neerzy-checkout-completed";

let paddlePromise: Promise<Paddle | undefined> | null = null;

/** Loads and initializes Paddle.js exactly once. Undefined when unavailable. */
export function getPaddleClient(): Promise<Paddle | undefined> {
  if (typeof window === "undefined") return Promise.resolve(undefined);

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    console.warn("Paddle client token missing — falling back to the checkout link.");
    return Promise.resolve(undefined);
  }

  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox",
      token,
      eventCallback: (event) => {
        if (event?.name === "checkout.completed") {
          window.dispatchEvent(new Event(CHECKOUT_COMPLETED_EVENT));
        }
      },
    })
      .then((paddle) => paddle ?? undefined)
      .catch((err) => {
        console.warn("Paddle.js failed to initialize:", err);
        paddlePromise = null; // a later click may retry
        return undefined;
      });
  }

  return paddlePromise;
}

/** Pulls the `txn_…` id out of a Paddle checkout link (`…?_ptxn=txn_…`). */
export function transactionIdFromCheckoutUrl(
  url: string | null | undefined
): string | null {
  return String(url || "").match(/_ptxn=(txn_[A-Za-z0-9]+)/)?.[1] || null;
}

/**
 * Opens the Paddle overlay for a server-created transaction.
 * Returns false when Paddle.js can't be used (or the overlay never appeared), so
 * callers can fall back to a plain navigation to the checkout link.
 */
export async function openPaddleCheckout(url: string): Promise<boolean> {
  const txnId = transactionIdFromCheckoutUrl(url);
  const paddle = await getPaddleClient();
  if (!paddle || !txnId) return false;
  try {
    paddle.Checkout.open({ transactionId: txnId });
  } catch (err) {
    console.warn("Paddle checkout could not open:", err);
    return false;
  }
  // Paddle renders into its own iframe. If nothing shows up shortly, report
  // failure so the caller can send the trader to the checkout link instead of
  // leaving them staring at an unchanged dashboard.
  return waitForCheckoutOverlay(4000);
}

/** Resolves true as soon as a Paddle checkout iframe exists in the page. */
function waitForCheckoutOverlay(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(false);
    const present = () =>
      !!document.querySelector(
        'iframe[name="paddle_frame"], iframe[src*="paddle"], .paddle-checkout-frame'
      );
    if (present()) return resolve(true);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (present()) {
        window.clearInterval(timer);
        resolve(true);
      } else if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer);
        resolve(false);
      }
    }, 150);
  });
}
