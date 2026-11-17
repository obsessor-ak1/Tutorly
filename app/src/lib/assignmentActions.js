"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAttempted } from "@/lib/assessment";
import { findOwnedAssignment, requireUserId } from "@/lib/learningQueries";
import { STATUS } from "@/lib/status";
import { Assignment } from "@/models/Assignment";

const assignmentPath = (assignmentId) => `/dashboard/assessments/${assignmentId}`;

/** Marks a new assignment as in progress, then opens it. */
export async function startAssignmentAction(assignmentId) {
  try {
    const userId = await requireUserId();
    const assignment = await findOwnedAssignment(userId, assignmentId);
    if (!assignment) return { error: "Assignment not found." };

    if (!isAttempted(assignment) && assignment.status === STATUS.NOT_STARTED) {
      await Assignment.updateOne(
        { _id: assignmentId },
        { $set: { status: STATUS.IN_PROGRESS } }
      );
      revalidatePath("/dashboard/assessments");
    }
  } catch (err) {
    return { error: err.message || "Could not start the assignment." };
  }
  redirect(assignmentPath(assignmentId));
}

/**
 * Reopens an in-progress assignment with a blank answer sheet. Answers are
 * only drafted in the browser until submission, so the page clears its
 * draft when opened with `?fresh=1`. Submitted assignments cannot restart.
 */
export async function restartAssignmentAction(assignmentId) {
  try {
    const userId = await requireUserId();
    const assignment = await findOwnedAssignment(userId, assignmentId);
    if (!assignment) return { error: "Assignment not found." };

    if (isAttempted(assignment)) {
      return { error: "This assignment has already been submitted." };
    }
    if (assignment.status !== STATUS.IN_PROGRESS) {
      return { error: "Only assignments in progress can be restarted." };
    }
  } catch (err) {
    return { error: err.message || "Could not restart the assignment." };
  }
  redirect(`${assignmentPath(assignmentId)}?fresh=1`);
}
