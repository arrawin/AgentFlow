from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.domains import router as domains_router
from api.routes.agents import router as agents_router
from api.routes.workflows import router as workflows_router
from api.routes.tasks import router as tasks_router
from api.routes.runs import router as runs_router
from db.database import engine, Base

app = FastAPI(title="Workflow Orchestration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(domains_router, prefix="/api", tags=["domains"])
app.include_router(agents_router, prefix="/api", tags=["agents"])
app.include_router(workflows_router, prefix="/api", tags=["workflows"])
app.include_router(tasks_router, prefix="/api", tags=["tasks"])
app.include_router(runs_router, prefix="/api", tags=["runs"])

@app.get("/")
def root():
    return {"message": "Workflow Orchestration API is running"}