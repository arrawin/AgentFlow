import { useEffect, useState, useCallback } from "react";
import api from "../api/client";
import { getTasks, runTask, dryRunTask } from "../api/tasks";
import { getWorkflows } from "../api/workflows";
import { getAgents } from "../api/agents";
import { useNavigate } from "react-router-dom";
import { buildDomainColorMap, getDomainColor } from "../utils/colors";
import { MarkdownLight } from "../components/MarkdownOutput";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Color palette — use shared domain colors
const AGENT_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];
const getAgentColor = (index) => AGENT_COLORS[index % AGENT_COLORS.length];

// Custom node — white card with colored left border + dry run status
function AgentNode({ data }) {
  const color = data.color || "#6366f1";
  const dryStatus = data.dryStatus || "idle";

  const statusColor = {
    idle:    null,
    running: "#1a56db",
    success: "#16a34a",
    error:   "#dc2626",
  }[dryStatus];

  const isRunMode = dryStatus !== "idle";
  const borderColor = isRunMode ? statusColor : color;
  const borderWidth = isRunMode ? 2 : 4;
  const borderStyle = isRunMode ? "solid" : "solid";

  return (
    <div
      style={{
        ...nodeStyle,
        borderLeft: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderTop:    isRunMode ? `${borderWidth}px solid ${borderColor}` : "1px solid #e2e8f0",
        borderRight:  isRunMode ? `${borderWidth}px solid ${borderColor}` : "1px solid #e2e8f0",
        borderBottom: isRunMode ? `${borderWidth}px solid ${borderColor}` : "1px solid #e2e8f0",
        boxShadow: dryStatus === "running"
          ? `0 0 0 3px ${statusColor}30, 0 2px 12px rgba(15,23,42,0.08)`
          : dryStatus === "success"
          ? `0 0 0 2px ${statusColor}25, 0 2px 12px rgba(15,23,42,0.08)`
          : dryStatus === "error"
          ? `0 0 0 2px ${statusColor}25, 0 2px 12px rgba(15,23,42,0.08)`
          : nodeStyle.boxShadow,
        cursor: data.onNodeClick ? "pointer" : "default",
        transition: "border-color 300ms ease, box-shadow 300ms ease",
      }}
      onClick={() => data.onNodeClick?.(data)}
    >
      <Handle type="target" position={Position.Top} style={{ ...handleStyle, background: isRunMode ? statusColor : color }} />
      <div style={nodeHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: color + "20",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800,
            color: color,
          }}>
            {data.name[0]}
          </div>
          <div style={nodeTitle}>{data.name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {dryStatus === "running" && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "#dbeafe", color: "#1a56db", animation: "nodePulse 1s ease-in-out infinite" }}>
              ● Running
            </span>
          )}
          {dryStatus === "success" && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "#dcfce7", color: "#16a34a" }}>
              ✓ Done
            </span>
          )}
          {dryStatus === "error" && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "#fef2f2", color: "#dc2626" }}>
              ✕ Error
            </span>
          )}
          {!isRunMode && (
            <button style={nodeRemoveBtn} onClick={(e) => { e.stopPropagation(); data.onRemove?.(data.id); }}>✕</button>
          )}
        </div>
      </div>
      <div style={nodeAssigned}>
        <span style={{ ...nodeAssignedTag, background: color + "15", color }}>
          {data.name}
        </span>
      </div>
      <div style={nodeMeta}>
        <span style={{ ...nodeMetaTag, background: color + "12", color }}>
          STEP {String(data.index + 1).padStart(2, "0")}
        </span>
        {data.dryDuration && (
          <span style={{ ...nodeMetaTag, background: "#f0fdf4", color: "#16a34a" }}>{data.dryDuration}ms</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ ...handleStyle, background: color }} />
    </div>
  );
}

const nodeStyle = {
  background: "#ffffff",
  borderRadius: 12,
  padding: "14px 16px",
  boxShadow: "0 2px 12px rgba(15,23,42,0.08)",
  minWidth: 220,
  border: "1px solid #e2e8f0",
  outline: "none",
};
const nodeHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 };
const nodeTitle = { fontSize: 13, fontWeight: 700, color: "#0f172a" };
const nodeRemoveBtn = { background: "none", border: "none", fontSize: 11, cursor: "pointer", color: "#94a3b8", padding: 0, lineHeight: 1 };
const nodeAssigned = { marginBottom: 8 };
const nodeAssignedTag = { fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, display: "inline-block" };
const nodeMeta = { display: "flex", gap: 6 };
const nodeMetaTag = { fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, letterSpacing: "0.05em" };
const handleStyle = { width: 10, height: 10, border: "2px solid #fff" };

