import { useEffect, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

const DOMAIN_ICONS = ["🎧", "📊", "⌨️", "✨", "🔬", "🛡️", "🧬", "🚀", "💡", "🤖"];

export default function AgentManagement() {
  const [agents, setAgents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [activeDomain, setActiveDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [showDomainInput, setShowDomainInput] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/agents"),
      api.get("/domains"),
    ]).then(([agentsRes, domainsRes]) => {
      setAgents(agentsRes.data);
      setDomains(domainsRes.data);
      setLoading(false);
    }).catch(e => { console.error(e); setLoading(false); });
  }, []);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    try {
      const res = await api.post("/domains", { name: newDomain.trim() });
      setDomains(prev => [...prev, res.data]);
      setNewDomain("");
      setShowDomainInput(false);
    } catch (e) {
      alert(e.response?.data?.detail || "Error creating domain");
    }
  };

  const filteredAgents = activeDomain
    ? agents.filter(a => a.domain_id === activeDomain)
    : agents;

  return (
    <div className="animate-up" style={s.container}>
      {/* Top Header Row */}
      <div style={s.topBar}>
        <div style={s.topLinks}>
           <a href="#" style={s.topLink}>Documentation</a>
           <a href="#" style={s.topLink}>API Reference</a>
           <a href="#" style={s.topLink}>Support</a>
        </div>
        <button className="btn-primary" style={s.deployBtn} onClick={() => navigate("/agents/create")}>Deploy Agent</button>
      </div>

      <div style={s.content}>
        {/* Left: Domains Sidebar */}
        <div style={s.domainSidebar}>
          <div style={s.domainHeader}>
            <span style={s.domainTitle}>Domains</span>
            <button style={s.addBtn} onClick={() => setShowDomainInput(v => !v)}>+</button>
          </div>

          {showDomainInput && (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--outline)", fontSize: 12, background: "var(--surface-bright)" }}
                placeholder="Domain name"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddDomain()}
                autoFocus
              />
              <button style={{ ...s.addBtn, width: "auto", padding: "0 10px", background: "var(--secondary)", color: "#fff" }} onClick={handleAddDomain}>Add</button>
            </div>
          )}

          <div style={s.domainList}>
            <div
              style={{ ...s.domainItem, ...(activeDomain === null ? s.domainItemActive : {}) }}
              onClick={() => setActiveDomain(null)}
            >
              <span>🌐</span>
              <span style={s.domainName}>All Domains</span>
              <span style={s.domainCount}>{agents.length} AGENTS</span>
            </div>
            {domains.map((d, i) => {
              const count = agents.filter(a => a.domain_id === d.id).length;
              return (
                <div
                  key={d.id}
                  style={{ ...s.domainItem, ...(activeDomain === d.id ? s.domainItemActive : {}) }}
                  onClick={() => setActiveDomain(d.id)}
                >
                  <span>{DOMAIN_ICONS[i % DOMAIN_ICONS.length]}</span>
                  <span style={s.domainName}>{d.name}</span>
                  <span style={s.domainCount}>{count} AGENTS</span>
                </div>
              );
            })}
          </div>

          <div style={s.infraCard}>
            <div style={s.infraTitle}>Expand Infrastructure</div>
            <p style={s.infraText}>Organize your AI workforce by creating targeted vertical domains.</p>
            <button style={s.infraBtn} onClick={() => setShowDomainInput(true)}>Create New Domain</button>
          </div>
        </div>

        {/* Right: Agent Grid */}
        <div style={s.main}>
          <div style={s.mainHeader}>
            <div>
              <h1 style={s.title}>Agent Management</h1>
              <p style={s.subtitle}>
                {activeDomain
                  ? `Viewing ${filteredAgents.length} agent(s) in ${domains.find(d => d.id === activeDomain)?.name}`
                  : `Viewing all ${agents.length} agent(s)`}
              </p>
            </div>
            <div style={s.mainActions}>
              <button className="btn-secondary">Filter</button>
              <button className="btn-secondary">Sort</button>
            </div>
          </div>

          <div style={s.grid}>
            {loading ? (
              <div style={s.empty}>Loading intelligence nodes...</div>
            ) : (
              <>
                {filteredAgents.map(a => (
                  <AgentCard
                    key={a.id}
                    name={a.name}
                    desc={a.skills?.slice(0, 80) || "No skills defined"}
                    status={a.is_system ? "SYSTEM" : "ACTIVE"}
                    statusColor={a.is_system ? "#6366f1" : "#10b981"}
                    tags={[domains.find(d => d.id === a.domain_id)?.name || "General"]}
                    icon="🤖"
                    onManage={() => navigate(`/agents/edit/${a.id}`)}
                  />
                ))}
                <div style={s.addItemCard} onClick={() => navigate("/agents/create")}>
                  <div style={s.addIcon}>+</div>
                  <div style={s.addTitle}>Add New Agent</div>
                  <p style={s.addText}>Define persona, skills, and deployment triggers for your next AI employee.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ name, desc, status, statusColor = "#10b981", tags, icon, onManage }) {
  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={s.cardIcon}>{icon}</div>
        <div style={{ ...s.cardStatus, color: statusColor, background: `${statusColor}15` }}>{status}</div>
      </div>
      <h3 style={s.cardName}>{name}</h3>
      <p style={s.cardDesc}>{desc}</p>
      <div style={s.tagRow}>
        {tags.map(t => <span key={t} style={s.tag}>{t}</span>)}
      </div>
      <div style={s.cardFooter}>
         <div style={s.miniAvatar}>AC</div>
         <button style={s.manageBtn} onClick={onManage}>Manage</button>
      </div>
    </div>
  );
}

