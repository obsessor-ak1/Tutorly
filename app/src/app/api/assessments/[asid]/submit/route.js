import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { MCQ_OPTION_KEYS, isAttempted } from "@/lib/assessment";
import { findOwnedAssignment } from "@/lib/learningQueries";
import { readServerSentEvents } from "@/lib/sse";
import { agentErrorResponse, callAgent, jsonError } from "@/lib/tutorProxy";

/** Returns an error message if the answers don't fit the assignment. */
function validateAnswers(assignment, { mcqAnswers, descriptiveAnswers } = {}) {
  const mcqCount = assignment.mcqs?.length ?? 0;
  const descriptiveCount = assignment.descriptives?.length ?? 0;

  if (
    !Array.isArray(mcqAnswers) ||
    mcqAnswers.length !== mcqCount ||
    !mcqAnswers.every((a) => MCQ_OPTION_KEYS.includes(a))
  ) {
    return "Please answer every multiple choice question.";
  }
  if (
    !Array.isArray(descriptiveAnswers) ||
    descriptiveAnswers.length !== descriptiveCount ||
    !descriptiveAnswers.every((a) => typeof a === "string" && a.trim())
  ) {
    return "Please answer every written question.";
  }
  return null;
}

/** Waits for the grading run to finish and returns its final stage. */
async function readFinalStage(response) {
  for await (const { event, data } of readServerSentEvents(response)) {
    if (event === "stage") return data;
    if (event === "error") throw new Error(data?.detail || "Grading failed.");
  }
  throw new Error("The connection to the grader was interrupted.");
}

/**
 * Submits the answers to the tutor's pending "assess" interrupt, which
 * grades and stores them. The assignment's `lesson_id` is the tutor thread
 * that generated it.
 */
export async function POST(request, { params }) {
  const { asid } = await params;

  const session = await auth();
  if (!session?.user?.id) return jsonError(401, "You must be signed in.");

  const assignment = await findOwnedAssignment(session.user.id, asid);
  if (!assignment) return jsonError(404, "Assignment not found.");
  if (isAttempted(assignment)) return jsonError(409, "This assignment has already been submitted.");
  if (!assignment.lesson_id) return jsonError(409, "This assignment is not linked to a tutor session.");

  const input = await request.json().catch(() => ({}));
  const invalid = validateAnswers(assignment, input);
  if (invalid) return jsonError(400, invalid);

  const upstream = await callAgent("assessment", {
    method: "POST",
    body: JSON.stringify({
      thread_id: assignment.lesson_id,
      mcq_answers: input.mcqAnswers,
      descriptive_answers: input.descriptiveAnswers.map((a) => a.trim()),
    }),
  });
  if (!upstream.ok) return agentErrorResponse(upstream);

  try {
    const stage = await readFinalStage(upstream);
    revalidatePath("/dashboard/assessments");
    return Response.json({ score: stage?.assignment?.score ?? null });
  } catch (err) {
    return jsonError(502, err.message);
  }
}
