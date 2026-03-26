from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Agent
from tools.registry import TOOLS
from pydantic import BaseModel
from typing import List

router = APIRouter()

# Real tools from registry with metadata
TOOL_METADATA = {
    "web_search":   {"group": "WEB DISCOVERY",  "desc": "Search the web via Tavily API"},
    "file_reader":  {"group": "FILE SYSTEM",     "desc": "Read full content of an uploaded file"},
    "file_search":  {"group": "FILE SYSTEM",     "desc": "Search for lines matching a query in a file"},
    "file_lines":   {"group": "FILE SYSTEM",     "desc": "Read specific line ranges from a file"},
}


@router.get("/tools")
def get_tools():
    return [
        {
            "key": key,
            "name": key,
            "group": TOOL_METADATA.get(key, {}).get("group", "OTHER"),
            "desc": TOOL_METADATA.get(key, {}).get("desc", ""),
        }
        for key in TOOLS.keys()
    ]


class ToolAssignment(BaseModel):
    allowed_tools: List[str]


@router.put("/agents/{agent_id}/tools")
def assign_tools(agent_id: int, payload: ToolAssignment, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Validate all tools exist
    invalid = [t for t in payload.allowed_tools if t not in TOOLS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown tools: {invalid}")

    agent.allowed_tools = payload.allowed_tools
    db.commit()
    return {"message": f"Tools updated for agent '{agent.name}'", "allowed_tools": agent.allowed_tools}
