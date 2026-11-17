"""
Service layer for the tutor agent.

`TutorSession` drives one tutoring thread through the tutor graph:

    start()              -> runs resource gathering, pauses at "review"
    review_resources()   -> answers "review",   pauses at "continue" / "complete"
    proceed()            -> answers "continue", pauses at "continue" / "complete"
    advance()            -> answers "complete" (next module), pauses again, or at
                            "assess" once the last module is done
    ask_followup()       -> answers "complete" (with followup), pauses again
    submit_assessment()  -> answers "assess", grades the assignment and finishes

Each resume method first checks that the thread is paused at the interrupt
type that method handles, and then resumes it with a payload that matches the
interrupt's `response_schema`.

Validation happens eagerly when a method is awaited, so invalid requests fail
before anything is streamed. The method then returns an async stream of
`TutorEvent`s: "token" events carrying the explainer's response as it is
generated, followed by a single "stage" event describing where the session
stopped.
"""
from collections.abc import AsyncIterator
from typing import Any, Literal

from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.mongodb import MongoDBSaver
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import Command, Interrupt, StateSnapshot
from pydantic import BaseModel, Field, computed_field
from pymongo import MongoClient

from agents.tutor.state_schema import (
    ExplainerTask,
    InterruptSpec,
    SelectedSources,
    TutorState,
    UserFollowup,
    UserProceed,
)
from agents.tutor.tutor import build_tutor_graph
from core.config import settings
from schemas.question import Assignment, AssignmentAnswers, Options
from schemas.topic import Lesson, Status

_tutor_graph: CompiledStateGraph | None = None


def get_tutor_graph() -> CompiledStateGraph:
    """
    Returns the tutor graph, building it on first use with a MongoDB
    checkpointer so that sessions persist across requests and restarts.
    Built lazily because MongoDBSaver creates its indexes on construction.
    """
    global _tutor_graph
    if _tutor_graph is None:
        checkpointer = MongoDBSaver(
            MongoClient(settings.mongodb_uri), db_name=settings.mongodb_database
        )
        _tutor_graph = build_tutor_graph(checkpointer=checkpointer)
    return _tutor_graph

# Fields hidden from the user while an assignment is still unanswered.
_ANSWER_KEY_FIELDS: dict[str, Any] = {
    "mcqs": {"__all__": {"correct_option", "explanation"}},
    "descriptives": {"__all__": {"correct_answer"}},
}


class TutorSessionError(ValueError):
    """Raised when an operation does not match the session's current state."""


class TutorStage(BaseModel):
    """Where a tutoring session currently stands, as returned to callers."""

    thread_id: str
    interrupt: InterruptSpec | None = Field(
        default=None,
        description="The pending interrupt, or None when the session has finished.",
    )
    response_schema: dict[str, Any] | None = Field(
        default=None,
        description="JSON schema of the payload expected to resume the interrupt.",
    )
    tutor_message: str | None = Field(
        default=None, description="The tutor's latest explanation or answer."
    )
    resources: dict[str, dict[str, str | float]] | None = Field(
        default=None, description="Gathered resources awaiting review."
    )
    lesson: Lesson | None = None
    assignment: dict[str, Any] | None = Field(
        default=None,
        description=(
            "The assignment: without its answer key while awaiting answers, "
            "graded with answers once the session has finished."
        ),
    )

    @computed_field
    @property
    def finished(self) -> bool:
        return self.interrupt is None


class TokenChunk(BaseModel):
    """A piece of the explainer's response."""

    message_id: str | None = Field(
        default=None, description="ID of the message the chunk belongs to."
    )
    content: str


class TutorEvent(BaseModel):
    """An event streamed while the tutor graph runs."""

    event: Literal["token", "stage"]
    data: TokenChunk | TutorStage


TutorEventStream = AsyncIterator[TutorEvent]

# Graph node whose LLM output is streamed to the user.
_STREAMED_NODE = "explainer"


