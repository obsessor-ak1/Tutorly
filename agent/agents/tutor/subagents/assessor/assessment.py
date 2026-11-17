import asyncio

from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt
from pydantic import BaseModel, Field

from agents.tutor.state_schema import InterruptSpec
from agents.tutor.subagents.assessor.prompts import ASSESSMENT_SYSTEM
from agents.utils.answer_compare import AnswerEvaluation
from models import get_google_llm
from repository import save_assignment as save_assignment_repo, save_assignment_results
from schemas.question import Assignment, AssignmentAnswers

llm = get_google_llm("gemini-3.8-flash")

class AssessorState(BaseModel):
    lesson_id: str
    conversation_history: list[BaseMessage]
    assignment: Assignment | None = None
    answers: AssignmentAnswers | None = None
    evaluations: list[AnswerEvaluation] = Field(
        default_factory=list,
        description="Score and feedback for each descriptive answer, in order."
    )


async def generate_assignment(state: AssessorState):
    """A node which generates assessments."""
    generator = llm.with_structured_output(Assignment)
    sys_instruction = SystemMessage(content=ASSESSMENT_SYSTEM)
    assignment = await generator.ainvoke(
        [sys_instruction] + state.conversation_history
    )
    return {
        "assignment": assignment
    }


async def save_assignment(state: AssessorState):
    """Saves the assignment to the database."""
    if state.assignment is not None:
        saved_assignment = await save_assignment_repo(
            assignment=state.assignment,
            lesson_id=state.lesson_id
        )
        return {
            "assignment": saved_assignment
        }
    return {}


async def check_assignment(state: AssessorState):
    """Checks the assignment submitted by the user."""
    answers = interrupt(
        value=InterruptSpec(int_type="assess", int_info="Assignment ready."),
        response_schema=AssignmentAnswers
    )
    # Restoring from a checkpoint leaves nested questions as plain dicts,
    # so rebuild the assignment to get MCQ / DescriptiveQuestion objects back.
    assignment = Assignment.model_validate(dict(state.assignment), by_name=True)
    # Performing basic validations
    assert assignment.assignment_id == answers.assignment_id
    mcq_score = sum([
        q.eval(ans) for q, ans in
        zip(assignment.mcqs, answers.mcq_answers)
    ])
    desc_score_tasks = [
        dq.aeval(dans)
        for dq, dans in zip(
            assignment.descriptives,
            answers.descriptive_answers
        )
    ]
    results = await asyncio.gather(*desc_score_tasks)
    desc_score = sum([res.score for res in results])
    total_score = mcq_score + desc_score
    assignment.score = total_score
    return {
        "assignment": assignment,
        "answers": answers,
        "evaluations": results
    }


async def save_results(state: AssessorState):
    """Saves the result and user submitted answers to the database."""
    if state.assignment and state.assignment.assignment_id:
        await save_assignment_results(
            assignment_id=state.assignment.assignment_id,
            score=state.assignment.score,
            answers=state.answers,
            descriptive_evaluations=state.evaluations,
            status="completed"
        )
    return {
        "assignment": state.assignment,
        "answers": state.answers
    }


def build_assessor(checkpointer=None, include_evaluation: bool = True):
    graph = StateGraph(state_schema=AssessorState)
    graph.add_node("generate_assignment", generate_assignment)
    graph.add_node("save_assignment", save_assignment)
    if include_evaluation:
        graph.add_node("check_assignment", check_assignment)
        graph.add_node("save_results", save_results)
        graph.add_edge(START, "generate_assignment")
        graph.add_edge("generate_assignment", "save_assignment")
        graph.add_edge("save_assignment", "check_assignment")
        graph.add_edge("check_assignment", "save_results")
        graph.add_edge("save_results", END)
    else:
        graph.add_edge(START, "generate_assignment")
        graph.add_edge("generate_assignment", "save_assignment")
        graph.add_edge("save_assignment", END)
    compiled = graph.compile(checkpointer=checkpointer)
    return compiled


assignemnt_generator = build_assessor()
assessor = assignemnt_generator
