import { useState } from "react";
import { getRunTrace } from "../api/runs";

export default function TraceDrawer({ run, onClose }) {
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    if (!run) return;
    window.setModalOpen(true);
    getRunTrace(run.id).then(data => {
      setTrace(data.trace);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [run]);

  const handleClose = () => { window.setModalOpen(false); onClose(); };

  if (!run) return null;

  const grouped = groupByNode(trace || []);

  return (
    <div style={s.overlay} onClick={handleClose}>
      <div style={s.drawer} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <div style={s.title}>Execution Trace</div>
            <div style={s.sub}>Run #{run.id} · <StatusText status={run.status} /></div>
          </div>
          <button style={s.closeBtn} onClick={handleClose}>✕</button>
        </div>

        {loading ? (
          <div style={s.loading}>Loading trace...</div>
        ) : trace?.length === 0 ? (
          <div style={s.empty}>No trace data for this run.</div>
        ) : (
          <div style={s.nodes}>
            {grouped.map(({ nodeId, logs }, i) => (
              <TraceNode key={i} nodeId={nodeId} logs={logs} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TraceNode({ nodeId, logs, index }) {
  const [open, setOpen] = useState(false);
  const output = logs.find(l => l.event_type === "output");
  const hasError = logs.some(l => l.event_type === "error");
  const color = hasError ? "#ef4444" : "#6366f1";

  return (
    <div style={{ ...s.node, borderLeft: `2px solid ${color}` }}>
      <div style={s.nodeHeader} onClick={() => setOpen(!open)}>
        <div style={s.nodeLeft}>
          <span style={{ ...s.stepBadge, background: `${color}20`, color }}>{index + 1}</span>
          <span style={s.nodeId}>{nodeId.replace(/_/g, " ").toUpperCase()}</span>
          {hasError && <span style={s.errorTag}>FAILED</span>}
        </div>
        <span style={s.chevron}>{open ? "▲" : "▼"}</span>
      </div>

      {!open && output && (
        <div style={s.snippet}>{output.message.slice(0, 140)}...</div>
      )}

      {open && (
        <div style={s.logList}>
          {logs.map((log, i) => (
            <div key={i} style={s.logRow}>
              <span style={{ ...s.eventTag, color: eventColor(log.event_type) }}>{log.event_type}</span>
              <span style={s.logMsg}>{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusText({ status }) {
  const colors = { completed: "#10b981", failed: "#ef4444", in_progress: "#6366f1" };
  return <span style={{ color: colors[status] || "#9ca3af", fontWeight: 600 }}>{status}</span>;
}

function groupByNode(logs) {
  const map = {}, order = [];
  logs.forEach(log => {
    if (!map[log.node_id]) { map[log.node_id] = []; order.push(log.node_id); }
    map[log.node_id].push(log);
  });
  return order.map(nodeId => ({ nodeId, logs: map[nodeId] }));
}

function eventColor(type) {
  return { node_start: "#6366f1", tool_call: "#f59e0b", tool_result: "#10b981", output: "#22c55e", error: "#ef4444" }[type] || "#9ca3af";
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.25)", backdropFilter: "blur(6px)", zIndex: 500, display: "flex", justifyContent: "flex-end" },
  drawer: { width: 500, background: "var(--surface-bright)", borderLeft: "1px solid var(--outline)", height: "100vh", overflow: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 16, fontWeight: 700 },
  sub: { fontSize: 12, color: "var(--on-surface-variant)", marginTop: 4 },
  closeBtn: { background: "transparent", color: "var(--on-surface-variant)", fontSize: 18, padding: 4 },
  loading: { color: "var(--on-surface-variant)", fontSize: 13 },
  empty: { color: "var(--on-surface-variant)", fontSize: 13 },
  nodes: { display: "flex", flexDirection: "column", gap: 12 },
  node: { background: "var(--surface-container-low)", borderRadius: 8, padding: "14px 16px", paddingLeft: 14 },
  nodeHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" },
  nodeLeft: { display: "flex", alignItems: "center", gap: 10 },
  stepBadge: { width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 },
  nodeId: { fontSize: 13, fontWeight: 600 },
  errorTag: { background: "rgba(239,68,68,0.15)", color: "#ef4444", fontSize: 10, padding: "2px 8px", borderRadius: 20 },
  chevron: { fontSize: 10, color: "var(--on-surface-variant)" },
  snippet: { fontSize: 12, color: "var(--on-surface-variant)", marginTop: 8, fontStyle: "italic" },
  logList: { marginTop: 12, display: "flex", flexDirection: "column", gap: 8 },
  logRow: { display: "flex", gap: 10, fontSize: 12 },
  eventTag: { fontWeight: 700, minWidth: 90, fontSize: 11 },
  logMsg: { color: "var(--on-surface-variant)", wordBreak: "break-word" },
};
