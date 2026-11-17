import {
  SSE_HEADERS,
  agentErrorResponse,
  callAgent,
  jsonError,
  resolveSessionLesson,
  saveSelectedResources,
  toAgentLesson,
} from "@/lib/tutorProxy";

/**
 * Tutor actions. Each one builds the agent request body from the lesson
 * context and the (untrusted) client input; returning a string signals
 * invalid input.
 */
const ACTIONS = {
  start: ({ topic, lesson, threadId }) => ({
    thread_id: threadId,
    lesson: toAgentLesson(lesson),
    topic_description: topic.description ?? "",
    familiarity_level: topic.topicFamiliarityLevel ?? "Not specified",
    user_remarks: topic.additionalUserRemarks ?? null,
  }),
  review: ({ threadId }, input) => {
    const sources = input?.selectedSources;
    if (!Array.isArray(sources) || !sources.every((s) => typeof s === "string")) {
      return "selectedSources must be a list of URLs.";
    }
    return { thread_id: threadId, selected_sources: sources };
  },
  proceed: ({ threadId }) => ({ thread_id: threadId }),
  advance: ({ threadId }) => ({ thread_id: threadId }),
  followup: ({ threadId }, input) => {
    const followup = typeof input?.followup === "string" ? input.followup.trim() : "";
    if (!followup) return "Please enter a question.";
    return { thread_id: threadId, followup };
  },
};

/** Runs a tutor action and streams the agent's SSE response back. */
export async function POST(request, { params }) {
  const { sid, action } = await params;
  const buildBody = ACTIONS[action];
  if (!buildBody) return jsonError(404, "Unknown tutor action.");

  const { context, response } = await resolveSessionLesson(sid);
  if (response) return response;

  const input = await request.json().catch(() => ({}));
  const body = buildBody(context, input);
  if (typeof body === "string") return jsonError(400, body);

  const upstream = await callAgent(action, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!upstream.ok) return agentErrorResponse(upstream);

  if (action === "review") {
    await saveSelectedResources(context.topicId, sid, body.selected_sources);
  }

  return new Response(upstream.body, { headers: SSE_HEADERS });
}
