"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Banners for the outcomes of the Google Business Profile connect flow.
 *
 * The OAuth callback can now REFUSE a connection (ownership mismatch, several
 * listings, no Business Profile, missing config) and redirect back with a
 * flag — without somewhere to show it, the user would land on a dashboard that
 * looks unchanged and simply try again. Kept in its own component with its own
 * Suspense boundary so the dashboard page itself needs only one extra line.
 */

interface Alert {
  tone: "success" | "error" | "info";
  text: string;
}

function Alerts() {
  const params = useSearchParams();

  const alerts: Alert[] = [];

  if (params.get("gbp_connected") === "true") {
    alerts.push({
      tone: "success",
      text: "Google Business Profile connected. Your listing is verified.",
    });
  }

  if (params.get("gbp_mismatch") === "1") {
    alerts.push({
      tone: "error",
      text:
        "We could not verify that you own the business you selected: the Google account you connected manages a different business. Nothing was changed. Connect the Google account that manages your listing, or update your business details.",
    });
  }

  if (params.get("gbp_multiple") === "1") {
    alerts.push({
      tone: "info",
      text:
        "Your Google account manages several businesses, so we can't tell which one is yours. Connect your business on the onboarding page first, then connect Google — we will match it automatically.",
    });
  }

  switch (params.get("gbp_error")) {
    case "no_business_account":
      alerts.push({
        tone: "error",
        text:
          "This Google account has no Google Business Profile listing. Sign in with the Google account that manages your business.",
      });
      break;
    case "not_configured":
      alerts.push({
        tone: "error",
        text: "Google connection is not configured on the server yet. Please contact support.",
      });
      break;
    case "oauth_failed":
      alerts.push({
        tone: "error",
        text: "We could not complete the Google connection. Please try again.",
      });
      break;
  }

  if (alerts.length === 0) return null;

  const styles: Record<Alert["tone"], string> = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-amber-50 border-amber-200 text-amber-900",
  };
  const icons: Record<Alert["tone"], string> = { success: "✅", error: "⚠️", info: "ℹ️" };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-4 flex flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.text}
          className={`border rounded-2xl px-4 py-3 text-sm font-semibold ${styles[alert.tone]}`}
        >
          <span className="mr-2">{icons[alert.tone]}</span>
          {alert.text}
        </div>
      ))}
    </div>
  );
}

export default function DashboardAlerts() {
  return (
    <Suspense fallback={null}>
      <Alerts />
    </Suspense>
  );
}
