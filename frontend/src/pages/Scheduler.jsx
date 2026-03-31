import { useEffect, useState } from "react";
import api from "../api/client";
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from "../api/schedules";
import { getTasks } from "../api/tasks";
import Modal from "../components/Modal";

const CRON_PRESETS = [
  { label: "Every day at 9 AM",     value: "0 9 * * *" },
  { label: "Every hour",            value: "0 * * * *" },
  { label: "Every 5 minutes",       value: "*/5 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every Monday 9 AM",     value: "0 9 * * 1" },
  { label: "Custom",                value: "" },
];

function cronHuman(expr) {
  if (!expr) return "—";
  const match = CRON_PRESETS.find(p => p.value === expr);
  return match?.value ? match.label : expr;
}

const EMPTY_FORM = {
  name: "", trigger_type: "cron", cron_expression: "0 9 * * *", task_ids: [], enabled: true,
  watch_path: "", file_pattern: "*",
  imap_host: "", imap_port: 993, imap_user: "", imap_password: "", subject_filter: "", sender_filter: "",
};

const TRIGGER_ICONS = {
  cron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  email: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  folder_watch: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  file_watch: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

export default function Scheduler() {
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [customCron, setCustomCron] = useState(false);

  const load = () =>
    Promise.all([getSchedules(), getTasks(), api.get("/runs")]).then(([s, t, r]) => {
      setSchedules(s);
      setTasks(t);
      setRuns(r.data.slice(0, 20));
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const closeForm = () => { setShowForm(false); };
  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setCustomCron(false); setError(""); setShowForm(true); };

  const openEdit = (sc) => {
    setForm({ name: sc.name, trigger_type: sc.trigger_type, cron_expression: sc.cron_expression || "0 9 * * *", task_ids: sc.task_ids || [], enabled: sc.enabled });
    setEditId(sc.id); setCustomCron(!CRON_PRESETS.find(p => p.value === sc.cron_expression)); setError(""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (form.trigger_type === "cron" && !form.cron_expression.trim()) { setError("Cron expression is required"); return; }
    if ((form.trigger_type === "folder_watch" || form.trigger_type === "file_watch") && !form.watch_path.trim()) { setError("Watch path is required"); return; }
    if (form.trigger_type === "email" && !form.imap_host.trim()) { setError("IMAP host is required"); return; }
    setSaving(true); setError("");
    try {
      if (editId) { await updateSchedule(editId, form); showToast("Schedule updated"); }
      else { await createSchedule(form); showToast("Schedule created"); }
      setShowForm(false); load();
    } catch (e) {
      console.error("Schedule save error:", e);
      setError(e.response?.data?.detail || e.message || "Error saving schedule");
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this schedule?")) return;
    await deleteSchedule(id); showToast("Schedule deleted"); load();
  };

  const handleToggle = async (sc) => { await updateSchedule(sc.id, { enabled: !sc.enabled }); load(); };
  const toggleTask = (taskId) => setForm(f => ({ ...f, task_ids: f.task_ids.includes(taskId) ? f.task_ids.filter(id => id !== taskId) : [...f.task_ids, taskId] }));

  const getTaskName = (id) => tasks.find(t => t.id === id)?.name || `Task #${id}`;

  // Compute next N fire times from a cron expression
  const getNextRuns = (scheduleList, count = 8) => {
    const upcoming = [];
    const now = new Date();
    scheduleList.filter(sc => sc.enabled && sc.trigger_type === "cron" && sc.cron_expression).forEach(sc => {
      const parts = sc.cron_expression.trim().split(" ");
      if (parts.length !== 5) return;
      const [min, hour] = parts;
      // Simple next-fire calculation for common patterns
      for (let offset = 1; offset <= 60 * 24; offset++) {
        const candidate = new Date(now.getTime() + offset * 60000);
        const m = candidate.getMinutes();
        const h = candidate.getHours();
        const minMatch = min === "*" || min.startsWith("*/") ? (min === "*" || m % parseInt(min.slice(2)) === 0) : parseInt(min) === m;
        const hourMatch = hour === "*" || parseInt(hour) === h;
        if (minMatch && hourMatch) {
          (sc.task_ids || []).forEach(tid => {
            upcoming.push({ time: candidate, taskId: tid, scheduleName: sc.name, scheduleId: sc.id });
          });
          break;
        }
      }
    });
    return upcoming.sort((a, b) => a.time - b.time).slice(0, count);
  };

  const upcomingRuns = getNextRuns(schedules);

  // Stats
  const enabled = schedules.filter(s => s.enabled).length;
  const successRuns = runs.filter(r => r.status === "completed").length;
  const failedRuns = runs.filter(r => r.status === "failed").length;
  const scheduledRuns = runs.filter(r => r.triggered_by === "scheduler");

  return (
    <div className="animate-up" style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Task Scheduler</h1>
          <p style={s.pageSub}>Orchestrate your autonomous workforce. Manage recurring triggers and monitor execution in real-time.</p>
        </div>
        <div style={s.headerActions}>
          <button style={s.exportBtn}>↑ Export Logs</button>
          <button className="btn-primary" style={s.newBtn} onClick={openCreate}>+ New Schedule</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={s.statsRow}>
        <StatCard icon="⚡" iconBg="#fef9c3" iconColor="#ca8a04" label="ACTIVE TRIGGERS" value={enabled} trend={`${schedules.length} total`} />
        <StatCard icon="✓" iconBg="#dcfce7" iconColor="#16a34a" label="SUCCESSFUL RUNS" value={successRuns} trend="Steady" trendOk />
        <StatCard icon="◉" iconBg="#eff6ff" iconColor="#3b82f6" label="SCHEDULED RUNS" value={scheduledRuns.length} trend="Queued" />
        <StatCard icon="▲" iconBg="#fef2f2" iconColor="#ef4444" label="FAILED ATTEMPTS" value={failedRuns} trend={failedRuns > 0 ? `-${failedRuns}` : "None"} trendBad={failedRuns > 0} />
      </div>

      {/* Main: Table + Queue */}
      <div style={s.mainLayout}>
        {/* Active Triggers Table */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>⚡ Active Triggers</span>
          </div>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>TRIGGER NAME</th>
                <th style={s.th}>TYPE</th>
                <th style={s.th}>FREQUENCY</th>
                <th style={s.th}>STATUS</th>
                <th style={{ ...s.th, textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={s.empty}>Loading...</td></tr>
              ) : schedules.length === 0 ? (
                <tr><td colSpan="5" style={s.empty}>No schedules yet. Create one to automate task execution.</td></tr>
              ) : schedules.map(sc => (
                <tr key={sc.id} style={s.tr}>
                  <td style={s.tdName}>
                    <div style={{ ...s.triggerIcon, background: sc.trigger_type === "cron" ? "#eff6ff" : "#f5f3ff", color: sc.trigger_type === "cron" ? "#3b82f6" : "#7c3aed" }}>
                      {TRIGGER_ICONS[sc.trigger_type]}
                    </div>
                    <div>
                      <div style={s.triggerName}>{sc.name}</div>
                      <div style={s.triggerSub}>
                        {(sc.task_ids || []).map(id => getTaskName(id)).join(", ") || "No tasks"}
                      </div>
                    </div>
                  </td>
                  <td style={s.tdCell}>
                    <span style={{ ...s.typePill, background: "#eff6ff", color: "#3b82f6" }}>
                      {sc.trigger_type === "cron" ? "Cron" : sc.trigger_type === "folder_watch" ? "Folder" : sc.trigger_type === "file_watch" ? "File" : "Email"}
                    </span>
                  </td>
                  <td style={{ ...s.tdCell, fontFamily: "monospace", fontSize: 12, color: "#475569" }}>
                    {sc.trigger_type === "cron" ? cronHuman(sc.cron_expression)
                      : sc.trigger_type === "folder_watch" ? (sc.watch_path || "—")
                      : sc.trigger_type === "file_watch" ? `${sc.watch_path || "—"} / ${sc.file_pattern || "*"}`
                      : sc.imap_user || "—"}
                  </td>
                  <td style={s.tdCell}>
                    <button
                      style={{ ...s.statusPill, background: sc.enabled ? "#dcfce7" : "#f3f4f6", color: sc.enabled ? "#15803d" : "#6b7280", cursor: "pointer", border: "none" }}
                      onClick={() => handleToggle(sc)}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.enabled ? "#16a34a" : "#9ca3af", display: "inline-block", marginRight: 5 }} />
                      {sc.enabled ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td style={{ ...s.tdCell, textAlign: "right" }}>
                    <button style={s.editBtn} onClick={() => openEdit(sc)}>Edit</button>
                    <button style={s.deleteBtn} onClick={() => handleDelete(sc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming Queue Sidebar */}
        <div style={s.queueCard}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>⏱ Upcoming</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>{upcomingRuns.length} queued</span>
          </div>
          {upcomingRuns.length === 0 ? (
            <div style={s.queueEmpty}>No active schedules. Enable a schedule to see upcoming runs.</div>
          ) : upcomingRuns.map((run, i) => {
            const mins = Math.round((run.time - new Date()) / 60000);
            return (
              <div key={i} style={s.queueItem}>
                <div style={s.queueTimeBadge}>
                  <div style={s.queueTimeVal}>{run.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
                  <div style={s.queueTimeIn}>in {mins}m</div>
                </div>
                <div style={s.queueBody}>
                  <div style={s.queueName}>{getTaskName(run.taskId)}</div>
                  <div style={s.queueMeta}>{run.scheduleName}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a56db", flexShrink: 0, marginTop: 4 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div style={s.logsSection}>
        <div style={s.cardTitle}>🕐 Recent Activity Logs</div>
        <div style={s.logsGrid}>
          {runs.filter(r => r.triggered_by === "scheduler").slice(0, 6).length === 0 ? (
            <div style={{ fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>No scheduled activity yet.</div>
          ) : runs.filter(r => r.triggered_by === "scheduler").slice(0, 6).map(run => (
            <div key={run.id} style={{ ...s.logCard, borderLeft: `4px solid ${run.status === "completed" ? "#16a34a" : run.status === "failed" ? "#ef4444" : "#f59e0b"}` }}>
              <div style={s.logHeader}>
                <span style={{ ...s.logTag, background: run.status === "completed" ? "#dcfce7" : run.status === "failed" ? "#fef2f2" : "#fef9c3", color: run.status === "completed" ? "#15803d" : run.status === "failed" ? "#dc2626" : "#92400e" }}>
                  {run.status.toUpperCase()}
                </span>
                <span style={s.logTime}>{new Date(run.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div style={s.logTitle}>{getTaskName(run.task_id)}</div>
              <div style={s.logMsg}>
                {run.status === "completed" ? "Finished successfully via scheduler." : run.status === "failed" ? "Execution failed. Check run logs." : "Currently running..."}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <Modal onClose={closeForm}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{editId ? "Edit Schedule" : "New Schedule"}</div>
              <button style={s.closeBtn} onClick={closeForm}>✕</button>
            </div>
            {error && <div style={s.errorMsg}>{error}</div>}
            <div style={s.field}>
              <label style={s.label}>SCHEDULE NAME</label>
              <input style={s.input} placeholder="e.g. Daily Research Run" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>TRIGGER TYPE</label>
              <div style={s.typeRow}>
                {[
                  { key: "cron",         label: "⏱ Cron" },
                  { key: "folder_watch", label: "📁 Folder Watch" },
                  { key: "file_watch",   label: "📄 File Watch" },
                  { key: "email",        label: "✉ Email" },
                ].map(t => (
                  <button key={t.key} style={{ ...s.typeBtn, ...(form.trigger_type === t.key ? s.typeBtnActive : {}) }}
                    onClick={() => setForm(f => ({ ...f, trigger_type: t.key }))}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {form.trigger_type === "cron" && (
              <div style={s.field}>
                <label style={s.label}>FREQUENCY</label>
                <select style={s.input} value={customCron ? "" : form.cron_expression} onChange={e => { if (e.target.value === "") { setCustomCron(true); setForm(f => ({ ...f, cron_expression: "" })); } else { setCustomCron(false); setForm(f => ({ ...f, cron_expression: e.target.value })); } }}>
                  {CRON_PRESETS.map(p => <option key={p.label} value={p.value}>{p.label}</option>)}
                </select>
                {customCron && <input style={{ ...s.input, marginTop: 8, fontFamily: "monospace" }} placeholder="e.g. 0 9 * * 1-5" value={form.cron_expression} onChange={e => setForm(f => ({ ...f, cron_expression: e.target.value }))} />}
                {form.cron_expression && <div style={s.cronPreview}>⏱ {cronHuman(form.cron_expression)}</div>}
              </div>
            )}

            {(form.trigger_type === "folder_watch" || form.trigger_type === "file_watch") && (
              <>
                <div style={s.field}>
                  <label style={s.label}>WATCH PATH</label>
                  <input style={s.input} placeholder="/app/uploads/watch" value={form.watch_path}
                    onChange={e => setForm(f => ({ ...f, watch_path: e.target.value }))} />
                  <div style={s.hint}>Directory to monitor for new files</div>
                </div>
                {form.trigger_type === "file_watch" && (
                  <div style={s.field}>
                    <label style={s.label}>FILE PATTERN</label>
                    <input style={s.input} placeholder="*.csv" value={form.file_pattern}
                      onChange={e => setForm(f => ({ ...f, file_pattern: e.target.value }))} />
                    <div style={s.hint}>e.g. *.csv, report_*.txt, * for all files</div>
                  </div>
                )}
              </>
            )}

            {form.trigger_type === "email" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12 }}>
                  <div style={s.field}>
                    <label style={s.label}>IMAP HOST</label>
                    <input style={s.input} placeholder="imap.gmail.com" value={form.imap_host}
                      onChange={e => setForm(f => ({ ...f, imap_host: e.target.value }))} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>PORT</label>
                    <input style={s.input} type="number" value={form.imap_port}
                      onChange={e => setForm(f => ({ ...f, imap_port: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>EMAIL ADDRESS</label>
                  <input style={s.input} placeholder="you@gmail.com" value={form.imap_user}
                    onChange={e => setForm(f => ({ ...f, imap_user: e.target.value }))} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>PASSWORD / APP PASSWORD</label>
                  <input style={s.input} type="password" placeholder="App password" value={form.imap_password}
                    onChange={e => setForm(f => ({ ...f, imap_password: e.target.value }))} />
                  <div style={s.hint}>For Gmail, use an App Password (not your main password)</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={s.field}>
                    <label style={s.label}>SUBJECT FILTER (optional)</label>
                    <input style={s.input} placeholder="New Report" value={form.subject_filter}
                      onChange={e => setForm(f => ({ ...f, subject_filter: e.target.value }))} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>SENDER FILTER (optional)</label>
                    <input style={s.input} placeholder="boss@company.com" value={form.sender_filter}
                      onChange={e => setForm(f => ({ ...f, sender_filter: e.target.value }))} />
                  </div>
                </div>
              </>
            )}
            <div style={s.field}>
              <label style={s.label}>TASKS TO RUN</label>
              {tasks.length === 0 ? <div style={{ fontSize: 12, color: "#94a3b8" }}>No tasks available.</div> : (
                <div style={s.taskList}>
                  {tasks.map(t => {
                    const selected = form.task_ids.includes(t.id);
                    return (
                      <div key={t.id} style={{ ...s.taskItem, ...(selected ? s.taskItemActive : {}) }} onClick={() => toggleTask(t.id)}>
                        <div style={{ ...s.taskCheck, background: selected ? "#6366f1" : "transparent", border: selected ? "none" : "2px solid #cbd5e1" }}>
                          {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        <div>
                          <div style={s.taskItemName}>{t.name}</div>
                          <div style={s.taskItemDesc}>{t.description?.slice(0, 60) || ""}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={s.enableRow}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Enabled</span>
              <button style={{ ...s.toggleBtn, background: form.enabled ? "#dcfce7" : "#f3f4f6", color: form.enabled ? "#15803d" : "#6b7280" }} onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}>
                {form.enabled ? "● On" : "○ Off"}
              </button>
            </div>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={closeForm}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Save Changes" : "Create Schedule"}</button>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#dcfce7" : "#fee2e2", color: toast.ok ? "#15803d" : "#dc2626" }}>
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, trend, trendOk, trendBad }) {
  return (
    <div style={s.statCard}>
      <div style={s.statTop}>
        <div style={{ ...s.statIcon, background: iconBg, color: iconColor }}>{icon}</div>
        <span style={{ ...s.statTrend, color: trendOk ? "#16a34a" : trendBad ? "#ef4444" : "#64748b", background: trendOk ? "#dcfce7" : trendBad ? "#fef2f2" : "#f1f5f9" }}>{trend}</span>
      </div>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statValue}>{value}</div>
    </div>
  );
}

const s = {
  page: { paddingBottom: 60 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: "var(--on-surface)", marginBottom: 6 },
  pageSub: { fontSize: 13, color: "var(--on-surface-variant)", maxWidth: 520 },
  headerActions: { display: "flex", gap: 10 },
  exportBtn: { background: "var(--surface-bright)", border: "1px solid var(--outline)", color: "var(--on-surface)", padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" },
  newBtn: { padding: "9px 20px", fontSize: 12 },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 },
  statCard: { background: "#fff", padding: "20px 22px", borderRadius: 14, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9" },
  statTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 },
  statTrend: { fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6 },
  statLabel: { fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.08em", marginBottom: 6 },
  statValue: { fontSize: 30, fontWeight: 800, color: "#0f172a" },

  mainLayout: { display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, marginBottom: 32 },

  tableCard: { background: "#fff", borderRadius: 14, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" },
  cardHeader: { padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9" },
  cardTitle: { fontSize: 15, fontWeight: 800, color: "#0f172a" },
  table: { width: "100%", borderCollapse: "collapse" },
  theadRow: { background: "#f8fafc" },
  th: { padding: "10px 16px", fontSize: 10, fontWeight: 800, color: "#64748b", textAlign: "left", letterSpacing: "0.06em", borderBottom: "1px solid #f1f5f9" },
  tr: { borderBottom: "1px solid #f8fafc", transition: "background 100ms" },
  tdName: { padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 },
  tdCell: { padding: "14px 16px", verticalAlign: "middle" },
  triggerIcon: { width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  triggerName: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  triggerSub: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  typePill: { fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 },
  statusPill: { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center" },
  editBtn: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#475569", marginRight: 6 },
  deleteBtn: { background: "transparent", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#ef4444" },
  empty: { padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 },

  queueCard: { background: "#fff", borderRadius: 14, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9", padding: "0 0 16px", display: "flex", flexDirection: "column" },
  queueEmpty: { padding: "24px 20px", fontSize: 12, color: "#94a3b8", textAlign: "center" },
  queueItem: { display: "flex", gap: 12, padding: "12px 20px", borderBottom: "1px solid #f8fafc", alignItems: "flex-start" },
  queueTimeBadge: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 },
  queueTimeVal: { fontSize: 13, fontWeight: 800, color: "#1a56db", lineHeight: 1.2 },
  queueTimeIn: { fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em" },
  queueBody: { flex: 1 },
  queueName: { fontSize: 12, fontWeight: 700, color: "#0f172a" },
  queueMeta: { marginTop: 2 },
  queueStatus: { fontSize: 10, fontWeight: 700 },
  viewPipelineBtn: { margin: "12px 20px 0", background: "none", border: "none", fontSize: 11, fontWeight: 800, color: "#6366f1", cursor: "pointer", letterSpacing: "0.04em", textAlign: "center" },

  logsSection: { marginTop: 4 },
  logsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16 },
  logCard: { background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 6px rgba(15,23,42,0.05)", border: "1px solid #f1f5f9" },
  logHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  logTag: { fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" },
  logTime: { fontSize: 10, color: "#94a3b8" },
  logTitle: { fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 },
  logMsg: { fontSize: 11, color: "#64748b", lineHeight: 1.5 },

  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.25)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 32 },
  modal: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", padding: 28, boxShadow: "0 25px 80px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", gap: 20 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  closeBtn: { background: "#f8fafc", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer", color: "#64748b" },
  errorMsg: { background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 12 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.08em" },
  input: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit" },
  cronPreview: { fontSize: 11, color: "#6366f1", fontWeight: 700, marginTop: 4 },
  hint: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  typeRow: { display: "flex", gap: 8 },
  typeBtn: { flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b" },
  typeBtnActive: { background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", fontWeight: 700 },
  taskList: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" },
  taskItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: "1px solid #e2e8f0", background: "#f8fafc" },
  taskItemActive: { background: "#eff6ff", border: "1px solid #bfdbfe" },
  taskCheck: { width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 },
  taskItemName: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  taskItemDesc: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  enableRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  toggleBtn: { border: "none", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid #f1f5f9" },
  cancelBtn: { background: "#f8fafc", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#64748b" },
  toast: { position: "fixed", bottom: 24, right: 24, padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 9999, border: "1px solid transparent" },
};
