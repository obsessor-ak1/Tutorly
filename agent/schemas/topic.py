from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List


class Status(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Module(BaseModel):
    title: str
    description: str
    status: Status = Status.NOT_STARTED


class Lesson(BaseModel):
    name: str
    description: str
    
    # Enforce at least 1 (or change to 2) module(s) per lesson and remove default factory
    modules: List[Module] = Field(..., min_length=1, description="At least one module is required per lesson.")
    
    status: Status = Status.NOT_STARTED


class Topic(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    description: str
    
    # Enforce at least 1 (or change to 2) lesson(s) per topic and remove default factory
    lessons: List[Lesson] = Field(..., min_length=1, description="At least one lesson is required per topic.")
    
    teaching_style: str
    persona: str
    topic_familiarity_level: str
    additional_user_remarks: Optional[str] = None