import { useEffect, useState } from "react";
import api from "../api/client";
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from "../api/schedules";
import { getTasks } from "../api/tasks";

export default function Scheduler() {
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSchedules(), getTasks(), api.get("/dashboard")]).then(([s, t, d]) => {
      setSchedules(s);
      setTasks(t);
      setStats(d.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="animate-up" style={s.container}>
      {/* Page Header */}
      <div style={s.header}>
        <div style={s.headerRow}>
          <div>
            <h1 style={s.title}>Task Scheduler</h1>
            <p style={s.subtitle}>Configure automated execution triggers for long-running AI workflows.</p>
          </div>
          <div style={s.actions}>
             <button className="btn-secondary">Pause All</button>
             <button className="btn-primary">+ Add Trigger</button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={s.statsGrid}>
        <SchedStat label="Total Active" value={schedules.length || "0"} subLabel={`${schedules.filter(s => s.enabled).length} Enabled`} />
        <SchedStat label="Tasks" value={tasks.length || "0"} subLabel="Configured Workflows" />
        <SchedStat label="Last Run" value={stats?.recent_runs?.[0] ? new Date(stats.recent_runs[0].started_at).toLocaleTimeString() : "N/A"} subLabel={stats?.recent_runs?.[0] ? `Task #${stats.recent_runs[0].task_id}` : "No runs yet"} />
        <SchedStat label="Run Status" value={stats?.recent_runs?.[0]?.status || "Idle"} subLabel="System Monitor" />
      </div>

      {/* Main Layout: Table + Queue */}
      <div style={s.content}>
        {/* Active Triggers Table */}
        <div style={s.mainTable}>
          <div style={s.cardHeader}>
             <span style={s.cardTitle}>Active Triggers</span>
             <button style={s.viewBtn}>Manage List ⌔</button>
          </div>
          <div style={s.tableWrap}>
            <table style={s.table}>
               <thead>
                  <tr>
                     <th style={s.th}>TRIGGER NAME</th>
                     <th style={s.th}>FREQUENCY</th>
                     <th style={s.th}>NEXT RUN</th>
                     <th style={s.th}>STATUS</th>
                     <th style={s.th}>ACTIONS</th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={s.empty}>Loading active triggers...</td></tr>
                  ) : schedules.length === 0 ? (
                    <tr><td colSpan="5" style={s.empty}>No schedules yet. Create one above.</td></tr>
                  ) : schedules.map(sc => (
                    <TriggerRow key={sc.id} name={sc.name} cron={sc.cron_expression || "—"} next="—" status={sc.enabled ? "Active" : "Paused"} isChecked={sc.enabled} />
                  ))}
               </tbody>
            </table>
          </div>
        </div>

        {/* Queue Sidebar */}
        <div style={s.queueSidebar}>
          <div style={s.cardHeader}>
             <span style={s.cardTitle}>Execution Queue</span>
             <span style={s.queueCount}>4 PENDING</span>
          </div>
          <div style={s.queueList}>
             {stats?.recent_runs?.filter(r => r.status === 'in_progress' || r.status === 'not_started').length > 0 ? (
               stats.recent_runs.filter(r => r.status === 'in_progress' || r.status === 'not_started').map(run => (
                 <QueueItem key={run.id} name={`Task #${run.task_id}`} time={new Date(run.started_at).toLocaleTimeString()} type={run.triggered_by} />
               ))
             ) : (
               <div style={s.emptyQueue}>Queue is empty</div>
             )}
          </div>
          <button style={s.queueBtn}>View Full Queue ›</button>
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div style={s.logsSection}>
         <div style={s.cardHeader}>
            <span style={s.cardTitle}>Recent Activity Logs</span>
         </div>
         <div style={s.logsGrid}>
            {stats?.recent_runs?.length > 0 ? stats.recent_runs.map(run => (
              <LogCard 
                key={run.id} 
                border={run.status === 'completed' ? 'var(--tertiary)' : run.status === 'failed' ? 'var(--error)' : 'var(--secondary)'} 
                title={run.status.toUpperCase()} 
                msg={`Task #${run.task_id} ${run.status === 'completed' ? 'finished successfully' : run.status === 'failed' ? 'failed execution' : 'is currently running'}. triggered by ${run.triggered_by}.`} 
                time={new Date(run.started_at).toLocaleTimeString()} 
              />
            )) : (
              <div style={s.empty}>No activity logs yet.</div>
            )}
         </div>
      </div>
    </div>
  );
}

function SchedStat({ label, value, subLabel }) {
  return (
    <div style={s.statCard}>
       <div style={s.statLabel}>{label}</div>
       <div style={s.statValue}>{value}</div>
       <div style={s.statSub}>{subLabel}</div>
    </div>
  );
}

