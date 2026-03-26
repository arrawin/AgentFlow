from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Domain
from pydantic import BaseModel
from typing import List

router = APIRouter()


class DomainCreate(BaseModel):
    name: str


class DomainResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


@router.post("/domains", response_model=DomainResponse)
def create_domain(domain: DomainCreate, db: Session = Depends(get_db)):
    existing = db.query(Domain).filter(Domain.name == domain.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Domain already exists")
    new_domain = Domain(name=domain.name)
    db.add(new_domain)
    db.commit()
    db.refresh(new_domain)
    return new_domain


@router.get("/domains", response_model=List[DomainResponse])
def get_domains(db: Session = Depends(get_db)):
    return db.query(Domain).all()


@router.get("/domains/{domain_id}", response_model=DomainResponse)
def get_domain(domain_id: int, db: Session = Depends(get_db)):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain


@router.delete("/domains/{domain_id}")
def delete_domain(domain_id: int, db: Session = Depends(get_db)):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    db.delete(domain)
    db.commit()
    return {"message": "Domain deleted"}
