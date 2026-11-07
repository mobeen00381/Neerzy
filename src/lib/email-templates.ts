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

import { COMPANY } from "./company";
import { OFFER_LINES, OFFER_NUMBERS, OFFER_PUBLISH_NOTE } from "./automation/offer-facts";
import { buildUnsubscribeUrl } from "./unsubscribe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.neerzy.com";

const ACCENT = "#0A2E22";
const MUTED = "#5B6B64";

/**
 * Postal address shown in every email footer. COMPANY.fullAddress is the source
 * of truth; there is no env override today (BUSINESS_POSTAL_ADDRESS is not
 * referenced anywhere in the project), so nobody can silently ship a stale
 * address through a forgotten env var.
 */
const FOOTER_ADDRESS_HTML = COMPANY.addressLines
  .map((line) => escapeHtml(line))
  .join("<br/>");

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
        <p style="margin:8px 0 0 0;font-size:11px;line-height:1.5;color:${MUTED};">
          ${FOOTER_ADDRESS_HTML}
        </p>
        ${footerExtra}
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
/**
 * Footer INNER block for MARKETING mail only (tips, previews, sequences).
 *
 * It renders the unsubscribe sentence + link and nothing else: the postal
 * address and the "Neerzy" identity line are already printed by shell() from
 * COMPANY (lib/company.ts), so repeating them here would duplicate the address
 * in every marketing email. Pass it as shell()'s `footerExtra` (which supplies
 * the surrounding paragraph), never as a full <p> of its own.
 *
 * Pair it with `sendEmail({ ..., marketing: true })`, which also adds the
 * machine-readable List-Unsubscribe / List-Unsubscribe-Post headers for the same
 * address. Plain-text emails use `buildUnsubscribeUrl(email)` directly.
 */
