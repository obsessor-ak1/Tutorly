from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import StateGraph, END, START
from pydantic import BaseModel

from agents.tutor.subagents.note_taker.prompts import (
    NOTE_TAKER_INSTRUCTION
)
from models import get_google_llm
from repository import append_note_elements
from schemas.note import NoteTakerOutput

llm = get_google_llm("emma-4-31b-it")

class NoteTakerState(BaseModel):
    lesson_id: str
    related_messages: list[BaseMessage]
    note_part: NoteTakerOutput | None = None


async def generate_note(state: NoteTakerState):
    """Generates notes for current module."""
    generator = llm.with_structured_output(NoteTakerOutput)
    sys_instruction = SystemMessage(
        content=NOTE_TAKER_INSTRUCTION
    )
    output_note = await generator.ainvoke(
        [sys_instruction] + state.related_messages
    )
    return {
        "note_part": output_note
    }


async def append_note(state: NoteTakerState):
    """Save the note part to the database by appending elements to the note collection."""
    if state.note_part and state.note_part.elements:
        lesson_id = state.lesson_id or state.note_part.lesson_id
        if lesson_id:
            await append_note_elements(
                lesson_id=lesson_id,
                elements=state.note_part.elements
            )
    return {
        "note_part": state.note_part
    }


def build_note_taker():
    graph = StateGraph(state_schema=NoteTakerState)
    graph.add_node("generate_note", generate_note)
    graph.add_node("append_note", append_note)
    graph.add_edge(START, "generate_note")
    graph.add_edge("generate_note", "append_note")
    graph.add_edge("append_note", END)
    compiled = graph.compile()
    return compiled


note_taker = build_note_taker()
