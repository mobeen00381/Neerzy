// Simple analytics event tracker
// Ready for Google Analytics / PostHog integration later

type EventName =
  | "signup_completed"
  | "domain_purchased"
  | "first_update_sent"
  | "second_update_sent"
  | "qr_scan_opened"
  | "photo_uploaded"
  | "voice_recorded"
  | "update_submitted";

interface EventProperties {
  [key: string]: string | number | boolean;
}

export function trackEvent(name: EventName, properties?: EventProperties) {
  const event = {
    name,
    properties: properties || {},
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (typeof window !== "undefined") {
    console.log("[Neerzy Analytics]", event);

    // Store in localStorage for dashboard stats
    const stored = JSON.parse(localStorage.getItem("sj_events") || "[]");
    stored.push(event);
    localStorage.setItem("sj_events", JSON.stringify(stored));

    // Update counters
    if (name === "update_submitted" || name === "first_update_sent" || name === "second_update_sent") {
      const count = parseInt(localStorage.getItem("sj_updates_count") || "0");
      localStorage.setItem("sj_updates_count", String(count + 1));
      localStorage.setItem("sj_last_update", new Date().toISOString());
    }
  }

  // Future: Send to Google Analytics
  // gtag('event', name, properties);

  // Future: Send to PostHog
  // posthog.capture(name, properties);
}

export function getUpdateCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("sj_updates_count") || "0");
}

export function getLastUpdateDate(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sj_last_update");
}

export function getEvents(): Array<{ name: string; timestamp: string }> {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("sj_events") || "[]");
}
