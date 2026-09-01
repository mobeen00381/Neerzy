/**
 * Shared parser for Neerzy's Google Business Profile post content.
 *
 * The AI generates posts in the labelled format:
 *   HEADLINE: ...
 *   BODY: ...
 *   CTA: ...
 *   HASHTAGS: ...
 *
 * This module extracts the FULL value of each labelled field (handles
 * multi-line values and markdown asterisks around labels) so that every
 * consumer (WhatsApp webhook, dashboard generate API, dashboard view)
 * shows the COMPLETE post text.
 */

export interface ParsedPost {
  headline: string;
  body: string;
  cta: string;
  hashtags: string;
  /** GBP post type: STANDARD | OFFER | EVENT ('' when the AI didn't provide one). */
  postType: string;
  /** Bonus Q&A suggestion for the GBP Q&A section (drives answer-engine activity). */
  qaQuestion: string;
  qaAnswer: string;
}

const POST_LABELS = ['HEADLINE:', 'BODY:', 'CTA:', 'HASHTAGS:', 'POST_TYPE:', 'Q_A:'];

export const POST_TYPES = ['STANDARD', 'OFFER', 'EVENT'] as const;

export function parsePostContent(content: string): ParsedPost {
  const lines = content.split('\n');
  const rawType = extractLine(lines, 'POST_TYPE:').toUpperCase().trim().split(/\s+/)[0];
  const [qaQuestion, qaAnswer] = splitQA(extractLine(lines, 'Q_A:'));
  return {
    headline: extractLine(lines, 'HEADLINE:'),
    body: extractLine(lines, 'BODY:'),
    cta: extractLine(lines, 'CTA:'),
    hashtags: extractLine(lines, 'HASHTAGS:'),
    postType: (POST_TYPES as readonly string[]).includes(rawType) ? rawType : '',
    qaQuestion,
    qaAnswer,
  };
}

/**
 * Splits a "Question -> Answer" string into its two parts.
 * Accepts "none" / empty input (returns empty strings) and falls back to
 * splitting at the first question mark when no arrow separator is present.
 */
function splitQA(raw: string): [string, string] {
  const value = (raw || '').trim();
  if (!value || value.toLowerCase() === 'none') return ['', ''];

  const arrow = value.match(/\s*(.+?)\s*->\s*([\s\S]+)/);
  if (arrow) return [arrow[1].trim(), arrow[2].trim()];

  const qi = value.indexOf('?');
  if (qi !== -1) {
    const question = value.slice(0, qi + 1).trim();
    const answer = value.slice(qi + 1).replace(/^[\s\-:>]+/, '').trim();
    return [question, answer];
  }

  return [value, ''];
}

/**
 * Builds a clean, copy-paste-ready post block from parsed fields.
 * Empty fields are dropped; the remaining fields are joined with a blank line.
 */
export function buildCleanPost(headline: string, body: string, cta: string, hashtags: string): string {
  return [headline, body, cta, hashtags]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Extracts the FULL value of a labelled field (e.g. "BODY:") from the AI output.
 * Handles multi-line values (everything until the next label) and strips any
 * leftover markdown asterisks around the label.
 */
function extractLine(lines: string[], prefix: string): string {
  const labelIndex = lines.findIndex(l => l.toUpperCase().includes(prefix.toUpperCase()));
  if (labelIndex === -1) return '';

  // Find where the next label starts (end of this field's value)
  let endIndex = lines.length;
  for (let i = labelIndex + 1; i < lines.length; i++) {
    if (POST_LABELS.some(lbl => lines[i].toUpperCase().includes(lbl.toUpperCase()))) {
      endIndex = i;
      break;
    }
  }

  const section = lines.slice(labelIndex, endIndex);
  // Strip the label (and any surrounding markdown asterisks) from the first line
  const firstLine = section[0];
  const labelPos = firstLine.toUpperCase().indexOf(prefix.toUpperCase());
  let value = labelPos === -1 ? firstLine : firstLine.slice(labelPos + prefix.length);
  value = value.replace(/^\s*\*+\s*/, '').replace(/\s*\*+\s*$/, '');
  section[0] = value;

  return section.join('\n').trim();
}
