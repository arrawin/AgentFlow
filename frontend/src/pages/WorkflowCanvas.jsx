import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6"];
const getColor = (i) => COLORS[i % COLORS.length];

// ─── Nodes ────────────────────────────────────────────────────

function StartNode({ data }) {
  return (
    <div style={{ ...ns.startNode, ...(data.running ? ns.startNodeRunning : {}) }} onClick={data.onStart}>
      <div style={ns.startRing}><span style={{ fontSize: 16, color: "#6366f1" }}>▶</span></div>
      <div style={ns.startLabel}>START</div>
      <div style={ns.startHint}>{data.running ? "Running..." : "Click to execute"}</div>
      <Handle type="source" position={Position.Bottom} style={ns.handle} />
    </div>
  );
}
function EndNode() {
  return (
    <div style={ns.endNode}>
      <Handle type="target" position={Position.Top} style={ns.handle} />
      <div style={ns.endRing}><span style={{ fontSize: 14, color: "#94a3b8" }}>■</span></div>
      <div style={ns.endLabel}>END</div>
    </div>
  );
}

function AgentNode({ data }) {
  const color = data.color || "#6366f1";
  const statusColor = { idle: "#cbd5e1", running: "#6366f1", completed: "#22c55e", failed: "#ef4444" }[data.status || "idle"];
  const isRunning = data.status === "running";

  return (
    <div
      style={{ ...ns.agentNode, borderLeft: `4px solid ${color}`, position: "relative" }}
      className={isRunning ? "node-running" : ""}
    >
      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
      <Handle type="target" position={Position.Top} style={{ ...ns.handle, background: color }} />
      <div style={ns.agentHeader}>
        <div style={{ ...ns.agentAvatar, background: color + "20", color }}>{data.name[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={ns.agentName}>{data.name}</div>
          <div style={ns.agentDomain}>{data.domain || "Agent"}</div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
      </div>
      {data.skills && <div style={ns.agentSkill}>{data.skills.slice(0, 70)}...</div>}
      <div style={ns.agentFooter}>
        <span style={ns.stepTag}>STEP {String(data.index + 1).padStart(2, "0")}</span>
        {data.status === "completed" && <span style={{ ...ns.statusTag, background: "#dcfce7", color: "#15803d" }}>✓ Done</span>}
        {data.status === "running"   && <span style={{ ...ns.statusTag, background: "#ede9fe", color: "#6366f1" }}>● Running</span>}
        {data.status === "failed"    && <span style={{ ...ns.statusTag, background: "#fee2e2", color: "#dc2626" }}>✗ Failed</span>}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ ...ns.handle, background: color }} />
      </div>
    </div>
  );
}

const nodeTypes = { startNode: StartNode, endNode: EndNode, agentNode: AgentNode };

// ─── Main ─────────────────────────────────────────────────────

