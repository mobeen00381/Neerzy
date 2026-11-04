import { NextResponse } from "next/server";
import { guardPublicRequest, REPORT_SEND_LIMIT } from "@/lib/api-guard";
import { detailCacheKey, getCached } from "@/lib/places-cache";
import { attachAuditLeadContact, auditReportUrl, isMockPlaceId } from "@/lib/audit-lead";
import { logEmailSend, redact, sendEmail } from "@/lib/email";
import { auditReportEmailContent } from "@/lib/email-templates";
import { makeUnlockToken } from "@/lib/report-unlock";
import { sendMetaTemplate } from "@/lib/whatsapp";

/**
 * Optional layer of the audit funnel: "send me this report" (email / WhatsApp).
 *
 * The lead itself is already captured by /api/audit/run - this route only adds
 * the contact the visitor volunteered and delivers a link-only card. Nothing is
 * rendered to an image: the results page re-runs the live audit, so the email
 * always matches the report and no storage bucket is involved.
 *
 * This is also the only place that hands out the unlock token: the link carries
 * `&t=...`, which is what makes /api/audit/run return the full fix list. Handing
 * over a contact is the price of the report, and the token is the receipt.
 *
 * Guarded with REPORT_SEND_LIMIT (4/hour per IP): every accepted request costs
 * one Resend or Meta call, and no visitor needs more than a couple of attempts.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOO_MANY_SENDS = "Too many report sends from this device - please try again later.";

/** Meta template approved in Business Manager (variables 1-4, see .env.example). */
const WHATSAPP_TEMPLATE = process.env.META_TEMPLATE_AUDIT_REPORT || "audit_report_link";
const WHATSAPP_TEMPLATE_LANG = process.env.META_TEMPLATE_AUDIT_REPORT_LANG || "en";

interface ReportSummary {
  score: number | null;
  rating: number | null;
  reviewCount: number | null;
  /** Local SEO / AEO / GEO, straight from the cached report. */
  sections: Array<{ label: string; score: number; measurable: boolean }>;
  /** Roadmap actions, red flags first. */
  actions: string[];
}

const EMPTY_SUMMARY: ReportSummary = {
  score: null,
  rating: null,
  reviewCount: null,
  sections: [],
  actions: [],
};

const SECTION_ORDER = ["local_seo", "aeo", "geo"] as const;

/**
 * Rebuilds the three scores and the top fixes from the 10-minute audit cache, so
 * the email shows the same numbers the visitor is looking at. A cache miss is
 * harmless - the email then simply links to the live report.
 */
