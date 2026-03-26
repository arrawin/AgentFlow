import { useEffect, useState } from "react";
import api from "../api/client";
import { getTasks, createTask, runTask } from "../api/tasks";
import { getWorkflows, createWorkflow } from "../api/workflows";
import { getAgents } from "../api/agents";

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [steps, setSteps] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [mode, setMode] = useState("manual");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [runStatus, setRunStatus] = useState({});
  const [tab, setTab] = useState("create"); // "create" | "list"

  useEffect(() => {
    getAgents().then((d) => setAgents(d.filter((a) => !a.is_system)));
    getTasks().then(setTasks);
    getWorkflows().then(setWorkflows);
  }, []);

  const toggleAgent = (agent) => {
    setSteps((prev) => {
      const exists = prev.find((s) => s.agent_id === agent.id);
      if (exists) return prev.filter((s) => s.agent_id !== agent.id);
      return [...prev, { id: Date.now(), agent_id: agent.id, name: agent.name }];
    });
  };

  const isSelected = (agentId) => steps.some((s) => s.agent_id === agentId);

  const removeStep = (stepId) => setSteps((prev) => prev.filter((s) => s.id !== stepId));

  const handlePublish = async () => {
    if (!form.name || steps.length === 0) {
      setError("Task name and at least one agent step are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const nodes = steps.map((s, i) => ({ id: `n${i + 1}`, agent_id: s.agent_id }));
      const edges = nodes.slice(0, -1).map((n, i) => ({ from: n.id, to: nodes[i + 1].id }));
      const wf = await api.post("/workflows", { name: form.name, graph_json: { nodes, edges } });
      const task = await api.post("/tasks", {
        name: form.name,
        description: form.description,
        workflow_id: wf.data.id,
      });
      setTasks((prev) => [...prev, task.data]);
      setSteps([]);
      setForm({ name: "", description: "" });
      setTab("list");
    } catch (e) {
      const d = e.response?.data?.detail;
      setError(typeof d === "object" ? JSON.stringify(d) : d || "Error creating task sequence");
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
          <button style={s.saveDraftBtn} onClick={() => setTab("list")}>
            {tab === "list" ? "+ New Sequence" : "View All Tasks"}
          </button>
          <button className="btn-primary" style={s.publishBtn} onClick={handlePublish} disabled={saving}>
            {saving ? "Publishing..." : "Publish Sequence"}
          </button>
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
                    style={{ ...s.runBtn, ...(status === "queued" ? { background: "#15803d" } : {}) }}
                    onClick={() => handleRun(task.id)}
                  >
                    {status === "queuing" ? "..." : status === "queued" ? "✓ Queued" : "▶ Run"}
                  </button>
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
                  style={{ ...s.fieldInput, resize: "none", height: 72 }}
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
            </div>
          </div>

          {/* Two-Column Workspace */}
          <div style={s.workspace}>
            {/* Left: Agent Selection */}
            <div style={s.agentPanel}>
              <div style={s.panelHeader}>
                <span style={s.panelTitle}>Agent Selection</span>
                {steps.length > 0 && (
                  <span style={s.selBadge}>{steps.length} SELECTED</span>
                )}
              </div>
              <div style={s.agentList}>
                {agents.length === 0 ? (
                  <div style={s.emptyAgents}>No agents yet. Create agents first.</div>
                ) : agents.map((agent) => {
                  const selected = isSelected(agent.id);
                  return (
                    <div
                      key={agent.id}
                      style={{ ...s.agentItem, ...(selected ? s.agentItemActive : {}) }}
                      onClick={() => toggleAgent(agent)}
                    >
                      <div style={{ ...s.agentAvatar, background: selected ? "var(--secondary)" : "var(--surface-container)" }}>
                        {selected ? "✓" : agent.name[0]}
                      </div>
                      <div style={s.agentInfo}>
                        <div style={s.agentName}>{agent.name}</div>
                        <div style={s.agentSkills}>{agent.skills?.slice(0, 40) || "No skills defined"}</div>
                      </div>
                      <div style={s.agentToggle}>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: selected ? "var(--tertiary)" : "transparent",
                          border: selected ? "none" : "2px solid var(--outline-variant)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button style={s.registerBtn}>+ Register New Agent</button>
            </div>

            {/* Right: Workflow Sequence Canvas */}
            <div style={s.canvasPanel}>
              <div style={s.canvasHeader}>
                <span style={s.panelTitle}>Workflow Sequence</span>
                <div style={s.canvasStats}>
                  <span style={s.canvasStat}>● {steps.length} Nodes</span>
                  <span style={s.canvasStat}>◌ {Math.max(0, steps.length - 1)} Connectors</span>
                </div>
              </div>

              <div style={s.canvas}>
                {steps.length === 0 ? (
                  <div style={s.emptyCanvas}>
                    <div style={s.emptyCanvasIcon}>⬡</div>
                    <div style={s.emptyCanvasText}>Select agents from the left panel to build your workflow sequence.</div>
                  </div>
                ) : (
                  <div style={s.stepsFlow}>
                    {steps.map((step, index) => (
                      <div key={step.id} style={s.stepWrapper}>
                        <div style={s.stepCard}>
                          <div style={s.stepCardHeader}>
                            <div style={s.stepCardTitle}>{step.name}</div>
                            <div style={s.stepCardActions}>
                              <button style={s.stepMoreBtn} onClick={() => removeStep(step.id)}>✕</button>
                            </div>
                          </div>
                          <div style={s.stepAssigned}>
                            <div style={s.stepAssignedDot} />
                            Assigned to: <strong>{step.name}</strong>
                          </div>
                          <div style={s.stepMeta}>
                            <span style={s.stepMetaTag}>STEP {String(index + 1).padStart(2, "0")}</span>
                          </div>
                        </div>
                        {index < steps.length - 1 && (
                          <div style={s.connector}>
                            <div style={s.connectorLine} />
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Append step button */}
                    <div style={s.appendStep}>
                      <div style={s.connectorLine} />
                      <div style={s.appendBtn}>+</div>
                      <div style={s.appendLabel}>APPEND NEW STEP</div>
                    </div>
                  </div>
                )}

                {/* Canvas Controls */}
                <div style={s.canvasControls}>
                  <button style={s.canvasCtrlBtn}>⊕</button>
                  <button style={s.canvasCtrlBtn}>⊖</button>
                  <button style={s.canvasCtrlBtn}>⊞</button>
                </div>
              </div>
            </div>
          </div>
        </>
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

  // Meta Row
  metaRow: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, marginBottom: 24 },
  metaLeft: { display: "flex", flexDirection: "column", gap: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em" },
  fieldInput: { background: "var(--surface-bright)", border: "1px solid var(--outline)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--on-surface)", outline: "none", fontFamily: "inherit" },
  errorMsg: { color: "#dc2626", fontSize: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 },

  // Mode Card
  modeCard: { background: "var(--surface-bright)", borderRadius: 14, padding: 20, boxShadow: "var(--ambient-shadow)", display: "flex", flexDirection: "column", gap: 8 },
  modeLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em", marginBottom: 4 },
  modeBtn: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--surface-container-low)", color: "var(--on-surface-variant)", border: "none", cursor: "pointer", textAlign: "left" },
  modeBtnActive: { background: "var(--secondary-container)", color: "var(--on-secondary-container)", fontWeight: 700 },
  modeHint: { fontSize: 11, color: "var(--on-surface-variant)", lineHeight: 1.5, marginTop: 4 },

  // Workspace
  workspace: { display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 },

  // Agent Panel
  agentPanel: { background: "var(--surface-bright)", borderRadius: 14, padding: 20, boxShadow: "var(--ambient-shadow)", display: "flex", flexDirection: "column" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  panelTitle: { fontSize: 14, fontWeight: 800, color: "var(--on-surface)" },
  selBadge: { fontSize: 9, fontWeight: 900, background: "var(--secondary-container)", color: "var(--on-secondary-container)", padding: "3px 8px", borderRadius: 6 },
  agentList: { display: "flex", flexDirection: "column", gap: 8, flex: 1, marginBottom: 16, overflowY: "auto", maxHeight: 400 },
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
  canvasPanel: { background: "var(--surface-container-low)", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", minHeight: 480 },
  canvasHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
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
  runBtn: { background: "#16a34a", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 },
};
