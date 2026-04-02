"""
Notifications — returns recently completed/failed task runs for the bell icon.
No persistent notification state — uses the runs table directly.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import TaskRun, Task

router = APIRouter()


@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    """Return last 20 completed/failed runs as notifications."""
    runs = (
        db.query(TaskRun)
        .filter(TaskRun.status.in_(["completed", "failed"]))
        .order_by(TaskRun.ended_at.desc())
        .limit(5)
        .all()
    )

    task_ids = {r.task_id for r in runs}
    task_names = {t.id: t.name for t in db.query(Task).filter(Task.id.in_(task_ids)).all()}

    return [
        {
            "run_id": r.id,
            "task_id": r.task_id,
            "task_name": task_names.get(r.task_id, f"Task #{r.task_id}"),
            "status": r.status,
            "triggered_by": r.triggered_by or "manual",
            "ended_at": r.ended_at.isoformat() if r.ended_at else None,
        }
        for r in runs
    ]
