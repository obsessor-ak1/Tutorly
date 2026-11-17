from functools import cached_property
from typing import Annotated, Literal, Any

from langchain_core.documents import Document
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from pydantic import BaseModel, computed_field, Field

from agents.tutor.prompts import (
    TUTOR_SYSTEM_PROMPT,
    JUDGE_SYSTEM_PROMPT,
    NEW_MODULE_PROMPT,
    MODULE_CONTINUATION_INSTRUCTION,
    USER_FOLLOWUP_PROMPT
)
from schemas.topic import Lesson


class ExplainerTask(BaseModel):
    """
    Represents a task to be handled by LLM explainer.
    """
    task_type: Literal["new_module", "continue_module", "followup"] = Field(
        frozen=True,
        description="Type of the task to continue."
    )
    module_index: int = Field(
        frozen=True,
        description="Current module Index"
    )
    followup_str: str = Field(
        default="",
        description="User's followup if any."
    )
    judge_feedback: str = Field(
        default="",
        description="The description of missing details given by judge."
    )

    def get_task_prompt(self, lesson: Lesson) -> str:
        module = lesson.modules[self.module_index]
        if self.task_type == "new_module":
            return NEW_MODULE_PROMPT.format(
                title=module.title, description=module.description
            )
        if self.task_type == "continue_module":
            return MODULE_CONTINUATION_INSTRUCTION.format(
                current_module=f"{self.module_index+1}. {module.title}: {module.description}",
                judge_feedback=self.judge_feedback
            )
        else:
            return USER_FOLLOWUP_PROMPT.format(
                current_module=f"{self.module_index+1}. {module.title}: {module.description}",
                followup=self.followup_str
            )


class UserProceed(BaseModel):
    proceed: bool


class UserFollowup(BaseModel):
    proceed_or_followup: bool
    followup: str


class AITutorResponse(BaseModel):
    done: bool = Field(
        default=False,
        description=(
            "Works as an indicator, True when the explanation of current module"
            " or response to the user's followup is complete, False otherwise"
        )
    )
    feedback: str = Field(
        default="",
        description="The feedback of the judge on the content."
    )


class TutorState(BaseModel):
    familiarity_level: str
    topic_description: str
    lesson: Lesson
    user_remarks: str | None
    current_task: ExplainerTask | None
    messages: Annotated[list[BaseMessage], add_messages]
    chunks_present: dict[str, Any] | None = Field(
        default=None, description="The chunks which are fetched and present so far."
    )
    relevant_docs: list[Document] = Field(
        default_factory=list,
        description="List of relevant documents for most recent query"
    )
    tutor_response: AITutorResponse | None
    current_module_messages: int = 0
    assignment: Any = None
    def get_system_info(self):
        """Returns the input need for system prompt."""

        system_info = {
            "familiarity_level": self.familiarity_level,
            "user_remarks": self.user_remarks,
            "topic_description": self.topic_description,
            "lesson_description": self.lesson.description,
        }
        modules_str = '\n'.join([
            f"{i+1}. {m.title}"
            for i, m in enumerate(self.lesson.modules)
        ])
        system_info["modules"] = modules_str
        return system_info

    @computed_field
    @cached_property
    def explainer_system_prompt(self) -> str:
        """Formats the system prompt for the explainer."""
        system_info = self.get_system_info()
        system_prompt = TUTOR_SYSTEM_PROMPT.format(**system_info)
        return system_prompt

    @computed_field
    @cached_property
    def judge_system_prompt(self) -> str:
        """Formats the system prompt for the explainer."""
        system_info = self.get_system_info()
        system_prompt = JUDGE_SYSTEM_PROMPT.format(**system_info)
        return system_prompt

class ResourceReviewNodeState(BaseModel):
    resources: dict[str, dict[str, str | float]] = Field(
        ..., description="Resources collected so far."
    )


class SelectedSources(BaseModel):
    sources: list[str] = Field(
        min_length=0, description="list of sources to delete."
    )


class InterruptSpec(BaseModel):
    int_type: Literal[
        "continue", "complete", "assess", "review"
    ]
    int_info: str | None = None

