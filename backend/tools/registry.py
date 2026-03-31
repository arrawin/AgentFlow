from tools.web_search import web_search
from tools.file_reader import file_reader
from tools.file_search import file_search
from tools.file_lines import file_lines
from tools.file_writer import file_writer
from tools.run_python import run_python
from tools.tool_config import is_sandboxed

TOOLS = {
    "web_search":  web_search,
    "file_reader": file_reader,
    "file_search": file_search,
    "file_lines":  file_lines,
    "file_writer": file_writer,
    "run_python":  run_python,
}

# Per-tool metadata — input format + mandatory usage rule
# The executor injects these dynamically based on which tools the agent has access to
TOOL_METADATA = {
    "web_search": {
        "input": '{"query": "<search_term>"}',
        "rule": None,
    },
    "file_reader": {
        "input": '{"filename": "<filename>"}',
        "rule": None,
    },
    "file_search": {
        "input": '{"filename": "<filename>", "query": "<search_term>"}',
        "rule": None,
    },
    "file_lines": {
        "input": '{"filename": "<filename>", "start": <line_num>, "end": <line_num>}',
        "rule": None,
    },
    "file_writer": {
        "input": '{"filename": "<output_filename>", "content": "<full_text_content>"}',
        "rule": "If the task asks to write/create/save a file, you MUST call file_writer with the complete content.",
    },
    "run_python": {
        "input": '{"code": "<python_code>"}',
        "rule": "If the task involves writing or executing code, you MUST call run_python to actually execute it. Never simulate or predict output — always run it and report the real result.",
    },
}

def is_unsafe(tool_name: str) -> bool:
    return is_sandboxed(tool_name)


def build_tool_docs(tool_list: list) -> tuple[str, list[str]]:
    """
    Build tool usage docs and mandatory rules for a given list of tool names.
    Returns (tool_docs_string, list_of_rules)
    """
    docs = "TOOL USAGE — respond with ONLY this raw JSON (no markdown, no code fences, no extra text):\n"
    docs += '{"action": "tool_call", "tool_name": "<tool_name>", "input": <input_object>}\n\nINPUT FORMATS PER TOOL:'
    rules = []
    for tool_name in tool_list:
        meta = TOOL_METADATA.get(tool_name)
        if meta:
            docs += f"\n- {tool_name}: {meta['input']}"
            if meta["rule"]:
                rules.append(meta["rule"])
    return docs, rules
