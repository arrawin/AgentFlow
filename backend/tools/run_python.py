"""
run_python — executes arbitrary Python code in an isolated Docker container.
The container has:
  - no network access (--network none)
  - read-only filesystem
  - 256MB RAM limit
  - 0.25 CPU limit
  - 50 process limit
  - 10 second timeout
Output is capped at 10KB.
"""
import subprocess
import os
import json


def run_python(input_data: dict) -> str:
    code = input_data.get("code") or input_data.get("script") or input_data.get("python")
    if not code:
        return "Error: 'code' is required for run_python"

    # Write code to uploads volume and run via docker with volume mount
    import time
    filename = f"_run_{int(time.time()*1000)}.py"
    code_path = os.path.join(os.getenv("UPLOAD_DIR", "/app/uploads"), filename)
    with open(code_path, "w") as f:
        f.write(code)

    try:
        result = subprocess.run(
            [
                "docker", "run",
                "--rm",
                "--network", "none",
                "--memory", "256m",
                "--memory-swap", "256m",
                "--cpus", "0.25",
                "--pids-limit", "50",
                "--read-only",
                "--tmpfs", "/tmp:size=64m,noexec",
                "--cap-drop", "ALL",
                "--security-opt", "no-new-privileges:true",
                "--volume", f"docker_uploads_data:/uploads:ro",  # named volume
                "--workdir", "/uploads",
                "python:3.11-slim",
                "python", f"/uploads/{filename}"
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )

        stdout = result.stdout[:10000]
        stderr = result.stderr[:2000]

        if result.returncode != 0:
            return f"Exit code {result.returncode}\n{stderr or stdout}"

        return stdout if stdout else "(no output)"

    except subprocess.TimeoutExpired:
        return "Error: Code execution timed out (10s limit)"
    except FileNotFoundError:
        return "Error: Docker not available — run_python requires Docker"
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        try:
            os.unlink(code_path)
        except Exception:
            pass