from datetime import datetime, timezone
from typing import Any
from db.mongodb import mongodb
from schemas.note import NoteElement


async def append_note_elements(lesson_id: str, elements: list[NoteElement | dict[str, Any]]) -> bool:
    """
    Appends new note elements to the note document for the given lesson_id
    in the 'notes' collection.
    """
    if not elements:
        return False

    collection = mongodb.get_collection("notes")

    elements_data = []
    for el in elements:
        if hasattr(el, "model_dump"):
            elements_data.append(el.model_dump())
        elif isinstance(el, dict):
            elements_data.append(el)

    now = datetime.now(timezone.utc)
    await collection.update_one(
        {"lesson_id": str(lesson_id)},
        {
            "$push": {
                "elements": {
                    "$each": elements_data
                }
            },
            "$setOnInsert": {
                "lesson_id": str(lesson_id),
                "createdAt": now
            },
            "$set": {
                "updatedAt": now
            }
        },
        upsert=True
    )
    return True
