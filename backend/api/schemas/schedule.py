from pydantic import BaseModel
from typing import Optional, List


class ScheduleCreate(BaseModel):
    name: str
    trigger_type: str = "cron"          # cron | email
    cron_expression: Optional[str] = None
    task_ids: List[int] = []
    enabled: bool = True


class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    cron_expression: Optional[str] = None
    task_ids: Optional[List[int]] = None
    enabled: Optional[bool] = None


class ScheduleResponse(BaseModel):
    id: int
    name: str
    trigger_type: str
    cron_expression: Optional[str]
    task_ids: List[int]
    enabled: bool

    class Config:
        from_attributes = True
