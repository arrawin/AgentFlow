from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Float, func
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from .database import Base


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LLMConfig(Base):
    __tablename__ = "llm_configs"

    id = Column(Integer, primary_key=True)
    provider = Column(String)           # openai | anthropic | gemini | ollama
    model = Column(String)
    api_key_encrypted = Column(String)
    base_url = Column(String, nullable=True)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2048)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    skills = Column(String)
    skill_file_path = Column(String, nullable=True)
    llm_config_id = Column(Integer, ForeignKey("llm_configs.id"), nullable=True)
    is_system = Column(Boolean, default=False)
    allowed_tools = Column(JSON, default=list)   # e.g. ["web_search", "file_reader"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    graph_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    max_tokens = Column(Integer, default=4096)
    max_steps = Column(Integer, default=10)
    timeout_s = Column(Integer, default=300)
    retries = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    trigger_type = Column(String, default="cron")   # cron | email
    cron_expression = Column(String, nullable=True)
    task_ids = Column(JSON, default=list)            # list of task IDs
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TaskRun(Base):
    __tablename__ = "task_runs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    status = Column(String, default="in_progress")  # not_started | in_progress | completed | failed
    workflow_snapshot = Column(JSON, nullable=True)  # graph_json at time of run
    triggered_by = Column(String, default="manual")  # manual | scheduler
    final_output = Column(Text, nullable=True)
    generated_files = Column(JSON, default=list, nullable=True)  # files created by agents during run
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime, nullable=True)


class RunLog(Base):
    __tablename__ = "run_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_run_id = Column(Integer, ForeignKey("task_runs.id"))
    node_id = Column(String)
    agent_id = Column(Integer)
    event_type = Column(String)
    message = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
