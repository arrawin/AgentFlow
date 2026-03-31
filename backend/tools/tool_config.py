"""
Tool sandbox configuration — persisted to tools_config.json.
Allows users to mark any tool as sandboxed (runs in container) or direct.
Defaults: run_python is sandboxed, everything else is direct.
"""
import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "tools_config.json")

_DEFAULTS = {
    "web_search":  {"sandboxed": False},
    "file_reader": {"sandboxed": False},
    "file_search": {"sandboxed": False},
    "file_lines":  {"sandboxed": False},
    "file_writer": {"sandboxed": False},
    "run_python":  {"sandboxed": True},
}


def _load() -> dict:
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                return json.load(f)
        except Exception:
            pass
    return dict(_DEFAULTS)


def _save(config: dict):
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)


def get_tool_config() -> dict:
    """Returns {tool_name: {sandboxed: bool}} for all tools."""
    config = _load()
    # Ensure all known tools have an entry
    for tool, defaults in _DEFAULTS.items():
        if tool not in config:
            config[tool] = defaults
    return config


def is_sandboxed(tool_name: str) -> bool:
    """Returns True if this tool should run in a container."""
    config = _load()
    return config.get(tool_name, {}).get("sandboxed", tool_name in {"run_python", "run_shell"})


def set_sandboxed(tool_name: str, sandboxed: bool):
    """Update sandbox setting for a tool."""
    config = _load()
    if tool_name not in config:
        config[tool_name] = {}
    config[tool_name]["sandboxed"] = sandboxed
    _save(config)
