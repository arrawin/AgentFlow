from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AgentCreate(BaseModel):
    name: str
    domain_id: int
    skills: Optional[str] = None
    skill_file_path: Optional[str] = None
    llm_config_id: Optional[int] = None
    allowed_tools: Optional[List[str]] = []


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    domain_id: Optional[int] = None
    skills: Optional[str] = None
    skill_file_path: Optional[str] = None
    llm_config_id: Optional[int] = None
    allowed_tools: Optional[List[str]] = None


class AgentResponse(BaseModel):
    id: int
    name: str
    domain_id: int
    skills: Optional[str]
    skill_file_path: Optional[str]
    llm_config_id: Optional[int]
    is_system: bool = False
    allowed_tools: Optional[List[str]] = []

    class Config:
        from_attributes = True
