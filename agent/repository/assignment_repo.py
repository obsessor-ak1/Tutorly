from collections.abc import Sequence
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo import ReturnDocument

from db.mongodb import mongodb
from schemas.question import Assignment, AssignmentAnswers


async def save_assignment(assignment: Assignment, lesson_id: str | None = None) -> Assignment:
    """
    Stores the generated assignment into the 'assignments' collection in MongoDB.
    Assigns a generated MongoDB ObjectId to assignment.assignment_id if not present.
    """
    collection = mongodb.get_collection("assignments")

    if not assignment.lesson_id and lesson_id:
        assignment.lesson_id = str(lesson_id)

    assignment_data = assignment.model_dump(by_alias=True)

    # Ensure document has an ObjectId
    existing_id = assignment_data.get("_id")
    if not existing_id:
        doc_id = ObjectId()
        assignment_data["_id"] = doc_id
        assignment.assignment_id = str(doc_id)
    else:
        try:
            assignment_data["_id"] = ObjectId(existing_id)
        except Exception:
            assignment_data["_id"] = existing_id

    now = datetime.now(timezone.utc)
    assignment_data.setdefault("createdAt", now)
    assignment_data["updatedAt"] = now
    assignment_data.setdefault("status", "not_started")

    # Insert or update
    await collection.replace_one(
        {"_id": assignment_data["_id"]},
        assignment_data,
        upsert=True
    )

    return assignment


def _as_dict(value: Any) -> dict[str, Any]:
    """Converts a Pydantic model (or dict) into a plain dict."""
    if hasattr(value, "model_dump"):
        return value.model_dump()
    return dict(value) if isinstance(value, dict) else {}


async def save_assignment_results(
    assignment_id: str,
    score: float | None,
    answers: AssignmentAnswers | dict[str, Any] | None = None,
    descriptive_evaluations: Sequence[Any] = (),
    status: str = "completed"
) -> str | None:
    """
    Stores the user's submission in the 'assignment_answers' collection and
    links it to the assignment through `answers_id`, together with the score
    and status. An assignment with an `answers_id` has been attempted.

    Args:
        assignment_id: ID of the graded assignment
        score: total score obtained
        answers: the submitted MCQ and descriptive answers
        descriptive_evaluations: score and feedback for each descriptive answer
        status: the assignment's new status

    Returns:
        The ID of the answers document, or None if the assignment was not found.
    """
    now = datetime.now(timezone.utc)
    answers_dict = _as_dict(answers)

    answers_doc = {
        "assignment_id": str(assignment_id),
        "mcq_answers": answers_dict.get("mcq_answers", []),
        "descriptive_answers": answers_dict.get("descriptive_answers", []),
        "descriptive_evaluations": [_as_dict(e) for e in descriptive_evaluations],
        "score": score,
        "updatedAt": now,
    }
    saved_answers = await mongodb.get_collection("assignment_answers").find_one_and_update(
        {"assignment_id": str(assignment_id)},
        {"$set": answers_doc, "$setOnInsert": {"createdAt": now}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    try:
        filter_query = {"_id": ObjectId(assignment_id)}
    except Exception:
        filter_query = {"_id": assignment_id}

    result = await mongodb.get_collection("assignments").update_one(
        filter_query,
        {
            "$set": {
                "score": score,
                "status": status,
                "answers_id": saved_answers["_id"],
                "updatedAt": now,
            },
            # Answers used to be embedded; they now live in 'assignment_answers'.
            "$unset": {"answers": ""},
        },
    )
    return str(saved_answers["_id"]) if result.matched_count > 0 else None
