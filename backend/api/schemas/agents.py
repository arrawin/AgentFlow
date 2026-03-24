from pydantic import BaseModel
from typing import Optional


class AgentCreate(BaseModel):
    name: str
    domain_id: int
    skills: Optional[str] = None


class AgentResponse(BaseModel):
    id: int
    name: str
    domain_id: int
    skills: Optional[str]

    class Config:
        from_attributes = True