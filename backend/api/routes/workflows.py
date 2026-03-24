from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Workflow
from api.schemas.workflow import WorkflowCreate, WorkflowResponse
from typing import List

router = APIRouter()


@router.post("/workflows", response_model=WorkflowResponse)
def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_db)):
    db_workflow = Workflow(**workflow.dict())
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return db_workflow


@router.get("/workflows", response_model=List[WorkflowResponse])
def get_workflows(db: Session = Depends(get_db)):
    return db.query(Workflow).all()