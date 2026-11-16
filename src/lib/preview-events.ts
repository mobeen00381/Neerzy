/**
 * Preview funnel events — the four measurable steps of the /website-builder
 * hero widget.
 *
 * The names live here so the widget (client) and the collector
 * (app/api/preview/event/route.ts) can never drift: the route only accepts a
 * name from PREVIEW_EVENTS, so adding a step means adding it once.
 *
 * PRIVACY: nothing here identifies a person. `sessionId` is a random value the
 * widget keeps in sessionStorage for the tab's lifetime, `placeId` is the
 * PUBLIC Google listing the visitor picked, and `trade` is one of our own
 * template ids. No name, email, phone, IP or user agent is ever sent or stored.
 */

export const PREVIEW_EVENTS = [
  "preview_searched",
  "preview_selected",
  "preview_build_click",
  "preview_try_another",
] as const;

export type PreviewEventName = (typeof PREVIEW_EVENTS)[number];

export function isPreviewEvent(value: unknown): value is PreviewEventName {
  return typeof value === "string" && (PREVIEW_EVENTS as readonly string[]).includes(value);
}

/** Where the beacon posts. One constant so the widget and route stay in sync. */
export const PREVIEW_EVENT_ENDPOINT = "/api/preview/event";

/** sessionStorage key for the per-tab random id. */
const SESSION_KEY = "neerzy_preview_session";

/** 32 hex chars; the crypto path is the normal one in every browser we target. */
function randomId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The random id for this tab, created on first use and reused after that so
 * the four steps can be joined into one session. Returns "" when storage is
 * unavailable (private mode, blocked cookies) — the event is then stored
 * without a session, never with a guess.
 */
export function getPreviewSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = randomId();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "";
  }
}

export interface PreviewEventProperties {
  /** Google Places id of the listing the visitor interacted with. */
  placeId?: string;
  /** Template id the preview matched (or "generic"). */
  trade?: string;
  /** Page/surface that produced the event; the widget sends "website_builder". */
  source?: string;
}

/**
 * Beacon one funnel event. Deliberately fire-and-forget: analytics must never
 * break the widget, so every failure (blocked beacon, offline, 4xx) is
 * swallowed here and the caller never awaits anything.
 *
 * `navigator.sendBeacon` is the primary transport because it survives the page
 * being navigated away from (the "Build This Website" and "Try another" clicks
 * are exactly that case). `fetch(..., { keepalive: true })` is the fallback.
 */
export function trackPreviewEvent(
  event: PreviewEventName,
  properties: PreviewEventProperties = {}
): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify({
      event,
      placeId: properties.placeId || undefined,
      trade: properties.trade || undefined,
      source: properties.source || "website_builder",
      sessionId: getPreviewSessionId(),
    });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const sent = navigator.sendBeacon(
        PREVIEW_EVENT_ENDPOINT,
        new Blob([body], { type: "application/json" })
      );
      if (sent) return;
    }

    void fetch(PREVIEW_EVENT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let a beacon take the preview down.
  }
}
