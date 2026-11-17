"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findOwnedLesson, requireUserId } from "@/lib/learningQueries";
import { STATUS } from "@/lib/status";
import { Topic } from "@/models/Topic";

const sessionPath = (lessonId) => `/dashboard/sessions/${lessonId}`;

async function updateLesson(topicId, lessonId, fields) {
  const update = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [`lessons.$.${key}`, value])
  );
  await Topic.updateOne({ _id: topicId, "lessons._id": lessonId }, { $set: update });
}

function revalidateLessonViews() {
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/topics/[tid]", "page");
}

/**
 * Starts a lesson: gives it a tutor thread (if it has none) and marks it
 * in progress, then opens the session.
 */
export async function startLessonAction(lessonId) {
  try {
    const userId = await requireUserId();
    const owned = await findOwnedLesson(userId, lessonId);
    if (!owned) return { error: "Lesson not found." };

    const { topicId, lesson } = owned;
    if (lesson.status === STATUS.NOT_STARTED) {
      await updateLesson(topicId, lessonId, {
        thread_id: lesson.thread_id || randomUUID(),
        status: STATUS.IN_PROGRESS,
      });
      revalidateLessonViews();
    }
  } catch (err) {
    return { error: err.message || "Could not start the lesson." };
  }
  redirect(sessionPath(lessonId));
}

/**
 * Restarts an in-progress lesson from scratch: a new tutor thread replaces
 * the old one and all module progress is reset.
 */
export async function restartLessonAction(lessonId) {
  try {
    const userId = await requireUserId();
    const owned = await findOwnedLesson(userId, lessonId);
    if (!owned) return { error: "Lesson not found." };

    const { topicId, lesson } = owned;
    if (lesson.status !== STATUS.IN_PROGRESS) {
      return { error: "Only lessons in progress can be restarted." };
    }

    await updateLesson(topicId, lessonId, {
      thread_id: randomUUID(),
      status: STATUS.IN_PROGRESS,
      modules: (lesson.modules ?? []).map((m) => ({ ...m, status: STATUS.NOT_STARTED })),
      resources: [],
    });
    revalidateLessonViews();
  } catch (err) {
    return { error: err.message || "Could not restart the lesson." };
  }
  redirect(sessionPath(lessonId));
}
