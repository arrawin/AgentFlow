from execution.celery_app import celery_app
from db.database import SessionLocal
from db.models import Agent, Task, Workflow
from services.llm_service import LLMService
from langgraph.graph import StateGraph


@celery_app.task
def run_task(task_id: int):
    db = SessionLocal()

    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            print(f"Error: Task {task_id} not found")
            return
            
        workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
        if not workflow:
            print(f"Error: Workflow {task.workflow_id} not found")
            return

        graph = workflow.graph_json
        
        if not graph or "nodes" not in graph or len(graph["nodes"]) == 0:
            print("Error: Invalid workflow graph")
            return

        state = {
            "input": task.description,
            "intermediate_outputs": {},
            "final_output": None
        }

        llm = LLMService()
        builder = StateGraph(dict)

        def create_node(node):
            def fn(state):
                node_id = node["id"]
                agent = db.query(Agent).filter(Agent.id == node["agent_id"]).first()
                
                if not agent:
                    print(f"Error: Agent {node['agent_id']} not found")
                    state["intermediate_outputs"][node_id] = "Error: Agent not found"
                    return state

                context = ""
                for k, v in state["intermediate_outputs"].items():
                    context += f"{k}: {v}\n"

                skills_text = agent.skills if agent.skills else "No specific skills"
                
                prompt = f"""
You are an AI agent.

ROLE:
{skills_text}

You MUST respond ONLY in valid JSON format.

Format:

For final answer:
{{
  "action": "final_answer",
  "output": "your answer here"
}}

For tool usage:
{{
  "action": "tool_call",
  "tool_name": "tool name",
  "input": "input for tool"
}}

RULES:
- Do NOT return plain text
- Do NOT explain anything outside JSON
- Always follow JSON format strictly

TASK:
{state['input']}

CONTEXT:
{context if context else "None"}
"""
                 
        
                result = llm.generate(prompt)
                
                if not result:
                    result = "Error: No response from LLM"

                import json

                try:
                  parsed = json.loads(result)
                except Exception:
                  parsed = {
                  "action": "final_answer",
                  "output": result
                }

               # Store structured output
                state["intermediate_outputs"][node_id] = parsed

                print("\n" + "=" * 30)
                print(f"NODE {node_id} ({agent.name})")
                print("=" * 30)
                print(result)

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

        executed_nodes = list(state["intermediate_outputs"].keys())
        last_node = executed_nodes[-1]
        state["final_output"] = state["intermediate_outputs"][last_node]

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