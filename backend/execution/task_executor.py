from execution.celery_app import celery_app
from db.database import SessionLocal
from db.models import Agent, Task, Workflow
from services.llm_service import LLMService
from langgraph.graph import StateGraph
from tools.registry import TOOLS
import json


@celery_app.task
def run_task(task_id: int):
    db = SessionLocal()

    try:
        # 🔹 Fetch task
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            print(f"Error: Task {task_id} not found")
            return

        # 🔹 Fetch workflow
        workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
        if not workflow:
            print(f"Error: Workflow {task.workflow_id} not found")
            return

        graph = workflow.graph_json

        if not graph or "nodes" not in graph or len(graph["nodes"]) == 0:
            print("Error: Invalid workflow graph")
            return

        # 🔹 Initialize state
        state = {
            "input": task.description,
            "intermediate_outputs": {},
            "final_output": None
        }

        llm = LLMService()
        builder = StateGraph(dict)

        # 🔹 Node factory
        def create_node(node):
            def fn(state):
                node_id = node["id"]
                agent_id = node["agent_id"]

                agent = db.query(Agent).filter(Agent.id == agent_id).first()

                if not agent:
                    state["intermediate_outputs"][node_id] = {
                        "action": "final_answer",
                        "output": "Error: Agent not found"
                    }
                    return state

                # 🟢 STRONG CONTEXT BUILDER
                context = ""
                for n in graph["nodes"]:
                    nid = n["id"]
                    if nid in state["intermediate_outputs"]:
                        prev = state["intermediate_outputs"][nid]

                        if isinstance(prev, dict):
                            output = prev.get("output")

                            if isinstance(output, dict):
                                content = json.dumps(output, indent=2)
                            else:
                                content = output or str(prev)
                        else:
                            content = str(prev)

                        context += f"""
--- OUTPUT FROM {nid} ---
{content}
"""

                skills_text = agent.skills if agent.skills else "You are a helpful assistant."

                # 🔴 FINAL PROMPT (STRICT + GROUNDED)
                prompt = f"""
You are an AI agent.

ROLE:
{skills_text}

You MUST respond ONLY in valid JSON.

FORMAT:

For final answer:
{{
  "action": "final_answer",
  "output": "your answer"
}}

For tool usage:
{{
  "action": "tool_call",
  "tool_name": "web_search",
  "input": "search query"
}}

AVAILABLE TOOLS:
- web_search

DECISION RULE:
- If task requires facts, stats, trends → use web_search
- If CONTEXT already has sufficient info → DO NOT call tool

CRITICAL INSTRUCTIONS:
- You MUST use the CONTEXT data explicitly
- You MUST include at least:
  • 1 trend
  • 1 statistic or insight
- You MUST NOT generate generic content
- Your answer must clearly reflect the research

BAD OUTPUT:
"Revolutionize coding with AI..."

GOOD OUTPUT:
"With AI coding assistants like Copilot and Gemini leading adoption..."

If you ignore context, the answer is incorrect.

TASK:
{state['input']}

CONTEXT (MANDATORY):
{context if context else "None"}
"""

                # 🔹 FIRST LLM CALL
                result = llm.generate(prompt)

                try:
                    parsed = json.loads(result)
                except:
                    parsed = {
                        "action": "final_answer",
                        "output": result
                    }

                print(f"\n[ACTION DECIDED] {parsed.get('action')}")

                # 🔥 TOOL EXECUTION + SECOND LLM CALL
                if parsed.get("action") == "tool_call":
                    tool_name = parsed.get("tool_name")
                    tool_input = parsed.get("input")

                    print(f"\n[TOOL CALL] {tool_name} -> {tool_input}")

                    if tool_name in TOOLS:
                        try:
                            tool_result = TOOLS[tool_name](tool_input)
                        except Exception as e:
                            tool_result = f"Tool execution failed: {str(e)}"
                    else:
                        tool_result = f"Tool '{tool_name}' not available"

                    # 🔹 SECOND LLM CALL (REASONING)
                    follow_up_prompt = f"""
You previously called a tool.

Tool Name: {tool_name}
Tool Input: {tool_input}

Tool Result:
{tool_result}

CRITICAL INSTRUCTIONS:
- Extract useful insights (trends, stats, tools)
- Do NOT call any tool again
- Structure your response clearly
- Use actual data from tool result

Respond ONLY in JSON:
{{
  "action": "final_answer",
  "output": {{
    "main_takeaways": ["..."],
    "key_stats": ["..."],
    "summary": "..."
  }}
}}
"""

                    second_result = llm.generate(follow_up_prompt)

                    try:
                        parsed = json.loads(second_result)
                    except:
                        parsed = {
                            "action": "final_answer",
                            "output": second_result
                        }

                # 🔹 NORMALIZE OUTPUT
                if parsed.get("action") != "final_answer":
                    parsed = {
                        "action": "final_answer",
                        "output": parsed.get("output", str(parsed))
                    }

                # 🔥 FIX DOUBLE JSON ISSUE
                if isinstance(parsed.get("output"), str):
                    try:
                        parsed["output"] = json.loads(parsed["output"])
                    except:
                        pass

                # 🔹 SAVE STATE
                state["intermediate_outputs"][node_id] = parsed

                # 🔹 DEBUG PRINT
                print("\n" + "=" * 30)
                print(f"NODE {node_id} ({agent.name})")
                print("=" * 30)
                print(json.dumps(parsed, indent=2))

                return state

            return fn

        # 🔹 Add nodes
        for node in graph["nodes"]:
            builder.add_node(node["id"], create_node(node))

        # 🔹 Add edges
        if "edges" in graph:
            for edge in graph["edges"]:
                builder.add_edge(edge["from"], edge["to"])

        # 🔹 Set entry point
        builder.set_entry_point(graph["nodes"][0]["id"])

        # 🔹 Compile & execute
        app = builder.compile()
        state = app.invoke(state)

        # 🔹 Extract final output
        executed_nodes = list(state["intermediate_outputs"].keys())
        last_node = executed_nodes[-1]
        final = state["intermediate_outputs"][last_node]

        if isinstance(final, dict):
            output = final.get("output")
            if isinstance(output, dict):
                state["final_output"] = json.dumps(output, indent=2)
            else:
                state["final_output"] = output
        else:
            state["final_output"] = final

        print("\n" + "=" * 30)
        print("FINAL OUTPUT")
        print("=" * 30)
        print(state["final_output"])

        return state["final_output"]

    except Exception as e:
        print(f"Error executing task {task_id}: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()
