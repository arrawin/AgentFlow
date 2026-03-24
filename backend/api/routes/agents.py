from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Agent
from api.schemas.agents import AgentCreate, AgentResponse
from typing import List

router = APIRouter()


@router.post("/agents", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    db_agent = Agent(**agent.dict())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.get("/agents", response_model=List[AgentResponse])
def get_agents(db: Session = Depends(get_db)):
    return db.query(Agent).all()