function TriggerRow({ name, cron, next, status, isChecked }) {
  return (
    <tr style={s.tr}>
       <td>
          <div style={s.triggerCell}>
             <input type="checkbox" checked={isChecked} readOnly style={s.checkbox} />
             <span style={s.triggerName}>{name}</span>
          </div>
       </td>
       <td style={s.monoText}>{cron}</td>
       <td style={s.monoText}>{next}</td>
       <td>
          <span style={{ ...s.statusTag, background: status === 'Active' ? 'var(--tertiary-container)' : 'var(--surface-container-low)', color: status === 'Active' ? 'var(--on-tertiary-container)' : 'var(--on-surface-variant)' }}>
             {status}
          </span>
       </td>
       <td>
          <button style={s.iconBtn}>⚙️</button>
       </td>
    </tr>
  );
}

function QueueItem({ name, time, type }) {
  return (
    <div style={s.queueItem}>
       <div style={s.queueTop}>
          <span style={s.queueName}>{name}</span>
          <span style={s.queueTime}>{time}</span>
       </div>
       <div style={s.queueType}>{type}</div>
    </div>
  );
}

function LogCard({ border, title, msg, time }) {
  return (
    <div style={{ ...s.logCard, borderLeft: `4px solid ${border}` }}>
       <div style={s.logHeader}>
          <span style={{ ...s.logTitle, color: border }}>{title}</span>
          <span style={s.logTime}>{time}</span>
       </div>
       <p style={s.logMsg}>{msg}</p>
    </div>
  );
}

const s = {
  container: { paddingBottom: 60 },
  header: { marginBottom: 32 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  title: { fontSize: 24, fontWeight: 800 },
  subtitle: { fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 },
  actions: { display: "flex", gap: 12 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 },
  statCard: { background: "var(--surface-bright)", padding: "24px", borderRadius: 16, boxShadow: "var(--ambient-shadow)" },
  statLabel: { fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 800, color: "var(--on-surface)", marginBottom: 8 },
  statSub: { fontSize: 11, color: "var(--on-surface-variant)" },
  content: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 32, marginBottom: 40 },
  mainTable: { background: "var(--surface-bright)", borderRadius: 16, padding: 24, boxShadow: "var(--ambient-shadow)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: 800 },
  viewBtn: { background: "none", border: "none", fontSize: 12, fontWeight: 800, color: "var(--on-surface-variant)", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: { padding: "12px 16px", fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", textTransform: "uppercase", borderBottom: "1px solid var(--surface-container-low)", textAlign: "left" },
  tr: { transition: "background 150ms" },
  triggerCell: { display: "flex", alignItems: "center", gap: 12 },
  checkbox: { width: 14, height: 14 },
  triggerName: { fontSize: 13, fontWeight: 700 },
  monoText: { fontFamily: "monospace", fontSize: 12, color: "var(--on-surface-variant)" },
  statusTag: { padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800 },
  iconBtn: { padding: "6px", background: "none", border: "none", fontSize: 14, cursor: "pointer", opacity: 0.5 },
  queueSidebar: { background: "var(--surface-bright)", borderRadius: 16, padding: 24, boxShadow: "var(--ambient-shadow)", height: "fit-content" },
  queueCount: { fontSize: 9, fontWeight: 900, background: "var(--secondary-container)", color: "var(--on-secondary-container)", padding: "2px 8px", borderRadius: 4 },
  queueList: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 },
  queueItem: { borderBottom: "1px solid var(--surface-container-low)", paddingBottom: 16 },
  queueTop: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  queueName: { fontSize: 13, fontWeight: 700 },
  queueTime: { fontSize: 11, color: "var(--secondary)", fontWeight: 800 },
  queueType: { fontSize: 10, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.05em" },
  queueBtn: { width: "100%", padding: "12px", borderRadius: 10, background: "var(--surface-container-low)", border: "none", fontSize: 12, fontWeight: 800, color: "var(--on-surface-variant)" },
  logsSection: { },
  logsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  logCard: { background: "var(--surface-bright)", padding: 20, borderRadius: 12, boxShadow: "var(--shadow-sm)" },
  logHeader: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  logTitle: { fontSize: 12, fontWeight: 800, textTransform: "uppercase" },
  logTime: { fontSize: 10, color: "var(--on-surface-variant)" },
  logMsg: { fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.5 },
  empty: { padding: "40px", textAlign: "center", color: "var(--on-surface-variant)" },
   emptyQueue: { padding: "20px 0", textAlign: "center", color: "var(--on-surface-variant)", fontSize: 13 },
};
