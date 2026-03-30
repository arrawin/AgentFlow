import { useEffect, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

const FEATURE_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    ),
    title: "Agents",
    desc: "Create and configure AI agents with custom skills, tools, and LLM backends.",
    action: "/agents",
    label: "Manage Agents",
    accent: "#1a56db",
    bg: "#dbeafe",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12h6M12 9v6"/></svg>
    ),
    title: "Tasks",
    desc: "Build multi-agent workflows and run them on demand or on a schedule.",
    action: "/tasks",
    label: "Create Task",
    accent: "#ea6c00",
    bg: "#fff0e0",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    ),
    title: "Run History",
    desc: "Inspect execution traces, outputs, and generated files from every run.",
    action: "/runs",
    label: "View Runs",
    accent: "#059669",
    bg: "#d1fae5",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
    title: "Scheduler",
    desc: "Automate task execution with cron expressions or event-based triggers.",
    action: "/scheduler",
    label: "Set Schedule",
    accent: "#7c3aed",
    bg: "#ede9fe",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
    ),
    title: "Tools",
    desc: "Browse available tools — web search, file reader, file writer and more.",
    action: "/tools",
    label: "View Tools",
    accent: "#0891b2",
    bg: "#cffafe",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
    ),
    title: "LLM Settings",
    desc: "Connect Groq, OpenAI, Anthropic, Gemini or Ollama as your model backend.",
    action: "/llm-settings",
    label: "Configure LLM",
    accent: "#ea6c00",
    bg: "#fff0e0",
  },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [agents, setAgents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data)).catch(console.error);
    api.get("/agents").then((r) => setAgents(r.data)).catch(console.error);
  }, []);

  return (
    <div className="animate-up" style={s.container}>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.badge}>AI WORKFLOW PLATFORM</div>
        <h1 style={s.heroTitle}>
          Orchestrate <span style={s.accentBlue}>Intelligent</span> Agents,{" "}
          <span style={s.accentOrange}>Automate</span> Everything
        </h1>
        <p style={s.heroSub}>
          Build multi-agent workflows, run them on demand or on a schedule, and inspect every execution trace — all from one place.
        </p>
        <div style={s.heroActions}>
          <button className="btn-primary" onClick={() => navigate("/tasks")} style={s.ctaBtn}>
            Create a Task
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <button className="btn-secondary" onClick={() => navigate("/agents")} style={s.ctaBtn}>Add an Agent</button>
        </div>
      </section>

      {/* Feature Cards */}
      <section style={s.featureSection}>
        <div style={s.sectionLabel}>WHAT YOU CAN DO</div>
        <div style={s.featureGrid}>
          {FEATURE_CARDS.map((f) => (
            <FeatureCard key={f.title} {...f} onAction={() => navigate(f.action)} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={s.statsGrid}>
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>}
          iconBg="#eff6ff" iconColor="#3b82f6" label="Total Agents" value={data?.agents_count ?? "—"} />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          iconBg="#f0fdf4" iconColor="#16a34a" label="Active Tasks" value={data?.tasks_count ?? "—"} />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          iconBg="#f5f3ff" iconColor="#7c3aed" label="Schedules" value={data?.schedules_count ?? "—"} />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
          iconBg="#f0fdf4" iconColor="#059669" label="Success Rate" value={data?.success_rate ?? "—"} />
      </section>

      {/* Recent Runs */}
      <section style={s.recentSection}>
        <div style={s.recentHeader}>
          <div>
            <div style={s.sectionLabel}>RECENT RUNS</div>
          </div>
          <button style={s.viewAllBtn} onClick={() => navigate("/runs")}>View All →</button>
        </div>
        <div style={s.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>RUN ID</th>
                <th>TASK</th>
                <th>TRIGGERED BY</th>
                <th>STARTED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_runs?.length > 0 ? data.recent_runs.map(run => (
                <tr key={run.id}>
                  <td style={s.mono}>#{run.id}</td>
                  <td style={{ fontWeight: 600 }}>{run.task_name || `Task #${run.task_id}`}</td>
                  <td style={{ color: "var(--on-surface-variant)" }}>{run.triggered_by || "manual"}</td>
                  <td style={s.mono}>{new Date(run.started_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</td>
                  <td><StatusPill status={run.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={s.emptyRow}>No runs yet — create a task and run it</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIconWrap, background: iconBg, color: iconColor }}>{icon}</div>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statValue, color: iconColor }}>{value}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, label, accent, bg, onAction }) {
  return (
    <div style={s.fCard}>
      <div style={{ ...s.fIcon, background: bg, color: accent }}>{icon}</div>
      <div style={s.fTitle}>{title}</div>
      <div style={s.fDesc}>{desc}</div>
      <button style={{ ...s.fBtn, color: accent, borderColor: accent + "40", background: bg }} onClick={onAction}>
        {label} →
      </button>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    completed:   { label: "Completed",   cls: "status-success" },
    in_progress: { label: "In Progress", cls: "status-pending" },
    failed:      { label: "Failed",      cls: "status-failed" },
    not_started: { label: "Not Started", cls: "status-neutral" },
  };
  const { label, cls } = map[status] || { label: status, cls: "status-neutral" };
  return <span className={`status-pill ${cls}`}>{label}</span>;
}

const s = {
  container: { paddingBottom: 64 },

  hero: { padding: "56px 0 48px", textAlign: "center", maxWidth: 820, margin: "0 auto" },
  badge: { fontSize: 10, fontWeight: 800, color: "#1a56db", background: "#dbeafe", display: "inline-block", padding: "4px 12px", borderRadius: 99, marginBottom: 20, letterSpacing: "0.1em" },
  heroTitle: { fontSize: "2.8rem", fontWeight: 800, lineHeight: 1.15, marginBottom: 20, color: "var(--on-surface)" },
  accentBlue: { color: "#1a56db" },
  accentOrange: { color: "#ea6c00" },
  heroSub: { fontSize: "1rem", color: "var(--on-surface-variant)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 32px" },
  heroActions: { display: "flex", gap: 12, justifyContent: "center" },
  ctaBtn: { padding: "11px 24px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 },
  statCard: { background: "var(--surface-bright)", borderRadius: 14, padding: "20px 24px", boxShadow: "var(--ambient-shadow)", display: "flex", flexDirection: "column", gap: 8 },
  statIconWrap: { width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  statLabel: { fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)" },
  statValue: { fontSize: 30, fontWeight: 800 },

  featureSection: { marginBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.1em", marginBottom: 16 },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  fCard: { background: "var(--surface-bright)", borderRadius: 14, padding: 24, boxShadow: "var(--ambient-shadow)", display: "flex", flexDirection: "column", gap: 10 },
  fIcon: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  fTitle: { fontSize: 15, fontWeight: 800, color: "var(--on-surface)" },
  fDesc: { fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6, flex: 1 },
  fBtn: { alignSelf: "flex-start", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "1px solid", background: "transparent", marginTop: 4 },

  recentSection: { background: "var(--surface-bright)", borderRadius: 14, padding: 24, boxShadow: "var(--ambient-shadow)" },
  recentHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  viewAllBtn: { fontSize: 12, fontWeight: 700, color: "#1a56db", background: "transparent", border: "none", padding: 0 },
  tableWrap: {},
  mono: { fontFamily: "monospace", fontSize: 12, color: "var(--on-surface-variant)" },
  emptyRow: { textAlign: "center", color: "var(--on-surface-variant)", padding: "32px 0", fontSize: 13 },
};
