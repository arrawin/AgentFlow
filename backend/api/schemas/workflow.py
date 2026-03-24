from pydantic import BaseModel


class WorkflowCreate(BaseModel):
    name: str
    graph_json: dict


class WorkflowResponse(BaseModel):
    id: int
    name: str
    graph_json: dict

    class Config:
        from_attributes = True