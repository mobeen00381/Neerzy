// src/app/api/admin/leads/followup/route.ts
import { NextResponse } from "next/server";
import {
  IS_ADMIN_CONFIGURED,
  adminNotConfigured,
  adminUnauthorized,
  getAdminSupabase,
  verifyAdminRequest,
} from "@/lib/admin-server";
import { isEmailSuppressed, logEmailSend, redact, sendEmail } from "@/lib/email";
import { auditFollowupEmailContent } from "@/lib/email-templates";
import { auditReportUrl } from "@/lib/audit-lead";

/**
 * POST /api/admin/leads/followup
 * Sends the human follow-up email for one lead (the "Email follow-up" action on
 * an Admin -> Leads row). Admin-guarded, one email per call, and every attempt
 * is recorded in public.email_log so the pipeline shows what was actually sent.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  try {
    const body: any = await req.json().catch(() => ({}));
    const leadId = String(body.leadId || "").trim();
    const message = String(body.message || "").trim();
    const subject = String(body.subject || "").trim();

    if (!leadId) return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
    if (message.length < 5) {
      return NextResponse.json({ error: "Write a short message first." }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Keep the message under 2000 characters." },
        { status: 400 }
      );
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .select("id, name, email, business_name, place_id, audit_score, report_link")
      .eq("id", leadId)
      .maybeSingle();

    if (error) throw error;
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const email = String(lead.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "This lead has no email address - add one before sending a follow-up." },
        { status: 400 }
      );
    }

    // The do-not-email list outranks the admin: an unsubscribe, a hard bounce or a
    // spam complaint is the recipient's decision, so this stops here with a clear
    // 409 instead of quietly burning the sending domain's reputation.
    if (await isEmailSuppressed(email)) {
      return NextResponse.json(
        {
          error:
            "This address is on the do-not-email list (unsubscribed, bounced or marked as spam), so no follow-up was sent. Use a different address if they asked you to.",
        },
        { status: 409 }
      );
    }

    // Prefer the link stored at capture time; rebuild it for older audit leads.
    const reportUrl =
      String(lead.report_link || "").trim() ||
      (lead.place_id ? auditReportUrl(String(lead.place_id), lead.business_name) : null);

    const content = auditFollowupEmailContent({
      businessName: lead.business_name,
      score: typeof lead.audit_score === "number" ? lead.audit_score : null,
      message,
      reportUrl,
      subject: subject || null,
    });

    const result = await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      template: "audit_followup",
    });

    await logEmailSend({
      emailType: "audit_followup",
      channel: "email",
      leadId: lead.id,
      toEmail: email,
      providerId: result.id ?? null,
      status: result.ok ? "sent" : "failed",
      error: result.ok ? null : result.error || "send failed",
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "The email provider rejected the send." },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`admin/leads/followup error: ${redact(String(error?.message || error))}`);
    return NextResponse.json({ error: "Failed to send follow-up" }, { status: 500 });
  }
}
