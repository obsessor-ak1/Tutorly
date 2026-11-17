// Shared assessment rules, used by both the listing and the assessment page.

import { STATUS, normalizeStatus } from "@/lib/status";

export const MCQ_OPTION_KEYS = ["a", "b", "c", "d"];

// Each MCQ scores 1 point; each descriptive answer is graded out of 5.
export const MCQ_MAX_SCORE = 1;
export const DESCRIPTIVE_MAX_SCORE = 5;

export function maxScoreOf(mcqCount, descriptiveCount) {
  return mcqCount * MCQ_MAX_SCORE + descriptiveCount * DESCRIPTIVE_MAX_SCORE;
}

/** An assignment is attempted once its answers have been submitted. */
export function isAttempted(assignment) {
  return Boolean(assignment?.answers_id);
}

/** Attempted assignments are always completed (view only). */
export function assignmentStatus(assignment) {
  return isAttempted(assignment) ? STATUS.COMPLETED : normalizeStatus(assignment.status);
}
