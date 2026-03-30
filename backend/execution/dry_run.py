"""
Dry run execution — runs the full workflow with MockLLM and MockTools.
No real API calls, no DB writes for results. Returns per-node timing and output.
"""
import time
from db.database import SessionLocal
from db.models import Agent, Task, Workflow
from validation.workflow_validator import validate_workflow


class MockLLM:
    """Returns a canned response without calling any LLM API."""
    def generate(self, prompt: str) -> str:
        # Extract agent name from prompt if possible
        name = "Agent"
        for line in prompt.split("\n"):
            if line.startswith("You are:"):
                name = line.replace("You are:", "").strip()
                break
        return f"[Dry Run] {name} processed the task. This is a mock response — no real LLM call was made."


class MockTool:
    """Returns stub data for any tool call."""
    @staticmethod
    def call(tool_name: str, tool_input: dict) -> str:
        stubs = {
            "web_search":  "[Mock] Web search results: Found 5 relevant articles about the topic.",
            "file_reader": "[Mock] File content: Sample file content returned by mock tool.",
            "file_search": "[Mock] File search: Found 3 matching lines.",
            "file_lines":  "[Mock] Lines 1-10: Sample content from the file.",
            "file_writer": "[Mock] File written successfully (mock — no actual file created).",
        }
        return stubs.get(tool_name, f"[Mock] Tool '{tool_name}' returned stub data.")


def run_dry_run(task_id: int) -> dict:
    """
    Execute a full workflow dry run synchronously.
    Returns: { status, nodes: [{ node_id, agent_name, status, duration_ms, output }], total_ms }
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

        mock_llm = MockLLM()
        state = {
            "input": task.description,
            "intermediate_outputs": {},
        }

        node_results = []
        total_start = time.time()

        for node in graph["nodes"]:
            node_id = node["id"]
            agent = db.query(Agent).filter(Agent.id == node["agent_id"]).first()
            agent_name = agent.name if agent else f"Agent #{node['agent_id']}"

            node_start = time.time()
            try:
                # Build context from previous nodes
                context = ""
                for k, v in state["intermediate_outputs"].items():
                    context += f"--- {k} output ---\n{v}\n\n"

                skills = agent.skills if agent else "No skills"
                prompt = f"""You are: {agent_name}
{skills}

TASK: {state['input']}

CONTEXT FROM PREVIOUS AGENTS:
{context if context else "None"}"""

                output = mock_llm.generate(prompt)

                # Simulate tool call detection — check if agent has tools
                tool_calls = []
                if agent and agent.allowed_tools:
                    for tool in agent.allowed_tools[:1]:  # mock one tool call
                        tool_result = MockTool.call(tool, {})
                        tool_calls.append({"tool": tool, "result": tool_result})
                        output += f"\n\n[Tool: {tool}] {tool_result}"

                state["intermediate_outputs"][node_id] = output
                duration_ms = int((time.time() - node_start) * 1000)

                node_results.append({
                    "node_id": node_id,
                    "agent_name": agent_name,
                    "agent_id": node["agent_id"],
                    "status": "success",
                    "duration_ms": duration_ms,
                    "output": output,
                    "tool_calls": tool_calls,
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
