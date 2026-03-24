from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Task
from api.schemas.task import TaskCreate, TaskResponse
from execution.task_executor import run_task
from typing import List

router = APIRouter()


@router.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()


@router.post("/tasks/{task_id}/run")
def run_task_api(task_id: int):
    run_task.delay(task_id)
    return {"message": "Task queued for execution", "task_id": task_id}