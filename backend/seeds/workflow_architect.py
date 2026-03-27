import os
from db.database import SessionLocal
from db.models import Agent, Domain, Task


SKILL_FILE = os.path.join(os.path.dirname(__file__), "workflow_architect_skill.md")
AGENT_NAME = "Workflow Architect"
DOMAIN_NAME = "SYSTEM"


def seed_workflow_architect():
    db = SessionLocal()
    try:
        # Backfill NULL task config columns from tasks created before defaults were set
        db.execute(
            __import__("sqlalchemy").text(
                "UPDATE tasks SET max_tokens=4096 WHERE max_tokens IS NULL"
            )
        )
        db.execute(
            __import__("sqlalchemy").text(
                "UPDATE tasks SET max_steps=10 WHERE max_steps IS NULL"
            )
        )
        db.execute(
            __import__("sqlalchemy").text(
                "UPDATE tasks SET timeout_s=300 WHERE timeout_s IS NULL"
            )
        )
        db.execute(
            __import__("sqlalchemy").text(
                "UPDATE tasks SET retries=3 WHERE retries IS NULL"
            )
        )
        db.commit()

        # Skip if already seeded
        existing = db.query(Agent).filter(Agent.name == AGENT_NAME, Agent.is_system == True).first()
        if existing:
            return

        # Ensure SYSTEM domain exists
        domain = db.query(Domain).filter(Domain.name == DOMAIN_NAME).first()
        if not domain:
            domain = Domain(name=DOMAIN_NAME)
            db.add(domain)
            db.commit()
            db.refresh(domain)

        # Read skill file
        with open(SKILL_FILE, "r") as f:
            skill_content = f.read()

        agent = Agent(
            name=AGENT_NAME,
            domain_id=domain.id,
            skills=skill_content,
            skill_file_path=SKILL_FILE,
            is_system=True,
            allowed_tools=[],
        )
        db.add(agent)
        db.commit()
        print(f"[seed] Workflow Architect Agent seeded (id={agent.id})")
    except Exception as e:
        print(f"[seed] Failed to seed Workflow Architect Agent: {e}")
        db.rollback()
    finally:
        db.close()
