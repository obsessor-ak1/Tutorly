from typing import Literal, TypeAlias

from pydantic import BaseModel, Field

from agents.utils.answer_compare import (
    AnswerEvaluation,
    compare_answers, acompare_answers
)

Options: TypeAlias = Literal['a', 'b', 'c', 'd']

class Question(BaseModel):
    """Base class for all the questions"""
    question_text: str


class MCQ(Question):
    """
    It is a multiple choice question (MCQ) with only one possible answer.
    """
    options: dict[Options, str]
    correct_option: Options
    explanation: str

    def eval(self, response: Options):
        return response == self.correct_option


class DescriptiveQuestion(Question):
    """
    It is a description type question. The answer should be correct
    but it needs not to follow a particular format.
    """
    correct_answer: str

    def eval(self, response: str) -> AnswerEvaluation:
        return compare_answers(self.correct_answer, response)

    async def aeval(self, response: str) -> AnswerEvaluation:
        return await acompare_answers(self.correct_answer, response)
        

class Assignment(BaseModel):
    assignment_id: str | None = Field(..., alias="_id")
    lesson_id: str | None
    title: str
    description: str
    mcqs: list[MCQ] = Field(
        min_length=5,
        description="A list of Multiple Choice Questions in the assignment."
    )
    descriptives: list[DescriptiveQuestion] = Field(
        min_length=2,
        description="It is a list of descriptive type questions."
    )
    score: float | None


class AssignmentAnswers(BaseModel):
    assignment_id: str
    mcq_answers: list[Options]
    descriptive_answers: list[str]



    