function DomainDropdown({ domain, agents, isSelected, onSelect, agentColorMap }) {
  const [open, setOpen] = useState(true);
  const selectedCount = agents.filter(a => isSelected(a.id)).length;

  return (
    <div style={dd.wrap}>
      <button style={dd.header} onClick={() => setOpen(o => !o)}>
        <span style={dd.chevron}>{open ? "▾" : "▸"}</span>
        <span style={dd.name}>{domain.name}</span>
        {selectedCount > 0 && <span style={dd.badge}>{selectedCount}</span>}
        <span style={dd.count}>{agents.length}</span>
      </button>
      {open && (
        <div style={dd.list}>
          {agents.map(agent => {
            const selected = isSelected(agent.id);
            const color = agentColorMap[agent.id] || "#6366f1";
            return (
              <div
                key={agent.id}
                style={{ ...dd.item, ...(selected ? { background: color + "0d", border: `1px solid ${color}30` } : {}) }}
                onClick={() => onSelect(agent)}
              >
                <div style={{ ...dd.avatar, background: color + "20", color }}>
                  {agent.name[0]}
                </div>
                <div style={dd.info}>
                  <div style={dd.agentName}>{agent.name}</div>
                  <div style={dd.agentSkill}>{agent.skills?.slice(0, 36) || "No skills"}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  background: selected ? color : "transparent",
                  border: selected ? "none" : "2px solid #cbd5e1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 150ms",
                }}>
                  {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const dd = {
  wrap: { marginBottom: 6 },
  header: { display: "flex", alignItems: "center", gap: 6, width: "100%", background: "#f8fafc", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", textAlign: "left" },
  chevron: { fontSize: 10, color: "#94a3b8", width: 12 },
  name: { flex: 1, fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" },
  badge: { background: "#6366f1", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 10 },
  count: { fontSize: 10, color: "#94a3b8" },
  list: { paddingLeft: 4, paddingTop: 4, display: "flex", flexDirection: "column", gap: 4 },
  item: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, background: "#fff", cursor: "pointer", transition: "all 150ms", border: "1px solid #f1f5f9" },
  itemActive: {},
  avatar: { width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  agentName: { fontSize: 12, fontWeight: 700, color: "#0f172a" },
  agentSkill: { fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 },
};

const nodeTypes = { agentNode: AgentNode };

function DryRunPanel({ result, selectedNode, onSelectNode, onClose }) {
  return (
    <div style={dr.wrap}>
      <div style={dr.header}>
        <div>
          <div style={dr.title}>Dry Run — {result.task_name}</div>
          <div style={dr.sub}>{result.nodes.length} agents · {result.total_ms}ms total · No real API calls made</div>
        </div>
        <button style={dr.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={dr.body}>
        {/* Node list */}
        <div style={dr.nodeList}>
          {result.nodes.map((node, i) => (
            <div key={node.node_id}
              style={{ ...dr.nodeItem, ...(selectedNode?.node_id === node.node_id ? dr.nodeItemActive : {}) }}
              onClick={() => onSelectNode(selectedNode?.node_id === node.node_id ? null : node)}
            >
              <div style={{ ...dr.nodeStatus, background: node.status === "success" ? "#dcfce7" : "#fef2f2" }}>
                {node.status === "success"
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                }
              </div>
              <div style={dr.nodeInfo}>
                <div style={dr.nodeName}>{node.agent_name}</div>
                <div style={dr.nodeMeta}>Step {i + 1} · {node.duration_ms}ms</div>
              </div>
              <div style={dr.nodeChevron}>{selectedNode?.node_id === node.node_id ? "▲" : "▼"}</div>
            </div>
          ))}
        </div>

        {/* Selected node output */}
        {selectedNode && (
          <div style={dr.outputPanel}>
            <div style={dr.outputHeader}>
              <span style={dr.outputTitle}>{selectedNode.agent_name}</span>
              <span style={dr.outputDuration}>{selectedNode.duration_ms}ms</span>
            </div>
            {selectedNode.tool_calls?.length > 0 && (
              <div style={dr.toolCalls}>
                <div style={dr.toolCallsLabel}>TOOL CALLS</div>
                {selectedNode.tool_calls.map((tc, i) => (
                  <div key={i} style={dr.toolCall}>
                    <span style={dr.toolName}>{tc.tool}</span>
                    <span style={dr.toolResult}>{tc.result}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={dr.outputLabel}>OUTPUT</div>
            <div style={dr.outputText}><MarkdownLight text={selectedNode.output} /></div>
          </div>
        )}
      </div>
    </div>
  );
}

const dr = {
  wrap: { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", marginTop: 20, overflow: "hidden" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" },
  title: { fontSize: 14, fontWeight: 800, color: "#0f172a" },
  sub: { fontSize: 11, color: "#64748b", marginTop: 3 },
  closeBtn: { background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#94a3b8", padding: 4 },
  body: { display: "grid", gridTemplateColumns: "240px 1fr" },
  nodeList: { borderRight: "1px solid #f1f5f9", padding: 12, display: "flex", flexDirection: "column", gap: 4 },
  nodeItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "background 150ms", border: "1px solid transparent" },
  nodeItemActive: { background: "#eff6ff", border: "1px solid #bfdbfe" },
  nodeStatus: { width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  nodeInfo: { flex: 1, minWidth: 0 },
  nodeName: { fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  nodeMeta: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  nodeChevron: { fontSize: 9, color: "#94a3b8" },
  outputPanel: { padding: 20, display: "flex", flexDirection: "column", gap: 12 },
  outputHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  outputTitle: { fontSize: 14, fontWeight: 800, color: "#0f172a" },
  outputDuration: { fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eff6ff", padding: "3px 10px", borderRadius: 20 },
  toolCalls: { background: "#f8fafc", borderRadius: 8, padding: "10px 14px" },
  toolCallsLabel: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: 8 },
  toolCall: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 },
  toolName: { fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eff6ff", padding: "2px 8px", borderRadius: 4, flexShrink: 0 },
  toolResult: { fontSize: 11, color: "#64748b" },
  outputLabel: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.06em" },
  outputText: { fontSize: 12, color: "#334155", lineHeight: 1.6, background: "#f8fafc", borderRadius: 8, padding: "12px 14px", whiteSpace: "pre-wrap" },
};

export default function TaskManagement() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [mode, setMode] = useState("manual");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [runStatus, setRunStatus] = useState({});
  const [tab, setTab] = useState("list");

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState(null);

  const fetchAll = () => {
    getAgents().then((d) => setAgents(d.filter((a) => !a.is_system)));
    getTasks().then(setTasks);
    getWorkflows().then(setWorkflows);
    api.get("/domains").then((r) => setDomains(r.data));
  };

  useEffect(() => {
    fetchAll();
    // Re-fetch when user navigates back to this tab
    const onFocus = () => fetchAll();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "var(--secondary)" } }, eds)),
    [setEdges]
  );

  const removeNode = useCallback((nodeId) => {
    setNodes((nds) => {
      const remaining = nds.filter((n) => n.id !== nodeId);
      // Re-index
      return remaining.map((n, i) => ({ ...n, data: { ...n.data, index: i } }));
    });
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const addAgentToFlow = (agent) => {
    const alreadyAdded = nodes.some((n) => n.data.agentId === agent.id);
    if (alreadyAdded) {
      setNodes((nds) => nds.filter((n) => n.data.agentId !== agent.id));
      setEdges((eds) => eds.filter((e) => {
        const removedNode = nodes.find((n) => n.data.agentId === agent.id);
        return removedNode ? e.source !== removedNode.id && e.target !== removedNode.id : true;
      }));
      return;
    }

    const index = nodes.length;
    const color = agentColorMap[agent.id] || getAgentColor(index);
    const newNode = {
      id: `node-${agent.id}-${Date.now()}`,
      type: "agentNode",
      position: { x: 250, y: index * 180 },
      data: {
        id: `node-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        name: agent.name,
        index,
        color,
        onRemove: removeNode,
      },
    };

    // Auto-connect to previous node
    if (nodes.length > 0) {
      const prevNode = nodes[nodes.length - 1];
      setEdges((eds) => addEdge({
        id: `e-${prevNode.id}-${newNode.id}`,
        source: prevNode.id,
        target: newNode.id,
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
      }, eds));
    }

    setNodes((nds) => [...nds, newNode]);
    // Auto fit after adding
    setTimeout(() => rfInstance?.fitView({ padding: 0.3, duration: 300 }), 50);
  };

  const [toast, setToast] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [dryRunning, setDryRunning] = useState(null);
  const [selectedDryNode, setSelectedDryNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasMode, setCanvasMode] = useState("edit"); // "edit" | "dryrun"

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Color map — agents get their domain's color for consistency with Agent Management page
  const domainColorMap = buildDomainColorMap(domains.filter(d => d.name !== "SYSTEM"));
  const agentColorMap = {};
  agents.forEach((a) => { agentColorMap[a.id] = domainColorMap[a.domain_id] || getAgentColor(0); });

  const handleGenerate = async () => {
    if (!form.description.trim()) {
      setError("Enter a task description first so the AI knows what to generate.");
      return;
    }
    setGenerating(true);
    setError("");
    setGenerateResult(null);
    try {
      const res = await api.post("/tasks/generate", { description: form.description });
      const { suggested_agents, workflow_json } = res.data;
      setGenerateResult({ suggested_agents, workflow_json });

      // Populate the React Flow canvas from the generated workflow
      const agentMap = {};
      agents.forEach((a) => { agentMap[a.id] = a; });

      const newNodes = workflow_json.nodes.map((n, i) => {
        const agent = agentMap[n.agent_id];
        const nodeId = `node-${n.agent_id}-${Date.now()}-${i}`;
        const color = agentColorMap[n.agent_id] || getAgentColor(i);
        return {
          id: nodeId,
          type: "agentNode",
          position: { x: 250, y: i * 180 },
          data: { id: nodeId, agentId: n.agent_id, name: agent?.name || `Agent #${n.agent_id}`, index: i, color, onRemove: removeNode },
          _graphNodeId: n.id,
        };
      });

      const nodeGraphIdToFlowId = {};
      workflow_json.nodes.forEach((n, i) => { nodeGraphIdToFlowId[n.id] = newNodes[i].id; });

      const newEdges = workflow_json.edges.map((e) => ({
        id: `e-${nodeGraphIdToFlowId[e.from]}-${nodeGraphIdToFlowId[e.to]}`,
        source: nodeGraphIdToFlowId[e.from],
        target: nodeGraphIdToFlowId[e.to],
        animated: true,
        style: { stroke: "var(--secondary)" },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setTimeout(() => rfInstance?.fitView({ padding: 0.3, duration: 300 }), 100);
      showToast("Workflow generated — review and publish when ready");
    } catch (e) {
      const d = e.response?.data?.detail;
      setError(typeof d === "object" ? JSON.stringify(d) : d || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };



  const [editingTask, setEditingTask] = useState(null); // task being edited

  const isSelected = (agentId) => nodes.some((n) => n.data.agentId === agentId);

  const handleEdit = (task) => {
    const wf = getWorkflow(task.workflow_id);
    const wfNodes = wf?.graph_json?.nodes || [];
    const wfEdges = wf?.graph_json?.edges || [];

    setForm({ name: task.name, description: task.description });
    setEditingTask(task);
    setTab("create");

    // Rebuild React Flow nodes from workflow
    const agentMap = {};
    agents.forEach(a => { agentMap[a.id] = a; });

    const newNodes = wfNodes.map((n, i) => {
      const agent = agentMap[n.agent_id];
      const nodeId = `node-${n.agent_id}-${Date.now()}-${i}`;
      const color = agentColorMap[n.agent_id] || getAgentColor(0);
      return {
        id: nodeId,
        type: "agentNode",
        position: { x: 250, y: i * 180 },
        data: { id: nodeId, agentId: n.agent_id, name: agent?.name || `Agent #${n.agent_id}`, index: i, color, onRemove: removeNode },
        _graphNodeId: n.id,
      };
    });

    const nodeGraphIdToFlowId = {};
    wfNodes.forEach((n, i) => { nodeGraphIdToFlowId[n.id] = newNodes[i]?.id; });

    const newEdges = wfEdges.map(e => ({
      id: `e-${nodeGraphIdToFlowId[e.from]}-${nodeGraphIdToFlowId[e.to]}`,
      source: nodeGraphIdToFlowId[e.from],
      target: nodeGraphIdToFlowId[e.to],
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
    })).filter(e => e.source && e.target);

    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => rfInstance?.fitView({ padding: 0.3, duration: 300 }), 100);
  };

  const handleDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast("Task deleted");
    } catch {
      showToast("Error deleting task", false);
    }
  };

  const handleSave = async () => {
    if (!form.name || nodes.length === 0) {
      setError("Task name and at least one agent step are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const flowNodes = nodes.map((n, i) => ({ id: `n${i + 1}`, agent_id: n.data.agentId }));
      const nodeIdMap = {};
      nodes.forEach((n, i) => { nodeIdMap[n.id] = `n${i + 1}`; });
      const flowEdges = edges.map((e) => ({ from: nodeIdMap[e.source], to: nodeIdMap[e.target] })).filter((e) => e.from && e.to);

      if (editingTask) {
        await api.put(`/workflows/${editingTask.workflow_id}`, { name: form.name, graph_json: { nodes: flowNodes, edges: flowEdges } });
        const updated = await api.put(`/tasks/${editingTask.id}`, { name: form.name, description: form.description });
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updated.data : t));
        showToast("Changes saved");
      } else {
        const wf = await api.post("/workflows", { name: form.name, graph_json: { nodes: flowNodes, edges: flowEdges } });
        const task = await api.post("/tasks", { name: form.name, description: form.description, workflow_id: wf.data.id });
        setTasks(prev => [...prev, task.data]);
        // Set as editing task so future saves update instead of create
        setEditingTask(task.data);
        showToast("Workflow saved");
      }
      fetchAll();
    } catch (e) {
      const d = e.response?.data?.detail;
      setError(typeof d === "object" ? JSON.stringify(d) : d || "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!form.name || nodes.length === 0) {
      setError("Task name and at least one agent step are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const flowNodes = nodes.map((n, i) => ({ id: `n${i + 1}`, agent_id: n.data.agentId }));
      const nodeIdMap = {};
      nodes.forEach((n, i) => { nodeIdMap[n.id] = `n${i + 1}`; });
      const flowEdges = edges.map((e) => ({ from: nodeIdMap[e.source], to: nodeIdMap[e.target] })).filter((e) => e.from && e.to);

      if (editingTask) {
        await api.put(`/workflows/${editingTask.workflow_id}`, { name: form.name, graph_json: { nodes: flowNodes, edges: flowEdges } });
        const updated = await api.put(`/tasks/${editingTask.id}`, { name: form.name, description: form.description });
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updated.data : t));
        setEditingTask(null);
        showToast("Task updated successfully");
      } else {
        const wf = await api.post("/workflows", { name: form.name, graph_json: { nodes: flowNodes, edges: flowEdges } });
        const task = await api.post("/tasks", { name: form.name, description: form.description, workflow_id: wf.data.id });
        setTasks(prev => [...prev, task.data]);
        showToast("Task sequence published successfully");
      }

      setNodes([]);
      setEdges([]);
      setForm({ name: "", description: "" });
      setTab("list");
      fetchAll();
    } catch (e) {
      const d = e.response?.data?.detail;
      setError(typeof d === "object" ? JSON.stringify(d) : d || "Error saving task sequence");
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async (taskId) => {
    setRunStatus((s) => ({ ...s, [taskId]: "queuing" }));
    try {
      await runTask(taskId);
      setRunStatus((s) => ({ ...s, [taskId]: "queued" }));
      setTimeout(() => setRunStatus((s) => ({ ...s, [taskId]: "" })), 3000);
    } catch {
      setRunStatus((s) => ({ ...s, [taskId]: "error" }));
    }
  };

  const handleDryRun = async (taskId) => {
    setDryRunning(taskId);
    setDryRunResult(null);
    setSelectedDryNode(null);
    setCanvasMode("dryrun");

    // Switch to create tab to show canvas, load the task's workflow into canvas
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      handleEdit(task);
    }

    try {
      // Animate nodes as "running" one by one while waiting
      const wf = workflows.find(w => w.id === task?.workflow_id);
      const wfNodes = wf?.graph_json?.nodes || [];

      // Set all to idle first
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, dryStatus: "idle", dryDuration: null } })));

      // Kick off the actual dry run
      const resultPromise = dryRunTask(taskId);

      // Animate running state node by node (estimated timing)
      for (let i = 0; i < wfNodes.length; i++) {
        const graphNodeId = wfNodes[i].id;
        setNodes(nds => nds.map((n, idx) => ({
          ...n,
          data: {
            ...n.data,
            dryStatus: idx === i ? "running" : idx < i ? "success" : "idle",
          }
        })));
        await new Promise(r => setTimeout(r, 600));
      }

      const result = await resultPromise;
      setDryRunResult({ taskId, ...result });

      // Apply final statuses from real result
      setNodes(nds => nds.map((n, idx) => {
        const nodeResult = result.nodes[idx];
        return {
          ...n,
          data: {
            ...n.data,
            dryStatus: nodeResult?.status === "success" ? "success" : nodeResult ? "error" : "idle",
            dryDuration: nodeResult?.duration_ms ?? null,
            onNodeClick: (nodeData) => {
              const nr = result.nodes.find((r) => r.agent_name === nodeData.name);
              setSelectedDryNode(nr || null);
            },
          }
        };
      }));

      showToast(`Dry run complete — ${result.nodes.length} nodes in ${result.total_ms}ms`);
    } catch (e) {
      const d = e.response?.data?.detail;
      showToast(typeof d === "string" ? d : "Dry run failed", false);
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, dryStatus: "error" } })));
    } finally {
      setDryRunning(null);
    }
  };

  const getAgentName = (id) => agents.find((a) => a.id === id)?.name || `Agent #${id}`;
  const getWorkflow = (id) => workflows.find((w) => w.id === id);
  return (
    <div className="animate-up" style={s.page}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <div>
          <div style={s.breadcrumb}>
            <span style={s.breadcrumbMuted}>WORKFLOW ACTIVE</span>
          </div>
          <h1 style={s.pageTitle}>Create Task Sequence</h1>
          <p style={s.pageSub}>Define architectural logic and agent coordination workflows.</p>
        </div>
        <div style={s.headerActions}>
          <button style={s.saveDraftBtn} onClick={() => { setTab(tab === "list" ? "create" : "list"); setEditingTask(null); setNodes([]); setEdges([]); setForm({ name: "", description: "" }); }}>
            {tab === "list" ? "+ Create Workflow" : "← All Tasks"}
          </button>
          {tab !== "list" && (
            <button className="btn-primary" style={s.publishBtn} onClick={handlePublish} disabled={saving}>
              {saving ? "Saving..." : editingTask ? "Save Changes" : "Publish Sequence"}
            </button>
          )}
        </div>
      </div>

      {/* Tab: Create or List */}
      {tab === "list" ? (
        <div style={s.taskListSection}>
          <div style={s.taskListHeader}>
            <span style={s.sectionLabel}>ALL TASK SEQUENCES</span>
            <span style={s.taskCount}>{tasks.length} TOTAL</span>
          </div>
          {tasks.length === 0 ? (
            <div style={s.emptyState}>
              No task sequences yet. Create your first one above.
            </div>
          ) : tasks.map((task) => {
            const wf = getWorkflow(task.workflow_id);
            const nodes = wf?.graph_json?.nodes || [];
            const status = runStatus[task.id];
            return (
              <div key={task.id} style={s.taskRow}>
                <div style={s.taskRowLeft}>
                  <div style={s.taskRowName}>{task.name}</div>
                  <div style={s.taskRowDesc}>{task.description}</div>
                  {nodes.length > 0 && (
                    <div style={s.flowChain}>
                      {nodes.map((n, i) => (
                        <span key={n.id} style={s.flowChainPart}>
                          {i > 0 && <span style={s.chainArrow}>→</span>}
                          <span style={s.chainAgent}>{getAgentName(n.agent_id)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={s.taskRowActions}>
                  <span style={s.nodeCount}>{nodes.length} Nodes</span>
                  <button
                    style={s.runBtn}
                    onClick={() => navigate(`/tasks/${task.id}/canvas`)}
                  >
                    Canvas
                  </button>
                  <button
                    style={{ ...s.dryRunBtn, ...(dryRunning === task.id ? { opacity: 0.6 } : {}) }}
                    onClick={() => handleDryRun(task.id)}
                    disabled={dryRunning === task.id}
                  >
                    {dryRunning === task.id ? "Running..." : "Dry Run"}
                  </button>
                  <button style={s.editBtn} onClick={() => handleEdit(task)}>Edit</button>
                  <button style={s.deleteBtn} onClick={() => handleDelete(task.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        <>
          {/* Task Meta Inputs */}
          <div style={s.metaRow}>
            <div style={s.metaLeft}>
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>TASK NAME</label>
                <input
                  style={s.fieldInput}
                  placeholder="e.g., Enterprise Security Audit 2024"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>DESCRIPTION</label>
                <textarea
                  style={{ ...s.fieldInput, resize: "vertical", height: 120 }}
                  placeholder="Describe the objective of this sequence..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              {error && <div style={s.errorMsg}>{error}</div>}
            </div>
            <div style={s.modeCard}>
              <div style={s.modeLabel}>CREATION MODE</div>
              <button
                style={{ ...s.modeBtn, ...(mode === "manual" ? s.modeBtnActive : {}) }}
                onClick={() => setMode("manual")}
              >
                <span>⊞</span> Manual Builder
              </button>
              <button
                style={{ ...s.modeBtn, ...(mode === "ai" ? s.modeBtnActive : {}) }}
                onClick={() => setMode("ai")}
              >
                <span style={{ color: "#8b5cf6" }}>✦</span> AI Auto-Generate
              </button>
              <p style={s.modeHint}>
                {mode === "manual"
                  ? "Manually configure each agent step and coordination order."
                  : "AI will analyze your description and generate an optimized agent sequence."}
              </p>
              {mode === "ai" && (
                <button
                  style={{ ...s.modeBtn, background: "#7c3aed", color: "#fff", fontWeight: 700, marginTop: 4, justifyContent: "center" }}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? "Generating..." : "✦ Generate Workflow"}
                </button>
              )}
            </div>
          </div>

          {/* AI Generate Result — suggested agents */}
          {mode === "ai" && generateResult && (
            <div style={s.generateResult}>
              <div style={s.generateResultLabel}>✦ SUGGESTED AGENTS</div>
              <div style={s.generateResultList}>
                {generateResult.suggested_agents.map((a) => (
                  <div key={a.id} style={s.generateResultItem}>
                    <span style={s.generateResultName}>{a.name}</span>
                    <span style={s.generateResultReason}>{a.reason}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 8 }}>
                Workflow loaded into canvas — adjust if needed, then Publish.
              </p>
            </div>
          )}

          {/* Two-Column Workspace */}
          <div style={{ ...s.workspace, ...(isFullscreen ? s.workspaceFull : {}) }}>
            {/* Left: Agent Selection - hidden in fullscreen */}
            {!isFullscreen && <div style={s.agentPanel}>
              <div style={s.panelHeader}>
                <span style={s.panelTitle}>Agent Selection</span>
                {nodes.length > 0 && (
                  <span style={s.selBadge}>{nodes.length} SELECTED</span>
                )}
              </div>
              <div style={s.agentList}>
                {domains.length === 0 ? (
                  <div style={s.emptyAgents}>No domains yet.</div>
                ) : domains.map((domain) => {
                  const domainAgents = agents.filter((a) => a.domain_id === domain.id);
                  if (domainAgents.length === 0) return null;
                  return (
                    <DomainDropdown
                      key={domain.id}
                      domain={domain}
                      agents={domainAgents}
                      isSelected={isSelected}
                      onSelect={addAgentToFlow}
                      agentColorMap={agentColorMap}
                    />
                  );
                })}
              </div>
            </div>
            }

            {/* Right: React Flow Canvas */}
            <div style={{ ...s.canvasPanel, ...(isFullscreen ? s.canvasPanelFull : {}) }}>
              {/* n8n-style toolbar */}
              <div style={s.canvasToolbar}>
                <div style={s.toolbarLeft}>
                  {isFullscreen && (
                    <span style={s.toolbarTitle}>{form.name || "Workflow Canvas"}</span>
                  )}
                  <div style={s.modeToggle}>
                    <button
                      style={{ ...s.modeToggleBtn, ...(canvasMode === "edit" ? s.modeToggleBtnActive : {}) }}
                      onClick={() => setCanvasMode("edit")}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button
                      style={{ ...s.modeToggleBtn, ...(canvasMode === "dryrun" ? s.modeToggleBtnDry : {}), ...(!tasks.find(t => t.name === form.name) ? { opacity: 0.4, cursor: "not-allowed" } : {}) }}
                      onClick={() => {
                        const savedTask = tasks.find(t => t.name === form.name);
                        if (canvasMode !== "dryrun" && savedTask) handleDryRun(savedTask.id);
                      }}
                      title={!tasks.find(t => t.name === form.name) ? "Save the task first before dry running" : "Dry Run"}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {dryRunning ? "Running..." : "Dry Run"}
                    </button>
                  </div>
                </div>
                <div style={s.toolbarRight}>
                  <span style={s.canvasStat}>● {nodes.length} nodes</span>
                  <span style={s.canvasStat}>◌ {edges.length} edges</span>
                  <button style={s.fullscreenBtn} onClick={() => setIsFullscreen(f => !f)} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                    {isFullscreen
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: "hidden", minHeight: isFullscreen ? "calc(100vh - 45px)" : 420, background: "#f8fafc" }}>
                {nodes.length === 0 ? (
                  <div style={s.emptyCanvas}>
                    <div style={s.emptyCanvasIcon}>⬡</div>
                    <div style={s.emptyCanvasText}>Select agents from the left panel to build your workflow.</div>
                  </div>
                ) : (
                  <ReactFlow
                    nodes={nodes.map((n) => ({ ...n, data: { ...n.data, onRemove: dryRunResult ? undefined : removeNode } }))}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setRfInstance}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                    style={{ background: "#f8fafc" }}
                  >
                    <Background color="#cbd5e1" gap={20} size={1} variant="dots" />
                    <Controls style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }} />
                  </ReactFlow>
                )}
              </div>
            </div>
          </div>

          {/* Save button below canvas */}
          {!dryRunResult && (
            <div style={s.canvasSaveBar}>
              <button style={s.canvasSaveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Workflow"}
              </button>
              <span style={s.canvasSaveHint}>Saves to DB without leaving this page</span>
            </div>
          )}
          {dryRunResult && (
            <DryRunPanel
              result={dryRunResult}
              selectedNode={selectedDryNode}
              onSelectNode={setSelectedDryNode}
              onClose={() => {
                setDryRunResult(null);
                setSelectedDryNode(null);
                setCanvasMode("edit");
                setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, dryStatus: "idle", dryDuration: null, onNodeClick: undefined } })));
              }}
            />
          )}
        </>
      )}
      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#16a34a" : "#dc2626", color: "#fff" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { paddingBottom: 60 },
  pageHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28,
  },
  breadcrumb: { marginBottom: 4 },
  breadcrumbMuted: { fontSize: 9, fontWeight: 900, color: "var(--on-surface-variant)", letterSpacing: "0.1em" },
  pageTitle: { fontSize: 26, fontWeight: 800, color: "var(--on-surface)", marginBottom: 6 },
  pageSub: { fontSize: 13, color: "var(--on-surface-variant)" },
  headerActions: { display: "flex", gap: 10, alignItems: "center" },
  saveDraftBtn: { background: "var(--surface-bright)", border: "1px solid var(--outline)", color: "var(--on-surface)", padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700 },
  publishBtn: { padding: "9px 20px", fontSize: 12 },
  canvasSaveBar: { display: "flex", alignItems: "center", gap: 12, padding: "14px 0", marginTop: 4 },
  canvasSaveBtn: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "#0f172a", cursor: "pointer", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" },
  canvasSaveHint: { fontSize: 11, color: "#94a3b8" },

  // Meta Row
  metaRow: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, marginBottom: 24 },
  metaLeft: { display: "flex", flexDirection: "column", gap: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em" },
  fieldInput: { background: "var(--surface-bright)", border: "1px solid var(--outline)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--on-surface)", outline: "none", fontFamily: "inherit" },
  domainGroup: { marginBottom: 12 },
  domainGroupLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em", padding: "4px 4px 8px", textTransform: "uppercase" },  errorMsg: { color: "#dc2626", fontSize: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 },

  // Generate result
  generateResult: { background: "var(--surface-bright)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, border: "1px solid #7c3aed33" },
  generateResultLabel: { fontSize: 10, fontWeight: 900, color: "#7c3aed", letterSpacing: "0.08em", marginBottom: 10 },
  generateResultList: { display: "flex", flexDirection: "column", gap: 6 },
  generateResultItem: { display: "flex", alignItems: "baseline", gap: 10 },
  generateResultName: { fontSize: 12, fontWeight: 700, color: "var(--on-surface)", minWidth: 120 },
  generateResultReason: { fontSize: 11, color: "var(--on-surface-variant)" },

  // Toast
  toast: { position: "fixed", bottom: 28, right: 28, padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" },

  // Mode Card
  modeCard: { background: "var(--surface-bright)", borderRadius: 14, padding: 20, boxShadow: "var(--ambient-shadow)", display: "flex", flexDirection: "column", gap: 8 },
  modeLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em", marginBottom: 4 },
  modeBtn: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--surface-container-low)", color: "var(--on-surface-variant)", border: "none", cursor: "pointer", textAlign: "left" },
  modeBtnActive: { background: "var(--secondary-container)", color: "var(--on-secondary-container)", fontWeight: 700 },
  modeHint: { fontSize: 11, color: "var(--on-surface-variant)", lineHeight: 1.5, marginTop: 4 },

  // Workspace
  workspace: { display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 },
  workspaceFull: { display: "block" },

  // Agent Panel
  agentPanel: { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column", border: "1px solid #e2e8f0" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  panelTitle: { fontSize: 14, fontWeight: 800, color: "var(--on-surface)" },
  selBadge: { fontSize: 9, fontWeight: 900, background: "var(--secondary-container)", color: "var(--on-secondary-container)", padding: "3px 8px", borderRadius: 6 },
  agentList: { display: "flex", flexDirection: "column", gap: 4, flex: 1, marginBottom: 16, overflowY: "auto", maxHeight: 400, paddingRight: 16 },
  emptyAgents: { color: "var(--on-surface-variant)", fontSize: 12, padding: 16, textAlign: "center" },
  agentItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface-container-low)", cursor: "pointer", transition: "all 150ms" },
  agentItemActive: { background: "var(--secondary-container)" },
  agentAvatar: { width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 },
  agentInfo: { flex: 1, minWidth: 0 },
  agentName: { fontSize: 12, fontWeight: 700, color: "var(--on-surface)", marginBottom: 2 },
  agentSkills: { fontSize: 10, color: "var(--on-surface-variant)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  agentToggle: { flexShrink: 0 },
  registerBtn: { background: "var(--surface-container-low)", color: "var(--on-surface-variant)", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700, width: "100%", border: "none", cursor: "pointer" },

  // Canvas Panel
  canvasPanel: { background: "#f8fafc", borderRadius: 14, display: "flex", flexDirection: "column", minHeight: 480, border: "1px solid #e2e8f0", overflow: "hidden" },
  canvasPanelFull: { position: "fixed", inset: 0, zIndex: 200, borderRadius: 0, minHeight: "100vh", border: "none" },
  canvasHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  canvasToolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 },
  toolbarLeft: { display: "flex", alignItems: "center", gap: 12 },
  toolbarRight: { display: "flex", alignItems: "center", gap: 10 },
  toolbarTitle: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  modeToggle: { display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3, gap: 2 },
  modeToggleBtn: { fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, border: "none", background: "transparent", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 150ms" },
  modeToggleBtnActive: { background: "#fff", color: "#0f172a", boxShadow: "0 1px 3px rgba(15,23,42,0.1)" },
  modeToggleBtnDry: { background: "#fff", color: "#ea6c00", boxShadow: "0 1px 3px rgba(15,23,42,0.1)" },
  fullscreenBtn: { background: "transparent", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" },
  canvasStats: { display: "flex", gap: 12 },
  canvasStat: { fontSize: 11, fontWeight: 700, color: "var(--on-surface-variant)" },
  canvas: { flex: 1, position: "relative" },
  emptyCanvas: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12 },
  emptyCanvasIcon: { fontSize: 32, opacity: 0.2 },
  emptyCanvasText: { fontSize: 13, color: "var(--on-surface-variant)", textAlign: "center", maxWidth: 280 },

  stepsFlow: { display: "flex", flexDirection: "column", alignItems: "center", gap: 0 },
  stepWrapper: { width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center" },
  stepCard: { width: "100%", background: "var(--surface-bright)", borderRadius: 12, padding: "16px 18px", boxShadow: "var(--shadow-md)" },
  stepCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  stepCardTitle: { fontSize: 14, fontWeight: 700, color: "var(--on-surface)" },
  stepCardActions: { display: "flex", gap: 6 },
  stepMoreBtn: { background: "none", border: "none", fontSize: 12, cursor: "pointer", color: "var(--error)", opacity: 0.7 },
  stepAssigned: { fontSize: 11, color: "var(--on-surface-variant)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  stepAssignedDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--secondary)", flexShrink: 0 },
  stepMeta: { display: "flex", gap: 8 },
  stepMetaTag: { fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "var(--surface-container-low)", color: "var(--on-surface-variant)", letterSpacing: "0.05em" },
  connector: { width: 2, height: 32, background: "var(--outline)", opacity: 0.4, margin: "0 auto" },
  connectorLine: { width: 2, height: 24, background: "var(--outline)", opacity: 0.4, margin: "0 auto" },
  appendStep: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 4 },
  appendBtn: { width: 28, height: 28, borderRadius: "50%", background: "var(--secondary-container)", color: "var(--on-secondary-container)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, cursor: "pointer" },
  appendLabel: { fontSize: 9, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em" },
  canvasControls: { position: "absolute", right: 0, bottom: 0, display: "flex", flexDirection: "column", gap: 6, padding: 8 },
  canvasCtrlBtn: { width: 28, height: 28, borderRadius: 6, background: "var(--surface-bright)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--outline)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--on-surface-variant)" },

  // Task List
  taskListSection: { background: "var(--surface-bright)", borderRadius: 14, padding: 24, boxShadow: "var(--ambient-shadow)" },
  taskListHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em" },
  taskCount: { fontSize: 9, fontWeight: 900, background: "var(--secondary-container)", color: "var(--on-secondary-container)", padding: "3px 8px", borderRadius: 6 },
  emptyState: { padding: 40, textAlign: "center", color: "var(--on-surface-variant)", fontSize: 13 },
  taskRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--surface-container-low)" },
  taskRowLeft: { flex: 1 },
  taskRowName: { fontSize: 14, fontWeight: 700, color: "var(--on-surface)", marginBottom: 4 },
  taskRowDesc: { fontSize: 12, color: "var(--on-surface-variant)", marginBottom: 8 },
  flowChain: { display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" },
  flowChainPart: { display: "flex", alignItems: "center", gap: 4 },
  chainArrow: { color: "var(--on-surface-variant)", fontSize: 11 },
  chainAgent: { fontSize: 11, color: "var(--on-secondary-container)", fontWeight: 600, background: "var(--secondary-container)", padding: "2px 8px", borderRadius: 6 },
  taskRowActions: { display: "flex", alignItems: "center", gap: 12 },
  nodeCount: { fontSize: 11, color: "var(--on-surface-variant)", fontWeight: 700 },
  runBtn: { background: "#16a34a", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" },
  editBtn: { background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid var(--outline)", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" },
  deleteBtn: { background: "transparent", color: "#dc2626", border: "1px solid #dc262633", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" },
};
