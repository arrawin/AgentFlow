import { useEffect, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

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
      {/* Hero Section */}
      <section style={s.hero}>
        <div style={s.heroContent}>
          <div style={s.badge}>PLATFORM LAUNCH V2.4</div>
          <h1 style={s.heroTitle}>
            The Future of <span style={s.accentText}>Autonomous</span> Workflows
          </h1>
          <p style={s.heroSub}>
            Deploy, monitor, and scale specialized AI agents with industrial-grade precision. 
            Orchestrate complex neural processes through a single unified command center.
          </p>
          <div style={s.heroActions}>
            <button className="btn-primary" onClick={() => navigate("/tasks")} style={s.ctaBtn}>
              Get Started 
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button className="btn-secondary" style={s.ctaBtnSec}>Documentation</button>
          </div>
        </div>
      </section>

      {/* System Command Section */}
      <section style={s.cmdSection}>
        <div style={s.cmdHeader}>
          <div>
            <h2 style={s.cmdTitle}>System Command</h2>
            <p style={s.cmdSub}>Monitoring 24 active neural processes across 4 clusters.</p>
          </div>
          <div style={s.cmdActions}>
            <button className="btn-ghost">Export Report</button>
            <button className="btn-primary" onClick={() => navigate("/tasks")}>+ New Workflow</button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={s.statsGrid}>
          <StatCard icon="👥" label="Total Agents" value={data?.agents_count ?? "0"} trend="+12%" up={true} />
          <StatCard icon="🚀" label="Active Tasks" value={data?.tasks_count ?? "0"} trend="Stable" up={null} />
          <StatCard icon="📅" label="Schedules" value={data?.schedules_count ?? "0"} trend="Active" up={true} />
          <StatCard icon="⚡" label="Success Rate" value={data?.success_rate ?? "100%"} trend="High" up={true} />
        </div>
      </section>

      {/* Two-Column Mid Section */}
      <section style={s.midSection}>
        {/* Left: Key Agents */}
        <div style={s.sideColumn}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Key Agents</span>
            <button style={s.viewAll} onClick={() => navigate("/agents")}>VIEW ALL</button>
          </div>
          <div style={s.agentList}>
            {agents.length > 0 ? agents.slice(0, 4).map(agent => (
              <AgentItem key={agent.id} name={agent.name} status={agent.is_system ? "System · Active" : "Active"} />
            )) : (
              <div style={s.emptySmall}>No agents found</div>
            )}
          </div>

          {/* Sidebar Alert */}
          <div style={s.alertCard}>
            <div style={s.alertTag}>OPTIMIZATION ALERT</div>
            <div style={s.alertTitle}>Your 'Neural Crawler' is 24% more efficient than last week.</div>
            <p style={s.alertText}>System suggests reallocating 2 vCPUs from idle workflows to further boost indexing speed.</p>
            <button style={s.alertBtn}>Apply Optimizer</button>
          </div>
        </div>

        {/* Right: Live Task Feed */}
        <div style={s.mainColumn}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Live Task Feed</span>
            <div style={s.liveStatus}>
              <div style={s.livePulse} />
              LIVE STREAMING
            </div>
          </div>
          <div style={s.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>WORKFLOW</th>
                  <th>AGENT NODE</th>
                  <th>OUTCOME</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_runs?.length > 0 ? data.recent_runs.map(run => (
                  <tr key={run.id}>
                    <td style={s.monoText}>{new Date(run.started_at).toLocaleTimeString([], { hour12: false })}</td>
                    <td style={s.boldText}>Task #{run.task_id}</td>
                    <td>{run.triggered_by || "AdminControl"}</td>
                    <td><StatusTag status={run.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={s.emptyTable}>No recent activity</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button style={s.loadMore}>Load More Activity ⌵</button>

          {/* Feature Card at Bottom of Main feed */}
          <div style={s.featureCard}>
             <div style={s.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 001 19.4a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
             </div>
             <div>
                <div style={s.featureLabel}>New Feature: Node Graph</div>
                <div style={s.featureText}>Visualize your agent interdependencies in real-time 3D environments.</div>
             </div>
             <button style={s.featureBtn}>Try Beta</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, trend, up }) {
  return (
    <div style={s.statCard}>
      <div style={s.statTop}>
        <div style={s.statIcon}>{icon}</div>
        <div style={{ ...s.trend, color: up === true ? "#059669" : up === false ? "#dc2626" : "var(--on-surface-variant)", background: up === true ? "#ecfdf5" : up === false ? "#fef2f2" : "#f1f5f9" }}>
          {trend}
        </div>
      </div>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statValue}>{value}</div>
    </div>
  );
}

function AgentItem({ name, status }) {
  return (
    <div style={s.agentItem}>
      <div style={s.agentAvatar} />
      <div>
        <div style={s.agentName}>{name}</div>
        <div style={s.agentStatus}>{status}</div>
      </div>
    </div>
  );
}

function PlaceholderRow({ time, workflow, node, status }) {
  return (
    <tr>
      <td style={s.monoText}>{time}</td>
      <td style={s.boldText}>{workflow}</td>
      <td>{node}</td>
      <td><StatusTag status={status.toLowerCase().replace(/ /g, "_")} /></td>
    </tr>
  );
}

function StatusTag({ status }) {
  const map = { success: "Success", processing: "Processing", timeout: "Timeout", failed: "Failed" };
  const className = `status-pill status-${["success", "processing", "timeout", "failed"].includes(status) ? (status === 'processing' ? 'pending' : (status === 'timeout' ? 'failed' : status)) : 'neutral'}`;
  return <span className={className}>{map[status] || status}</span>;
}

const s = {
  container: {
    paddingBottom: 64,
  },
  hero: {
    padding: "64px 0 80px 0",
    textAlign: "center",
    maxWidth: 900,
    margin: "0 auto",
  },
  badge: {
    fontSize: 10,
    fontWeight: 800,
    color: "var(--secondary)",
    background: "var(--secondary-container)",
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 99,
    marginBottom: 24,
    letterSpacing: "0.1em",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: 800,
    color: "var(--on-surface)",
    lineHeight: 1.1,
    marginBottom: 24,
  },
  accentText: {
    color: "transparent",
    backgroundImage: "linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
  },
  heroSub: {
    fontSize: "1.125rem",
    color: "var(--on-surface-variant)",
    lineHeight: 1.6,
    maxWidth: 680,
    margin: "0 auto 40px auto",
  },
  heroActions: {
    display: "flex",
    gap: 16,
    justifyContent: "center",
  },
  ctaBtn: {
    padding: "14px 28px",
    fontSize: 14,
    borderRadius: 12,
  },
  ctaBtnSec: {
    padding: "14px 28px",
    fontSize: 14,
    borderRadius: 12,
  },
  cmdSection: {
    marginBottom: 48,
  },
  cmdHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  cmdTitle: { fontSize: 22, fontWeight: 800 },
  cmdSub: { fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 },
  cmdActions: { display: "flex", gap: 12 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  statCard: {
    background: "var(--surface-bright)",
    padding: "24px",
    borderRadius: 16,
    boxShadow: "var(--ambient-shadow)",
  },
  statTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statIcon: { fontSize: 20 },
  trend: {
    fontSize: 10,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 8,
  },
  statLabel: { fontSize: 13, fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800, color: "var(--on-surface)" },
  midSection: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 24,
  },
  sideColumn: { display: "flex", flexDirection: "column", gap: 24 },
  mainColumn: {
    background: "var(--surface-bright)",
    borderRadius: 16,
    padding: 24,
    boxShadow: "var(--ambient-shadow)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: { fontSize: 15, fontWeight: 800 },
  viewAll: { fontSize: 11, fontWeight: 800, color: "var(--secondary)", background: "transparent", border: "none" },
  liveStatus: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 10,
    fontWeight: 800,
    color: "var(--on-surface-variant)",
    letterSpacing: "0.08em",
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#ef4444",
    boxShadow: "0 0 8px #ef4444",
  },
  agentList: {
    background: "var(--surface-bright)",
    borderRadius: 16,
    padding: "12px",
    boxShadow: "var(--ambient-shadow)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  agentItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px",
    borderRadius: 10,
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "var(--surface-container-low)",
  },
  agentName: { fontSize: 13, fontWeight: 700 },
  agentStatus: { fontSize: 11, color: "var(--on-surface-variant)" },
  alertCard: {
    background: "var(--primary-container)",
    padding: 24,
    borderRadius: 16,
    color: "#fff",
  },
  alertTag: { fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: 12 },
  alertTitle: { fontSize: 15, fontWeight: 800, marginBottom: 8, lineHeight: 1.3 },
  alertText: { fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 20 },
  alertBtn: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },
  tableWrap: { marginBottom: 16 },
  monoText: { fontFamily: "monospace", fontSize: 12, color: "var(--on-surface-variant)" },
  boldText: { fontWeight: 700 },
  loadMore: {
    width: "100%",
    background: "var(--surface-container-low)",
    color: "var(--on-surface-variant)",
    padding: "10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },
  featureCard: {
    marginTop: 24,
    background: "var(--surface-container-low)",
    padding: 20,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureLabel: { fontSize: 14, fontWeight: 800, color: "var(--on-surface)", marginBottom: 2 },
  featureText: { fontSize: 12, color: "var(--on-surface-variant)" },
  featureBtn: {
    marginLeft: "auto",
    padding: "8px 16px",
    background: "var(--secondary)",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12,
  },
};
