// src/components/reviews/AuditReviewPrompt.tsx
//
// "How was your audit?" — the capture half of the review pipeline.
//
// Deliberately NOT gated: every visitor who finishes an audit sees the same
// prompt. Routing happy users to a public rating and unhappy ones to a private
// form is review gating and violates the same policy family we cleaned up.
//
// Everything submitted here lands as status='pending' and is invisible on the
// public page until it is approved in /admin (see
// src/app/api/audit/review/route.ts).
"use client";

import { useRef, useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";

const LABELS: Record<number, string> = {
  1: "Not useful",
  2: "Below average",
  3: "Decent",
  4: "Really useful",
  5: "Excellent",
};

export default function AuditReviewPrompt({
  placeId,
}: {
  placeId?: string | null;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  // Used for the bot check: nobody rates a tool within 3s of it rendering.
  const mountedAt = useRef(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || status === "saving") return;

    setStatus("saving");
    setError("");

    try {
      const res = await fetch("/api/audit/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment,
          author_name: name,
          scan_place_id: placeId || null,
          honeypot,
          elapsed_ms: Date.now() - mountedAt.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not save your rating.");
      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Could not save your rating. Please try again.");
    }
  };

  const shown = hover || rating;

  return (
    <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10">
      <h3 className="text-2xl font-black text-slate-800">How was your audit?</h3>
      <p className="text-slate-500 font-semibold text-sm mt-1">
        A quick rating helps the next business owner decide whether to run it. Takes five seconds.
      </p>

      {status === "done" ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-emerald-800">Thanks — that&apos;s in.</p>
            <p className="text-sm text-emerald-700/80 font-medium mt-0.5">
              Your {rating}-star rating has been recorded. We read every one.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <div
              className="flex items-center gap-1.5"
              role="radiogroup"
              aria-label="Rate this audit tool from 1 to 5 stars"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={rating === i}
                  aria-label={`${i} star${i > 1 ? "s" : ""}`}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(0)}
                  className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <Star
                    className={`w-8 h-8 ${
                      i <= shown
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-slate-500">
                {shown ? LABELS[shown] : "Tap to rate"}
              </span>
            </div>
          </div>

          {/* Honeypot — invisible to humans, irresistible to bots. */}
          <div className="hidden" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Name (optional)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Sam"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Comment (optional)
            </span>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="What did the audit get right or miss?"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 resize-none"
            />
          </label>

          {error && (
            <p className="text-sm font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={!rating || status === "saving"}
              className="inline-flex items-center gap-2 bg-[#0F5C4D] hover:bg-[#12705e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 px-8 rounded-2xl transition-all shadow-lg"
            >
              {status === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "saving" ? "Saving…" : "Submit rating"}
            </button>
            <p className="text-xs font-medium text-slate-400 max-w-xs">
              Ratings are checked before they appear publicly on this page.
            </p>
          </div>
        </form>
      )}
    </section>
  );
}
