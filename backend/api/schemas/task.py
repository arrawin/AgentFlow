from pydantic import BaseModel
from typing import Optional


class TaskCreate(BaseModel):
    name: str
    description: str
    workflow_id: int
    max_tokens: Optional[int] = 4096
    max_steps: Optional[int] = 10
    timeout_s: Optional[int] = 300
    retries: Optional[int] = 3


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workflow_id: Optional[int] = None
    max_tokens: Optional[int] = None
    max_steps: Optional[int] = None
    timeout_s: Optional[int] = None
    retries: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    name: str
    description: str
    workflow_id: int
    max_tokens: int
    max_steps: int
    timeout_s: int
    retries: int

    class Config:
        from_attributes = True
