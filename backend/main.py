from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base
from seeds.workflow_architect import seed_workflow_architect
from execution.celery_app import register_schedules
from api.routes.domains import router as domains_router
from api.routes.agents import router as agents_router
from api.routes.workflows import router as workflows_router
from api.routes.tasks import router as tasks_router
from api.routes.runs import router as runs_router
from api.routes.files import router as files_router
from api.routes.llm_configs import router as llm_configs_router
from api.routes.schedules import router as schedules_router
from api.routes.dashboard import router as dashboard_router
from api.routes.tools import router as tools_router
from api.routes.internal import router as internal_router
from api.routes.notifications import router as notifications_router

app = FastAPI(title="Workflow Orchestration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# Seed system agents
seed_workflow_architect()

# Register cron schedules with Celery Beat
register_schedules()

app.include_router(domains_router, prefix="/api", tags=["domains"])
app.include_router(agents_router, prefix="/api", tags=["agents"])
app.include_router(workflows_router, prefix="/api", tags=["workflows"])
app.include_router(tasks_router, prefix="/api", tags=["tasks"])
app.include_router(runs_router, prefix="/api", tags=["runs"])
app.include_router(files_router, prefix="/api/files", tags=["files"])
app.include_router(llm_configs_router, prefix="/api", tags=["llm-configs"])
app.include_router(schedules_router, prefix="/api", tags=["schedules"])
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])
app.include_router(tools_router, prefix="/api", tags=["tools"])
app.include_router(internal_router, tags=["internal"])
app.include_router(notifications_router, prefix="/api", tags=["notifications"])


@app.get("/")
def root():
    return {"message": "Workflow Orchestration API is running"}
