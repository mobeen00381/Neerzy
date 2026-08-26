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
}

const POST_LABELS = ['HEADLINE:', 'BODY:', 'CTA:', 'HASHTAGS:'];

export function parsePostContent(content: string): ParsedPost {
  const lines = content.split('\n');
  return {
    headline: extractLine(lines, 'HEADLINE:'),
    body: extractLine(lines, 'BODY:'),
    cta: extractLine(lines, 'CTA:'),
    hashtags: extractLine(lines, 'HASHTAGS:'),
  };
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
