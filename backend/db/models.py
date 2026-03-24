from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from .database import Base


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    skills = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LLMConfig(Base):
    __tablename__ = "llm_configs"

    id = Column(Integer, primary_key=True)
    provider = Column(String)
    model = Column(String)
    api_key_encrypted = Column(String)

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    graph_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TaskRun(Base):
    __tablename__ = "task_runs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))

    status = Column(String, default="in_progress")
    final_output = Column(Text)

    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime)


class RunLog(Base):
    __tablename__ = "run_logs"

    id = Column(Integer, primary_key=True, index=True)

    task_run_id = Column(Integer, ForeignKey("task_runs.id"))
    node_id = Column(String)
    agent_id = Column(Integer)
    event_type = Column(String)   
    message = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())