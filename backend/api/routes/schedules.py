from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Schedule
from api.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from execution.celery_app import register_schedules
from services.encryption_service import EncryptionService
from typing import List
import subprocess

router = APIRouter()


def _reload_beat():
    try:
        subprocess.Popen(
            ["docker", "restart", "docker-celery_beat-1"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        print(f"[beat reload] Could not restart beat container: {e}")


def _build_schedule(payload: ScheduleCreate) -> Schedule:
    data = payload.dict(exclude={"imap_password"})
    schedule = Schedule(**data)
    if payload.imap_password:
        enc = EncryptionService()
        schedule.imap_password_encrypted = enc.encrypt(payload.imap_password)
    return schedule


@router.post("/schedules", response_model=ScheduleResponse)
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db)):
    if payload.trigger_type == "cron" and not payload.cron_expression:
        raise HTTPException(status_code=400, detail="cron_expression required for cron trigger")
    if payload.trigger_type in ("folder_watch", "file_watch") and not payload.watch_path:
        raise HTTPException(status_code=400, detail="watch_path required for folder/file watch trigger")
    if payload.trigger_type == "email" and not payload.imap_host:
        raise HTTPException(status_code=400, detail="imap_host required for email trigger")

    schedule = _build_schedule(payload)
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
    for field, value in update.dict(exclude={"imap_password"}, exclude_none=True).items():
        setattr(schedule, field, value)
    if update.imap_password:
        enc = EncryptionService()
        schedule.imap_password_encrypted = enc.encrypt(update.imap_password)
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
