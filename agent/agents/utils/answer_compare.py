from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from agents.utils.basic_prompts import (
    DESCRIPTIVE_ANSWER_EVALUATOR_INSTRUCTION,
    DESCRIPTIVE_ANSWER_PROMPT_TEMPLATE
)
from models import get_groq_llm

llm = get_groq_llm("openai/gpt-oss-20")

class AnswerEvaluation(BaseModel):
    score: int = Field(ge=0, le=5)
    feedback: str = Field(
        description="Concise, constructive feedback explaining the score."
    )


def compare_answers(reference_answer, answer):
    """Compares the student answer against a reference answer."""
    comparer = llm.with_structured_output(AnswerEvaluation)
    sys_instruction = SystemMessage(
        content=DESCRIPTIVE_ANSWER_EVALUATOR_INSTRUCTION
    )
    answers = HumanMessage(content=DESCRIPTIVE_ANSWER_PROMPT_TEMPLATE.format(
        reference_answer=reference_answer, answer=answer
    ))
    evaluation = comparer.invoke([sys_instruction, answers])
    return evaluation


async def acompare_answers(reference_answer, answer):
    comparer = llm.with_structured_output(AnswerEvaluation)
    sys_instruction = SystemMessage(
        content=DESCRIPTIVE_ANSWER_EVALUATOR_INSTRUCTION
    )
    answers = HumanMessage(content=DESCRIPTIVE_ANSWER_PROMPT_TEMPLATE.format(
        reference_answer=reference_answer, answer=answer
    ))
    evaluation = await comparer.ainvoke([sys_instruction, answers])
    return evaluation
