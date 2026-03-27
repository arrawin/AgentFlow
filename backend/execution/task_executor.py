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
def run_task(task_id: int, existing_run_id: int = None, triggered_by: str = "manual"):
    db = SessionLocal()

    if existing_run_id:
        task_run = db.query(TaskRun).filter(TaskRun.id == existing_run_id).first()
        run_id = existing_run_id
    else:
        task_run = TaskRun(task_id=task_id, status="in_progress", triggered_by=triggered_by, started_at=datetime.utcnow())
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

                # Respect agent's allowed_tools; fall back to all tools if none set
                all_tool_keys = list(TOOLS.keys())
                if agent.allowed_tools and len(agent.allowed_tools) > 0:
                    tool_list = [t for t in agent.allowed_tools if t in TOOLS]
                else:
                    tool_list = all_tool_keys

                available_files = os.listdir(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else []
                files_text = "\n".join([f"- {f}" for f in available_files]) or "No files available"

                # Track files created during this node's execution
                files_before = set(available_files)

                max_iterations = 8
                iteration = 0
                agent_result = ""
                has_written_file = False

                tool_usage_docs = """TOOL USAGE — respond with ONLY this raw JSON (no markdown, no code fences, no extra text):
{"action": "tool_call", "tool_name": "<tool_name>", "input": <input_object>}

INPUT FORMATS PER TOOL:"""
                if "web_search" in tool_list:
                    tool_usage_docs += '\n- web_search:  {"query": "<search_term>"}'
                if "file_reader" in tool_list:
                    tool_usage_docs += '\n- file_reader: {"filename": "<filename>"}'
                if "file_search" in tool_list:
                    tool_usage_docs += '\n- file_search: {"filename": "<filename>", "query": "<search_term>"}'
                if "file_lines" in tool_list:
                    tool_usage_docs += '\n- file_lines:  {"filename": "<filename>", "start": <line_num>, "end": <line_num>}'
                if "file_writer" in tool_list:
                    tool_usage_docs += '\n- file_writer: {"filename": "<output_filename>", "content": "<full_text_content>"}'
                    tool_usage_docs += '\n  IMPORTANT: If the task asks you to write/create/save a file, you MUST call file_writer with the content. Use markdown tables, plain text, or any format appropriate for the request.'

                while iteration < max_iterations:
                    iteration += 1

                    if agent_result or context:
                        if agent_result and has_written_file:
                            # Already wrote a file — wrap up
                            instruction = "You have written a file successfully. Write your FINAL ANSWER as plain text now summarizing what you did and the filename. Do NOT call any more tools."
                        elif agent_result:
                            # Has tool results — allow file_writer if task needs it
                            if "file_writer" in tool_list:
                                instruction = f"""You have tool results above.
If the task requires writing/creating/saving output to a file, call file_writer now:
{{"action": "tool_call", "tool_name": "file_writer", "input": {{"filename": "<output_filename>", "content": "<full_content>"}}}}
If you still need more information, you may call another tool.
Otherwise, write your FINAL ANSWER as plain text now.
Available tools: {tool_list}"""
                            else:
                                instruction = "You have tool results above. Write your FINAL ANSWER as plain text now. Do NOT call any more tools."
                        else:
                            instruction = f"""You have context from previous agents above.
If you need more information, call a tool using ONLY this JSON (no extra text):
{{"action": "tool_call", "tool_name": "<tool_name>", "input": <input_object>}}
Available tools: {tool_list}
Otherwise, write your FINAL ANSWER as plain text using the context provided."""
                    else:
                        instruction = f"""{tool_usage_docs}

Available tools: {tool_list}
Do NOT add any text before or after the JSON when calling a tool."""

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
- Only use files from AVAILABLE FILES for reading
- If the task asks to create/write/save a file, you MUST use file_writer tool
- For file_writer, include the COMPLETE content in your tool call

{instruction}
"""

                    llm = LLMService(llm_config=llm_config)
                    result = llm.generate(prompt)

                    if not result:
                        result = "Error: No response from LLM"
                        break

                    log(node_id, agent.id, "llm_decision", result[:500])

                    # Scan for tool call JSON anywhere in the response
                    # Strip markdown code fences first
                    clean_result = result
                    import re as _re
                    clean_result = _re.sub(r"```(?:json)?", "", clean_result).replace("```", "")

                    tool_call = None
                    try:
                        for match_start in [i for i, c in enumerate(clean_result) if c == '{']:
                            depth = 0
                            for i, ch in enumerate(clean_result[match_start:]):
                                if ch == '{':
                                    depth += 1
                                elif ch == '}':
                                    depth -= 1
                                    if depth == 0:
                                        candidate = clean_result[match_start:match_start + i + 1]
                                        try:
                                            parsed = json.loads(candidate)
                                            action = parsed.get("action", "")
                                            tool_name = parsed.get("tool_name")

                                            # Format 1: {"action": "tool_call", "tool_name": "web_search", "input": {...}}
                                            if tool_name and (action == "tool_call" or action in TOOLS):
                                                tool_call = parsed
                                                break

                                            # Format 2: {"action": "web_search", "input": {...}} — action IS the tool name
                                            if not tool_name and action in TOOLS:
                                                parsed["tool_name"] = action
                                                parsed["action"] = "tool_call"
                                                # input may be a string — normalize to dict
                                                if isinstance(parsed.get("input"), str):
                                                    parsed["input"] = {"filename": parsed["input"]} if action in ("file_reader", "file_search", "file_lines") else {"query": parsed["input"]}
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

                        # Enforce allowed_tools
                        if tool_name not in tool_list:
                            tool_result = f"Error: Tool '{tool_name}' is not in your allowed tools. Available: {tool_list}"
                            log(node_id, agent.id, "tool_blocked", tool_result)
                            agent_result += f"\n\nTool '{tool_name}' result:\n{tool_result}\n"
                            continue

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
                                    # Track if file_writer was used successfully
                                    if tool_name == "file_writer" and "successfully" in str(tool_result):
                                        has_written_file = True
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

                # Detect any files created during this node's execution
                files_after = set(os.listdir(UPLOAD_DIR)) if os.path.exists(UPLOAD_DIR) else set()
                new_files = files_after - files_before
                if new_files:
                    file_list_str = ", ".join(new_files)
                    agent_result += f"\n\n[GENERATED FILES: {file_list_str}]"
                    # Store generated files in state for downstream use
                    if "generated_files" not in state:
                        state["generated_files"] = []
                    state["generated_files"].extend(list(new_files))

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

        # Store generated files list on the run (safe — won't crash if column missing)
        generated_files = state.get("generated_files", [])
        if generated_files:
            try:
                task_run.generated_files = generated_files
            except Exception:
                pass  # Column may not exist yet; files are still on disk

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


@celery_app.task
def run_scheduled_task(task_id: int, schedule_id: int):
    """Celery Beat fires this. Runs the task with triggered_by=scheduler."""
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            print(f"[scheduler] Task {task_id} not found")
            return

        workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
        if not workflow:
            print(f"[scheduler] Workflow not found for task {task_id}")
            return

        # Single task_run row — no duplicate
        task_run = TaskRun(
            task_id=task_id,
            status="in_progress",
            triggered_by="scheduler",
            workflow_snapshot=workflow.graph_json,
            started_at=datetime.utcnow(),
        )
        db.add(task_run)
        db.commit()
        db.refresh(task_run)
        run_id = task_run.id
        db.close()

        print(f"[scheduler] Running task {task_id} (run_id={run_id}) from schedule {schedule_id}")
        # Pass the existing run_id so run_task doesn't create a second row
        run_task.delay(task_id, existing_run_id=run_id, triggered_by="scheduler")

    except Exception as e:
        print(f"[scheduler] Error: {e}")
        try:
            db.close()
        except Exception:
            pass
