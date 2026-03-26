from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Agent, Task, Schedule, TaskRun

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    agents_count = db.query(Agent).filter(Agent.is_system == False).count()
    tasks_count = db.query(Task).count()
    schedules_count = db.query(Schedule).count()

    recent_runs = db.query(TaskRun).order_by(TaskRun.started_at.desc()).limit(10).all()
    
    # Calculate success rate
    total_runs = db.query(TaskRun).filter(TaskRun.status.in_(["completed", "failed"])).count()
    successful_runs = db.query(TaskRun).filter(TaskRun.status == "completed").count()
    success_rate = f"{(successful_runs / total_runs * 100):.1f}%" if total_runs > 0 else "100%"

    return {
        "agents_count": agents_count,
        "tasks_count": tasks_count,
        "schedules_count": schedules_count,
        "success_rate": success_rate,
        "recent_runs": [
            {
                "id": r.id,
                "task_id": r.task_id,
                "status": r.status,
                "started_at": r.started_at,
                "ended_at": r.ended_at,
                "triggered_by": r.triggered_by,
            }
            for r in recent_runs
        ]
    }
