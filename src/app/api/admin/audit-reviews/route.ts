// src/app/api/admin/audit-reviews/route.ts
// Moderation queue for the ratings submitted on /gmb-audit-tool/results.
//
// Nothing shows on the public page (or in its AggregateRating) until a row's
// status is flipped to 'published' here. Same auth contract as every other
// /api/admin route: IS_ADMIN_CONFIGURED + verifyAdminRequest().

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  isMissingTableError,
} from "@/lib/admin-server";
import type { AdminAuditReview, AdminAuditReviewList } from "@/lib/admin-types";

const STATUSES = ["pending", "published", "rejected"];
const PUBLIC_PAGE = "/gmb-audit-tool";

function mapRow(r: any): AdminAuditReview {
  return {
    id: r.id,
    rating: Number(r.rating) || 0,
    comment: r.comment || null,
    author_name: r.author_name || null,
    scan_place_id: r.scan_place_id || null,
    status: r.status || "pending",
    moderated_at: r.moderated_at || null,
    created_at: r.created_at || null,
  };
}

/** The pre-migration empty payload — keeps the tab useful before the SQL runs. */
function emptyList(page: number, pageSize: number): AdminAuditReviewList {
  return {
    reviews: [],
    total: 0,
    page,
    pageSize,
    byStatus: { pending: 0, published: 0, rejected: 0 },
  };
}

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "").trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10) || 25)
  );

  try {
    let base = supabase.from("audit_reviews").select("*", { count: "exact" });
    if (status && STATUSES.includes(status)) base = base.eq("status", status);

    const from = (page - 1) * pageSize;
    const { data: rows, count, error } = await base
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    // Table not migrated yet → show an empty queue rather than an error.
    if (error && isMissingTableError(error)) return NextResponse.json(emptyList(page, pageSize));
    if (error) throw error;

    const { data: statusRows } = await supabase.from("audit_reviews").select("status");
    const byStatus = { pending: 0, published: 0, rejected: 0 };
    for (const r of statusRows || []) {
      if (r.status === "pending") byStatus.pending++;
      else if (r.status === "published") byStatus.published++;
      else if (r.status === "rejected") byStatus.rejected++;
    }

    const payload: AdminAuditReviewList = {
      reviews: (rows || []).map(mapRow),
      total: count || 0,
      page,
      pageSize,
      byStatus,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("admin audit-reviews GET failed:", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { action, id, status } = body || {};

  if (action !== "update") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (!id || typeof id !== "string" || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("audit_reviews")
      .update({ status, moderated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    // The public page is statically prerendered with ISR. Refresh it now so an
    // approved review — and the AggregateRating it may unlock — is live in
    // seconds instead of waiting out the hourly revalidate window.
    revalidatePath(PUBLIC_PAGE);

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("admin audit-reviews POST failed:", err);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
