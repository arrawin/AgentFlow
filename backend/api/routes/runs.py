from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import TaskRun, RunLog

router = APIRouter()


# 🔹 DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 🔥 GET ALL RUNS (Run History Page)
@router.get("/runs")
def get_runs(db: Session = Depends(get_db)):
    runs = db.query(TaskRun).order_by(TaskRun.started_at.desc()).all()

    return [
        {
            "id": run.id,
            "task_id": run.task_id,
            "status": run.status,
            "triggered_by": run.triggered_by,
            "started_at": run.started_at,
            "ended_at": run.ended_at,
            "final_output": run.final_output,
            "generated_files": getattr(run, 'generated_files', None) or [],
        }
        for run in runs
    ]


# 🔥 GET TRACE (THIS IS THE CORE)
@router.get("/runs/{run_id}/trace")
def get_run_trace(run_id: int, db: Session = Depends(get_db)):
    logs = (
        db.query(RunLog)
        .filter(RunLog.task_run_id == run_id)
        .order_by(RunLog.timestamp.asc())
        .all()
    )

    trace = []

    for log in logs:
        trace.append({
            "node_id": log.node_id,
            "agent_id": log.agent_id,
            "event_type": log.event_type,
            "message": log.message,
            "timestamp": log.timestamp
        })

    return {
        "run_id": run_id,
        "trace": trace
    }