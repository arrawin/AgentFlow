"""
Agent runner — executes inside the sandbox container.
Used for trigger-based runs (folder watch, file watch, email).
Has NO API keys. Calls FastAPI proxy for everything.
"""
import os
import sys
import json
import re
import httpx

FASTAPI_URL = os.environ.get("FASTAPI_URL", "http://backend:8000")
RUN_ID      = int(os.environ.get("RUN_ID", "0"))
NODE_ID     = os.environ.get("NODE_ID", "n1")
AGENT_ID    = int(os.environ.get("AGENT_ID", "0"))
TASK_INPUT  = os.environ.get("TASK_INPUT", "")
SKILLS      = os.environ.get("AGENT_SKILLS", "")
TOOL_LIST   = json.loads(os.environ.get("ALLOWED_TOOLS", "[]"))
CONTEXT     = os.environ.get("CONTEXT", "")


def log(event_type: str, message: str):
    try:
        httpx.post(f"{FASTAPI_URL}/internal/logs/append", json={
            "run_id": RUN_ID, "node_id": NODE_ID,
            "agent_id": AGENT_ID, "event_type": event_type,
            "message": message[:2000]
        }, timeout=10)
    except Exception:
        pass


def call_llm(prompt: str) -> str:
    resp = httpx.post(f"{FASTAPI_URL}/internal/llm/generate", json={
        "prompt": prompt, "agent_id": AGENT_ID, "run_id": RUN_ID
    }, timeout=60)
    resp.raise_for_status()
    return resp.json()["content"]


def call_tool(tool_name: str, tool_input: dict) -> str:
    resp = httpx.post(f"{FASTAPI_URL}/internal/tools/execute", json={
        "tool_name": tool_name, "input": tool_input,
        "agent_id": AGENT_ID, "run_id": RUN_ID
    }, timeout=30)
    resp.raise_for_status()
    return str(resp.json()["result"])


def parse_tool_call(text: str):
    clean = re.sub(r"```(?:json)?", "", text).replace("```", "")
    for i, c in enumerate(clean):
        if c == '{':
            depth = 0
            for j, ch in enumerate(clean[i:]):
                if ch == '{': depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        try:
                            parsed = json.loads(clean[i:i+j+1])
                            tool_name = parsed.get("tool_name")
                            action = parsed.get("action", "")
                            if tool_name and (action == "tool_call" or action == tool_name):
                                return parsed
                            if not tool_name and action in TOOL_LIST:
                                parsed["tool_name"] = action
                                return parsed
                        except Exception:
                            pass
                        break
    return None


def main():
    log("node_start", f"Agent {AGENT_ID} started in sandbox")

    tool_docs = ""
    if TOOL_LIST:
        tool_docs = f"\nAvailable tools: {TOOL_LIST}\nTo call a tool respond with ONLY:\n{{\"action\": \"tool_call\", \"tool_name\": \"<name>\", \"input\": <input>}}"

    agent_result = ""
    max_iterations = 8

    for iteration in range(max_iterations):
        if agent_result:
            instruction = "You have tool results above. Write your FINAL ANSWER as plain text now."
        else:
            instruction = tool_docs or "Write your FINAL ANSWER as plain text."

        prompt = f"""You are agent {AGENT_ID}.
{SKILLS}

TASK:
{TASK_INPUT}

CONTEXT FROM PREVIOUS AGENTS:
{CONTEXT if CONTEXT else "None"}

YOUR TOOL RESULTS SO FAR:
{agent_result if agent_result else "None"}

{instruction}
"""
        log("llm_call", f"Iteration {iteration + 1}")
        result = call_llm(prompt)
        log("llm_decision", result[:500])

        tool_call = parse_tool_call(result)
        if tool_call and TOOL_LIST:
            tool_name = tool_call.get("tool_name")
            tool_input = tool_call.get("input", {})
            if tool_name in TOOL_LIST:
                log("tool_call", f"{tool_name} | {json.dumps(tool_input)[:200]}")
                tool_result = call_tool(tool_name, tool_input)
                log("tool_result", tool_result[:500])
                agent_result += f"\nTool '{tool_name}' result:\n{tool_result}\n"
                continue

        # Final answer
        agent_result = result
        break

    log("output", agent_result[:1000])
    print(agent_result)  # Celery reads this from stdout


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log("error", str(e))
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
