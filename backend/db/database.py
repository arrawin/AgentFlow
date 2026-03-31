from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/workflow_db")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # Verify connections before using
    pool_recycle=60,      # Recycle connections every 60s (Neon drops idle ones aggressively)
    pool_size=3,          # Smaller pool for serverless DB
    max_overflow=5,
    connect_args={"connect_timeout": 10},
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()