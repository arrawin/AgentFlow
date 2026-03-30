Decision
LLM orchestration runs in the Celery worker.
Tool execution that involves untrusted or heavy operations runs inside Docker containers.
Celery Worker (outside Docker)
    ↓
LangGraph graph execution
    ↓
LLM calls → Groq API
    ↓
Agent decides to use a tool
    ↓
Safe tools → run directly (web_search, file_reader)
Unsafe tools → run inside Docker container (run_python)

Why This Approach

LLM calls require network access to Groq API
Giving containers network access is a security risk
Only tool execution that runs untrusted logic needs sandboxing
This is the industry standard pattern (LangGraph, LangChain, Zapier all follow this)


Architecture
task_executor.py (Celery worker)
    ↓
LangGraph StateGraph built from workflow graph_json
    ↓
For each node:
    fetch agent from DB
    build prompt from skills + state
    call Groq LLM
    parse response (action + tool_name + input)
    ↓
    if action == "final_answer":
        write to state
    if action == "tool_call":
        route to tool registry
        ↓
        web_search → call Tavily directly (no Docker)
        file_reader → read workspace file (no Docker)
        run_python → spawn Docker container (isolated)