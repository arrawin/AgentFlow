from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Schedule
from api.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from execution.celery_app import register_schedules
from typing import List
import subprocess


def _reload_beat():
    """Restart the celery_beat container so it picks up new schedules."""
    try:
        subprocess.Popen(
            ["docker", "restart", "docker-celery_beat-1"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        print(f"[beat reload] Could not restart beat container: {e}")

router = APIRouter()


@router.post("/schedules", response_model=ScheduleResponse)
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db)):
    if payload.trigger_type == "email":
        schedule = Schedule(
            name=payload.name,
            trigger_type="email",
            task_ids=payload.task_ids,
            enabled=False,
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule

    if payload.trigger_type == "cron" and not payload.cron_expression:
        raise HTTPException(status_code=400, detail="cron_expression required for cron trigger")

    schedule = Schedule(**payload.dict())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    register_schedules()
    _reload_beat()
    return schedule


@router.get("/schedules", response_model=List[ScheduleResponse])
def get_schedules(db: Session = Depends(get_db)):
    return db.query(Schedule).all()


@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


@router.patch("/schedules/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(schedule_id: int, update: ScheduleUpdate, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    for field, value in update.dict(exclude_none=True).items():
        setattr(schedule, field, value)
    db.commit()
    db.refresh(schedule)
    register_schedules()
    _reload_beat()
    return schedule


@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    register_schedules()
    _reload_beat()
    return {"message": "Schedule deleted"}


@router.post("/schedules/email/stub")
def email_stub():
    return {"message": "Email trigger not yet implemented"}
