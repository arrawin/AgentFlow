from pydantic import BaseModel
from typing import Optional, List


class ScheduleCreate(BaseModel):
    name: str
    trigger_type: str = "cron"          # cron | folder_watch | file_watch | email
    cron_expression: Optional[str] = None
    task_ids: List[int] = []
    enabled: bool = True
    # Watch config
    watch_path: Optional[str] = None
    file_pattern: Optional[str] = None
    # Email config
    imap_host: Optional[str] = None
    imap_port: Optional[int] = 993
    imap_user: Optional[str] = None
    imap_password: Optional[str] = None   # plaintext — encrypted before storing
    subject_filter: Optional[str] = None
    sender_filter: Optional[str] = None


class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    cron_expression: Optional[str] = None
    task_ids: Optional[List[int]] = None
    enabled: Optional[bool] = None
    watch_path: Optional[str] = None
    file_pattern: Optional[str] = None
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    imap_user: Optional[str] = None
    imap_password: Optional[str] = None
    subject_filter: Optional[str] = None
    sender_filter: Optional[str] = None


class ScheduleResponse(BaseModel):
    id: int
    name: str
    trigger_type: str
    cron_expression: Optional[str] = None
    task_ids: List[int]
    enabled: bool
    watch_path: Optional[str] = None
    file_pattern: Optional[str] = None
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    imap_user: Optional[str] = None
    subject_filter: Optional[str] = None
    sender_filter: Optional[str] = None

    class Config:
        from_attributes = True
