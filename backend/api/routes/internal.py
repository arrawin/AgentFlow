"""
Internal proxy endpoints — only reachable from agentflow_internal network.
Workflow containers call these instead of hitting Groq/Tavily directly.
API keys never leave the FastAPI host.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from services.llm_service import LLMService
from tools.registry import TOOLS
from db.database import SessionLocal
from db.models import LLMConfig, Agent, TaskRun, RunLog
from datetime import datetime

router = APIRouter()


class LLMRequest(BaseModel):
    prompt: str
    agent_id: Optional[int] = None
    run_id: Optional[int] = None


class ToolRequest(BaseModel):
    tool_name: str
    input: Any
    run_id: Optional[int] = None
    agent_id: Optional[int] = None
    node_id: Optional[str] = None


class LogRequest(BaseModel):
    run_id: int
    node_id: str
    agent_id: Optional[int] = None
    event_type: str
    message: str


class RunStatusRequest(BaseModel):
    run_id: int
    status: str
    final_output: Optional[str] = None
    generated_files: Optional[list] = None


@router.post("/internal/llm/generate")
def llm_generate(req: LLMRequest):
    """Proxy LLM calls from workflow containers. API key stays here."""
    db = SessionLocal()
    try:
        llm_config = None
        if req.agent_id:
            agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
            if agent and agent.llm_config_id:
                llm_config = db.query(LLMConfig).filter(LLMConfig.id == agent.llm_config_id).first()
        if not llm_config:
            llm_config = db.query(LLMConfig).filter(LLMConfig.is_default == True).first()

        llm = LLMService(llm_config=llm_config)
        result = llm.generate(req.prompt)

        if not result:
            raise HTTPException(status_code=502, detail="LLM returned no response")

        return {"content": result}
    finally:
        db.close()


@router.post("/internal/tools/execute")
def tool_execute(req: ToolRequest):
    """Proxy tool calls from workflow containers."""
    tool_fn = TOOLS.get(req.tool_name)
    if not tool_fn:
        raise HTTPException(status_code=404, detail=f"Tool '{req.tool_name}' not found")
    try:
        result = tool_fn(req.input)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")


@router.post("/internal/logs/append")
def log_append(req: LogRequest):
    """Workflow containers write run logs through here."""
    db = SessionLocal()
    try:
        entry = RunLog(
            task_run_id=req.run_id,
            node_id=req.node_id,
            agent_id=req.agent_id,
            event_type=req.event_type,
            message=str(req.message),
        )
        db.add(entry)
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@router.post("/internal/runs/update")
def run_update(req: RunStatusRequest):
    """Workflow containers report final status through here."""
    db = SessionLocal()
    try:
        run = db.query(TaskRun).filter(TaskRun.id == req.run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        run.status = req.status
        run.ended_at = datetime.utcnow()
        if req.final_output is not None:
            run.final_output = req.final_output
        if req.generated_files:
            run.generated_files = req.generated_files
        db.commit()
        return {"ok": True}
    finally:
        db.close()
