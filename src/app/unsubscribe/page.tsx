"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, MailX } from "lucide-react";

/**
 * Public unsubscribe confirmation page.
 *
 * The visitor lands here from a marketing email footer and must CLICK to
 * unsubscribe - nothing happens on load. That is deliberate: mailbox scanners,
 * link previews and corporate security products fetch every link in an email, so
 * a GET that unsubscribed would drop people who never opened the message.
 *
 * The token is read from the URL in an effect (not useSearchParams) so the page
 * renders without a Suspense boundary, and it is POSTed to /api/unsubscribe,
 * which is also the endpoint Gmail/Outlook hit for one-click (RFC 8058).
 */
export default function UnsubscribePage() {
  const [token, setToken] = useState("");
  // False until the effect below has read the URL. Rendering the button before
  // that keeps the server HTML and the first client paint identical (no flash of
  // "missing code"), and only then can a missing token be reported honestly.
  const [tokenChecked, setTokenChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("t") || params.get("token") || "");
    setTokenChecked(true);
  }, []);

  const unsubscribe = async () => {
    if (status === "sending" || status === "done") return;
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "We couldn't record that just now.");
      setStatus("done");
      setMessage(data?.message || "You're unsubscribed.");
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || "We couldn't record that just now - please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#E6F2EA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border border-[#E1E8E4] p-8 text-center">
        {status === "done" ? (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-[#0A2E22]">You&apos;re unsubscribed</h1>
            <p className="text-sm font-semibold text-[#5B6B64] mt-3 leading-relaxed">
              {message}
            </p>
            <p className="text-xs font-semibold text-[#5B6B64] mt-4 leading-relaxed">
              You&apos;ll still get anything you specifically ask us for — for example a Google
              Business Profile report you request from the audit tool.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 bg-[#0F5C4D] hover:bg-[#073a30] text-white px-5 py-3 rounded-xl font-bold transition-all"
            >
              Back to neerzy.com
            </Link>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-[#F7F9F8] flex items-center justify-center mx-auto mb-5">
              <MailX className="w-8 h-8 text-[#0F5C4D]" />
            </div>
            <h1 className="text-2xl font-black text-[#0A2E22]">Unsubscribe</h1>
            <p className="text-sm font-semibold text-[#5B6B64] mt-3 leading-relaxed">
              This stops the free website preview and Google profile tips emails. Reports you ask
              for are still delivered.
            </p>

            {!tokenChecked || token ? (
              <button
                type="button"
                onClick={() => void unsubscribe()}
                disabled={status === "sending"}
                className="inline-flex items-center gap-2 mt-6 bg-[#0F5C4D] hover:bg-[#073a30] disabled:opacity-60 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md"
              >
                {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
                {status === "sending" ? "Unsubscribing…" : "Yes, unsubscribe me"}
              </button>
            ) : (
              <p className="text-sm font-bold text-rose-600 mt-6">
                This link is missing its code. Please use the unsubscribe link at the bottom of the
                email you received.
              </p>
            )}

            {status === "error" && message && (
              <p className="mt-4 inline-flex items-start gap-2 text-left text-xs font-bold text-rose-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {message}
              </p>
            )}

            <p className="text-xs font-semibold text-[#5B6B64] mt-6">
              Changed your mind? Just close this page — nothing has changed yet.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