export default function WorkflowCanvas() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask]         = useState(null);
  const [tasks, setTasks]       = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [agents, setAgents]     = useState([]);
  const [running, setRunning]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState({}); // { nodeId: "idle"|"running"|"completed"|"failed" }
  const [runOutputs, setRunOutputs] = useState(null); // { nodes: [...], final_output }
  const pollRef = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    api.get("/tasks").then(r => setTasks(r.data)).catch(console.error);
    Promise.all([api.get(`/tasks/${id}`), api.get("/agents")])
      .then(([tRes, aRes]) => {
        setTask(tRes.data);
        setAgents(aRes.data);
        api.get(`/workflows/${tRes.data.workflow_id}`).then(wRes => {
          setWorkflow(wRes.data);
          buildGraph(wRes.data, aRes.data);
        });
      }).catch(console.error);

    // Check if this task already has an active run
    api.get("/runs").then(r => {
      const activeRun = r.data.find(run => run.task_id === parseInt(id) && run.status === "in_progress");
      if (activeRun) {
        setRunning(true);
        setCurrentRunId(activeRun.id);
        startPollingTrace(activeRun.id);
      }
    }).catch(console.error);
  }, [id]);

  const buildGraph = useCallback((wf, agentList) => {
    const gNodes = wf.graph_json?.nodes || [];
    const gEdges = wf.graph_json?.edges || [];
    const SPACING_Y = 180;
    const CX = 200;  // center X - same for all nodes so edges go straight down

    const fNodes = [];
    const fEdges = [];

    fNodes.push({ id: "start", type: "startNode", position: { x: CX, y: 0 }, data: { running: false, onStart: handleRun } });

    gNodes.forEach((n, i) => {
      const agent = agentList.find(a => a.id === n.agent_id);
      fNodes.push({
        id: n.id, type: "agentNode",
        position: { x: CX, y: (i + 1) * SPACING_Y },
        data: { name: agent?.name || `Agent #${n.agent_id}`, skills: agent?.skills, domain: "Agent", color: getColor(i), index: i, status: "idle" },
      });
    });

    fNodes.push({ id: "end", type: "endNode", position: { x: CX, y: (gNodes.length + 1) * SPACING_Y }, data: {} });

    const edgeStyle = { stroke: "#6366f1", strokeWidth: 2 };
    const marker = { type: MarkerType.ArrowClosed, color: "#6366f1" };

    if (gNodes.length > 0) fEdges.push({ id: "s-n1", source: "start", target: gNodes[0].id, animated: true, style: edgeStyle, markerEnd: marker });
    gEdges.forEach(e => fEdges.push({ id: `${e.from}-${e.to}`, source: e.from, target: e.to, animated: true, style: edgeStyle, markerEnd: marker }));
    if (gNodes.length > 0) {
      const last = gNodes[gNodes.length - 1];
      fEdges.push({ id: `${last.id}-end`, source: last.id, target: "end", animated: true, style: edgeStyle, markerEnd: marker });
    }

    setNodes(fNodes);
    setEdges(fEdges);
  }, []);

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    setNodeStatuses({});
    setNodes(nds => nds.map(n => n.id === "start" ? { ...n, data: { ...n.data, running: true, onStart: handleRun } } : n));
    try {
      await api.post(`/tasks/${id}/run`);
      showToast("Task started", true);
      // Wait a moment then start polling for the new run
      setTimeout(() => pollForRun(), 1500);
    } catch (e) {
      showToast(e.response?.data?.detail || "Error", false);
      setRunning(false);
    }
  };

  const pollForRun = async () => {
    try {
      const res = await api.get("/runs");
      const runs = res.data;
      // Find the most recent run for this task
      const run = runs.find(r => r.task_id === parseInt(id) && (r.status === "in_progress" || r.status === "completed" || r.status === "failed"));
      if (run) {
        setCurrentRunId(run.id);
        startPollingTrace(run.id);
      } else {
        setTimeout(() => pollForRun(), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startPollingTrace = (runId) => {
    const interval = setInterval(async () => {
      try {
        const [traceRes, runsRes] = await Promise.all([
          api.get(`/runs/${runId}/trace`),
          api.get("/runs"),
        ]);

        const trace = traceRes.data.trace || [];
        const run = runsRes.data.find(r => r.id === runId);

        // Build node statuses from trace logs
        const statuses = {};
        const nodeStarted = new Set();
        const nodeCompleted = new Set();
        const nodeFailed = new Set();

        trace.forEach(log => {
          if (log.event_type === "node_start") nodeStarted.add(log.node_id);
          if (log.event_type === "output") nodeCompleted.add(log.node_id);
          if (log.event_type === "error") nodeFailed.add(log.node_id);
        });

        // Determine status per node
        const graphNodes = workflow?.graph_json?.nodes || [];
        graphNodes.forEach(n => {
          if (nodeFailed.has(n.id)) statuses[n.id] = "failed";
          else if (nodeCompleted.has(n.id)) statuses[n.id] = "completed";
          else if (nodeStarted.has(n.id)) statuses[n.id] = "running";
          else statuses[n.id] = "idle";
        });

        setNodeStatuses(statuses);

        // Stop polling when run is done
        if (run && (run.status === "completed" || run.status === "failed")) {
          clearInterval(interval);
          setRunning(false);
          showToast(run.status === "completed" ? "Workflow completed ✓" : "Workflow failed", run.status === "completed");
          setNodes(nds => nds.map(n => n.id === "start" ? { ...n, data: { ...n.data, running: false, onStart: handleRun } } : n));
          // Fetch trace for output display
          const traceData = traceRes.data.trace || [];
          const graphNds = workflow?.graph_json?.nodes || [];
          const outputs = graphNds.map((n, i) => {
            const outputLog = traceData.filter(l => l.node_id === n.id && l.event_type === "output").pop();
            const agent = agents.find(a => a.id === n.agent_id);
            return { node_id: n.id, agent_name: agent?.name || `Agent #${n.agent_id}`, output: outputLog?.message || "", index: i };
          });
          setRunOutputs({ nodes: outputs, final_output: run.final_output });
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);

    // Store interval ref for cleanup
    pollRef[0] = interval;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (pollRef[0]) clearInterval(pollRef[0]); };
  }, []);

  const showToast = (msg, ok) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (workflow && agents.length > 0) buildGraph(workflow, agents);
  }, [workflow, agents]);

  if (!task) return <div style={{ padding: 40, color: "#64748b" }}>Loading...</div>;

  const graphNodes = workflow?.graph_json?.nodes || [];

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", background: "#f8fafc", flexDirection: "column" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

      {/* Left panel — task list */}
      <div style={s.leftPanel}>
        <div style={s.leftHeader}>
          <button style={s.backBtn} onClick={() => navigate("/tasks")}>← Tasks</button>
        </div>
        <div style={s.leftTitle}>Workflows</div>
        <div style={s.taskList}>
          {tasks.map(t => (
            <div
              key={t.id}
              style={{ ...s.taskItem, ...(t.id === parseInt(id) ? s.taskItemActive : {}) }}
              onClick={() => navigate(`/tasks/${t.id}/canvas`)}
            >
              <div style={s.taskItemName}>{t.name}</div>
              <div style={s.taskItemDesc}>{t.description?.slice(0, 50)}{t.description?.length > 50 ? "..." : ""}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes.map(n => {
            if (n.id === "start") return { ...n, data: { ...n.data, running, onStart: handleRun } };
            if (n.type === "agentNode") return { ...n, data: { ...n.data, status: nodeStatuses[n.id] || "idle" } };
            return n;
          })}
          edges={edges.map(e => {
            const targetStatus = nodeStatuses[e.target];
            const isActive = targetStatus === "running" || targetStatus === "completed";
            return {
              ...e,
              animated: isActive || running,
              style: { ...e.style, stroke: targetStatus === "completed" ? "#22c55e" : targetStatus === "failed" ? "#ef4444" : "#6366f1", strokeWidth: isActive ? 3 : 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: targetStatus === "completed" ? "#22c55e" : targetStatus === "failed" ? "#ef4444" : "#6366f1" },
            };
          })}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          style={{ background: "#f8fafc" }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e2e8f0" gap={24} size={1.5} variant="dots" />
          <Controls style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }} showInteractive={false} />

          {/* Top bar inside canvas */}
          <Panel position="top-center" style={s.topBar}>
            <div style={s.topTaskName}>{task.name}</div>
            <div style={s.topDivider} />
            <span style={{ ...s.statusPill, background: running ? "#ede9fe" : "#f1f5f9", color: running ? "#6366f1" : "#64748b" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: running ? "#6366f1" : "#cbd5e1", display: "inline-block", marginRight: 6 }} />
              {running ? "Running" : "Ready"}
            </span>
            <button style={{ ...s.runBtn, ...(running ? { opacity: 0.6, cursor: "not-allowed" } : {}) }} onClick={handleRun} disabled={running}>
              ▶ Run Workflow
            </button>
          </Panel>

          {/* Node count */}
          <Panel position="bottom-center" style={s.infoBar}>
            <span style={s.infoText}>{graphNodes.length} agent{graphNodes.length !== 1 ? "s" : ""}</span>
            <span style={{ color: "#e2e8f0" }}>·</span>
            <span style={s.infoText}>{Math.max(0, graphNodes.length - 1)} connection{graphNodes.length > 2 ? "s" : ""}</span>
          </Panel>
        </ReactFlow>
      </div>

      </div>

      {/* Agent outputs below canvas — shown after run completes */}
      {runOutputs && (
        <div style={s.outputPanel}>
          <div style={s.outputPanelHeader}>
            <span style={s.outputPanelTitle}>Execution Results</span>
            <button style={s.outputCloseBtn} onClick={() => setRunOutputs(null)}>✕</button>
          </div>
          <div style={s.outputGrid}>
            {runOutputs.nodes.map((n, i) => (
              <div key={n.node_id} style={s.outputCard}>
                <div style={s.outputCardHeader}>
                  <span style={s.outputStep}>STEP {i + 1}</span>
                  <span style={s.outputAgentName}>{n.agent_name}</span>
                </div>
                <div style={s.outputText}>{n.output?.slice(0, 300) || "No output"}{n.output?.length > 300 ? "..." : ""}</div>
              </div>
            ))}
          </div>
          {runOutputs.final_output && (
            <div style={s.finalOutput}>
              <div style={s.finalOutputLabel}>FINAL OUTPUT</div>
              <div style={s.finalOutputText}>{runOutputs.final_output.slice(0, 500)}{runOutputs.final_output.length > 500 ? "..." : ""}</div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#dcfce7" : "#fee2e2", color: toast.ok ? "#15803d" : "#dc2626" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Node Styles ──────────────────────────────────────────────

const ns = {
  handle: { width: 10, height: 10, border: "2px solid #f8fafc" },
  startNode: { background: "#fff", border: "2px solid #6366f1", borderRadius: 16, padding: "20px 28px", textAlign: "center", cursor: "pointer", minWidth: 160, boxShadow: "0 0 0 4px rgba(99,102,241,0.08)", transition: "all 200ms" },
  startNodeRunning: { background: "#f5f3ff", boxShadow: "0 0 0 4px rgba(99,102,241,0.2)" },
  startRing: { width: 40, height: 40, borderRadius: "50%", background: "rgba(99,102,241,0.1)", border: "2px solid #6366f1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
  startLabel: { fontSize: 11, fontWeight: 800, color: "#6366f1", letterSpacing: "0.1em" },
  startHint: { fontSize: 10, color: "#94a3b8", marginTop: 4 },
  endNode: { background: "#fff", border: "2px solid #e2e8f0", borderRadius: 16, padding: "20px 28px", textAlign: "center", minWidth: 160, boxShadow: "0 1px 8px rgba(15,23,42,0.06)" },
  endRing: { width: 40, height: 40, borderRadius: "50%", background: "#f1f5f9", border: "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
  endLabel: { fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em" },
  agentNode: { background: "#fff", borderRadius: 12, padding: "16px 18px", minWidth: 240, border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(15,23,42,0.08)" },
  agentHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  agentAvatar: { width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 },
  agentName: { fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 1 },
  agentDomain: { fontSize: 10, color: "#94a3b8" },
  agentSkill: { fontSize: 11, color: "#64748b", lineHeight: 1.4, marginBottom: 10, borderTop: "1px solid #f1f5f9", paddingTop: 8 },
  agentFooter: { display: "flex", gap: 6, alignItems: "center" },
  stepTag: { fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "#f1f5f9", color: "#64748b", letterSpacing: "0.05em" },
  statusTag: { fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6 },
};

// ─── Page Styles ──────────────────────────────────────────────

const s = {
  leftPanel: { width: 240, background: "#fff", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", flexShrink: 0 },
  leftHeader: { padding: "16px 16px 8px" },
  backBtn: { background: "transparent", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" },
  leftTitle: { fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", padding: "8px 16px 8px", textTransform: "uppercase" },
  taskList: { flex: 1, overflowY: "auto", padding: "0 8px 16px" },
  taskItem: { padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, transition: "background 150ms" },
  taskItemActive: { background: "#ede9fe" },
  taskItemName: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 2 },
  taskItemDesc: { fontSize: 11, color: "#94a3b8", lineHeight: 1.4 },

  topBar: { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px", boxShadow: "0 2px 12px rgba(15,23,42,0.08)" },
  topTaskName: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  topDivider: { width: 1, height: 20, background: "#e2e8f0" },
  statusPill: { display: "flex", alignItems: "center", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  runBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" },

  infoBar: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" },
  infoText: { fontSize: 11, color: "#94a3b8", fontWeight: 600 },

  toast: { position: "fixed", bottom: 24, right: 24, padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  outputPanel: { background: "#fff", borderTop: "1px solid #e2e8f0", padding: "16px 24px", maxHeight: 280, overflowY: "auto", flexShrink: 0 },
  outputPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  outputPanelTitle: { fontSize: 12, fontWeight: 800, color: "#0f172a", letterSpacing: "0.06em" },
  outputCloseBtn: { background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 },
  outputGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 12 },
  outputCard: { background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" },
  outputCardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  outputStep: { fontSize: 9, fontWeight: 800, background: "#e2e8f0", color: "#64748b", padding: "2px 7px", borderRadius: 6, letterSpacing: "0.05em" },
  outputAgentName: { fontSize: 12, fontWeight: 700, color: "#0f172a" },
  outputText: { fontSize: 11, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  finalOutput: { background: "#f0fdf4", borderRadius: 10, padding: 14, border: "1px solid #bbf7d0" },
  finalOutputLabel: { fontSize: 9, fontWeight: 800, color: "#15803d", letterSpacing: "0.06em", marginBottom: 6 },
  finalOutputText: { fontSize: 12, color: "#166534", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" },
};
