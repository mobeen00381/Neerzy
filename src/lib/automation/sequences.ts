// src/lib/automation/sequences.ts
/**
 * The sequence PLANS - pure data, no database, no email copy, no network.
 *
 * Enrollment (lib/automation/enroll.ts) turns one of these tables into
 * public.message_queue rows, and the drainer (/api/cron/automation) walks the
 * rows. Keeping the schedule in one dependency-light file means the admin tab,
 * the enroller and the drainer can never disagree about what "day 3" means.
 *
 * Shape of the promise:
 *
 *   HOT  (no website / weak profile): day 1, day 3, day 7  + review ask day 5
 *   WARM (mid score, some reviews)  : day 2, day 6          + review ask day 5
 *   COLD (nothing to act on)        :                         review ask day 5
 *
 * Rules baked into the table:
 *   - a COLD lead only ever gets the review ask. Emailing a lead we have no
 *     angle on is what turns a helpful sequence into spam,
 *   - the review ask goes to EVERY segment on day 5 and never shares a day with
 *     a sales email (see findDayConflicts() below - it is checked by the unit
 *     that builds the table, not by a reviewer's eyes),
 *   - `kind` is a LABEL, not the compliance gate: every step here is automated
 *     marketing mail, so every step needs an active marketing consent and is
 *     checked against the suppression list. The value stays on the row so the
 *     admin tab and lead_activity can tell the review ask apart from a sales
 *     nudge - never to decide whether consent applies.
 */

import type { LeadPriorityLevel } from "@/lib/lead-priority";

/** HOT / WARM / COLD, straight from lib/lead-priority.ts. */
export type SequenceSegment = LeadPriorityLevel;

/** sales = a pitch | review = the day-5 review ask. Both are marketing mail. */
export type SequenceStepKind = "sales" | "review";

/** Also the value stored in message_queue.step_key and email_log.email_type. */
export type SequenceStepKey =
  | "hot_d1"
  | "hot_d3"
  | "hot_d7"
  | "warm_d2"
  | "warm_d6"
  | "review_d5";

export interface SequenceStep {
  key: SequenceStepKey;
  kind: SequenceStepKind;
  /** Days after enrollment. The cron runs once a day, so this is a floor. */
  day: number;
  /** Short label for the admin tab / lead activity (never used in an email). */
  label: string;
}

const REVIEW_STEP: SequenceStep = {
  key: "review_d5",
  kind: "review",
  day: 5,
  label: "Day 5 · review ask",
};

/**
 * The complete plan per segment. Order in the array is the order the admin tab
 * lists them; the drainer follows run_at, not this order.
 */
export const SEQUENCE_STEPS: Record<SequenceSegment, readonly SequenceStep[]> = {
  hot: [
    { key: "hot_d1", kind: "sales", day: 1, label: "Day 1 · the first fix" },
    { key: "hot_d3", kind: "sales", day: 3, label: "Day 3 · the missing website" },
    REVIEW_STEP,
    { key: "hot_d7", kind: "sales", day: 7, label: "Day 7 · what publishing costs" },
  ],
  warm: [
    { key: "warm_d2", kind: "sales", day: 2, label: "Day 2 · what is already working" },
    REVIEW_STEP,
    { key: "warm_d6", kind: "sales", day: 6, label: "Day 6 · what publishing costs" },
  ],
  cold: [REVIEW_STEP],
} as const;

/** Every key the drainer understands (used to reject tampered queue rows). */
export const SEQUENCE_STEP_KEYS: readonly SequenceStepKey[] = [
  "hot_d1",
  "hot_d3",
  "hot_d7",
  "warm_d2",
  "warm_d6",
  "review_d5",
] as const;

export function isSequenceStepKey(value: unknown): value is SequenceStepKey {
  return typeof value === "string" && (SEQUENCE_STEP_KEYS as readonly string[]).includes(value);
}

export function isSequenceSegment(value: unknown): value is SequenceSegment {
  return value === "hot" || value === "warm" || value === "cold";
}

/** The plan for one segment; unknown input falls back to COLD (review only). */
export function planForSegment(segment: string | null | undefined): readonly SequenceStep[] {
  return isSequenceSegment(segment) ? SEQUENCE_STEPS[segment] : SEQUENCE_STEPS.cold;
}

/** The step definition for a queue row, or null when the key is unknown. */
export function stepByKey(key: string | null | undefined): SequenceStep | null {
  if (!isSequenceStepKey(key)) return null;
  for (const segment of Object.keys(SEQUENCE_STEPS) as SequenceSegment[]) {
    const found = SEQUENCE_STEPS[segment].find((step) => step.key === key);
    if (found) return found;
  }
  return null;
}

/** Human label for a step key (falls back to the raw key). */
export function stepLabel(key: string | null | undefined): string {
  return stepByKey(key)?.label || String(key || "unknown step");
}

/** Longest plan (days) - the admin tab uses it to describe the sequence. */
export function planLengthDays(segment: string | null | undefined): number {
  return planForSegment(segment).reduce((max, step) => Math.max(max, step.day), 0);
}

/**
 * Same-day collisions between a sales email and the review ask.
 *
 * A day with two emails is how a helpful sequence becomes a spam complaint, so
 * this is a pure, testable rule instead of a comment: the table above is
 * expected to return [] for every segment.
 */
export function findDayConflicts(): Array<{ segment: SequenceSegment; day: number }> {
  const conflicts: Array<{ segment: SequenceSegment; day: number }> = [];
  for (const segment of Object.keys(SEQUENCE_STEPS) as SequenceSegment[]) {
    const perDay = new Map<number, number>();
    for (const step of SEQUENCE_STEPS[segment]) {
      perDay.set(step.day, (perDay.get(step.day) || 0) + 1);
    }
    for (const [day, count] of perDay) {
      if (count > 1) conflicts.push({ segment, day });
    }
  }
  return conflicts;
}
