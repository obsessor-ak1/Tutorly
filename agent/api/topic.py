from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from schemas.topic import Topic
from agents.topic_planner import TopicPlanner

router = APIRouter(prefix="/agent/topic", tags=["topic"])

class NewTopicRequest(BaseModel):
    thread_id: str
    name: str
    description: str
    familiarity_level: str
    additional_info: Optional[str] = ""

class RefineTopicRequest(BaseModel):
    thread_id: str
    refine_instruction: str

# Instantiate the planner globally to maintain the checkpointer state across requests
planner_instance = TopicPlanner()

def get_topic_planner():
    return planner_instance

@router.post("/new", response_model=Topic)
async def create_new_topic(
    request: NewTopicRequest, 
    planner: TopicPlanner = Depends(get_topic_planner)
):
    try:
        topic = await planner.create_topic(
            thread_id=request.thread_id,
            name=request.name,
            description=request.description,
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
    planner: TopicPlanner = Depends(get_topic_planner)
):
    try:
        refined_topic = await planner.refine_topic(
            thread_id=request.thread_id,
            refine_instruction=request.refine_instruction
        )
        return refined_topic
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
