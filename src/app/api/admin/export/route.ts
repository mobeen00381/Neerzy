import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  getAllAuthEmails,
} from "@/lib/admin-server";

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(",")];
  for (const row of rows) lines.push(row.map(esc).join(","));
  return "\uFEFF" + lines.join("\r\n");
}

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") || "").toLowerCase();
  const supabase = getAdminSupabase();

  try {
    if (type === "users") {
      const { data: profiles } = await supabase
        .from("profiles").select("*").order("created_at", { ascending: false });
      const emailMap = await getAllAuthEmails(supabase);
      const rows = (profiles || []).map((p: any) => [
        emailMap.get(p.id) || p.phone || "",
        p.phone || "",
        p.business_name || p.company_name || "",
        p.selected_plan || "free",
        p.signup_source || p.utm_source || "",
        p.utm_campaign || "",
        p.gbp_connected ? "yes" : "no",
        p.created_at || "",
      ]);
      const csv = toCsv(
        ["email", "phone", "business_name", "plan", "source", "campaign", "gbp_connected", "created_at"],
        rows
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="neerzy-users-${Date.now()}.csv"`,
        },
      });
    }

    if (type === "transactions") {
      const { data: tx } = await supabase
        .from("transactions").select("*").order("occurred_at", { ascending: false });
      const userIds = [...new Set((tx || []).map((t: any) => t.user_id).filter(Boolean))] as string[];
      const emailMap = userIds.length ? await getAllAuthEmails(supabase) : new Map<string, string>();
      const rows = (tx || []).map((t: any) => [
        t.email || (t.user_id ? emailMap.get(t.user_id) || "" : ""),
        t.event_type || "",
        t.plan || "",
        t.amount !== null && t.amount !== undefined ? String(t.amount) : "",
        t.currency || "",
        t.origin || "",
        t.status || "",
        t.occurred_at || "",
      ]);
      const csv = toCsv(
        ["email", "event_type", "plan", "amount", "currency", "origin", "status", "occurred_at"],
        rows
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="neerzy-transactions-${Date.now()}.csv"`,
        },
      });
    }

    // type === 'leads' (default)
    const { data: leads } = await supabase
      .from("leads").select("*").order("created_at", { ascending: false });
    const rows = (leads || []).map((l: any) => [
      l.name || "",
      l.phone || "",
      l.email || "",
      l.business_name || "",
      l.source || "",
      l.utm_source || "",
      l.utm_campaign || "",
      l.status || "",
      l.notes || "",
      l.created_at || "",
    ]);
    const csv = toCsv(
      ["name", "phone", "email", "business_name", "source", "utm_source", "utm_campaign", "status", "notes", "created_at"],
      rows
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="neerzy-leads-${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("admin/export error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Export failed" }, { status: 500 });
  }
}
