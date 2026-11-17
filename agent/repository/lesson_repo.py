from bson import ObjectId
from db.mongodb import mongodb
from schemas.topic import Lesson


async def update_lesson_progress(lesson: Lesson) -> bool:
    """
    Persists updated lesson and module statuses to the MongoDB database.
    Updates the lesson subdocument inside the topics collection.
    """
    collection = mongodb.get_collection("topics")

    # Determine query filter to locate the parent topic and the specific lesson
    filter_query = None
    lesson_id = getattr(lesson, "id", None)
    if lesson_id:
        try:
            filter_query = {"lessons._id": ObjectId(lesson_id)}
        except Exception:
            filter_query = {"lessons._id": lesson_id}
    elif lesson.thread_id:
        filter_query = {"lessons.thread_id": lesson.thread_id}
    else:
        filter_query = {"lessons.name": lesson.name}

    status_val = lesson.status.value if hasattr(lesson.status, "value") else str(lesson.status)
    modules_data = []
    for m in lesson.modules:
        m_dict = {
            "title": m.title,
            "description": m.description,
            "status": m.status.value if hasattr(m.status, "value") else str(m.status)
        }
        mod_id = getattr(m, "id", None)
        if mod_id:
            try:
                m_dict["_id"] = ObjectId(mod_id)
            except Exception:
                m_dict["_id"] = mod_id
        modules_data.append(m_dict)

    update_fields = {
        "lessons.$.status": status_val,
        "lessons.$.modules": modules_data,
    }
    if lesson.thread_id:
        update_fields["lessons.$.thread_id"] = lesson.thread_id

    result = await collection.update_one(filter_query, {"$set": update_fields})
    if result.matched_count > 0:
        return True

    # Fallback: check if lessons are stored in a standalone 'lessons' collection
    standalone_col = mongodb.get_collection("lessons")
    standalone_filter = None
    if lesson_id:
        try:
            standalone_filter = {"_id": ObjectId(lesson_id)}
        except Exception:
            standalone_filter = {"_id": lesson_id}
    elif lesson.thread_id:
        standalone_filter = {"thread_id": lesson.thread_id}
    else:
        standalone_filter = {"name": lesson.name}

    standalone_update = {
        "name": lesson.name,
        "description": lesson.description,
        "status": status_val,
        "modules": modules_data,
    }
    if lesson.thread_id:
        standalone_update["thread_id"] = lesson.thread_id

    await standalone_col.update_one(standalone_filter, {"$set": standalone_update}, upsert=False)
    return True
