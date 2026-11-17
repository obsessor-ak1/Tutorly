// Server-side data access for the user's lessons (sessions) and assignments.

import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { assignmentStatus, maxScoreOf } from "@/lib/assessment";
import dbConnect from "@/lib/db";
import { normalizeStatus } from "@/lib/status";
import { Assignment } from "@/models/Assignment";
import { Topic } from "@/models/Topic";

// Topics may be written by Node.js (userId) or Python (user_id).
export function ownedTopicsFilter(userId) {
  return { $or: [{ userId }, { user_id: userId }] };
}

export async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// ---------------------------------------------------------------------- //
// Lessons
// ---------------------------------------------------------------------- //
function toLessonSummary(topic, lesson) {
  const modules = lesson.modules ?? [];
  return {
    id: lesson._id.toString(),
    topicId: topic._id.toString(),
    topicName: topic.name,
    name: lesson.name,
    description: lesson.description,
    status: normalizeStatus(lesson.status),
    threadId: lesson.thread_id ?? null,
    modulesTotal: modules.length,
    modulesCompleted: modules.filter((m) => m.status === "completed").length,
  };
}

export async function getUserLessons(userId) {
  await dbConnect();
  const topics = await Topic.find(ownedTopicsFilter(userId))
    .select("name lessons")
    .sort({ createdAt: -1 })
    .lean();

  return topics.flatMap((topic) =>
    (topic.lessons ?? []).map((lesson) => toLessonSummary(topic, lesson))
  );
}

/** Returns the user's lesson with its parent topic, or null if not owned. */
export async function findOwnedLesson(userId, lessonId) {
  if (!isValidObjectId(lessonId)) return null;

  await dbConnect();
  const topic = await Topic.findOne(
    { ...ownedTopicsFilter(userId), "lessons._id": lessonId },
    {
      "lessons.$": 1,
      name: 1,
      description: 1,
      topicFamiliarityLevel: 1,
      additionalUserRemarks: 1,
    }
  ).lean();

  return topic ? { topicId: topic._id, topic, lesson: topic.lessons[0] } : null;
}

// ---------------------------------------------------------------------- //
// Assignments
// ---------------------------------------------------------------------- //
function toAssignmentSummary(assignment, lessonsByThread) {
  const mcqCount = assignment.mcqs?.length ?? 0;
  const descriptiveCount = assignment.descriptives?.length ?? 0;
  const lesson = lessonsByThread.get(assignment.lesson_id);

  return {
    id: assignment._id.toString(),
    title: assignment.title,
    description: assignment.description,
    status: assignmentStatus(assignment),
    score: assignment.score ?? null,
    maxScore: maxScoreOf(mcqCount, descriptiveCount),
    questionCount: mcqCount + descriptiveCount,
    lessonName: lesson?.name ?? null,
    topicName: lesson?.topicName ?? null,
    createdAt: assignment.createdAt?.toISOString() ?? null,
  };
}

/**
 * Assignments are linked to lessons through `lesson_id`, which holds the
 * lesson's tutor thread id.
 */
export async function getUserAssignments(userId) {
  const lessons = await getUserLessons(userId);
  const lessonsByThread = new Map(
    lessons.filter((l) => l.threadId).map((l) => [l.threadId, l])
  );

  const assignments = await Assignment.find({
    $or: [{ userId }, { lesson_id: { $in: [...lessonsByThread.keys()] } }],
  })
    .select("title description status score mcqs descriptives lesson_id answers_id createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return assignments.map((a) => toAssignmentSummary(a, lessonsByThread));
}

/** Returns the assignment if it belongs to one of the user's lessons. */
export async function findOwnedAssignment(userId, assignmentId) {
  if (!isValidObjectId(assignmentId)) return null;

  await dbConnect();
  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) return null;
  if (assignment.userId === userId) return assignment;

  const ownsLesson = assignment.lesson_id
    ? await Topic.exists({
        ...ownedTopicsFilter(userId),
        "lessons.thread_id": assignment.lesson_id,
      })
    : null;
  return ownsLesson ? assignment : null;
}
