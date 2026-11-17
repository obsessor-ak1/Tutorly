"""
Tutor agent API.

Every action endpoint returns a Server-Sent Events stream with two event types:

    event: token   data: {"message_id": "...", "content": "..."}
        A chunk of the explainer's response, sent as it is generated.

    event: stage   data: <TutorStage>
        Sent once at the end: the interrupt the session is now waiting on
        (with its response schema) or `finished: true`.

If the graph fails mid-stream, an `error` event with {"detail": "..."} is sent
instead of the stage. Requests that don't match the session's current stage are
rejected with HTTP 400 before streaming starts.
"""
import json
import logging
from collections.abc import AsyncIterator, Awaitable

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from schemas.question import Options
from schemas.topic import Lesson
from services.tutor import (
    TutorEventStream,
    TutorSession,
    TutorSessionError,
    TutorStage,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent/tutor", tags=["tutor"])

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",  # disable proxy buffering (e.g. nginx)
}


class TutorRequest(BaseModel):
    thread_id: str


class StartTutorRequest(TutorRequest):
    lesson: Lesson
    topic_description: str
    familiarity_level: str
    user_remarks: str | None = None


class ReviewResourcesRequest(TutorRequest):
    selected_sources: list[str] = Field(
        default_factory=list, description="URLs of the resources to keep."
    )


class FollowupRequest(TutorRequest):
    followup: str


class AssessmentRequest(TutorRequest):
    mcq_answers: list[Options]
    descriptive_answers: list[str]


# ---------------------------------------------------------------------- #
# Helpers
# ---------------------------------------------------------------------- #
def _format_sse(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


async def _to_sse(events: TutorEventStream) -> AsyncIterator[str]:
    """Serializes tutor events into SSE messages."""
    try:
        async for event in events:
            yield _format_sse(event.event, event.data.model_dump_json())
    except Exception as e:
        logger.exception("Tutor stream failed")
        yield _format_sse("error", json.dumps({"detail": str(e)}))


async def _stream_response(events: Awaitable[TutorEventStream]) -> StreamingResponse:
    """
    Awaits the service call (which validates the request) and wraps the
    resulting event stream in an SSE response.
    """
    try:
        stream = await events
    except TutorSessionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return StreamingResponse(
        _to_sse(stream), media_type="text/event-stream", headers=_SSE_HEADERS
    )


# ---------------------------------------------------------------------- #
# Endpoints
# ---------------------------------------------------------------------- #
@router.post("/start")
async def start_session(request: StartTutorRequest) -> StreamingResponse:
    """Starts a session; streams until resources are ready for review."""
    session = TutorSession(request.thread_id)
    return await _stream_response(
        session.start(
            lesson=request.lesson,
            topic_description=request.topic_description,
            familiarity_level=request.familiarity_level,
            user_remarks=request.user_remarks,
        )
    )


@router.post("/review")
async def review_resources(request: ReviewResourcesRequest) -> StreamingResponse:
    """Answers the "review" interrupt and streams the first explanation."""
    session = TutorSession(request.thread_id)
    return await _stream_response(session.review_resources(request.selected_sources))


@router.post("/proceed")
async def proceed(request: TutorRequest) -> StreamingResponse:
    """Answers the "continue" interrupt and streams the continued explanation."""
    session = TutorSession(request.thread_id)
    return await _stream_response(session.proceed())


@router.post("/advance")
async def advance(request: TutorRequest) -> StreamingResponse:
    """Answers the "complete" interrupt by moving on to the next module."""
    session = TutorSession(request.thread_id)
    return await _stream_response(session.advance())


@router.post("/followup")
async def ask_followup(request: FollowupRequest) -> StreamingResponse:
    """Answers the "complete" interrupt with a followup question."""
    session = TutorSession(request.thread_id)
    return await _stream_response(session.ask_followup(request.followup))


@router.post("/assessment")
async def submit_assessment(request: AssessmentRequest) -> StreamingResponse:
    """Answers the "assess" interrupt; streams the final, graded stage."""
    session = TutorSession(request.thread_id)
    return await _stream_response(
        session.submit_assessment(request.mcq_answers, request.descriptive_answers)
    )


@router.get("/{thread_id}/stage", response_model=TutorStage)
async def get_stage(thread_id: str) -> TutorStage:
    """Returns the session's current stage, e.g. to restore the UI on reload."""
    try:
        return await TutorSession(thread_id).get_stage()
    except TutorSessionError as e:
        raise HTTPException(status_code=404, detail=str(e))
