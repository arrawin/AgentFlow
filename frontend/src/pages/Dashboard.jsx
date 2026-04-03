import { useEffect, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

const GUIDE_STEPS = [
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>, title: "Agents", desc: "Configure specialists and tool access behind each workflow.", path: "/agents", accent: "#6366f1", bg: "#eff6ff" },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>, title: "Tools", desc: "Assign web search, file access, and other capabilities.", path: "/tools", accent: "#0891b2", bg: "#ecfeff" },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12h6M12 9v6"/></svg>, title: "Tasks", desc: "Define task briefs and arrange multi-agent workflows.", path: "/tasks", accent: "#ea6c00", bg: "#fff7ed" },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, title: "Scheduler", desc: "Automate recurring tasks with cron triggers.", path: "/scheduler", accent: "#7c3aed", bg: "#f5f3ff" },
];

const SC = { completed: { color: "#16a34a", bg: "#dcfce7" }, failed: { color: "#ef4444", bg: "#fef2f2" }, in_progress: { color: "#f59e0b", bg: "#fef9c3" }, not_started: { color: "#94a3b8", bg: "#f1f5f9" } };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.get("/dashboard").then(r => setData(r.data)).catch(console.error); }, []);
  const latestRun = data?.recent_runs?.[0];
  const recentRuns = data?.recent_runs || [];

  return (
    <div className="animate-up" style={s.container}>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroAccent} />
        <div style={s.heroLeft}>
          <div style={s.heroContentWrap}>
            <div style={s.heroLabel}>OPERATIONS OVERVIEW</div>
            <h1 style={s.heroTitle}>A calmer command center for agents and tasks.</h1>
            <p style={s.heroSub}>Build multi-agent workflows, run them on demand or on a schedule, and inspect every execution trace with precision.</p>
            <div style={s.heroActions}>
              <button className="btn-primary" style={s.ctaBtnPrimary} onClick={() => navigate("/tasks")}>Create Task</button>
              <button className="btn-secondary" style={s.ctaBtnSecondary} onClick={() => navigate("/runs")}>Review Recent Runs</button>
            </div>
          </div>
        </div>
        <div style={s.heroRight}>
          <div style={s.focusCard}>
            <div style={s.focusLabel}>Focus Today</div>
            <div style={s.focusValue}>{data?.tasks_count ?? "0"} active tasks</div>
            <div style={s.focusHint}>Pair task setup with agents first, then move into canvas refinement only when sequence details matter.</div>
          </div>
          <div style={s.miniStats}>
            {[
              { label: "Agents",    value: data?.agents_count,    color: "#4f46e5", bg: "#f5f3ff" },
              { label: "Schedules", value: data?.schedules_count, color: "#7c3aed", bg: "#f5f3ff" },
              { label: "Runs",      value: recentRuns.length,     color: "#0891b2", bg: "#ecfeff" },
              { label: "Success",   value: data?.success_rate,    color: "#16a34a", bg: "#dcfce7" },
            ].map(stat => (
              <div key={stat.label} style={{ ...s.miniStat, background: stat.bg }}>
                <div style={{ ...s.miniStatLabel, color: stat.color }}>{stat.label}</div>
                <div style={{ ...s.miniStatValue, color: stat.color }}>{stat.value ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guide + Latest Activity */}
      <section style={s.midSection}>
        <div style={s.guideSection}>
          <div style={s.sectionHeader}>
            <div style={s.sectionLabel}>START HERE</div>
            <h2 style={s.sectionTitle}>Guided Sequence</h2>
          </div>
          <div style={s.guideGrid}>
            {GUIDE_STEPS.map(step => (
              <div key={step.title} style={s.guideCard} onClick={() => navigate(step.path)}>
                <div style={{ ...s.guideIcon, background: step.bg, color: step.accent }}>{step.icon}</div>
                <div>
                  <div style={{ ...s.guideCardTitle, color: step.accent }}>{step.title}</div>
                  <div style={s.guideCardDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.activitySection}>
          <div style={s.sectionHeader}>
            <div style={s.sectionLabel}>&nbsp;</div>
            <h2 style={s.sectionTitle}>Latest Activity</h2>
          </div>
          <div style={s.activityCard}>
            {recentRuns.length === 0 ? (
              <>
                <div style={s.activityTitle}>No runs yet</div>
                <div style={s.activityMeta}>Create a task and run it to see activity here.</div>
                <button style={s.activityBtn} onClick={() => navigate("/tasks")}>Create a Task</button>
              </>
            ) : (
              <>
                {recentRuns.slice(0, 3).map((run, i) => {
                  const sc = SC[run.status] || SC.not_started;
                  // Remove border from the very last item if there's no button, 
                  // but here we always have a button so it looks better with a separator.
                  return (
                    <div key={run.id} style={s.activityItem}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={s.activityTitle}>{run.task_name || `Task #${run.task_id}`}</div>
                        <span style={{ ...s.statusPill, background: sc.bg, color: sc.color, fontSize: 10 }}>{run.status}</span>
                      </div>
                      <div style={s.activityMeta}>{new Date(run.started_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div>
                    </div>
                  );
                })}
                <button style={s.activityBtn} onClick={() => navigate("/runs")}>Open Run History</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Recent Runs Table */}
      <section style={s.tableSection}>
        <div style={s.tableHeader}>
          <div>
            <div style={s.sectionLabel}>EXECUTION LOGS</div>
            <h2 style={s.sectionTitle}>Recent Task Runs</h2>
          </div>
          <button style={s.viewAllBtn} onClick={() => navigate("/runs")}>View All Runs →</button>
        </div>
        <table style={s.table}>
          <thead>
            <tr style={s.theadRow}>
              {["RUN ID","TASK","TRIGGER","STARTED","STATUS"].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {recentRuns.length > 0 ? recentRuns.map(run => {
              const sc = SC[run.status] || SC.not_started;
              return (
                <tr key={run.id} style={s.tr}>
                  <td style={s.tdMono}>#{run.id}</td>
                  <td style={s.tdName}>{run.task_name || `Task #${run.task_id}`}</td>
                  <td style={s.tdMeta}>{
                    (() => {
                      const tb = run.triggered_by;
                      if (!tb || tb === "manual") return "Manual";
                      if (tb === "scheduler") return "Scheduled (Cron)";
                      if (tb.startsWith("trigger:")) {
                        const type = tb.split(":")[1];
                        return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + " Event";
                      }
                      return tb;
                    })()
                  }</td>
                  <td style={s.tdMeta}>{new Date(run.started_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</td>
                  <td><span style={{ ...s.statusPill, background: sc.bg, color: sc.color }}>{run.status}</span></td>
                </tr>
              );
            }) : (
              <tr><td colSpan="5" style={s.emptyRow}>No runs yet — create a task and run it</td></tr>
            )}
          </tbody>
        </table>
      </section>

    </div>
  );
}

const s = {
  container: { paddingBottom: 80, maxWidth: 1400, margin: "0 auto" },
  hero: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, marginBottom: 48, background: "var(--surface-bright)", borderRadius: 24, padding: "48px 56px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden", minHeight: 380 },
  heroAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, #6366f1 0%, #0891b2 35%, #ea6c00 65%, #7c3aed 100%)" },
  heroLeft: { display: "flex", flexDirection: "column", justifyContent: "center" },
  heroContentWrap: { display: "flex", flexDirection: "column", gap: 20 },
  heroLabel: { fontSize: 12, fontWeight: 800, color: "#4f46e5", letterSpacing: "0.15em", fontFamily: "Manrope" },
  heroTitle: { fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.15, color: "var(--on-surface)", margin: 0, fontFamily: "Manrope", letterSpacing: "-0.02em" },
  heroSub: { fontSize: 16, color: "var(--on-surface-variant)", lineHeight: 1.6, margin: 0, maxWidth: 500 },
  heroActions: { display: "flex", gap: 16, marginTop: 12 },
  ctaBtnPrimary: { padding: "14px 28px", fontSize: 15, fontWeight: 700, borderRadius: 12, background: "linear-gradient(135deg, #131b2e 0%, #000000 100%)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  ctaBtnSecondary: { padding: "14px 28px", fontSize: 15, fontWeight: 700, borderRadius: 12, background: "#fff", color: "var(--on-surface)", border: "1px solid var(--outline)", cursor: "pointer" },
  heroRight: { display: "flex", flexDirection: "column", gap: 16 },
  focusCard: { background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)", borderRadius: 20, padding: "24px 28px", boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.3)" },
  focusLabel: { fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" },
  focusValue: { fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 10, fontFamily: "Manrope" },
  focusHint: { fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 },
  miniStats: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  miniStat: { borderRadius: 16, padding: "16px 20px" },
  miniStatLabel: { fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  miniStatValue: { fontSize: 22, fontWeight: 800, fontFamily: "Manrope" },
  midSection: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32, marginBottom: 48, alignItems: "stretch" },
  sectionHeader: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" },
  sectionTitle: { fontSize: 24, fontWeight: 800, color: "var(--on-surface)", margin: 0, fontFamily: "Manrope" },
  guideSection: { display: "flex", flexDirection: "column" },
  guideGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  guideCard: { background: "var(--surface-bright)", borderRadius: 16, padding: 24, boxShadow: "var(--ambient-shadow)", cursor: "pointer", transition: "all 200ms ease", display: "flex", alignItems: "flex-start", gap: 18, border: "1px solid transparent", height: "100%" },
  guideIcon: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  guideCardTitle: { fontSize: 18, fontWeight: 800, marginBottom: 6, fontFamily: "Manrope" },
  guideCardDesc: { fontSize: 13, color: "var(--on-surface-variant)", lineHeight: 1.5 },
  activitySection: { display: "flex", flexDirection: "column" },
  activityCard: { background: "var(--surface-bright)", borderRadius: 16, padding: "28px 24px", boxShadow: "var(--ambient-shadow)", display: "flex", flexDirection: "column", height: "100%" },
  activityItem: { display: "flex", flexDirection: "column", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #f1f5f9" },
  activityTitle: { fontSize: 14, fontWeight: 700, color: "var(--on-surface)", fontFamily: "Manrope" },
  activityMeta: { fontSize: 12, color: "var(--on-surface-variant)", marginTop: 2 },
  activityBtn: { alignSelf: "stretch", textAlign: "center", marginTop: "auto", background: "var(--surface-container-low)", border: "1px solid var(--outline)", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "var(--on-surface)", cursor: "pointer", transition: "all 150ms" },
  tableSection: { background: "var(--surface-bright)", borderRadius: 20, boxShadow: "var(--ambient-shadow)", overflow: "hidden", padding: "4px" },
  tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "32px 32px 24px" },
  viewAllBtn: { fontSize: 14, fontWeight: 700, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer", padding: "8px 0" },
  table: { width: "100%", borderCollapse: "collapse" },
  theadRow: { background: "var(--surface-container-low)" },
  th: { padding: "16px 32px", fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", textAlign: "left", letterSpacing: "0.1em", textTransform: "uppercase" },
  tr: { borderBottom: "1px solid var(--surface-container-low)", transition: "background 150ms" },
  tdMono: { padding: "20px 32px", fontFamily: "monospace", fontSize: 14, color: "#4f46e5", fontWeight: 700 },
  tdName: { padding: "20px 32px", fontSize: 15, fontWeight: 600, color: "var(--on-surface)" },
  tdMeta: { padding: "20px 32px", fontSize: 14, color: "var(--on-surface-variant)" },
  statusPill: { fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99, display: "inline-block", textTransform: "uppercase", letterSpacing: "0.02em" },
  emptyRow: { textAlign: "center", color: "var(--on-surface-variant)", padding: "48px 0", fontSize: 15 },
};

