"""
Workflow Validator — pure Python, no DB dependency.
Validates a workflow graph_json before execution or saving.
"""
from typing import List, Set


class WorkflowValidationError(Exception):
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(", ".join(errors))


def validate_workflow(graph_json: dict, valid_agent_ids: Set[int] = None) -> List[str]:
    """
    Validates a workflow graph_json.

    Returns a list of error strings. Empty list = valid.

    Checks:
    - graph_json has 'nodes' and 'edges'
    - nodes have required fields: id, agent_id
    - no duplicate node IDs
    - all edge from/to reference existing node IDs
    - no cycles (topological sort)
    - if valid_agent_ids provided: all agent_ids exist
    """
    errors = []

    if not isinstance(graph_json, dict):
        return ["graph_json must be a dict"]

    nodes = graph_json.get("nodes", [])
    edges = graph_json.get("edges", [])

    if not nodes:
        return ["Workflow must have at least one node"]

    # --- Node validation ---
    node_ids = set()
    for i, node in enumerate(nodes):
        if "id" not in node:
            errors.append(f"Node at index {i} missing 'id'")
            continue
        if "agent_id" not in node:
            errors.append(f"Node '{node['id']}' missing 'agent_id'")
        if node["id"] in node_ids:
            errors.append(f"Duplicate node id: '{node['id']}'")
        node_ids.add(node["id"])

        # Agent existence check
        if valid_agent_ids is not None and "agent_id" in node:
            if node["agent_id"] not in valid_agent_ids:
                errors.append(f"Node '{node['id']}' references unknown agent_id: {node['agent_id']}")

    if errors:
        return errors

    # --- Edge validation ---
    for edge in edges:
        if "from" not in edge or "to" not in edge:
            errors.append(f"Edge missing 'from' or 'to': {edge}")
            continue
        if edge["from"] not in node_ids:
            errors.append(f"Edge references unknown node: '{edge['from']}'")
        if edge["to"] not in node_ids:
            errors.append(f"Edge references unknown node: '{edge['to']}'")

    if errors:
        return errors

    # --- Cycle detection (topological sort) ---
    adjacency = {nid: [] for nid in node_ids}
    for edge in edges:
        adjacency[edge["from"]].append(edge["to"])

    visited = set()
    in_stack = set()

    def has_cycle(node_id: str) -> bool:
        visited.add(node_id)
        in_stack.add(node_id)
        for neighbor in adjacency.get(node_id, []):
            if neighbor not in visited:
                if has_cycle(neighbor):
                    return True
            elif neighbor in in_stack:
                return True
        in_stack.discard(node_id)
        return False

    for nid in node_ids:
        if nid not in visited:
            if has_cycle(nid):
                errors.append("Workflow contains a cycle — infinite loop detected")
                break

    return errors


def validate_or_raise(graph_json: dict, valid_agent_ids: Set[int] = None):
    """Raises WorkflowValidationError if invalid."""
    errors = validate_workflow(graph_json, valid_agent_ids)
    if errors:
        raise WorkflowValidationError(errors)
