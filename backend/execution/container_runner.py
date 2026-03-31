"""
Container runner — spawns agent_runner containers for triggered task runs.
Used by trigger_poller for folder_watch, file_watch, and email triggers.
The container runs on agentflow_internal network — no internet access.
API keys never enter the container.
"""
import subprocess
import json
import os
from datetime import datetime
from execution.celery_app import celery_app
from db.database import SessionLocal
from db.models import Task, Workflow, Agent, TaskRun, RunLog

FASTAPI_URL = os.getenv("INTERNAL_FASTAPI_URL", "http://backend:8000")
AGENT_IMAGE = os.getenv("AGENT_IMAGE", "agentflow-agent-runner")
NETWORK     = "docker_agentflow_internal"
TIMEOUT_S   = int(os.getenv("CONTAINER_TIMEOUT_S", "300"))


@celery_app.task(bind=True)
def run_triggered_task(self, task_id: int, run_id: int, triggered_by: str = "trigger"):
    """Celery task that spawns the agent_runner container for triggered runs."""
    return run_task_in_container(task_id, run_id, triggered_by)


def run_task_in_container(task_id: int, run_id: int, triggered_by: str = "trigger") -> str:
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return "Error: task not found"

        workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
        if not workflow:
            return "Error: workflow not found"

        graph = workflow.graph_json
        state = {"input": task.description, "intermediate_outputs": {}}
        task_run = db.query(TaskRun).filter(TaskRun.id == run_id).first()

        for node in graph.get("nodes", []):
            node_id = node["id"]
            agent = db.query(Agent).filter(Agent.id == node["agent_id"]).first()
            if not agent:
                _log(db, run_id, node_id, node["agent_id"], "error", "Agent not found")
                continue

            context = ""
            for k, v in state["intermediate_outputs"].items():
                context += f"--- {k} output ---\n{v}\n\n"

            _log(db, run_id, node_id, agent.id, "node_start",
                 f"Agent '{agent.name}' starting in sandbox container")

            output = _spawn_agent_container(
                run_id=run_id,
                node_id=node_id,
                agent_id=agent.id,
                task_input=task.description,
                skills=agent.skills or "",
                allowed_tools=agent.allowed_tools or [],
                context=context,
            )

            _log(db, run_id, node_id, agent.id, "output", output[:1000])
            state["intermediate_outputs"][node_id] = output

        last_node = graph["nodes"][-1]["id"] if graph.get("nodes") else None
        final_output = state["intermediate_outputs"].get(last_node, "") if last_node else ""

        if task_run:
            task_run.status = "completed"
            task_run.final_output = final_output
            task_run.ended_at = datetime.utcnow()
            db.commit()

        return final_output

    except Exception as e:
        if 'task_run' in locals() and task_run:
            task_run.status = "failed"
            task_run.ended_at = datetime.utcnow()
            db.commit()
        print(f"[container_runner] Error: {e}")
        return f"Error: {str(e)}"
    finally:
        db.close()


def _spawn_agent_container(run_id, node_id, agent_id, task_input, skills, allowed_tools, context) -> str:
    try:
        result = subprocess.run(
            [
                "docker", "run", "--rm",
                "--network", NETWORK,
                "--memory", "512m",
                "--memory-swap", "512m",
                "--cpus", "0.5",
                "--pids-limit", "100",
                "--read-only",
                "--tmpfs", "/tmp:size=64m",
                "--security-opt", "no-new-privileges:true",
                "--cap-drop", "ALL",
                "--env", f"RUN_ID={run_id}",
                "--env", f"NODE_ID={node_id}",
                "--env", f"AGENT_ID={agent_id}",
                "--env", f"FASTAPI_URL={FASTAPI_URL}",
                "--env", f"TASK_INPUT={task_input[:2000]}",
                "--env", f"AGENT_SKILLS={skills[:1000]}",
                "--env", f"ALLOWED_TOOLS={json.dumps(allowed_tools)}",
                "--env", f"CONTEXT={context[:3000]}",
                AGENT_IMAGE,
            ],
            capture_output=True, text=True, timeout=TIMEOUT_S,
        )
        if result.returncode != 0:
            err = result.stderr[:1000] or "Container exited with non-zero code"
            return f"Error: {err}"
        output = result.stdout.strip()
        return output[:20000] if output else "(no output)"
    except subprocess.TimeoutExpired:
        return f"Error: Container timed out after {TIMEOUT_S}s"
    except FileNotFoundError:
        return "Error: Docker not available"
    except Exception as e:
        return f"Error: {str(e)}"


def _log(db, run_id, node_id, agent_id, event_type, message):
    try:
        entry = RunLog(
            task_run_id=run_id, node_id=node_id, agent_id=agent_id,
            event_type=event_type, message=str(message)[:2000],
        )
        db.add(entry)
        db.commit()
    except Exception:
        pass
