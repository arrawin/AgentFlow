from celery import Celery
from celery.schedules import crontab
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Import task module to register tasks
from execution import task_executor


def register_schedules():
    """Load all enabled cron schedules from DB and register with Celery Beat."""
    from db.database import SessionLocal
    from db.models import Schedule
    db = SessionLocal()
    try:
        schedules = db.query(Schedule).filter(
            Schedule.enabled == True,
            Schedule.trigger_type == "cron",
            Schedule.cron_expression != None
        ).all()

        beat_schedule = {}
        for sc in schedules:
            for task_id in (sc.task_ids or []):
                key = f"schedule-{sc.id}-task-{task_id}"
                try:
                    parts = sc.cron_expression.strip().split()
                    if len(parts) != 5:
                        continue
                    minute, hour, day, month, weekday = parts
                    beat_schedule[key] = {
                        "task": "execution.task_executor.run_scheduled_task",
                        "schedule": crontab(
                            minute=minute,
                            hour=hour,
                            day_of_month=day,
                            month_of_year=month,
                            day_of_week=weekday,
                        ),
                        "args": [task_id, sc.id],
                    }
                except Exception as e:
                    print(f"[beat] Failed to register schedule {sc.id}: {e}")

        celery_app.conf.beat_schedule = beat_schedule
        print(f"[beat] Registered {len(beat_schedule)} cron job(s)")
    except Exception as e:
        print(f"[beat] register_schedules error: {e}")
    finally:
        db.close()


# Load schedules at import time so Beat reads them on startup
try:
    register_schedules()
except Exception:
    pass

# Also reload when Beat process initialises
from celery.signals import beat_init

@beat_init.connect
def on_beat_init(sender, **kwargs):
    register_schedules()


# Add a periodic task that reloads schedules from DB every minute
# This ensures new schedules created after Beat started are picked up automatically
@celery_app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(60.0, reload_schedules_task.s(), name="reload-schedules-every-minute")


@celery_app.task
def reload_schedules_task():
    register_schedules()
