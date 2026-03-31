FROM python:3.11-slim

# Minimal deps — only what the sandbox needs
RUN pip install --no-cache-dir httpx

WORKDIR /code

# No API keys, no secrets, no host mounts
# Container receives: PROMPT, AGENT_ID, RUN_ID, NODE_ID, FASTAPI_URL via env
# Container calls: POST $FASTAPI_URL/internal/llm/generate
# Container calls: POST $FASTAPI_URL/internal/tools/execute
# Container writes output to stdout, exits

COPY docker/agent_runner.py /code/agent_runner.py

ENTRYPOINT ["python", "/code/agent_runner.py"]