class TutorSession:
    """
    Handles the tutor agent's lifecycle for a single thread.
    """

    def __init__(self, thread_id: str):
        self.thread_id = thread_id
        self.config: RunnableConfig = {"configurable": {"thread_id": thread_id}}

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    async def start(
        self,
        lesson: Lesson,
        topic_description: str,
        familiarity_level: str,
        user_remarks: str | None = None,
    ) -> TutorEventStream:
        """
        Starts a new tutoring session for the lesson. Streams until the gathered
        resources are ready for the user's review.

        Args:
            lesson: the lesson to be taught
            topic_description: description of the parent topic
            familiarity_level: the user's familiarity with the topic
            user_remarks: any additional preferences of the user
        """
        snapshot = await self._get_snapshot()
        if snapshot.values:
            raise TutorSessionError(
                f"A tutoring session already exists for thread '{self.thread_id}'."
            )

        initial_state = TutorState(
            familiarity_level=familiarity_level,
            topic_description=topic_description,
            lesson=self._begin_lesson(lesson),
            user_remarks=user_remarks,
            current_task=ExplainerTask(task_type="new_module", module_index=0),
            messages=[],
            tutor_response=None,
        )
        return self._stream(initial_state)

    async def review_resources(self, selected_sources: list[str]) -> TutorEventStream:
        """
        Resolves the "review" interrupt with the resources the user selected
        for ingestion, then starts explaining the first module.

        Args:
            selected_sources: URLs of the resources to keep
        """
        return await self._resume(
            "review", SelectedSources(sources=selected_sources)
        )

    async def proceed(self) -> TutorEventStream:
        """
        Resolves the "continue" interrupt, letting the tutor continue the
        explanation of the current module.
        """
        return await self._resume("continue", UserProceed(proceed=True))

    async def advance(self) -> TutorEventStream:
        """
        Resolves the "complete" interrupt by moving to the next module. After
        the last module, notes are recorded and the assessment is generated.
        """
        return await self._resume(
            "complete", UserFollowup(proceed_or_followup=True, followup="")
        )

    async def ask_followup(self, followup: str) -> TutorEventStream:
        """
        Resolves the "complete" interrupt with a followup question about the
        current module.

        Args:
            followup: the user's question
        """
        if not followup.strip():
            raise TutorSessionError("Followup question must not be empty.")
        return await self._resume(
            "complete", UserFollowup(proceed_or_followup=False, followup=followup)
        )

    async def submit_assessment(
        self, mcq_answers: list[Options], descriptive_answers: list[str]
    ) -> TutorEventStream:
        """
        Resolves the "assess" interrupt with the user's answers. The answers are
        graded, saved, and the session finishes.

        Args:
            mcq_answers: chosen option for each MCQ, in question order
            descriptive_answers: answer to each descriptive question, in order
        """
        snapshot = await self._get_snapshot(subgraphs=True)
        interrupt = self._require_interrupt(snapshot, "assess")
        assignment = self._pending_assignment(snapshot)

        self._check_answer_count("MCQ", len(mcq_answers), len(assignment.mcqs))
        self._check_answer_count(
            "descriptive", len(descriptive_answers), len(assignment.descriptives)
        )
        if not assignment.assignment_id:
            raise TutorSessionError("The pending assignment has not been saved yet.")

        answers = AssignmentAnswers(
            assignment_id=assignment.assignment_id,
            mcq_answers=mcq_answers,
            descriptive_answers=descriptive_answers,
        )
        return self._stream_resume(interrupt, answers)

    async def get_stage(self) -> TutorStage:
        """Returns the session's current stage without advancing the graph."""
        snapshot = await self._get_snapshot(subgraphs=True)
        if not snapshot.values:
            raise TutorSessionError(
                f"No tutoring session exists for thread '{self.thread_id}'."
            )
        return self._build_stage(snapshot)

    # ------------------------------------------------------------------ #
    # Graph interaction helpers
    # ------------------------------------------------------------------ #
    async def _get_snapshot(self, subgraphs: bool = False) -> StateSnapshot:
        """Returns the thread's state, including nested subgraph states if asked."""
        graph = get_tutor_graph()
        return await graph.aget_state(self.config, subgraphs=subgraphs)

    async def _resume(self, expected_type: str, response: BaseModel) -> TutorEventStream:
        """
        Validates the pending interrupt's type, then returns the stream that
        resumes it with the response.
        """
        snapshot = await self._get_snapshot()
        interrupt = self._require_interrupt(snapshot, expected_type)
        return self._stream_resume(interrupt, response)

    def _stream_resume(self, interrupt: Interrupt, response: BaseModel) -> TutorEventStream:
        """Returns the stream that resumes the given interrupt with the response."""
        return self._stream(Command(resume={interrupt.id: response.model_dump()}))

    async def _stream(self, graph_input: Any) -> TutorEventStream:
        """
        Runs the graph, yielding the explainer's response chunk by chunk and
        finally the stage at which the graph stopped.
        """
        graph = get_tutor_graph()
        async for message, metadata in graph.astream(
            graph_input, config=self.config, stream_mode="messages"
        ):
            if chunk := self._explainer_chunk(message, metadata):
                yield TutorEvent(event="token", data=chunk)
        yield TutorEvent(event="stage", data=await self.get_stage())

    def _require_interrupt(self, snapshot: StateSnapshot, expected_type: str) -> Interrupt:
        """
        Returns the pending interrupt if it is of the expected type, and
        raises TutorSessionError otherwise.
        """
        interrupt = self._first_interrupt(snapshot)
        if interrupt is None:
            raise TutorSessionError(
                f"Thread '{self.thread_id}' is not waiting for any input."
            )

        spec = self._parse_spec(interrupt)
        if spec.int_type != expected_type:
            raise TutorSessionError(
                f"Thread '{self.thread_id}' expects a '{spec.int_type}' "
                f"response, not '{expected_type}'."
            )
        return interrupt

    def _pending_assignment(self, snapshot: StateSnapshot) -> Assignment:
        """
        Returns the assignment awaiting answers. It lives in the assessor
        subgraph's state, so the snapshot must be fetched with subgraphs=True.
        """
        for task in snapshot.tasks:
            if isinstance(task.state, StateSnapshot):
                assignment = self._to_assignment(task.state.values.get("assignment"))
                if assignment is not None:
                    return assignment
        raise TutorSessionError(
            f"No pending assignment found for thread '{self.thread_id}'."
        )

    # ------------------------------------------------------------------ #
    # Response building helpers
    # ------------------------------------------------------------------ #
    def _build_stage(self, snapshot: StateSnapshot) -> TutorStage:
        """Builds the caller-facing stage from a graph state snapshot."""
        values = snapshot.values
        interrupt = self._first_interrupt(snapshot)
        spec = self._parse_spec(interrupt) if interrupt else None
        int_type = spec.int_type if spec else None
        response_schema = interrupt.response_schema if interrupt else None

        stage = TutorStage(
            thread_id=self.thread_id,
            interrupt=spec,
            response_schema=response_schema if isinstance(response_schema, dict) else None,
            lesson=values.get("lesson"),
        )
        if int_type == "review":
            stage.resources = values.get("resources")
        elif int_type == "assess":
            stage.assignment = self._dump_assignment(
                self._pending_assignment(snapshot), include_answers=False
            )
        else:
            stage.tutor_message = self._latest_tutor_message(values.get("messages", []))
            if int_type is None:
                stage.assignment = self._dump_assignment(
                    self._to_assignment(values.get("assignment")), include_answers=True
                )
        return stage

    @staticmethod
    def _explainer_chunk(message: Any, metadata: dict[str, Any]) -> TokenChunk | None:
        """
        Returns the text of an explainer LLM chunk, or None for anything else
        (other nodes, subagents, echoed prompts, or tool-call-only chunks).
        """
        if metadata.get("langgraph_node") != _STREAMED_NODE:
            return None
        if not isinstance(message, AIMessage) or not message.text:
            return None
        return TokenChunk(message_id=message.id, content=message.text)

    @staticmethod
    def _first_interrupt(snapshot: StateSnapshot) -> Interrupt | None:
        """
        Returns the first pending interrupt, i.e. the `__interrupt__` value.
        Interrupts raised inside subgraphs are surfaced here as well.
        """
        return snapshot.interrupts[0] if snapshot.interrupts else None

    @staticmethod
    def _parse_spec(interrupt: Interrupt) -> InterruptSpec:
        """Interrupt values may come back as a model or a dict after checkpointing."""
        return InterruptSpec.model_validate(interrupt.value)

    @staticmethod
    def _to_assignment(value: Any) -> Assignment | None:
        """
        Normalizes a checkpointed assignment into an Assignment. Restored
        instances keep nested questions as dicts, so they are rebuilt too.
        """
        if value is None:
            return None
        data = dict(value) if isinstance(value, Assignment) else value
        return Assignment.model_validate(data, by_name=True)

    @staticmethod
    def _dump_assignment(
        assignment: Assignment | None, include_answers: bool
    ) -> dict[str, Any] | None:
        """Serializes an assignment, optionally hiding its answer key."""
        if assignment is None:
            return None
        exclude = None if include_answers else _ANSWER_KEY_FIELDS
        return assignment.model_dump(mode="json", exclude=exclude)

    @staticmethod
    def _latest_tutor_message(messages: list[BaseMessage]) -> str | None:
        """Returns the latest tutor reply, skipping tool-calling messages."""
        for message in reversed(messages):
            if isinstance(message, AIMessage) and not message.tool_calls:
                return message.text
        return None

    @staticmethod
    def _check_answer_count(kind: str, given: int, expected: int) -> None:
        if given != expected:
            raise TutorSessionError(
                f"Expected {expected} {kind} answers, got {given}."
            )

    @staticmethod
    def _begin_lesson(lesson: Lesson) -> Lesson:
        """Marks the lesson and its first module as in progress."""
        modules = list(lesson.modules)
        modules[0] = modules[0].model_copy(update={"status": Status.IN_PROGRESS})
        return lesson.model_copy(
            update={"modules": modules, "status": Status.IN_PROGRESS}
        )
