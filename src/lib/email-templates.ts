// src/lib/email-templates.ts
/**
 * HTML + plain-text builders for onboarding & lead automation emails.
 * Every builder returns { subject, html, text } ready for sendEmail().
 *
 * Safety rules:
 *  - every dynamic value is escaped: escapeHtml() in HTML bodies,
 *    textLine() in plain-text bodies (also strips CR/LF),
 *  - subjects go through subjectLine() (strips CR/LF and angle brackets)
 *    so no header/body injection is possible,
 *  - names that came from an untrusted submission go through
 *    safeDisplayName() first (drops links / emails, caps length at 40).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.neerzy.com";

const ACCENT = "#0A2E22";
const MUTED = "#5B6B64";

/** Max length of any user-supplied display name rendered in an email. */
const MAX_DISPLAY_NAME = 40;

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Escapes a dynamic value for safe interpolation into HTML bodies. */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Makes a dynamic value safe for a subject line: strips CR/LF and angle brackets. */
export function subjectLine(value: string): string {
  return String(value).replace(/[\r\n<>]+/g, " ").trim();
}

/** Makes a dynamic value safe for a plain-text body line. */
function textLine(value: string): string {
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

/**
 * Sanitizes an untrusted display name:
 *  - removes any token containing http/https, "www." or "@" (links, emails),
 *  - collapses whitespace / removes CR-LF-tabs,
 *  - caps the result at 40 characters.
 * Returns "" when nothing usable survives, so callers can fall back to "there".
 */
export function safeDisplayName(raw?: string | null): string {
  return String(raw || "")
    .replace(/\S*https?\S*/gi, " ")
    .replace(/\S*www\.\S*/gi, " ")
    .replace(/\S*@\S*/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DISPLAY_NAME)
    .trim();
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:${ACCENT};border-radius:8px;">
    <a href="${href}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-weight:700;text-decoration:none;">${label}</a>
  </td></tr></table>`;
}

/** Shared email shell. Optional CTA button + footer note (e.g. unsubscribe). */
function shell(
  title: string,
  bodyHtml: string,
  opts?: { cta?: { href: string; label: string }; footerExtra?: string }
): string {
  const cta = opts?.cta ? button(opts.cta.href, opts.cta.label) : "";
  const footerExtra = opts?.footerExtra
    ? `<p style="margin:8px 0 0 0;font-size:11px;color:${MUTED};">${opts.footerExtra}</p>`
    : "";
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F7F9F8;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #E1E8E4;">
      <tr><td style="padding:28px 32px 8px 32px;">
        <span style="font-size:20px;font-weight:800;color:${ACCENT};">Neerzy</span>
      </td></tr>
      <tr><td style="padding:8px 32px 28px 32px;">
        <h1 style="margin:0 0 16px 0;font-size:20px;color:${ACCENT};">${title}</h1>
        ${bodyHtml}
        ${cta}
      </td></tr>
      <tr><td style="padding:16px 32px 24px 32px;border-top:1px solid #E1E8E4;">
        <p style="margin:0;font-size:12px;color:${MUTED};">
          Neerzy - turn every job into more calls via Google<br/>
          <a href="${APP_URL}" style="color:${MUTED};">${APP_URL}</a>
        </p>
        ${footerExtra}
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** A) Welcome - sent once when the GMB connect succeeds (never at signup). */
export function welcomeEmailContent(businessName?: string | null): EmailContent {
  const name = escapeHtml(businessName || "there");
  const bodyHtml =
    `<p style="margin:0 0 12px 0;color:${ACCENT};">Hi ${name},</p>` +
    `<p style="margin:0 0 16px 0;color:${ACCENT};">Your Google Business Profile is now connected to Neerzy - everything you post through Neerzy goes straight to Google.</p>` +
    `<p style="margin:0 0 8px 0;color:${ACCENT};font-weight:700;">Your free trial includes:</p>` +
    `<ul style="margin:0;padding-left:20px;color:${ACCENT};">` +
    `<li style="margin-bottom:4px;"><strong>5 Google posts</strong> every 30 days</li>` +
    `<li><strong>5 review replies</strong> every 30 days</li>` +
    `</ul>`;
  return {
    subject: subjectLine("Your Google Business Profile is connected"),
    html: shell("Your Google Business Profile is connected", bodyHtml, {
      cta: { href: `${APP_URL}/dashboard`, label: "Create your first post" },
    }),
    text: [
      `Hi ${textLine(businessName || "there")},`,
      ``,
      `Your Google Business Profile is now connected to Neerzy - everything you post through Neerzy goes straight to Google.`,
      ``,
      `Your free trial includes 5 Google posts and 5 review replies every 30 days.`,
      ``,
      `Create your first post: ${APP_URL}/dashboard`,
    ].join("\n"),
  };
}

/** B) How-to - sent ~24h after connect if the user has used 0 posts/reviews. */
export function howtoEmailContent(businessName?: string | null): EmailContent {
  const name = escapeHtml(businessName || "there");
  const steps: Array<[string, string]> = [
    ["1. Post weekly", "Businesses that post weekly look active to customers - and to Google. One job photo is all it takes."],
    ["2. Reply to every review", "A short reply shows future customers you care. Even a simple thank-you works."],
    ["3. Answer leads fast", "Most customers call the first business that responds. Reply within minutes, not hours."],
  ];
  const bodyHtml =
    `<p style="margin:0 0 16px 0;color:${ACCENT};">Hi ${name}, you connected your Google Business Profile recently but have not posted yet. Here are the 3 habits that get local businesses more calls:</p>` +
    steps.map(([t, d]) => `<p style="margin:0 0 10px 0;color:${ACCENT};"><strong>${t}</strong><br/><span style="color:${MUTED};">${d}</span></p>`).join("");
  const footerExtra = `You are getting this because you connected your Google Business Profile to Neerzy. Reply "unsubscribe" and we will not send tips like this again.`;
  return {
    subject: subjectLine("3 ways to get more customers from Google this week"),
    html: shell("Get the most out of Neerzy", bodyHtml, {
      cta: { href: APP_URL, label: "Open Neerzy" },
      footerExtra,
    }),
    text: [
      `Hi ${textLine(businessName || "there")},`,
      ``,
      `You connected your Google Business Profile recently but have not posted yet. The 3 habits that get local businesses more calls:`,
      ``,
      `1. Post weekly - recent posts keep your profile looking active.`,
      `2. Reply to every review - even a simple thank-you works.`,
      `3. Answer leads fast - most customers call the first business that responds.`,
      ``,
      `Open Neerzy: ${APP_URL}`,
      ``,
      `Reply "unsubscribe" and we will not send tips like this again.`,
    ].join("\n"),
  };
}

/**
 * C) Lead ack - instant, FIXED text, no links, and no echo of user-supplied
 * details beyond a sanitized name (max 40 chars, links/emails stripped).
 * serviceType is intentionally NOT rendered (abuse / injection surface).
 */
export function leadAckEmailContent(leadName?: string | null): EmailContent {
  const name = safeDisplayName(leadName);
  const greetingHtml = name ? `Hi ${escapeHtml(name)},` : "Hi there,";
  const greetingText = name ? `Hi ${name},` : "Hi there,";
  const bodyLine = "Thanks for reaching out. We have received your request and a member of our team will get back to you shortly.";
  const html = shell(
    "Thanks - we got your request",
    `<p style="margin:0 0 12px 0;color:${ACCENT};">${greetingHtml}</p>` +
      `<p style="margin:0 0 12px 0;color:${ACCENT};">${bodyLine}</p>` +
      `<p style="margin:0;color:${ACCENT};">- The Neerzy Team</p>`
  );
  const text = [greetingText, ``, bodyLine, ``, `- The Neerzy Team`].join("\n");
  return { subject: subjectLine("We received your request"), html, text };
}

/** D) Admin notification - a new lead arrived; AI draft waiting in Admin -> Leads. */
export function adminLeadNotifyEmailContent(lead: {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  businessName?: string | null;
  serviceType?: string | null;
  source?: string | null;
}): EmailContent {
  const rows: Array<[string, string]> = [
    ["Name", lead.name || "-"],
    ["Phone", lead.phone || "-"],
    ["Email", lead.email || "-"],
    ["Business", lead.businessName || "-"],
    ["Service", lead.serviceType || "-"],
    ["Source", lead.source || "-"],
  ];
  const tableHtml = rows
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:${MUTED};font-size:13px;">${k}</td><td style="padding:4px 0;color:${ACCENT};font-size:13px;font-weight:600;">${escapeHtml(v)}</td></tr>`)
    .join("");
  const bodyHtml =
    `<p style="margin:0 0 12px 0;color:${ACCENT};">A new lead just arrived. An AI-drafted reply is waiting for your approval.</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">${tableHtml}</table>`;
  // Subject uses a sanitized name so a junk submission cannot inject a subject.
  const subjectName = safeDisplayName(lead.name) || safeDisplayName(lead.phone) || "unknown";
  return {
    subject: subjectLine(`New lead: ${subjectName}`),
    html: shell("New lead received", bodyHtml, { cta: { href: `${APP_URL}/admin`, label: "Open Admin - Leads" } }),
    text: [
      `New lead received:`,
      ...rows.map(([k, v]) => `${k}: ${textLine(v)}`),
      ``,
      `AI draft ready - open Admin -> Leads: ${APP_URL}/admin`,
    ].join("\n"),
  };
}
