from execution.celery_app import celery_app
from db.database import SessionLocal
from db.models import Agent, Task, Workflow, TaskRun, RunLog
from services.llm_service import LLMService
from langgraph.graph import StateGraph
from tools.registry import TOOLS
from datetime import datetime
import json


@celery_app.task
def run_task(task_id: int):
    db = SessionLocal()

    try:
        # 🔹 Fetch task
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            print("Task not found")
            return

        # 🔥 CREATE RUN
        task_run = TaskRun(
            task_id=task_id,
            status="in_progress"
        )
        db.add(task_run)
        db.commit()
        db.refresh(task_run)

        # 🔥 LOGGER
        def log(event_type, message, node_id=None, agent_id=None):
            log_entry = RunLog(
                task_run_id=task_run.id,
                node_id=node_id,
                agent_id=agent_id,
                event_type=event_type,
                message=message
            )
            db.add(log_entry)
            db.commit()

        # 🔹 Fetch workflow
        workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
        graph = workflow.graph_json

        # 🔥 STATE
        state = {
            "input": task.description,
            "messages": [],
            "intermediate_outputs": {},
            "tool_history": [],
            "final_output": None
        }

        llm = LLMService()
        builder = StateGraph(dict)

        # 🔹 NODE
        def create_node(node, log):
            def fn(state):
                node_id = node["id"]
                agent_id = node["agent_id"]

                log("node_start", "Node started", node_id, agent_id)

                agent = db.query(Agent).filter(Agent.id == agent_id).first()

                # 🔹 CONTEXT
                context = ""
                for n in graph["nodes"]:
                    nid = n["id"]
                    if nid in state["intermediate_outputs"]:
                        prev = state["intermediate_outputs"][nid]
                        content = prev.get("output", {}).get("content", "")
                        context += f"\n--- {nid} ---\n{content}\n"

                prompt = f"""
You are an AI agent.

ROLE:
{agent.skills}

Respond ONLY in JSON.

FORMAT:
{{
  "action": "final_answer",
  "output": {{
    "content": "...",
    "metadata": {{}}
  }}
}}

OR:
{{
  "action": "tool_call",
  "tool_name": "web_search",
  "input": "query"
}}

TASK:
{state["input"]}

CONTEXT:
{context}
"""

                result = llm.generate(prompt)

                try:
                    parsed = json.loads(result)
                except:
                    parsed = {
                        "action": "final_answer",
                        "output": {
                            "content": result,
                            "metadata": {}
                        }
                    }

                log("llm_decision", parsed.get("action"), node_id, agent_id)

                # 🔥 TOOL
                if parsed.get("action") == "tool_call":
                    tool_name = parsed.get("tool_name")
                    tool_input = parsed.get("input")

                    log("tool_call", tool_name, node_id, agent_id)

                    tool_data = {
                        "tool_name": tool_name,
                        "input": tool_input,
                        "output": None,
                        "status": "success"
                    }

                    try:
                        result = TOOLS[tool_name](tool_input)
                        tool_data["output"] = result
                    except Exception as e:
                        tool_data["output"] = str(e)
                        tool_data["status"] = "error"

                    log("tool_result", tool_data["status"], node_id, agent_id)

                    state["tool_history"].append(tool_data)

                    follow_up = f"""
Tool result:
{json.dumps(tool_data)}

Respond in JSON:
{{
  "action": "final_answer",
  "output": {{
    "content": "...",
    "metadata": {{
      "tools_used": ["{tool_name}"]
    }}
  }}
}}
"""
                    result = llm.generate(follow_up)

                    try:
                        parsed = json.loads(result)
                    except:
                        parsed = {
                            "action": "final_answer",
                            "output": {
                                "content": result,
                                "metadata": {}
                            }
                        }

                # 🔥 NORMALIZE
                if parsed.get("action") != "final_answer":
                    parsed = {
                        "action": "final_answer",
                        "output": {
                            "content": str(parsed),
                            "metadata": {}
                        }
                    }

                output = parsed.get("output")

                if isinstance(output, str):
                    parsed["output"] = {
                        "content": output,
                        "metadata": {}
                    }

                if "metadata" not in parsed["output"]:
                    parsed["output"]["metadata"] = {}

                state["intermediate_outputs"][node_id] = parsed

                log(
                    "output",
                    parsed["output"]["content"][:100],
                    node_id,
                    agent_id
                )

                return state

            return fn

        # 🔹 GRAPH BUILD
        for node in graph["nodes"]:
            builder.add_node(node["id"], create_node(node, log))

        if "edges" in graph:
            for edge in graph["edges"]:
                builder.add_edge(edge["from"], edge["to"])

        builder.set_entry_point(graph["nodes"][0]["id"])

        app = builder.compile()
        state = app.invoke(state)

        # 🔥 FINAL OUTPUT
        last_node = list(state["intermediate_outputs"].keys())[-1]
        final = state["intermediate_outputs"][last_node]

        state["final_output"] = {
            "content": final.get("output", {}).get("content", ""),
            "metadata": final.get("output", {}).get("metadata", {})
        }

        log("task_complete", "Task finished")

        task_run.status = "completed"
        task_run.final_output = json.dumps(state["final_output"])
        task_run.ended_at = datetime.utcnow()

        db.commit()

        return state["final_output"]

    except Exception as e:
        print("ERROR:", str(e))

        task_run.status = "failed"
        task_run.final_output = str(e)
        task_run.ended_at = datetime.utcnow()

        db.commit()

    finally:
        db.close()