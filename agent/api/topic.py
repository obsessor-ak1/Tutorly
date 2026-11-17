from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from schemas.topic import Topic
from services.topic_planner import TopicPlanner

router = APIRouter(prefix="/agent/topic", tags=["topic"])

class TopicRequest(BaseModel):
    thread_id: str

class NewTopicRequest(TopicRequest):
    name: str
    description: str
    familiarity_level: str
    additional_info: Optional[str] = ""

class RefineTopicRequest(TopicRequest):
    refine_instruction: str


@router.post("/new", response_model=Topic)
async def create_new_topic(
    request: NewTopicRequest,
) -> Topic:
    planner = TopicPlanner(thread_id=request.thread_id)
    try:
        topic = await planner.generate(
            name=request.name,
            desc=request.description,
            familiarity_level=request.familiarity_level,
            additional_info=request.additional_info
        )
        return topic
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refine", response_model=Topic)
async def refine_existing_topic(
    request: RefineTopicRequest,
) -> Topic:
    planner = TopicPlanner(thread_id=request.thread_id)
    try:
        refined_topic = await planner.incorporate_feedback(
            feedback=request.refine_instruction
        )
        return refined_topic
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/finalize")
async def finalize(request: TopicRequest):
    planner = TopicPlanner(thread_id=request.thread_id)
    try:
        await planner.finish()
        return {
            "finished": True
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