const s = {
  container: { paddingBottom: 40 },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  topLinks: { display: "flex", gap: 24 },
  topLink: { fontSize: 12, fontWeight: 700, color: "var(--on-surface-variant)", textDecoration: "none" },
  deployBtn: { padding: "8px 20px" },
  content: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: 32,
    alignItems: "start",
  },
  domainSidebar: {
    background: "rgba(226, 232, 240, 0.4)",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  domainHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  domainTitle: { fontSize: 15, fontWeight: 800 },
  addBtn: { width: 24, height: 24, background: "var(--surface-container)", borderRadius: 6, border: "none", fontSize: 14, fontWeight: 800, color: "var(--on-surface-variant)", cursor: "pointer" },
  domainList: { display: "flex", flexDirection: "column", gap: 8 },
  domainItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 8,
    background: "transparent",
    color: "var(--on-surface-variant)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 150ms",
  },
  domainItemActive: {
    background: "var(--on-surface)",
    color: "#fff",
  },
  domainName: { flex: 1 },
  domainCount: { fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.15)" },
  infraCard: {
    marginTop: 20,
    background: "var(--on-surface)",
    borderRadius: 12,
    padding: "20px 16px",
    textAlign: "center",
  },
  infraTitle: { fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 8 },
  infraText: { fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 16 },
  infraBtn: { width: "100%", background: "#fff", color: "var(--on-surface)", padding: "8px", borderRadius: 6, fontSize: 11, fontWeight: 800 },
  main: {},
  mainHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 800, marginBottom: 4 },
  subtitle: { fontSize: 13, color: "var(--on-surface-variant)" },
  mainActions: { display: "flex", gap: 12 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
  },
  card: {
    background: "var(--surface-bright)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "var(--ambient-shadow)",
    display: "flex",
    flexDirection: "column",
  },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: 16 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, background: "var(--surface-container-low)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  cardStatus: { fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.05em" },
  cardName: { fontSize: 16, fontWeight: 800, marginBottom: 8 },
  cardDesc: { fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.5, marginBottom: 16 },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  tag: { fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "var(--surface-container-low)", color: "var(--on-surface-variant)" },
  cardFooter: { marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--surface-container-low)", paddingTop: 16 },
  miniAvatar: { width: 20, height: 20, borderRadius: "50%", background: "var(--surface-container)", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  manageBtn: { background: "var(--on-surface)", color: "#fff", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  addItemCard: {
    background: "transparent",
    border: "2px dashed var(--surface-container-high)",
    borderRadius: 16,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    cursor: "pointer",
  },
  addIcon: { width: 32, height: 32, borderRadius: "50%", background: "var(--surface-container-high)", color: "var(--on-surface-variant)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 16 },
  addTitle: { fontSize: 14, fontWeight: 800, color: "var(--on-surface)", marginBottom: 8 },
  addText: { fontSize: 11, color: "var(--on-surface-variant)", lineHeight: 1.5 },
  empty: { padding: 40, textAlign: "center", color: "var(--on-surface-variant)" },
};
