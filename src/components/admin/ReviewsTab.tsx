// src/components/admin/ReviewsTab.tsx
// Moderation queue for the ratings submitted on /gmb-audit-tool/results.
//
// Submissions land as `pending` and are invisible on the public page until
// they are approved here. Approving calls revalidatePath("/gmb-audit-tool"),
// so the review — and the AggregateRating it may unlock — goes live in
// seconds rather than waiting out the hourly ISR window.
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { RefreshCw, Star, Check, X, Undo2, Clock } from "lucide-react";
import { adminFetch, qs } from "@/components/admin/api";
import {
  Spinner,
  EmptyState,
  KpiCard,
  PaginationBar,
  fmtDateTime,
} from "@/components/admin/ui";
import type {
  AdminAuditReview,
  AdminAuditReviewList,
  AuditReviewStatus,
} from "@/lib/admin-types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#CBD5CF]"
          }`}
        />
      ))}
    </span>
  );
}

const STATUS_STYLES: Record<AuditReviewStatus, string> = {
  pending: "bg-white text-[#B45309] border border-[#FCD34D]",
  published: "bg-[#E6F2EA] text-[#0F5132]",
  rejected: "bg-[#F7F9F8] text-[#5B6B64]",
};

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export default function ReviewsTab() {
  const [data, setData] = useState<AdminAuditReviewList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [busyId, setBusyId] = useState("");

  const load = async (p = page, st = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      const url =
        "/api/admin/audit-reviews" +
        qs({ page: p, pageSize: 25, status: st === "all" ? undefined : st });
      setData(await adminFetch<AdminAuditReviewList>(url));
    } catch (e: any) {
      setError(e?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const moderate = async (id: string, status: AuditReviewStatus) => {
    setBusyId(id);
    setError("");
    try {
      await adminFetch("/api/admin/audit-reviews", {
        method: "POST",
        body: JSON.stringify({ action: "update", id, status }),
      });
      // Reload so the KPI counts and the active filter stay accurate.
      await load(page, statusFilter);
    } catch (e: any) {
      setError(e?.message || "Failed to update review");
    } finally {
      setBusyId("");
    }
  };

  const counts = data?.byStatus || { pending: 0, published: 0, rejected: 0 };
  const reviews: AdminAuditReview[] = data?.reviews || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E22]">Audit tool reviews</h1>
          <p className="text-sm font-normal text-[#5B6B64] mt-0.5">
            Ratings of the free GMB audit tool. Nothing appears on /gmb-audit-tool until it is
            published here.
          </p>
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#0B3D2E] text-white hover:bg-[#0F5132]"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Pending"
          value={counts.pending}
          sub="Awaiting moderation"
          icon={<Clock className="w-5 h-5 text-[#B45309]" />}
        />
        <KpiCard
          label="Published"
          value={counts.published}
          sub="Live on the public page"
          icon={<Check className="w-5 h-5 text-[#0F5132]" />}
        />
        <KpiCard
          label="Rejected"
          value={counts.rejected}
          sub="Never shown publicly"
          icon={<X className="w-5 h-5 text-[#5B6B64]" />}
        />
      </div>

      <Card className="border-[#E1E8E4] rounded-2xl shadow-[0_2px_8px_rgba(11,61,46,0.06)] bg-white">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setStatusFilter(f.id);
                  setPage(1);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  statusFilter === f.id
                    ? "bg-[#0B3D2E] text-white"
                    : "bg-[#F7F9F8] text-[#5B6B64] hover:bg-[#E6F2EA]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs font-bold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {loading ? (
            <Spinner label="Loading reviews…" />
          ) : reviews.length === 0 ? (
            <EmptyState
              message={
                statusFilter === "pending"
                  ? "No reviews waiting for moderation."
                  : "No reviews in this view yet."
              }
            />
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="border border-[#E1E8E4] rounded-xl p-4 flex flex-col md:flex-row md:items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} />
                      <span className="text-xs font-bold text-[#0A2E22]">
                        {r.author_name || "Audit user"}
                      </span>
                      <span
                        className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          STATUS_STYLES[r.status]
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    {r.comment ? (
                      <p className="text-sm font-normal text-[#0A2E22] mt-2">{r.comment}</p>
                    ) : (
                      <p className="text-sm font-normal text-[#5B6B64] mt-2 italic">
                        Rating only — no comment left.
                      </p>
                    )}
                    <p className="text-[11px] font-normal text-[#5B6B64] mt-2">
                      Submitted {fmtDateTime(r.created_at)} · scan {r.scan_place_id || "unknown"}
                      {r.moderated_at ? ` · moderated ${fmtDateTime(r.moderated_at)}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {r.status !== "published" && (
                      <button
                        onClick={() => moderate(r.id, "published")}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#22C55E] text-white hover:bg-[#16A34A] disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Publish
                      </button>
                    )}
                    {r.status !== "rejected" && (
                      <button
                        onClick={() => moderate(r.id, "rejected")}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                    {r.status !== "pending" && (
                      <button
                        onClick={() => moderate(r.id, "pending")}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#E1E8E4] bg-white hover:bg-[#F7F9F8] disabled:opacity-50"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Back to pending
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data && data.total > data.pageSize && (
            <PaginationBar
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

