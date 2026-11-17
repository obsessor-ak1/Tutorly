import { agentErrorResponse, callAgent, resolveSessionLesson } from "@/lib/tutorProxy";

/**
 * Returns `{ stage }` with the session's current stage, or `{ stage: null }`
 * if the tutor has not been started for this lesson's thread yet.
 */
export async function GET(request, { params }) {
  const { sid } = await params;
  const { context, response } = await resolveSessionLesson(sid);
  if (response) return response;

  const upstream = await callAgent(`${encodeURIComponent(context.threadId)}/stage`);
  if (upstream.status === 404) return Response.json({ stage: null });
  if (!upstream.ok) return agentErrorResponse(upstream);

  return Response.json({ stage: await upstream.json() });
}
