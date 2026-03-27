from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Task, Workflow, Agent, LLMConfig
from api.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from execution.task_executor import run_task
from validation.workflow_validator import validate_workflow
from services.llm_service import LLMService
from pydantic import BaseModel
from typing import List, Optional
import json
import re

router = APIRouter()


class GenerateTaskRequest(BaseModel):
    description: str


@router.post("/tasks/generate")
def generate_task(req: GenerateTaskRequest, db: Session = Depends(get_db)):
    """Run the Workflow Architect Agent to suggest an agent sequence from a task description."""
    # Load the Workflow Architect system agent
    architect = db.query(Agent).filter(Agent.name == "Workflow Architect", Agent.is_system == True).first()
    if not architect:
        raise HTTPException(status_code=503, detail="Workflow Architect Agent not seeded. Restart the server.")

    # All non-system agents are candidates
    agents = db.query(Agent).filter(Agent.is_system == False).all()
    if not agents:
        raise HTTPException(status_code=400, detail="No agents available to generate a workflow from.")

    agent_list = [
        {"id": a.id, "name": a.name, "domain": a.domain_id, "skills": (a.skills or "")[:120]}
        for a in agents
    ]

    # Use the architect's skill content as the system context, inject task + agents as the user message
    skill = architect.skills or ""
    user_message = f"""Task description: {req.description}

Available agents:
{json.dumps(agent_list, indent=2)}"""

    full_prompt = f"{skill}\n\n{user_message}"

    # Use architect's LLM config if set, otherwise fall back to default
    llm_config = None
    if architect.llm_config_id:
        llm_config = db.query(LLMConfig).filter(LLMConfig.id == architect.llm_config_id).first()
    if not llm_config:
        llm_config = db.query(LLMConfig).filter(LLMConfig.is_default == True).first()

    llm = LLMService(llm_config=llm_config)
    raw = llm.generate(full_prompt)

    if not raw:
        raise HTTPException(status_code=502, detail="Workflow Architect Agent did not return a response.")

    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail=f"Workflow Architect returned invalid JSON: {raw[:300]}")

    # Validate all agent IDs come from the real registry — no hallucinations
    valid_ids = {a.id for a in agents}
    for node in result.get("workflow_json", {}).get("nodes", []):
        if node.get("agent_id") not in valid_ids:
            raise HTTPException(
                status_code=422,
                detail=f"Workflow Architect referenced unknown agent_id {node.get('agent_id')}."
            )

    # Validate graph structure
    errors = validate_workflow(result["workflow_json"], valid_ids)
    if errors:
        raise HTTPException(status_code=422, detail={"validation_errors": errors})

    return result


@router.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    # Validate workflow exists
    workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Validate graph
    valid_agent_ids = {a.id for a in db.query(Agent).all()}
    errors = validate_workflow(workflow.graph_json, valid_agent_ids)
    if errors:
        raise HTTPException(status_code=422, detail={"validation_errors": errors})

    db_task = Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in update.dict(exclude_none=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


@router.post("/tasks/{task_id}/run")
def run_task_api(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    run_task.delay(task_id)
    return {"message": "Task queued for execution", "task_id": task_id}
