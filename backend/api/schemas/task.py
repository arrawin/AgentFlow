from pydantic import BaseModel


class TaskCreate(BaseModel):
    name: str
    description: str
    workflow_id: int


class TaskResponse(BaseModel):
    id: int
    name: str
    description: str
    workflow_id: int

    class Config:
        from_attributes = True