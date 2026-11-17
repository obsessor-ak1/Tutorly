// Builds the data the assessment page renders. Answer keys (correct options,
// explanations, reference answers) are only included once the assignment has
// been attempted, so they never reach the browser beforehand.

import {
  DESCRIPTIVE_MAX_SCORE,
  MCQ_OPTION_KEYS,
  isAttempted,
  maxScoreOf,
} from "@/lib/assessment";
import { findOwnedAssignment } from "@/lib/learningQueries";
import { AssignmentAnswers } from "@/models/AssignmentAnswers";

function toMcqView(mcq, selected, revealAnswers) {
  const view = {
    questionText: mcq.question_text,
    options: MCQ_OPTION_KEYS.map((key) => ({ key, text: mcq.options?.[key] ?? "" })),
  };
  if (!revealAnswers) return view;

  return {
    ...view,
    selected: selected ?? null,
    correctOption: mcq.correct_option,
    explanation: mcq.explanation,
    isCorrect: selected === mcq.correct_option,
  };
}

function toDescriptiveView(question, answer, evaluation, revealAnswers) {
  const view = { questionText: question.question_text };
  if (!revealAnswers) return view;

  return {
    ...view,
    answer: answer ?? "",
    referenceAnswer: question.correct_answer,
    evaluation: evaluation
      ? { score: evaluation.score, feedback: evaluation.feedback ?? "" }
      : null,
  };
}

function toResultSummary(mcqs, descriptives, score) {
  const descriptiveScore = descriptives.reduce(
    (total, d) => total + (d.evaluation?.score ?? 0),
    0
  );
  return {
    score,
    maxScore: maxScoreOf(mcqs.length, descriptives.length),
    mcqCorrect: mcqs.filter((m) => m.isCorrect).length,
    mcqTotal: mcqs.length,
    descriptiveScore,
    descriptiveMax: descriptives.length * DESCRIPTIVE_MAX_SCORE,
  };
}

/** Returns the assessment page data, or null if the user does not own it. */
export async function getAssessmentView(userId, assignmentId) {
  const assignment = await findOwnedAssignment(userId, assignmentId);
  if (!assignment) return null;

  const attempted = isAttempted(assignment);
  const answers = attempted
    ? await AssignmentAnswers.findById(assignment.answers_id).lean()
    : null;

  const mcqs = (assignment.mcqs ?? []).map((mcq, i) =>
    toMcqView(mcq, answers?.mcq_answers?.[i], attempted)
  );
  const descriptives = (assignment.descriptives ?? []).map((question, i) =>
    toDescriptiveView(
      question,
      answers?.descriptive_answers?.[i],
      answers?.descriptive_evaluations?.[i],
      attempted
    )
  );

  return {
    id: assignment._id.toString(),
    title: assignment.title,
    description: assignment.description,
    attempted,
    mcqs,
    descriptives,
    result: attempted
      ? toResultSummary(mcqs, descriptives, answers?.score ?? assignment.score ?? 0)
      : null,
  };
}
