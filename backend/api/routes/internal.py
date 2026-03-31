"""
Internal proxy endpoints — reachable only from agentflow_internal network.
Used by sandboxed containers for trigger-based runs.
API keys and tool execution stay here — never inside containers.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional, List
from services.llm_service import LLMService
from tools.registry import TOOLS
from db.database import SessionLocal
from db.models import LLMConfig, Agent, TaskRun, RunLog
from datetime import datetime

router = APIRouter()

# ── Request models ──────────────────────────────────────────────

class LLMRequest(BaseModel):
    prompt: str
    agent_id: Optional[int] = None
    run_id: Optional[int] = None

class ToolRequest(BaseModel):
    tool_name: str
    input: Any
    agent_id: Optional[int] = None
    run_id: Optional[int] = None

class LogRequest(BaseModel):
    run_id: int
    node_id: str
    agent_id: Optional[int] = None
    event_type: str
    message: str

class RunOutputRequest(BaseModel):
    run_id: int
    node_id: str
    output: str
    status: str = "completed"
    final_output: Optional[str] = None
    generated_files: Optional[List[str]] = None

# ── Endpoints ───────────────────────────────────────────────────

@router.post("/internal/llm/generate")
def llm_generate(req: LLMRequest):
    """Proxy LLM calls. API key never leaves FastAPI."""
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
    """Execute a tool. Validates agent permissions and path safety before running."""
    db = SessionLocal()
    try:
        # Validate tool is allowed for this agent
        if req.agent_id:
            agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
            if agent and agent.allowed_tools and req.tool_name not in agent.allowed_tools:
                raise HTTPException(status_code=403, detail=f"Tool '{req.tool_name}' not allowed for this agent")

        # Path jail at proxy level — second layer after tool-level safe_path
        if req.tool_name in ("file_reader", "file_writer", "file_search", "file_lines"):
            if isinstance(req.input, dict):
                filename = req.input.get("filename") or req.input.get("file") or req.input.get("file_path", "")
                if filename and (".." in filename or filename.startswith("/")):
                    raise HTTPException(status_code=403, detail=f"Path traversal blocked: '{filename}'")

        tool_fn = TOOLS.get(req.tool_name)
        if not tool_fn:
            raise HTTPException(status_code=404, detail=f"Tool '{req.tool_name}' not found")

        try:
            result = tool_fn(req.input)
            return {"result": result}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")
    finally:
        db.close()


@router.post("/internal/logs/append")
def log_append(req: LogRequest):
    """Containers write run logs through here."""
    db = SessionLocal()
    try:
        entry = RunLog(
            task_run_id=req.run_id,
            node_id=req.node_id,
            agent_id=req.agent_id,
            event_type=req.event_type,
            message=str(req.message)[:2000],
        )
        db.add(entry)
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@router.post("/internal/runs/output")
def run_output(req: RunOutputRequest):
    """Containers report node output and final run status through here."""
    db = SessionLocal()
    try:
        run = db.query(TaskRun).filter(TaskRun.id == req.run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        if req.final_output is not None:
            run.final_output = req.final_output[:50000]  # cap at 50KB
        if req.generated_files:
            run.generated_files = req.generated_files
        if req.status in ("completed", "failed"):
            run.status = req.status
            run.ended_at = datetime.utcnow()

        db.commit()
        return {"ok": True}
    finally:
        db.close()
