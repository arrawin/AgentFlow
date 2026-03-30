FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Sandboxed workspace — agents read/write here only
RUN mkdir -p /workspace

# No network access to host, no host mounts except /workspace
# Entrypoint: run a single task and exit
ENTRYPOINT ["python", "-m", "execution.workflow_runner"]
