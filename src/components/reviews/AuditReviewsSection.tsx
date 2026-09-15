// src/components/reviews/AuditReviewsSection.tsx
//
// The VISIBLE reviews block on /gmb-audit-tool.
//
// This component is what makes the structured data legitimate. Google's review
// snippet policy requires a rating to be backed by reviews a visitor can
// actually read on the page — a number in the markup with nothing visible
// behind it is the violation we removed. So: this renders, or the page emits
// no AggregateRating at all. Both read the same object from
// src/lib/audit-reviews.ts.
//
// Server component — no hooks, no client JS.

import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";
import type { PublishedAuditReviews } from "@/lib/audit-reviews";
import { displayAverage } from "@/lib/audit-reviews";

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating);
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          style={{ color: i <= rounded ? "var(--color-accent)" : "var(--color-border)" }}
          fill={i <= rounded ? "var(--color-accent)" : "none"}
        />
      ))}
    </span>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AuditReviewsSection({
  published,
}: {
  published: PublishedAuditReviews;
}) {
  const average = displayAverage(published);
  const reviews = published.display;

  return (
    <section
      id="reviews"
      style={{ marginTop: "var(--space-7)", fontFamily: "var(--font-family)" }}
      aria-labelledby="audit-reviews-heading"
    >
      <div style={{ textAlign: "center", marginBottom: "var(--space-5)" }}>
        <h2
          id="audit-reviews-heading"
          style={{
            fontSize: "var(--text-h2-size, var(--text-h3-size))",
            fontWeight: 800,
            color: "var(--color-primary)",
            marginBottom: "var(--space-2)",
            letterSpacing: "-0.01em",
          }}
        >
          What people say about this audit tool
        </h2>
        <p style={{ fontSize: "var(--text-body-size)", color: "var(--color-text-secondary)" }}>
          Ratings left by people who ran a Google Business Profile audit here.
        </p>
      </div>

      {published.count > 0 && average ? (
        <div
          className="card"
          style={{
            padding: "var(--space-5)",
            marginBottom: "var(--space-5)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-4)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-hero-size)",
              fontWeight: 800,
              color: "var(--color-primary)",
              lineHeight: 1,
            }}
          >
            {average}
          </span>
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "center",
            }}
          >
            <Stars rating={published.average ?? 0} size={20} />
            <span
              style={{
                fontSize: "var(--text-small-size)",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              {published.count} {published.count === 1 ? "rating" : "ratings"} from audit users
            </span>
          </span>
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {reviews.map((review) => (
            <figure
              key={review.id}
              className="card"
              style={{
                padding: "var(--space-4)",
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <Stars rating={review.rating} />
              {review.comment ? (
                <blockquote
                  style={{
                    margin: 0,
                    fontSize: "var(--text-body-size)",
                    color: "var(--color-text-primary)",
                    lineHeight: 1.55,
                  }}
                >
                  “{review.comment}”
                </blockquote>
              ) : null}
              <figcaption
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-small-size)",
                  fontWeight: 700,
                  color: "var(--color-text-secondary)",
                  marginTop: "auto",
                }}
              >
                <span>{review.author_name || "Audit user"}</span>
                <span style={{ fontWeight: 600, opacity: 0.8 }}>
                  {fmtDate(review.created_at)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: "var(--space-5)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-bg-soft)",
              color: "var(--color-primary)",
            }}
          >
            <MessageSquare size={22} />
          </span>
          <p
            style={{
              fontSize: "var(--text-body-size)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            No ratings yet — this tool is brand new.
          </p>
          <p
            style={{
              fontSize: "var(--text-small-size)",
              color: "var(--color-text-secondary)",
              margin: 0,
              maxWidth: "460px",
            }}
          >
            Run an audit on your business above, then tell the next visitor whether it was useful.
          </p>
          <Link
            href="/gmb-audit-tool"
            style={{
              fontSize: "var(--text-small-size)",
              fontWeight: 700,
              color: "var(--color-primary)",
              textDecoration: "underline",
            }}
          >
            Run a free audit
          </Link>
        </div>
      )}

      {reviews.length > 0 && published.count > reviews.length ? (
        <p
          style={{
            marginTop: "var(--space-3)",
            textAlign: "center",
            fontSize: "var(--text-small-size)",
            color: "var(--color-text-secondary)",
          }}
        >
          Showing the {reviews.length} most recent of {published.count} ratings.
        </p>
      ) : null}
    </section>
  );
}
