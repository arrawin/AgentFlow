from execution.celery_app import celery_app
from db.database import SessionLocal
from db.models import Agent, Task, Workflow, TaskRun, RunLog
from services.llm_service import LLMService
from langgraph.graph import StateGraph
from tools.registry import TOOLS
from tools.utils import UPLOAD_DIR
from validation.workflow_validator import validate_workflow
from datetime import datetime
import json
import os


def should_execute_tool(state, tool_name, tool_input):
    for t in state["tool_history"]:
        if t["tool"] == tool_name and t["input"] == tool_input:
            return False, "Duplicate tool call"
    return True, None


@celery_app.task
def run_task(task_id: int):
    db = SessionLocal()

    task_run = TaskRun(task_id=task_id, status="in_progress", started_at=datetime.utcnow())
    db.add(task_run)
    db.commit()
    db.refresh(task_run)
    run_id = task_run.id

    def log(node_id, agent_id, event_type, message):
        entry = RunLog(
            task_run_id=run_id,
            node_id=node_id,
            agent_id=agent_id,
            event_type=event_type,
            message=str(message)
        )
        db.add(entry)
        db.commit()

    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            task_run.status = "failed"
            task_run.ended_at = datetime.utcnow()
            db.commit()
            return

        workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
        if not workflow:
            task_run.status = "failed"
            task_run.ended_at = datetime.utcnow()
            db.commit()
            return

        graph = workflow.graph_json

        # Validate graph before execution
        valid_agent_ids = {a.id for a in db.query(Agent).all()}
        errors = validate_workflow(graph, valid_agent_ids)
        if errors:
            task_run.status = "failed"
            task_run.ended_at = datetime.utcnow()
            db.commit()
            print(f"Workflow validation failed: {errors}")
            return

        # Snapshot the workflow at time of run
        task_run.workflow_snapshot = graph
        task_run.triggered_by = "manual"
        db.commit()

        state = {
            "input": task.description,
            "intermediate_outputs": {},
            "tool_history": [],
            "final_output": None
        }

        builder = StateGraph(dict)

        def create_node(node):
            def fn(state):
                node_id = node["id"]
                agent = db.query(Agent).filter(Agent.id == node["agent_id"]).first()

                if not agent:
                    log(node_id, node["agent_id"], "error", "Agent not found")
                    state["intermediate_outputs"][node_id] = "Error: Agent not found"
                    return state

                log(node_id, agent.id, "node_start", f"Agent '{agent.name}' started")

                # Load agent's LLM config if set, else fall back to default Groq
                llm_config = None
                if agent.llm_config_id:
                    from db.models import LLMConfig
                    llm_config = db.query(LLMConfig).filter(LLMConfig.id == agent.llm_config_id).first()

                context = ""
                for k, v in state["intermediate_outputs"].items():
                    context += f"--- {k} output ---\n{v}\n\n"

                skills_text = agent.skills if agent.skills else "No specific skills"
                tool_list = list(TOOLS.keys())

                available_files = os.listdir(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else []
                files_text = "\n".join([f"- {f}" for f in available_files]) or "No files available"

                max_iterations = 5
                iteration = 0
                agent_result = ""

                while iteration < max_iterations:
                    iteration += 1

                    if agent_result or context:
                        if agent_result:
                            instruction = "You have tool results above. Write your FINAL ANSWER as plain text now. Do NOT call any more tools."
                        else:
                            instruction = f"""You have context from previous agents above.
If you need more information, call a tool using ONLY this JSON (no extra text):
{{"action": "tool_call", "tool_name": "<tool_name>", "input": {{"query": "<search_term>"}}}}
Available tools: {tool_list}
Otherwise, write your FINAL ANSWER as plain text using the context provided."""
                    else:
                        instruction = f"""Available tools: {tool_list}
To call a tool respond with ONLY this JSON (no extra text):
{{"action": "tool_call", "tool_name": "<tool_name>", "input": {{"query": "<search_term>"}}}}
- For web_search: {{"query": "<search_term>"}}
- For file_reader: {{"filename": "<filename>"}}
- For file_search: {{"filename": "<filename>", "query": "<search_term>"}}
- Do NOT add any text before or after the JSON."""

                    prompt = f"""You are: {agent.name}
{skills_text}

TASK:
{state['input']}

CONTEXT FROM PREVIOUS AGENTS:
{context if context else "None"}

YOUR TOOL RESULTS SO FAR:
{agent_result if agent_result else "None"}

AVAILABLE FILES:
{files_text}

RULES:
- Do NOT call the same tool with same input twice
- If a tool fails, correct your input
- Only use files from AVAILABLE FILES

{instruction}
"""

                    llm = LLMService(llm_config=llm_config)
                    result = llm.generate(prompt)

                    if not result:
                        result = "Error: No response from LLM"
                        break

                    log(node_id, agent.id, "llm_decision", result[:500])

                    # Scan for tool call JSON anywhere in the response
                    tool_call = None
                    try:
                        for match_start in [i for i, c in enumerate(result) if c == '{']:
                            depth = 0
                            for i, ch in enumerate(result[match_start:]):
                                if ch == '{':
                                    depth += 1
                                elif ch == '}':
                                    depth -= 1
                                    if depth == 0:
                                        candidate = result[match_start:match_start + i + 1]
                                        try:
                                            parsed = json.loads(candidate)
                                            tool_name = parsed.get("tool_name")
                                            action = parsed.get("action", "")
                                            if tool_name and (action == "tool_call" or action in TOOLS):
                                                tool_call = parsed
                                                break
                                        except Exception:
                                            pass
                                        break
                            if tool_call:
                                break
                    except Exception:
                        pass

                    if tool_call:
                        tool_name = tool_call.get("tool_name")
                        tool_input = tool_call.get("input", {})

                        log(node_id, agent.id, "tool_call", f"{tool_name} | {tool_input}")

                        allowed, reason = should_execute_tool(state, tool_name, tool_input)
                        if not allowed:
                            tool_result = f"Blocked: {reason}"
                        else:
                            tool_fn = TOOLS.get(tool_name)
                            if not tool_fn:
                                tool_result = f"Error: Tool '{tool_name}' not found. Available: {tool_list}"
                            else:
                                try:
                                    tool_result = tool_fn(tool_input)
                                except Exception as e:
                                    tool_result = f"Tool execution failed: {str(e)}"

                            state["tool_history"].append({
                                "tool": tool_name,
                                "input": tool_input,
                                "result": str(tool_result)[:200]
                            })

                        log(node_id, agent.id, "tool_result", str(tool_result)[:500])
                        agent_result += f"\n\nTool '{tool_name}' result:\n{tool_result}\n"
                        continue

                    agent_result = result
                    break

                if iteration >= max_iterations:
                    agent_result = f"Max iterations reached. Last result: {agent_result}"

                state["intermediate_outputs"][node_id] = agent_result
                log(node_id, agent.id, "output", agent_result[:1000])

                print("\n" + "=" * 30)
                print(f"NODE {node_id} ({agent.name})")
                print("=" * 30)
                print(agent_result)

                return state

            return fn

        for node in graph["nodes"]:
            builder.add_node(node["id"], create_node(node))

        if "edges" in graph:
            for edge in graph["edges"]:
                builder.add_edge(edge["from"], edge["to"])

        builder.set_entry_point(graph["nodes"][0]["id"])

        app = builder.compile()
        state = app.invoke(state)

        last_node = graph["nodes"][-1]["id"]
        final_output = state["intermediate_outputs"].get(last_node, "")

        task_run.status = "completed"
        task_run.final_output = final_output
        task_run.ended_at = datetime.utcnow()
        db.commit()

        print("\n" + "=" * 30)
        print("FINAL OUTPUT")
        print("=" * 30)
        print(final_output)

        return final_output

    except Exception as e:
        task_run.status = "failed"
        task_run.ended_at = datetime.utcnow()
        db.commit()
        print(f"Error executing task {task_id}: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