function reportSummaryFromCache(placeId: string): ReportSummary {
  const cached = getCached<any>(detailCacheKey("audit:run", placeId));
  const report = cached?.report;
  if (!report?.sections || !report?.scores) return EMPTY_SUMMARY;

  const sections = SECTION_ORDER.map((key) => {
    const section = report.sections[key];
    return {
      label: String(section?.label || key),
      score: Math.round(Number(section?.score) || 0),
      measurable: Boolean(section?.measurable),
    };
  });

  // Red first, then amber: the email only ever lists work worth doing now.
  const roadmap: any[] = Array.isArray(report.roadmap) ? report.roadmap : [];
  const actions = [...roadmap.filter((step) => step?.priority === "red"), ...roadmap.filter((step) => step?.priority === "amber")]
    .map((step) => String(step?.action || step?.label || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    score: Number.isFinite(Number(report.scores.overall)) ? Math.round(Number(report.scores.overall)) : null,
    rating: Number(report?.facts?.rating) || null,
    reviewCount: Number(report?.facts?.reviewCount) || null,
    sections,
    actions,
  };
}

export async function POST(req: Request) {
  try {
    const guard = await guardPublicRequest(
      req,
      "audit:report-send",
      REPORT_SEND_LIMIT,
      TOO_MANY_SENDS
    );
    if (!guard.allowed) return guard.response;

    const body: any = await req.json().catch(() => ({}));
    const placeId = String(body.placeId || "").trim();
    const channel = String(body.channel || "email").trim().toLowerCase();
    const businessName = String(body.businessName || "").trim().slice(0, 120) || null;

    if (isMockPlaceId(placeId)) {
      return NextResponse.json(
        { error: "Run a live audit first - this sample report has no shareable link." },
        { status: 400 }
      );
    }
    if (channel !== "email" && channel !== "whatsapp") {
      return NextResponse.json({ error: "Unknown delivery channel" }, { status: 400 });
    }

    const unlockToken = makeUnlockToken(placeId);
    const reportUrl = auditReportUrl(placeId, businessName, unlockToken);

    if (channel === "email") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email) || email.length > 254) {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      }

      const summary = reportSummaryFromCache(placeId);
      const content = auditReportEmailContent({
        businessName,
        score: summary.score,
        rating: summary.rating,
        reviewCount: summary.reviewCount,
        sections: summary.sections,
        actions: summary.actions,
        reportUrl,
      });

      const result = await sendEmail({
        to: email,
        subject: content.subject,
        html: content.html,
        text: content.text,
        template: "audit_report",
      });

      // The visitor volunteered this address: keep it on the lead even when the
      // provider hiccups, so the admin can still reach them manually.
      const attach = await attachAuditLeadContact({ placeId, email });

      await logEmailSend({
        emailType: "audit_report",
        channel: "email",
        leadId: attach.leadId ?? null,
        toEmail: email,
        providerId: result.id ?? null,
        status: result.ok ? "sent" : "failed",
        error: result.ok ? null : result.error || "send failed",
      });

      if (!result.ok) {
        return NextResponse.json(
          { error: "We couldn't send that email right now - please try again in a moment." },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, channel: "email", reportUrl, unlock: unlockToken });
    }

    // ── WhatsApp ────────────────────────────────────────────────────────────
    // Needs a Meta MARKETING template (variables: greeting, business, score,
    // link). Until one is approved this branch answers 409 and the card falls
    // back to email - the code is dormant, not broken.
    const phone = String(body.phone || "").replace(/[^\d]/g, "");
    if (phone.length < 8 || phone.length > 15) {
      return NextResponse.json(
        { error: "Enter a valid mobile number including the country code." },
        { status: 400 }
      );
    }

    const summary = reportSummaryFromCache(placeId);
    const scoreText = summary.score === null ? "-" : String(summary.score);

    try {
      await sendMetaTemplate({
        to: phone,
        templateName: WHATSAPP_TEMPLATE,
        languageCode: WHATSAPP_TEMPLATE_LANG,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: businessName || "there" }, // {{1}} greeting
              { type: "text", text: businessName || "your business" }, // {{2}} business
              { type: "text", text: scoreText }, // {{3}} score /100
              { type: "text", text: reportUrl }, // {{4}} report link
            ],
          },
        ],
      });
    } catch (error: any) {
      const message = redact(String(error?.message || error));
      console.error(`[AuditReport] WhatsApp template failed: ${message}`);
      const attach = await attachAuditLeadContact({ placeId, phone });
      await logEmailSend({
        emailType: "audit_report",
        channel: "whatsapp",
        leadId: attach.leadId ?? null,
        status: "failed",
        error: message,
      });
      return NextResponse.json(
        { error: "WhatsApp delivery isn't available right now - please use email instead." },
        { status: 409 }
      );
    }

    const attach = await attachAuditLeadContact({ placeId, phone });
    await logEmailSend({
      emailType: "audit_report",
      channel: "whatsapp",
      leadId: attach.leadId ?? null,
      status: "sent",
    });

    return NextResponse.json({
      success: true,
      channel: "whatsapp",
      reportUrl,
      unlock: unlockToken,
    });
  } catch (error: any) {
    console.error(`[AuditReport] send failed: ${redact(String(error?.message || error))}`);
    return NextResponse.json({ error: "Could not send the report" }, { status: 500 });
  }
}

