from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Agent
from tools.registry import TOOLS
from tools.tool_config import get_tool_config, set_sandboxed
from pydantic import BaseModel
from typing import List

router = APIRouter()

TOOL_METADATA = {
    "web_search":  {"group": "WEB DISCOVERY", "desc": "Search the web via Tavily API"},
    "file_reader": {"group": "FILE SYSTEM",   "desc": "Read full content of an uploaded file"},
    "file_search": {"group": "FILE SYSTEM",   "desc": "Search for lines matching a query in a file"},
    "file_lines":  {"group": "FILE SYSTEM",   "desc": "Read specific line ranges from a file"},
    "file_writer": {"group": "FILE SYSTEM",   "desc": "Write content to a file in the uploads directory"},
    "run_python":  {"group": "CODE EXECUTION","desc": "Execute Python code in an isolated sandbox container"},
}


@router.get("/tools")
def get_tools():
    config = get_tool_config()
    return [
        {
            "key": key,
            "name": key,
            "group": TOOL_METADATA.get(key, {}).get("group", "OTHER"),
            "desc": TOOL_METADATA.get(key, {}).get("desc", ""),
            "sandboxed": config.get(key, {}).get("sandboxed", False),
        }
        for key in TOOLS.keys()
    ]


class SandboxUpdate(BaseModel):
    sandboxed: bool


@router.patch("/tools/{tool_key}/sandbox")
def update_tool_sandbox(tool_key: str, payload: SandboxUpdate):
    """Toggle whether a tool runs in a sandbox container."""
    if tool_key not in TOOLS:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_key}' not found")
    set_sandboxed(tool_key, payload.sandboxed)
    return {"tool": tool_key, "sandboxed": payload.sandboxed}


class ToolAssignment(BaseModel):
    allowed_tools: List[str]


@router.put("/agents/{agent_id}/tools")
def assign_tools(agent_id: int, payload: ToolAssignment, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    invalid = [t for t in payload.allowed_tools if t not in TOOLS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown tools: {invalid}")
    agent.allowed_tools = payload.allowed_tools
    db.commit()
    return {"message": f"Tools updated for agent '{agent.name}'", "allowed_tools": agent.allowed_tools}
