from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
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
    created_at = Column(DateTime, default=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    created_at = Column(DateTime, default=datetime.utcnow)