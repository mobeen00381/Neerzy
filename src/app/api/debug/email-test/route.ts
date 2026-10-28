// src/app/api/debug/email-test/route.ts
// TODO(M1-cleanup): DELETE THIS FILE after Milestone 1 validation.
/**
 * DEV-ONLY smoke test for the Resend email pipeline (Milestone 1).
 *
 * Auth: requires CRON_SECRET via "Authorization: Bearer <secret>" or "x-cron-secret".
 * Recipient: ALWAYS ADMIN_EMAIL - the request body cannot pick a recipient.
 * In production it additionally requires AUTOMATION_DRY_RUN=1 (preview mode).
 *
 * POST { template?: "welcome" | "howto" | "lead_ack" | "admin_notify" }
 */
import { NextResponse } from "next/server";
import { isDryRun, logEmailSend, sendEmail } from "@/lib/email";
import {
  adminLeadNotifyEmailContent,
  howtoEmailContent,
  leadAckEmailContent,
  welcomeEmailContent,
} from "@/lib/email-templates";

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false; // never run unprotected
  const bearer = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const headerSecret = req.headers.get("x-cron-secret") || "";
  return bearer === secret || headerSecret === secret;
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && !isDryRun()) {
    return NextResponse.json(
      { error: "Disabled in production. Set AUTOMATION_DRY_RUN=1 to preview." },
      { status: 403 }
    );
  }
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Recipient is pinned to the admin inbox - body.to is ignored on purpose.
  const to = (process.env.ADMIN_EMAIL || "").trim();
  if (!to) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL is not set - test emails are restricted to the admin inbox." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({} as any));
  const template = String(body.template || "welcome");

  const content =
    template === "howto" ? howtoEmailContent("Test Business")
    : template === "lead_ack" ? leadAckEmailContent("Sam")
    : template === "admin_notify" ? adminLeadNotifyEmailContent({
        name: "Sam", phone: "+15551230000", email: "lead@example.com",
        businessName: "Test Business", serviceType: "boiler repair", source: "organic",
      })
    : welcomeEmailContent("Test Business");

  const result = await sendEmail({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    template,
  });

  // Real sends are audited; DRY_RUN skips the write entirely (see logEmailSend).
  await logEmailSend({
    emailType: template === "lead_ack" ? "lead_ack"
      : template === "admin_notify" ? "lead_owner_notify"
      : template === "howto" ? "howto"
      : "welcome",
    toEmail: to,
    providerId: result.id ?? null,
    status: result.ok ? "sent" : "failed",
    error: result.error ?? null,
  });

  // Response carries NO secrets and no raw error objects - message only.
  return NextResponse.json({
    template,
    dryRun: isDryRun(),
    ok: result.ok,
    id: result.id ?? null,
    error: result.error ?? null,
  });
}