export function marketingFooter(email: string): string {
  const url = buildUnsubscribeUrl(email);
  return (
    `You are getting this because you asked for tips about your Google Business Profile. ` +
    `<a href="${escapeHtml(url)}" style="color:${MUTED};">Unsubscribe</a>.`
  );
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

/**
 * E) Audit report link - sent to a visitor who asked for their report by email.
 * Link-only on purpose: the report is live, so the email stays short and the
 * score/detail always match what the tool currently shows.
 */
export function auditReportEmailContent(report: {
  businessName?: string | null;
  score?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  /** The three scored surfaces (Local SEO / AEO / GEO), in report order. */
  sections?: Array<{ label: string; score: number; measurable: boolean }>;
  /** The roadmap's top actions, red flags first. */
  actions?: string[];
  reportUrl: string;
  /** Free website preview builder. Defaults to /website-builder. */
  previewUrl?: string | null;
}): EmailContent {
  const business = safeDisplayName(report.businessName) || "your business";
  const score =
    typeof report.score === "number" && Number.isFinite(report.score)
      ? Math.round(report.score)
      : null;
  const sections = (report.sections || []).slice(0, 3);
  const actions = (report.actions || [])
    .map((a) => String(a || "").replace(/[\r\n]+/g, " ").trim().slice(0, 140))
    .filter(Boolean)
    .slice(0, 3);

  const heading =
    score === null ? "Your Google Business Profile report" : `Your profile scores ${score}/100`;

  const scoreHtml =
    score === null
      ? ""
      : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;"><tr>` +
        `<td style="background:#F7F9F8;border:1px solid #E1E8E4;border-radius:10px;padding:14px 22px;text-align:center;">` +
        `<span style="display:block;font-size:32px;font-weight:800;color:${ACCENT};line-height:1.1;">${score}<span style="font-size:15px;font-weight:700;color:${MUTED};">/100</span></span>` +
        `<span style="display:block;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${MUTED};margin-top:4px;">GBP audit score</span>` +
        `</td></tr></table>`;

  // Three surfaces, not five categories: Local SEO (50%), AEO (25%), GEO (25%).
  // A surface we could not verify is printed as "not measured" rather than 0, so
  // the email can never accuse a business of failing something we never saw.
  const sectionsHtml =
    sections.length === 0
      ? ""
      : `<p style="margin:0 0 8px 0;color:${ACCENT};font-weight:700;">Where you stand:</p>` +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;width:100%;">` +
        sections
          .map(
            (s) =>
              `<tr><td style="padding:3px 12px 3px 0;color:${MUTED};font-size:13px;">${escapeHtml(
                String(s.label).slice(0, 24)
              )}</td><td style="padding:3px 0;color:${ACCENT};font-size:13px;font-weight:700;text-align:right;white-space:nowrap;">${
                s.measurable ? `${Math.round(Number(s.score) || 0)}/100` : "not measured"
              }</td></tr>`
          )
          .join("") +
        `</table>`;

  const actionsHtml =
    actions.length === 0
      ? ""
      : `<p style="margin:0 0 8px 0;color:${ACCENT};font-weight:700;">Fix these first:</p>` +
        `<ul style="margin:0 0 4px 0;padding-left:20px;color:${ACCENT};">` +
        actions.map((a) => `<li style="margin-bottom:4px;font-size:14px;">${escapeHtml(a)}</li>`).join("") +
        `</ul>`;

  const websiteUrl = httpUrl(report.previewUrl, `${APP_URL}/website-builder`);
  const websiteHtml =
    `<p style="margin:18px 0 0 0;padding:14px 16px;background:#F7F9F8;border:1px solid #E1E8E4;border-radius:10px;color:${ACCENT};font-size:14px;">` +
    `<strong>Want the website too?</strong> We build the page from your Google listing: the build and the preview cost nothing. ` +
    `Publishing is the ${escapeHtml(OFFER_NUMBERS.publish)} domain, once, in your name - hosting is free for the first ${escapeHtml(
      OFFER_NUMBERS.hostingFree
    )}. ` +
    `<a href="${escapeHtml(websiteUrl)}" style="color:${ACCENT};font-weight:700;">Build the free preview</a>` +
    `</p>`;

  const bodyHtml =
    `<p style="margin:0 0 12px 0;color:${ACCENT};">Hi there,</p>` +
    `<p style="margin:0 0 16px 0;color:${ACCENT};">Here is the audit you asked for - <strong>${escapeHtml(
      business
    )}</strong>.</p>` +
    scoreHtml +
    sectionsHtml +
    actionsHtml +
    `<p style="margin:0;color:${ACCENT};">The full report has every check, which ones are red, and the order to fix them in.</p>` +
    websiteHtml;

  const footerExtra =
    "This link always opens your live report, so you can re-check it after making changes. If you did not request it, just ignore this email.";

  const metaBits: string[] = [];
  if (typeof report.rating === "number" && report.rating > 0) {
    metaBits.push(`${report.rating.toFixed(1)}* rating`);
  }
  if (typeof report.reviewCount === "number" && report.reviewCount > 0) {
    metaBits.push(`${Math.round(report.reviewCount)} reviews`);
  }

  return {
    subject: subjectLine(`Your Google Business Profile audit - ${business}`),
    html: shell(heading, bodyHtml, {
      cta: { href: report.reportUrl, label: "View the full report" },
      footerExtra,
    }),
    text: [
      "Hi there,",
      ``,
      `Here is the audit you asked for - ${textLine(business)}.`,
      ...(score === null ? [] : [``, `GBP audit score: ${score}/100`]),
      ...(sections.length === 0
        ? []
        : [
            `Scores:`,
            ...sections.map(
              (s) =>
                `- ${textLine(s.label)}: ${
                  s.measurable ? `${Math.round(Number(s.score) || 0)}/100` : "not measured"
                }`
            ),
          ]),
      ...(metaBits.length === 0 ? [] : [`Google rating: ${metaBits.join(" / ")}`]),
      ...(actions.length === 0
        ? []
        : [``, `Fix these first:`, ...actions.map((a, i) => `${i + 1}. ${textLine(a)}`)]),
      ``,
      `View the full report: ${report.reportUrl}`,
      ``,
      "This link always opens your live report, so you can re-check it after making changes.",
      ``,
      `Want the website too? The build and preview are free; publishing is the ${OFFER_NUMBERS.publish} domain, once, in your name, and hosting is free for the first ${OFFER_NUMBERS.hostingFree}.`,
      `Build the free preview: ${websiteUrl}`,
    ].join("\n"),
  };
}

/**
 * F) Admin follow-up - a human reply from Admin -> Leads about an audit report.
 * The message is admin free text: escaped for HTML, blank-line aware, CR/LF-safe
 * in plain text, and capped at 2000 chars so a pasted document cannot turn into
 * a mail bomb. The report link is only accepted when it is a real http(s) URL,
 * so the template can never be used to smuggle a `javascript:` href.
 */
export function auditFollowupEmailContent(input: {
  businessName?: string | null;
  score?: number | null;
  message: string;
  reportUrl?: string | null;
  subject?: string | null;
}): EmailContent {
  const business = safeDisplayName(input.businessName) || "your business";
  const raw = String(input.message || "").replace(/\r\n?/g, "\n").trim().slice(0, 2000);
  const paragraphs = raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const score =
    typeof input.score === "number" && Number.isFinite(input.score)
      ? Math.round(input.score)
      : null;
  const candidateUrl = String(input.reportUrl || "").trim();
  const reportUrl = /^https?:\/\/\S+$/i.test(candidateUrl)
    ? candidateUrl
    : `${APP_URL}/gmb-audit-tool`;

  const bodyHtml =
    `<p style="margin:0 0 12px 0;color:${ACCENT};">Hi there,</p>` +
    paragraphs
      .map(
        (p) =>
          `<p style="margin:0 0 12px 0;color:${ACCENT};">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`
      )
      .join("") +
    (score === null
      ? ""
      : `<p style="margin:0 0 12px 0;color:${MUTED};font-size:13px;">Current GBP audit score for ${escapeHtml(
          business
        )}: <strong style="color:${ACCENT};">${score}/100</strong></p>`) +
    `<p style="margin:0;color:${ACCENT};">- The Neerzy Team</p>`;

  const footerExtra = "You are getting this because you ran a free Google Business Profile audit on neerzy.com.";

  const subject = subjectLine(
    input.subject || `About your Google Business Profile audit - ${business}`
  ).slice(0, 140);

  return {
    subject,
    html: shell(`Your GBP audit - ${business}`, bodyHtml, {
      cta: { href: reportUrl, label: "Open your report" },
      footerExtra,
    }),
    text: [
      "Hi there,",
      ``,
      ...paragraphs.map((p) => textLine(p)),
      ...(score === null ? [] : [``, `Current GBP audit score: ${score}/100`]),
      ``,
      "- The Neerzy Team",
      ``,
      `Open your report: ${reportUrl}`,
    ].join("\n"),
  };
}

/**
 * G) AUTOMATION SEQUENCES - the one place the drip copy lives.
 *
 * One entry point (`sequenceEmailContent`) covers every step in
 * lib/automation/sequences.ts, so the drainer never builds HTML and the copy for
 * "day 3" cannot drift between the hot and warm plans. The step key decides the
 * message; an unknown key, or a review step with no review link configured,
 * returns null and the drainer skips the row instead of sending something vague.
 *
 * Rules the copy follows:
 *  - money always comes from OFFER_FACTS (offer-facts.ts), never from a literal,
 *  - nothing is claimed about the business that the audit did not measure: the
 *    score, the rating and the review count are the only personal numbers used,
 *  - nothing is claimed about how Google works that we cannot stand behind: no
 *    "this is a ranking signal" promises, no "you will show up in search" -
 *    advice only. Timing words stay vague ("recently"), because the drainer may
 *    send a step days after the audit (a paused queue, a failed retry),
 *  - every step is marketing mail, so every step carries the unsubscribe block
 *    and the RFC 8058 headers (the drainer sends them with marketing: true).
 */
export interface SequenceEmailInput {
  /** hot_d1 | hot_d3 | hot_d7 | warm_d2 | warm_d6 | review_d5 */
  stepKey: string;
  businessName?: string | null;
  /** GBP audit score, 0-100. */
  score?: number | null;
  reviewCount?: number | null;
  rating?: number | null;
  /** FALSE = the listing has no website. null/undefined = never checked. */
  hasWebsite?: boolean | null;
  /** Live report link (carries the unlock token when the caller has one). */
  reportUrl?: string | null;
  /** Free website preview builder. */
  previewUrl?: string | null;
  /** Google review link. REQUIRED for review_d5 - no link, no email. */
  reviewUrl?: string | null;
  /** Recipient address, for the unsubscribe link. Marketing steps need it. */
  email?: string | null;
}

/** Accepts only real http(s) URLs so a template can never emit `javascript:`. */
function httpUrl(candidate: string | null | undefined, fallback: string): string {
  const value = String(candidate || "").trim();
  return /^https?:\/\/\S+$/i.test(value) ? value : fallback;
}

/** "4.8★ from 213 reviews" / "213 reviews" / "" - only what we actually know. */
function reviewLine(rating: number | null, reviews: number | null): string {
  if (rating !== null && reviews !== null && reviews > 0) {
    return `${rating.toFixed(1)}\u2605 from ${reviews} reviews`;
  }
  if (reviews !== null && reviews > 0) return `${reviews} reviews`;
  return "";
}

function priceListHtml(): string {
  return (
    `<ul style="margin:0 0 14px 0;padding-left:20px;color:${ACCENT};">` +
    OFFER_LINES.map(
      (line) => `<li style="margin-bottom:4px;font-size:14px;">${escapeHtml(line)}</li>`
    ).join("") +
    `</ul>`
  );
}

export function sequenceEmailContent(input: SequenceEmailInput): EmailContent | null {
  const step = String(input.stepKey || "").trim();
  const business = safeDisplayName(input.businessName) || "your business";
  const score =
    typeof input.score === "number" && Number.isFinite(input.score)
      ? Math.round(input.score)
      : null;
  const reviews =
    typeof input.reviewCount === "number" && Number.isFinite(input.reviewCount)
      ? Math.round(input.reviewCount)
      : null;
  const rating =
    typeof input.rating === "number" && Number.isFinite(input.rating) ? input.rating : null;
  const reportUrl = httpUrl(input.reportUrl, `${APP_URL}/gmb-audit-tool`);
  const previewUrl = httpUrl(input.previewUrl, `${APP_URL}/website-builder`);
  const email = String(input.email || "").trim();
  const unsubHtml = email ? marketingFooter(email) : "";
  const unsubText = email ? `Unsubscribe: ${buildUnsubscribeUrl(email)}` : "";
  const scoreText = score === null ? "" : `${score}/100`;
  const known = reviewLine(rating, reviews);

  switch (step) {
    // ── Day 1 (HOT): the first fixes ────────────────────────────────────────
    case "hot_d1": {
      const scoreLine =
        score === null
          ? `Recently you ran a free audit of <strong>${escapeHtml(business)}</strong> on Google.`
          : `Recently your profile for <strong>${escapeHtml(business)}</strong> scored <strong>${scoreText}</strong>.`;

      const bodyHtml =
        `<p style="margin:0 0 12px 0;color:${ACCENT};">Hi there,</p>` +
        `<p style="margin:0 0 16px 0;color:${ACCENT};">${scoreLine} A profile does not have to be perfect to bring in calls - it has to be complete and active.</p>` +
        `<p style="margin:0 0 8px 0;color:${ACCENT};font-weight:700;">The three that move the needle first:</p>` +
        `<ul style="margin:0 0 16px 0;padding-left:20px;color:${ACCENT};">` +
        `<li style="margin-bottom:4px;font-size:14px;">Finish every field - hours, services, areas, attributes. A complete profile gives customers more to work with.</li>` +
        `<li style="margin-bottom:4px;font-size:14px;">Add one real photo a week. Recent photos keep a listing looking open for business.</li>` +
        `<li style="margin-bottom:4px;font-size:14px;">Answer every review, good or bad. Customers read the reply as much as the review.</li>` +
        `</ul>` +
        `<p style="margin:0;color:${ACCENT};">Your full list is in the report - it is live, so re-run it once you have made changes.</p>`;

      return {
        subject: subjectLine(
          score === null
            ? `${business}: where to start on Google`
            : `${business}: your ${scoreText} profile - where to start`
        ),
        html: shell(`${business}: where to start`, bodyHtml, {
          cta: { href: reportUrl, label: "Open your report" },
          footerExtra: unsubHtml,
        }),
        text: [
          "Hi there,",
          ``,
          score === null
            ? `Recently you ran a free audit of ${textLine(business)} on Google.`
            : `Recently your profile for ${textLine(business)} scored ${scoreText}.`,
          ``,
          `A profile does not have to be perfect to bring in calls - it has to be complete and active.`,
          ``,
          `The three that move the needle first:`,
          `1. Finish every field - hours, services, areas, attributes.`,
          `2. Add one real photo a week.`,
          `3. Answer every review, good or bad.`,
          ``,
          `Your full report: ${reportUrl}`,
          ...(unsubText ? [``, unsubText] : []),
        ].join("\n"),
      };
    }

    // ── Day 2 (WARM): what is already working ───────────────────────────────
    case "warm_d2": {
      const praise =
        known
          ? `A ${known} is a real asset - most local businesses never get there.`
          : `You already have the hardest part: people who found you and left a review.`;
      const bodyHtml =
        `<p style="margin:0 0 12px 0;color:${ACCENT};">Hi there,</p>` +
        `<p style="margin:0 0 16px 0;color:${ACCENT};">This is a short one. When we audited <strong>${escapeHtml(
          business
        )}</strong>, the profile had more going for it than most. ${praise}</p>` +
        `<p style="margin:0 0 8px 0;color:${ACCENT};font-weight:700;">Two small things that usually help from here:</p>` +
        `<ul style="margin:0 0 16px 0;padding-left:20px;color:${ACCENT};">` +
        `<li style="margin-bottom:4px;font-size:14px;">Post something this week - a job, a photo, an offer. Regular activity keeps your profile looking current.</li>` +
        `<li style="margin-bottom:4px;font-size:14px;">Reply to the reviews you have not answered yet. It takes ten minutes, and the reply is the part new customers read first.</li>` +
        `</ul>` +
        `<p style="margin:0;color:${ACCENT};">The report has the rest, including anything that changed since you ran it.</p>`;

      return {
        subject: subjectLine(`${business}: what is already working on Google`),
        html: shell(`${business}: what is already working`, bodyHtml, {
          cta: { href: reportUrl, label: "Open your report" },
          footerExtra: unsubHtml,
        }),
        text: [
          "Hi there,",
          ``,
          `A short one. When we audited ${textLine(business)}, the profile had more going for it than most. ${praise}`,
          ``,
          `Two small things that usually help from here:`,
          `1. Post something this week - a job, a photo, an offer.`,
          `2. Reply to the reviews you have not answered yet.`,
          ``,
          `The report has the rest: ${reportUrl}`,
          ...(unsubText ? [``, unsubText] : []),
        ].join("\n"),
      };
    }

    // ── Day 3 (HOT): the missing website ────────────────────────────────────
    case "hot_d3": {
      const noSite = input.hasWebsite === false;
      // Two versions, because "you have no website" is only true when the audit
      // actually said so. has_website null means unknown, so the other wording
      // has to work whether or not a site exists.
      const opening = noSite
        ? `Your Google listing does not link to a website yet. When somebody finds you on the map and there is nowhere to click, the next listing is one tap away.`
        : `Your listing is doing the selling already. A one-page site that matches it gives people somewhere to land, and one place to read about the services you sell.`;
      const heading = noSite
        ? `${business}: nowhere to send your Google traffic`
        : `${business}: a page that matches your listing`;

      const bodyHtml =
        `<p style="margin:0 0 12px 0;color:${ACCENT};">Hi there,</p>` +
        `<p style="margin:0 0 16px 0;color:${ACCENT};">${escapeHtml(opening)}</p>` +
        `<p style="margin:0 0 16px 0;color:${ACCENT};">The page itself is the easy part: we build it for free from your Google listing, and you can look at it before deciding anything. ${escapeHtml(
          OFFER_PUBLISH_NOTE
        )}</p>` +
        `<p style="margin:0;color:${ACCENT};">No card, no call. If it is useful, publish it. If not, close the tab.</p>`;

      return {
        subject: subjectLine(heading),
        html: shell(heading, bodyHtml, {
          cta: { href: previewUrl, label: "Build the free preview" },
          footerExtra: unsubHtml,
        }),
        text: [
          "Hi there,",
          ``,
          textLine(opening),
          ``,
          `The page itself is the easy part: we build it for free from your Google listing, and you can look at it before deciding anything. ${OFFER_PUBLISH_NOTE}`,
          ``,
          `No card, no call. If it is useful, publish it. If not, close the tab.`,
          ``,
          `Build the free preview: ${previewUrl}`,
          ...(unsubText ? [``, unsubText] : []),
        ].join("\n"),
      };
    }

    // ── Day 6/7: what publishing actually costs ─────────────────────────────
    // Same message for both plans: the price question does not change with the
    // segment, and having one implementation means one number to correct.
    case "hot_d7":
    case "warm_d6": {
      const bodyHtml =
        `<p style="margin:0 0 12px 0;color:${ACCENT};">Hi there,</p>` +
        `<p style="margin:0 0 16px 0;color:${ACCENT};">One last note on the website, then we will leave it. In plain numbers, this is what a site for <strong>${escapeHtml(
          business
        )}</strong> costs:</p>` +
        priceListHtml() +
        `<p style="margin:0 0 16px 0;color:${ACCENT};">The build and the preview are the free part. The one-off payment is the <strong>${escapeHtml(
          OFFER_NUMBERS.publish
        )} domain</strong>, registered in your name - and hosting is free for the first ${escapeHtml(
          OFFER_NUMBERS.hostingFree
        )}, then ${escapeHtml(OFFER_NUMBERS.hostingMonthly)}, which you can stop whenever you like.</p>` +
        `<p style="margin:0;color:${ACCENT};">If the answer is "not now", that is fine - the preview stays where you left it.</p>`;

      return {
        subject: subjectLine(`What a website for ${business} actually costs`),
        html: shell(`What a website for ${business} actually costs`, bodyHtml, {
          cta: { href: previewUrl, label: "Build the free preview" },
          footerExtra: unsubHtml,
        }),
        text: [
          "Hi there,",
          ``,
          `One last note on the website, then we will leave it. In plain numbers, this is what a site for ${textLine(
            business
          )} costs:`,
          ...OFFER_LINES.map((line) => `- ${line}`),
          ``,
          `The build and the preview are the free part. The one-off payment is the ${OFFER_NUMBERS.publish} domain, registered in your name - and hosting is free for the first ${OFFER_NUMBERS.hostingFree}, then ${OFFER_NUMBERS.hostingMonthly}, which you can stop whenever you like.`,
          ``,
          `If the answer is "not now", that is fine - the preview stays where you left it.`,
          ``,
          `Build the free preview: ${previewUrl}`,
          ...(unsubText ? [``, unsubText] : []),
        ].join("\n"),
      };
    }

    // ── Day 5 (everyone): the review ask ────────────────────────────────────
    case "review_d5": {
      // No configured review link = no email. Sending "leave us a review" with
      // no button is worse than sending nothing, so the drainer skips the row.
      const reviewUrl = httpUrl(input.reviewUrl, "");
      if (!reviewUrl) return null;

      const bodyHtml =
        `<p style="margin:0 0 12px 0;color:${ACCENT};">Hi there,</p>` +
        `<p style="margin:0 0 16px 0;color:${ACCENT};">You asked us for an audit of <strong>${escapeHtml(
          business
        )}</strong> a few days ago. Quick favour: did it tell you anything you did not already know?</p>` +
        `<p style="margin:0 0 16px 0;color:${ACCENT};">If it did, a short review of Neerzy helps other owners find it. Two lines is plenty - and if it did not, reply and tell us why.</p>`;

      return {
        subject: subjectLine("Quick favour - did the audit help?"),
        html: shell("Quick favour - did the audit help?", bodyHtml, {
          cta: { href: reviewUrl, label: "Leave a short review" },
          // The review ask is marketing mail too, so it carries the same footer
          // as every other step: this address can always opt out in one click.
          footerExtra: unsubHtml,
        }),
        text: [
          "Hi there,",
          ``,
          `You asked us for an audit of ${textLine(business)} a few days ago. Quick favour: did it tell you anything you did not already know?`,
          ``,
          `If it did, a short review of Neerzy helps other owners find it. Two lines is plenty - and if it did not, reply and tell us why.`,
          ``,
          `Leave a review: ${reviewUrl}`,
          ...(unsubText ? [``, unsubText] : []),
        ].join("\n"),
      };
    }
  }

  return null;
}






