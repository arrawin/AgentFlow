import { useEffect, useState } from "react";
import api from "../api/client";

export default function RunHistory() {
  const [runs, setRuns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [trace, setTrace] = useState([]);
  const [traceLoading, setTraceLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([api.get("/runs"), api.get("/tasks")])
      .then(([runsRes, tasksRes]) => {
        setRuns(runsRes.data);
        setTasks(tasksRes.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const getTaskName = (taskId) => {
    const t = tasks.find((t) => t.id === taskId);
    return t ? t.name : `Task #${taskId}`;
  };

  const openTrace = async (run) => {
    setSelectedRun(run);
    setTraceLoading(true);
    try {
      const res = await api.get(`/runs/${run.id}/trace`);
      setTrace(res.data.trace || []);
    } catch {
      setTrace([]);
    } finally {
      setTraceLoading(false);
    }
  };

  // Compute real stats from data
  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === "completed").length;
  const failedRuns = runs.filter((r) => r.status === "failed").length;
  const successRate = totalRuns > 0 ? ((completedRuns / totalRuns) * 100).toFixed(1) : "100";
  const avgExec = (() => {
    const finished = runs.filter((r) => r.started_at && r.ended_at);
    if (!finished.length) return "—";
    const total = finished.reduce((sum, r) => sum + (new Date(r.ended_at) - new Date(r.started_at)), 0);
    const avg = total / finished.length;
    return avg > 1000 ? `${(avg / 1000).toFixed(1)}s` : `${Math.round(avg)}ms`;
  })();

  const filteredRuns = runs.filter((r) => {
    if (!searchQuery) return true;
    const name = getTaskName(r.task_id).toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || r.status?.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="animate-up" style={s.page}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <div>
          <div style={s.breadcrumb}>CHRONOS ENGINE</div>
          <h1 style={s.pageTitle}>Run History</h1>
          <p style={s.pageSub}>
            Audit log of all executed precision tasks. Monitor success rates and debug execution errors in real-time.
          </p>
        </div>
        <div style={s.headerBtns}>
          <div style={s.searchBox}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.4 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              style={s.searchInput}
              placeholder="Search runs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button style={s.filterBtn}><span>📊</span> Filters</button>
          <button style={s.filterBtn}><span>📤</span> Export CSV</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={s.statsRow}>
        <StatCard label="TOTAL RUNS" value={totalRuns} icon="▷" accent="var(--secondary)" />
        <StatCard label="SUCCESS RATE" value={`${successRate}%`} icon="◉" accent="var(--tertiary)" />
        <StatCard label="FAILED RUNS" value={failedRuns} icon="⊘" accent="#dc2626" isBad={failedRuns > 0} />
        <StatCard label="AVG EXECUTION" value={avgExec} icon="⏱" accent="var(--on-surface-variant)" />
      </div>

      {/* Main Table */}
      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>TASK NAME</th>
              <th style={s.th}>RUN ON</th>
              <th style={s.th}>STATUS</th>
              <th style={s.th}>ERROR CODE</th>
              <th style={s.th}>FILES</th>
              <th style={{ ...s.th, textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={s.empty}>
                <div style={s.loadingDots}>
                  <span style={s.dot1} /><span style={s.dot2} /><span style={s.dot3} />
                </div>
                Acquiring audit history...
              </td></tr>
            ) : filteredRuns.length === 0 ? (
              <PlaceholderRows getTaskName={getTaskName} openTrace={openTrace} />
            ) : (
              filteredRuns.map((run) => (
                <tr key={run.id} style={s.tr}>
                  <td style={s.taskCell}>
                    <div style={{ ...s.statusDot, background: run.status === "failed" ? "#ef4444" : run.status === "completed" ? "#3b82f6" : run.status === "in_progress" ? "#f59e0b" : "#94a3b8" }} />
                    <span style={s.taskName}>{getTaskName(run.task_id)}</span>
                  </td>
                  <td style={s.tdTime}>{formatDate(run.started_at)}</td>
                  <td><StatusPill status={run.status} /></td>
                  <td style={{ ...s.tdError, color: run.status === "failed" ? "#991b1b" : "var(--on-surface-variant)" }}>
                    {run.status === "failed" ? "ERR_EXEC_400" : "—"}
                  </td>
                  <td style={s.tdFiles}>
                    {run.generated_files && run.generated_files.length > 0 ? (
                      <div style={s.fileChips}>
                        {run.generated_files.map((f) => (
                          <a
                            key={f}
                            href={`/api/files/download/${f}`}
                            download={f}
                            style={s.fileChip}
                            title={`Download ${f}`}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            {f.length > 18 ? f.slice(0, 15) + "..." : f}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>—</span>
                    )}
                  </td>
                  <td style={s.tdAction}>
                    <button style={s.showLogBtn} onClick={() => openTrace(run)}>
                      Show Log
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredRuns.length > 0 && (
          <div style={s.pagination}>
            <div style={s.pageSize}>Showing 1 to {filteredRuns.length} of {totalRuns} results</div>
            <div style={s.pageNumBox}>
              <button style={s.pageArrow}>‹</button>
              <button style={s.pageNumActive}>1</button>
              {totalRuns > 10 && <button style={s.pageNum}>2</button>}
              <button style={s.pageArrow}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Insight Card */}
      <div style={s.insightCard}>
        <div style={s.insightIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div style={s.insightBody}>
          <div style={s.insightTitle}>Execution Insight</div>
          <div style={s.insightText}>
            {failedRuns > 0
              ? <>We've detected <b>{failedRuns} failed run{failedRuns > 1 ? "s" : ""}</b>. Check the logs for timeout or configuration errors. Consider adjusting task parameters or agent tool permissions.</>
              : <>All runs are executing successfully. Your agent configurations are performing optimally. Agents with <b>file_writer</b> access can generate downloadable output files during task execution.</>
            }
          </div>
        </div>
      </div>

      {/* Trace Modal */}
      {selectedRun && (
        <div style={s.modalOverlay} onClick={() => setSelectedRun(null)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={s.modalTitle}>Run Trace — {getTaskName(selectedRun.task_id)}</div>
                <div style={s.modalSub}>
                  <StatusPill status={selectedRun.status} />
                  <span style={{ marginLeft: 12, fontSize: 12, color: "var(--on-surface-variant)" }}>
                    {formatDate(selectedRun.started_at)}
                  </span>
                </div>
              </div>
              <button style={s.modalClose} onClick={() => setSelectedRun(null)}>✕</button>
            </div>

            {/* Generated Files Section */}
            {selectedRun.generated_files && selectedRun.generated_files.length > 0 && (
              <div style={s.genFilesSection}>
                <div style={s.genFilesLabel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  GENERATED FILES
                </div>
                <div style={s.genFilesList}>
                  {selectedRun.generated_files.map((f) => (
                    <a key={f} href={`/api/files/download/${f}`} download={f} style={s.genFileItem}>
                      <span style={s.genFileName}>{f}</span>
                      <span style={s.genFileDownload}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Final Output */}
            {selectedRun.final_output && (
              <div style={s.outputSection}>
                <div style={s.outputLabel}>FINAL OUTPUT</div>
                <pre style={s.outputPre}>{selectedRun.final_output}</pre>
              </div>
            )}

            {/* Trace Timeline */}
            <div style={s.traceSection}>
              <div style={s.traceLabel}>EXECUTION TRACE</div>
              {traceLoading ? (
                <div style={s.traceEmpty}>Loading trace...</div>
              ) : trace.length === 0 ? (
                <div style={s.traceEmpty}>No trace data available</div>
              ) : (
                <div style={s.traceList}>
                  {trace.map((entry, i) => (
                    <div key={i} style={s.traceItem}>
                      <div style={s.traceLeft}>
                        <div style={{
                          ...s.traceTypeBadge,
                          background: entry.event_type === "error" || entry.event_type === "tool_blocked"
                            ? "#fef2f2" : entry.event_type === "tool_call"
                            ? "#eff6ff" : entry.event_type === "tool_result"
                            ? "#f0fdf4" : entry.event_type === "output"
                            ? "#faf5ff" : "#f8fafc",
                          color: entry.event_type === "error" || entry.event_type === "tool_blocked"
                            ? "#dc2626" : entry.event_type === "tool_call"
                            ? "#2563eb" : entry.event_type === "tool_result"
                            ? "#059669" : entry.event_type === "output"
                            ? "#7c3aed" : "#475569",
                        }}>
                          {entry.event_type}
                        </div>
                        <span style={s.traceNode}>Node {entry.node_id}</span>
                      </div>
                      <pre style={s.traceMsg}>{entry.message?.slice(0, 400)}{entry.message?.length > 400 ? "..." : ""}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).replace(",", " ·");
}

function StatCard({ label, value, icon, accent, isBad }) {
  return (
    <div style={s.statCard}>
      <div style={s.statTop}>
        <div style={{ ...s.statIcon, color: accent, background: `${accent}14` }}>{icon}</div>
      </div>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statValue, color: isBad ? "#b91c1c" : "var(--on-surface)" }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = status?.toLowerCase() || "completed";
  const styles = {
    completed:   { bg: "#eff6ff", text: "#3b82f6", label: "Completed" },
    failed:      { bg: "#fef2f2", text: "#ef4444", label: "Failed" },
    in_progress: { bg: "#fef9c3", text: "#a16207", label: "In Progress" },
    not_started: { bg: "#f1f5f9", text: "#94a3b8", label: "Not Started" },
  };
  const config = styles[normalized] || styles.completed;
  return (
    <div style={{ ...s.statusPill, background: config.bg, color: config.text }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: config.text, flexShrink: 0 }} />
      {config.label}
    </div>
  );
}

function PlaceholderRows() {
  const data = [
    { name: "Daily_Cache_Purge", time: "Mar 26, 2026 · 08:00:04", status: "completed", code: "—", dot: "#3b82f6" },
    { name: "Realtime_Ingress_Stream", time: "Mar 26, 2026 · 12:44:12", status: "in_progress", code: "—", dot: "#f59e0b" },
    { name: "Monthly_Report_Aggregator", time: "Mar 25, 2026 · 02:15:00", status: "failed", code: "ERR_TIMEOUT_408", dot: "#ef4444" },
    { name: "IPL_2026_Schedule", time: "Mar 25, 2026 · 23:59:59", status: "completed", code: "—", dot: "#3b82f6", files: ["ipl_2026_schedule.md"] },
    { name: "Auth_Token_Refresh", time: "Mar 25, 2026 · 09:12:33", status: "completed", code: "—", dot: "#3b82f6" },
  ];
  return data.map((d, i) => (
    <tr key={i} style={s.tr}>
      <td style={s.taskCell}>
        <div style={{ ...s.statusDot, background: d.dot }} />
        <span style={s.taskName}>{d.name}</span>
      </td>
      <td style={s.tdTime}>{d.time}</td>
      <td><StatusPill status={d.status} /></td>
      <td style={{ ...s.tdError, color: d.status === "failed" ? "#991b1b" : "var(--on-surface-variant)" }}>{d.code}</td>
      <td style={s.tdFiles}>
        {d.files ? (
          <div style={s.fileChips}>
            {d.files.map((f) => (
              <span key={f} style={s.fileChip}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {f}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>—</span>
        )}
      </td>
      <td style={s.tdAction}>
        <button style={s.showLogBtn}>
          {d.status === "not_started" ? "Show Log 🔒" : "Show Log"}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </td>
    </tr>
  ));
}

const s = {
  page: { paddingBottom: 60 },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  breadcrumb: { fontSize: 9, fontWeight: 900, color: "var(--on-surface-variant)", letterSpacing: "0.1em", marginBottom: 4 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: "var(--on-surface)", letterSpacing: "-0.01em", marginBottom: 6 },
  pageSub: { fontSize: 13, color: "var(--on-surface-variant)", maxWidth: 520, lineHeight: 1.5 },
  headerBtns: { display: "flex", gap: 10, alignItems: "center" },
  searchBox: { background: "var(--surface-container-low)", padding: "0 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, height: 36, color: "var(--on-surface-variant)" },
  searchInput: { background: "transparent", border: "none", outline: "none", fontSize: 12, fontWeight: 500, flex: 1, width: 180 },
  filterBtn: { background: "var(--surface-container-low)", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--on-surface-variant)" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 },
  statCard: { background: "var(--surface-bright)", padding: "22px 24px", borderRadius: 14, boxShadow: "var(--ambient-shadow)" },
  statTop: { marginBottom: 14 },
  statIcon: { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 },
  statLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em", marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800 },

  tableCard: { background: "var(--surface-bright)", borderRadius: 14, boxShadow: "var(--ambient-shadow)", overflow: "hidden", marginBottom: 28 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "14px 20px", fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", textAlign: "left", letterSpacing: "0.06em", background: "var(--surface-container-low)", borderBottom: "1px solid var(--outline)" },
  tr: { transition: "background 100ms" },
  taskCell: { padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  taskName: { fontSize: 13, fontWeight: 600, color: "var(--on-surface)" },
  tdTime: { fontSize: 12, color: "var(--on-surface-variant)", padding: "0 20px", whiteSpace: "nowrap" },
  tdError: { fontSize: 11, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace", padding: "0 20px" },
  tdFiles: { padding: "0 20px" },
  fileChips: { display: "flex", gap: 6, flexWrap: "wrap" },
  fileChip: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: 6,
    fontSize: 10, fontWeight: 700,
    background: "#ecfdf5", color: "#059669",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 150ms",
  },
  tdAction: { padding: "0 20px", textAlign: "right" },
  showLogBtn: {
    background: "transparent", border: "none",
    fontSize: 12, fontWeight: 700, color: "var(--secondary)",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
    padding: "5px 10px", borderRadius: 6,
    transition: "background 100ms",
  },

  statusPill: { padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 },

  pagination: { padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--surface-container-low)" },
  pageSize: { fontSize: 11, color: "var(--on-surface-variant)" },
  pageNumBox: { display: "flex", alignItems: "center", gap: 4 },
  pageNum: { width: 28, height: 28, borderRadius: 6, background: "var(--surface-container-low)", border: "none", fontSize: 11, fontWeight: 700, color: "var(--on-surface-variant)", cursor: "pointer" },
  pageNumActive: { width: 28, height: 28, borderRadius: 6, background: "#334155", border: "none", fontSize: 11, fontWeight: 700, color: "#fff" },
  pageArrow: { width: 28, height: 28, borderRadius: 6, background: "var(--surface-container-low)", border: "none", fontSize: 14, color: "var(--on-surface-variant)", cursor: "pointer" },

  insightCard: { background: "var(--surface-bright)", borderRadius: 14, padding: "22px 28px", display: "flex", gap: 18, alignItems: "flex-start", boxShadow: "var(--ambient-shadow)", borderLeft: "3px solid #3b82f6" },
  insightIcon: { width: 40, height: 40, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  insightBody: {},
  insightTitle: { fontSize: 14, fontWeight: 800, color: "var(--on-surface)", marginBottom: 4 },
  insightText: { fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6, maxWidth: 800 },

  empty: { padding: "48px 20px", textAlign: "center", color: "var(--on-surface-variant)", fontSize: 13 },
  loadingDots: { display: "flex", justifyContent: "center", gap: 4, marginBottom: 12 },
  dot1: { width: 6, height: 6, borderRadius: "50%", background: "var(--secondary)", animation: "pulse 1.2s ease infinite" },
  dot2: { width: 6, height: 6, borderRadius: "50%", background: "var(--secondary)", animation: "pulse 1.2s ease 0.2s infinite" },
  dot3: { width: 6, height: 6, borderRadius: "50%", background: "var(--secondary)", animation: "pulse 1.2s ease 0.4s infinite" },

  // Modal
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 32,
  },
  modalContent: {
    background: "var(--surface-bright)", borderRadius: 16,
    width: "100%", maxWidth: 720, maxHeight: "85vh",
    overflow: "auto", boxShadow: "var(--shadow-lg)",
    padding: 28,
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 800, color: "var(--on-surface)", marginBottom: 8 },
  modalSub: { display: "flex", alignItems: "center" },
  modalClose: { background: "var(--surface-container-low)", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer", color: "var(--on-surface-variant)", display: "flex", alignItems: "center", justifyContent: "center" },

  genFilesSection: { background: "#f0fdf4", borderRadius: 12, padding: "16px 20px", marginBottom: 20 },
  genFilesLabel: { fontSize: 10, fontWeight: 800, color: "#065f46", letterSpacing: "0.06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 },
  genFilesList: { display: "flex", flexDirection: "column", gap: 6 },
  genFileItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 14px", background: "#fff", borderRadius: 8,
    textDecoration: "none", color: "var(--on-surface)",
    transition: "all 150ms", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  genFileName: { fontSize: 13, fontWeight: 600 },
  genFileDownload: { fontSize: 11, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 4 },

  outputSection: { marginBottom: 20 },
  outputLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.06em", marginBottom: 8 },
  outputPre: {
    background: "#0f172a", color: "#e2e8f0", padding: 16, borderRadius: 10,
    fontSize: 12, lineHeight: 1.6, fontFamily: "'IBM Plex Mono', monospace",
    overflow: "auto", maxHeight: 200, whiteSpace: "pre-wrap", wordBreak: "break-word",
  },

  traceSection: {},
  traceLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.06em", marginBottom: 12 },
  traceEmpty: { color: "var(--on-surface-variant)", fontSize: 12, padding: 20, textAlign: "center" },
  traceList: { display: "flex", flexDirection: "column", gap: 8 },
  traceItem: { background: "var(--surface-container-low)", borderRadius: 10, padding: "12px 16px" },
  traceLeft: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  traceTypeBadge: { fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, letterSpacing: "0.04em", textTransform: "uppercase" },
  traceNode: { fontSize: 10, fontWeight: 700, color: "var(--on-surface-variant)" },
  traceMsg: {
    fontSize: 11, color: "var(--on-surface)", lineHeight: 1.5,
    fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word",
    margin: 0, background: "transparent",
  },
};
