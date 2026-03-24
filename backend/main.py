from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.domains import router as d
from api.routes.agents import router as a
from api.routes.workflows import router as w
from api.routes.tasks import router as t
from db.database import engine, Base

app = FastAPI(title="Workflow Orchestration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(d, prefix="/api", tags=["domains"])
app.include_router(a, prefix="/api", tags=["agents"])
app.include_router(w, prefix="/api", tags=["workflows"])
app.include_router(t, prefix="/api", tags=["tasks"])

@app.get("/")
def root():
    return {"message": "Workflow Orchestration API is running"}