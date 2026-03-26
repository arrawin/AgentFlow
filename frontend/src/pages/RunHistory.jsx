import { useEffect, useState } from "react";
import api from "../api/client";

export default function RunHistory() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/runs").then((r) => {
      setRuns(r.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="animate-up" style={s.page}>
      {/* Search Header */}
      <div style={s.topControls}>
        <div style={s.searchBox}>
          <span style={s.searchIcon}>🔍</span>
          <input style={s.searchInput} placeholder="Search logs..." />
        </div>
        <div style={s.topActions}>
          <button style={s.iconBtn}>🔔</button>
          <button style={s.iconBtn}>❓</button>
          <button style={s.iconBtn}>⚙️</button>
          <div style={s.avatar}>👤</div>
        </div>
      </div>

      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Run History</h1>
          <p style={s.pageSub}>Audit log of all executed precision tasks. Monitor success rates and debug execution errors in real-time.</p>
        </div>
        <div style={s.headerBtns}>
          <button style={s.filterBtn}><span>📊</span> Filters</button>
          <button style={s.filterBtn}><span>📤</span> Export CSV</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={s.statsRow}>
        <StatCard label="TOTAL RUNS" value="1,284" />
        <StatCard label="SUCCESS RATE" value="98.2%" />
        <StatCard label="FAILED RUNS" value="23" isBad={true} />
        <StatCard label="AVG EXECUTION" value="42ms" />
      </div>

      {/* Main Table */}
      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>SCHEDULER / TASK NAME</th>
              <th style={s.th}>RUN ON</th>
              <th style={s.th}>STATUS</th>
              <th style={s.th}>ERROR CODE</th>
              <th style={s.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan="5" style={s.empty}>Acquiring audit history...</td></tr>
            ) : runs.length === 0 ? (
               <PlaceholderRows />
            ) : (
              runs.map((run, i) => (
                <tr key={run.id} style={s.tr}>
                  <td style={s.taskCell}>
                    <div style={{ ...s.dot, background: run.status === "failed" ? "#ef4444" : run.status === "completed" ? "#3b82f6" : "#94a3b8" }} />
                    <span style={s.taskName}>Task #{run.task_id}</span>
                  </td>
                  <td style={s.tdTime}>{new Date(run.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', ' \u00B7')}</td>
                  <td><StatusPill status={run.status} /></td>
                  <td style={{ ...s.tdError, color: run.status === "failed" ? "#991b1b" : "var(--on-surface-variant)" }}>{run.status === "failed" ? "ERR_EXEC_400" : "\u2014"}</td>
                  <td style={s.tdAction}>Show Log <span style={{marginLeft: 4}}></span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={s.pagination}>
           <div style={s.pageSize}>Showing 1 to 5 of 1,284 results</div>
           <div style={s.pageNumBox}>
              <button style={s.pageArrow}>‹</button>
              <button style={s.pageNumActive}>1</button>
              <button style={s.pageNum}>2</button>
              <button style={s.pageNum}>3</button>
              <span style={s.pageDots}>...</span>
              <button style={s.pageNum}>257</button>
              <button style={s.pageArrow}>›</button>
           </div>
        </div>
      </div>

      {/* Insight Card */}
      <div style={s.insightCard}>
         <div style={s.insightIcon}>💡</div>
         <div style={s.insightBody}>
            <div style={s.insightTitle}>Execution Insight</div>
            <div style={s.insightText}>
               We've detected a recurring timeout on <b>Monthly_Report_Aggregator</b>. This usually happens during peak database I/O periods. 
               Consider rescheduling to 03:00 UTC or increasing the process memory allocation in Task Settings.
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, isBad }) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statValue, color: isBad ? "#b91c1c" : "var(--on-surface)" }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = status?.toLowerCase() || 'completed';
  const styles = {
    completed: { bg: "#eff6ff", text: "#3b82f6", label: "Completed" },
    failed: { bg: "#fef2f2", text: "#ef4444", label: "Failed" },
    in_progress: { bg: "#f1f5f9", text: "#475569", label: "In progress" },
    not_started: { bg: "#f1f5f9", text: "#94a3b8", label: "Not started" },
  };
  const config = styles[normalized] || styles.completed;
  return (
    <div style={{ ...s.statusPill, background: config.bg, color: config.text }}>
      {config.label}
    </div>
  );
}

function PlaceholderRows() {
  const data = [
    { name: "Daily_Cache_Purge", time: "Oct 24, 2023 \u00B7 08:00:04", status: "completed", code: "\u2014", dot: "#3b82f6" },
    { name: "Realtime_Ingress_Stream", time: "Oct 24, 2023 \u00B7 12:44:12", status: "in_progress", code: "\u2014", dot: "#94a3b8" },
    { name: "Monthly_Report_Aggregator", time: "Oct 24, 2023 \u00B7 02:15:00", status: "failed", code: "ERR_TIMEOUT_408", dot: "#ef4444" },
    { name: "System_Backup_Mirror", time: "Oct 24, 2023 \u00B7 23:59:59", status: "not_started", code: "\u2014", dot: "#cbd5e1", lock: true },
    { name: "Auth_Token_Refresh", time: "Oct 24, 2023 \u00B7 09:12:33", status: "completed", code: "\u2014", dot: "#3b82f6" },
  ];
  return data.map((d, i) => (
    <tr key={i} style={s.tr}>
      <td style={s.taskCell}>
        <div style={{ ...s.dot, background: d.dot }} />
        <span style={s.taskName}>{d.name}</span>
      </td>
      <td style={s.tdTime}>{d.time}</td>
      <td><StatusPill status={d.status} /></td>
      <td style={{ ...s.tdError, color: d.status === "failed" ? "#991b1b" : "var(--on-surface-variant)" }}>{d.code}</td>
      <td style={s.tdAction}>{d.lock ? "Show Log 🔒" : "Show Log >"}</td>
    </tr>
  ));
}

const s = {
  page: { paddingBottom: 60 },
  topControls: { position: "absolute", top: -72, right: 48, height: 72, display: "flex", alignItems: "center", gap: 32 },
  searchBox: { background: "var(--surface-container-low)", padding: "0 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, width: 280, height: 40 },
  searchIcon: { fontSize: 13, opacity: 0.4 },
  searchInput: { background: "transparent", border: "none", outline: "none", fontSize: 13, fontWeight: 500, flex: 1 },
  topActions: { display: "flex", alignItems: "center", gap: 16 },
  iconBtn: { background: "transparent", border: "none", fontSize: 16, cursor: "pointer", opacity: 0.6 },
  avatar: { width: 32, height: 32, borderRadius: 8, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, marginTop: 12 },
  pageTitle: { fontSize: 32, fontWeight: 700, color: "var(--on-surface)", letterSpacing: "-0.01em" },
  pageSub: { fontSize: 14, color: "#64748b", maxWidth: 480, marginTop: 8, lineHeight: 1.5 },
  headerBtns: { display: "flex", gap: 12 },
  filterBtn: { background: "var(--surface-container-low)", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 },
  statCard: { background: "var(--surface-bright)", padding: "24px", borderRadius: 12, boxShadow: "var(--ambient-shadow)" },
  statLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.1em", marginBottom: 12 },
  statValue: { fontSize: 32, fontWeight: 700 },

  tableCard: { background: "var(--surface-bright)", borderRadius: 12, boxShadow: "var(--ambient-shadow)", overflow: "hidden", marginBottom: 32 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "16px 24px", fontSize: 10, fontWeight: 800, color: "#64748b", textAlign: "left", letterSpacing: "0.05em", borderBottom: "1px solid var(--surface-container-low)" },
  tr: { borderBottom: "1px solid var(--surface-container-low)" },
  taskCell: { padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 },
  dot: { width: 8, height: 8, borderRadius: "50%" },
  taskName: { fontSize: 13, fontWeight: 600, color: "#1e293b" },
  tdTime: { fontSize: 12, color: "#475569", padding: "0 24px" },
  tdError: { fontSize: 11, fontWeight: 800, fontFamily: "monospace", padding: "0 24px" },
  tdAction: { padding: "0 24px", fontSize: 12, fontWeight: 700, color: "#64748b", cursor: "pointer", textAlign: "right" },

  statusPill: { padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-block" },

  pagination: { padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pageSize: { fontSize: 12, color: "#64748b" },
  pageNumBox: { display: "flex", alignItems: "center", gap: 6 },
  pageNum: { width: 32, height: 32, borderRadius: 6, background: "var(--surface-container-low)", border: "none", fontSize: 12, fontWeight: 700, color: "#64748b" },
  pageNumActive: { width: 32, height: 32, borderRadius: 6, background: "#334155", border: "none", fontSize: 12, fontWeight: 700, color: "#fff" },
  pageArrow: { width: 32, height: 32, borderRadius: 6, background: "var(--surface-container-low)", border: "none", fontSize: 16, color: "#64748b" },
  pageDots: { fontSize: 12, color: "#94a3b8", padding: "0 4px" },

  insightCard: { background: "#eff6ff", borderRadius: 12, padding: "24px 32px", display: "flex", gap: 20, alignItems: "flex-start" },
  insightIcon: { width: 44, height: 44, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)" },
  insightBody: { },
  insightTitle: { fontSize: 14, fontWeight: 700, color: "#1e3a8a", marginBottom: 6 },
  insightText: { fontSize: 13, color: "#3b82f6", lineHeight: 1.6, maxWidth: 800 },
  empty: { padding: "60px", textAlign: "center", color: "var(--on-surface-variant)" },
};
