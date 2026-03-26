from pydantic import BaseModel
from typing import Optional


class WorkflowCreate(BaseModel):
    name: str
    graph_json: dict


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    graph_json: Optional[dict] = None


class WorkflowResponse(BaseModel):
    id: int
    name: str
    graph_json: dict

    class Config:
        from_attributes = True
