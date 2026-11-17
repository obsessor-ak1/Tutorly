// Server-side bridge between the session UI and the agent's tutor API.
// The browser only ever sends a lesson id; the thread id stays on the server.

import { auth } from "@/auth";
import { AGENT_BASE_URL } from "@/lib/agentConfig";
import { findOwnedLesson } from "@/lib/learningQueries";
import { Topic } from "@/models/Topic";

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

export function jsonError(status, error) {
  return Response.json({ error }, { status });
}

/**
 * Resolves the signed-in user's lesson for a session.
 * Returns `{ context }` on success or `{ response }` with an error response.
 */
export async function resolveSessionLesson(lessonId) {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: jsonError(401, "You must be signed in.") };
  }

  const owned = await findOwnedLesson(session.user.id, lessonId);
  if (!owned) {
    return { response: jsonError(404, "Lesson not found.") };
  }
  if (!owned.lesson.thread_id) {
    return { response: jsonError(409, "This lesson has not been started yet.") };
  }

  return { context: { ...owned, threadId: owned.lesson.thread_id } };
}

/** The lesson in the shape expected by the agent's `Lesson` schema. */
export function toAgentLesson(lesson) {
  return {
    name: lesson.name,
    description: lesson.description,
    status: lesson.status,
    thread_id: lesson.thread_id,
    modules: (lesson.modules ?? []).map(({ title, description, status }) => ({
      title,
      description,
      status,
    })),
  };
}

/** Calls the agent's tutor API. */
export function callAgent(path, init = {}) {
  return fetch(`${AGENT_BASE_URL}/agent/tutor/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
}

/** Converts a failed agent response into an error response for the browser. */
export async function agentErrorResponse(upstream) {
  const body = await upstream.json().catch(() => ({}));
  const detail = typeof body.detail === "string" ? body.detail : "The tutor is unavailable.";
  return jsonError(upstream.status, detail);
}

/** Stores the resources selected during the review step on the lesson. */
export async function saveSelectedResources(topicId, lessonId, resources) {
  await Topic.updateOne(
    { _id: topicId, "lessons._id": lessonId },
    { $set: { "lessons.$.resources": resources } }
  );
}
