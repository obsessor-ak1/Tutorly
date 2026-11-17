from pydantic import BaseModel, Field
from typing import Literal


class NoteElement(BaseModel):
    title: str
    content: str
    element_type: Literal[
        "concept",
        "definition",
        "principle",
        "procedure",
        "equation",
        "example",
        "comparison",
        "application",
        "caveat",
    ]
    related_concepts: list[str] = Field(default_factory=list)


class NoteTakerOutput(BaseModel):
    lesson_id: str | None = None
    elements: list[NoteElement]
