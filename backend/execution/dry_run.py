"""
Dry run — runs the full workflow with the real LLM and real tools.
No DB writes (no TaskRun/RunLog rows created). Returns per-node timing and output.
"""
import time
import json
import re
import os
from db.database import SessionLocal
from db.models import Agent, Task, Workflow, LLMConfig
from validation.workflow_validator import validate_workflow
from services.llm_service import LLMService
from tools.registry import TOOLS
from tools.utils import UPLOAD_DIR


def _should_execute_tool(tool_history, tool_name, tool_input):
    for t in tool_history:
        if t["tool"] == tool_name and t["input"] == tool_input:
            return False
    return True


def run_dry_run(task_id: int) -> dict:
    """
    Execute a full workflow dry run synchronously using the real LLM.
    No TaskRun or RunLog rows are written.
    Returns: { status, task_name, total_ms, nodes: [...], final_output }
    """
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return {"status": "failed", "error": f"Task {task_id} not found", "nodes": []}

        workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
        if not workflow:
            return {"status": "failed", "error": "Workflow not found", "nodes": []}

        graph = workflow.graph_json
        valid_agent_ids = {a.id for a in db.query(Agent).all()}
        errors = validate_workflow(graph, valid_agent_ids)
        if errors:
            return {"status": "failed", "error": f"Workflow validation failed: {errors}", "nodes": []}

        state = {
            "input": task.description,
            "intermediate_outputs": {},
            "tool_history": [],
        }

        node_results = []
        total_start = time.time()

        for node in graph["nodes"]:
            node_id = node["id"]
            agent = db.query(Agent).filter(Agent.id == node["agent_id"]).first()
            agent_name = agent.name if agent else f"Agent #{node['agent_id']}"
            node_start = time.time()

            try:
                llm_config = db.query(LLMConfig).filter(LLMConfig.is_default == True).first()
                llm = LLMService(llm_config=llm_config)

                context = ""
                for k, v in state["intermediate_outputs"].items():
                    context += f"--- {k} output ---\n{v}\n\n"

                skills_text = agent.skills if agent and agent.skills else "No specific skills"
                all_tool_keys = list(TOOLS.keys())
                tool_list = [t for t in (agent.allowed_tools or []) if t in TOOLS] if agent and agent.allowed_tools else all_tool_keys

                available_files = os.listdir(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else []
                files_text = "\n".join([f"- {f}" for f in available_files]) or "No files available"

                max_iterations = 8
                iteration = 0
                agent_result = ""
                tool_calls_log = []

                while iteration < max_iterations:
                    iteration += 1

                    if agent_result:
                        instruction = "You have tool results above. Write your FINAL ANSWER as plain text now."
                    else:
                        tool_docs = "TOOL USAGE — respond with ONLY this raw JSON:\n{\"action\": \"tool_call\", \"tool_name\": \"<tool_name>\", \"input\": <input_object>}\n"
                        if "web_search" in tool_list:
                            tool_docs += '\n- web_search: {"query": "<search_term>"}'
                        if "file_reader" in tool_list:
                            tool_docs += '\n- file_reader: {"filename": "<filename>"}'
                        if "file_writer" in tool_list:
                            tool_docs += '\n- file_writer: {"filename": "<filename>", "content": "<content>"}'
                        instruction = f"{tool_docs}\n\nAvailable tools: {tool_list}\nOtherwise write your FINAL ANSWER."

                    prompt = f"""You are: {agent_name}
{skills_text}

TASK:
{state['input']}

CONTEXT FROM PREVIOUS AGENTS:
{context if context else "None"}

YOUR TOOL RESULTS SO FAR:
{agent_result if agent_result else "None"}

AVAILABLE FILES:
{files_text}

{instruction}
"""
                    result = llm.generate(prompt)
                    if not result:
                        result = "Error: No response from LLM"
                        break

                    # Parse tool call
                    clean = re.sub(r"```(?:json)?", "", result).replace("```", "")
                    tool_call = None
                    try:
                        for i, c in enumerate(clean):
                            if c == '{':
                                depth = 0
                                for j, ch in enumerate(clean[i:]):
                                    if ch == '{': depth += 1
                                    elif ch == '}':
                                        depth -= 1
                                        if depth == 0:
                                            candidate = clean[i:i+j+1]
                                            try:
                                                parsed = json.loads(candidate)
                                                if parsed.get("tool_name") and (parsed.get("action") == "tool_call" or parsed.get("action") in TOOLS):
                                                    tool_call = parsed
                                                elif not parsed.get("tool_name") and parsed.get("action") in TOOLS:
                                                    parsed["tool_name"] = parsed["action"]
                                                    parsed["action"] = "tool_call"
                                                    tool_call = parsed
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

                        if tool_name not in tool_list:
                            agent_result += f"\nTool '{tool_name}' not allowed.\n"
                            continue

                        if not _should_execute_tool(state["tool_history"], tool_name, tool_input):
                            agent_result += f"\nDuplicate tool call blocked.\n"
                            continue

                        tool_fn = TOOLS.get(tool_name)
                        if tool_fn:
                            try:
                                tool_result = tool_fn(tool_input)
                            except Exception as e:
                                tool_result = f"Tool error: {str(e)}"
                        else:
                            tool_result = f"Tool '{tool_name}' not found."

                        state["tool_history"].append({"tool": tool_name, "input": tool_input})
                        tool_calls_log.append({"tool": tool_name, "result": str(tool_result)[:300]})
                        agent_result += f"\nTool '{tool_name}' result:\n{tool_result}\n"
                        continue

                    agent_result = result
                    break

                state["intermediate_outputs"][node_id] = agent_result
                duration_ms = int((time.time() - node_start) * 1000)

                node_results.append({
                    "node_id": node_id,
                    "agent_name": agent_name,
                    "agent_id": node["agent_id"],
                    "status": "success",
                    "duration_ms": duration_ms,
                    "output": agent_result,
                    "tool_calls": tool_calls_log,
                })

            except Exception as e:
                duration_ms = int((time.time() - node_start) * 1000)
                node_results.append({
                    "node_id": node_id,
                    "agent_name": agent_name,
                    "agent_id": node["agent_id"],
                    "status": "error",
                    "duration_ms": duration_ms,
                    "output": f"Error: {str(e)}",
                    "tool_calls": [],
                })

        total_ms = int((time.time() - total_start) * 1000)
        final_output = state["intermediate_outputs"].get(graph["nodes"][-1]["id"], "") if graph["nodes"] else ""

        return {
            "status": "success",
            "task_name": task.name,
            "total_ms": total_ms,
            "nodes": node_results,
            "final_output": final_output,
        }

    except Exception as e:
        return {"status": "failed", "error": str(e), "nodes": []}
    finally:
        db.close()
