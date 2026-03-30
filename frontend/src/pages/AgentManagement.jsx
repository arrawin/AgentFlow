import { useEffect, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import { buildDomainColorMap, getAgentColor } from "../utils/colors";

export default function AgentManagement() {
  const [agents, setAgents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [activeDomain, setActiveDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const load = () =>
    Promise.all([api.get("/agents"), api.get("/domains")])
      .then(([a, d]) => { setAgents(a.data); setDomains(d.data); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });

  useEffect(() => { load(); }, []);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    try {
      const res = await api.post("/domains", { name: newDomain.trim() });
      setDomains(prev => [...prev, res.data]);
      setNewDomain(""); setShowDomainInput(false);
    } catch (e) { alert(e.response?.data?.detail || "Error creating domain"); }
  };

  const handleDelete = async (agentId) => {
    try {
      await api.delete(`/agents/${agentId}`);
      setAgents(prev => prev.filter(a => a.id !== agentId));
      showToast("Agent deleted");
    } catch (e) { showToast(e.response?.data?.detail || "Error deleting agent", false); }
  };

  const visibleDomains = domains.filter(d => d.name !== "SYSTEM");
  const domainColorMap = buildDomainColorMap(visibleDomains);
  const filteredAgents = (activeDomain ? agents.filter(a => a.domain_id === activeDomain) : agents).filter(a => !a.is_system);

  return (
    <div className="animate-up" style={s.container}>
      <div style={s.topBar}>
        <h1 style={s.pageTitle}>Agent Management</h1>
        <button className="btn-primary" onClick={() => navigate("/agents/create")}>+ Deploy Agent</button>
      </div>

      <div style={s.content}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sideHeader}>
            <span style={s.sideTitle}>Domains</span>
            <button style={s.addBtn} onClick={() => setShowDomainInput(v => !v)} title="Add domain">+</button>
          </div>

          {showDomainInput && (
            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <input style={s.domainInput} placeholder="Domain name" value={newDomain}
                onChange={e => setNewDomain(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddDomain()} autoFocus />
              <button style={s.domainAddBtn} onClick={handleAddDomain}>Add</button>
            </div>
          )}

          <div style={s.domainList}>
            <div style={{ ...s.domainItem, ...(activeDomain === null ? { background: "#f1f5f9", borderLeft: "3px solid #6366f1" } : {}) }}
              onClick={() => setActiveDomain(null)}>
              <div style={{ ...s.domainDot, background: "#6366f1" }} />
              <span style={s.domainName}>All Domains</span>
              <span style={s.domainCount}>{agents.filter(a => !a.is_system).length}</span>
            </div>
            {visibleDomains.map(d => {
              const color = domainColorMap[d.id];
              const count = agents.filter(a => a.domain_id === d.id && !a.is_system).length;
              const isActive = activeDomain === d.id;
              return (
                <div key={d.id}
                  style={{ ...s.domainItem, ...(isActive ? { background: color + "15", borderLeft: `3px solid ${color}` } : {}) }}
                  onClick={() => setActiveDomain(d.id)}>
                  <div style={{ ...s.domainDot, background: color }} />
                  <span style={s.domainName}>{d.name}</span>
                  <span style={s.domainCount}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* New domain prompt — light, clean */}
          <div style={s.newDomainCard}>
            <div style={s.newDomainIcon}>⊕</div>
            <div style={s.newDomainText}>Group agents by function — Sales, Research, Content, etc.</div>
            <button style={s.newDomainBtn} onClick={() => setShowDomainInput(true)}>+ New Domain</button>
          </div>
        </div>

        {/* Agent Grid */}
        <div style={s.main}>
          <p style={s.subtitle}>
            {activeDomain
              ? `${filteredAgents.length} agent(s) in ${domains.find(d => d.id === activeDomain)?.name}`
              : `${filteredAgents.length} agent(s) across all domains`}
          </p>
          <div style={s.grid}>
            {loading ? (
              <div style={s.empty}>Loading agents...</div>
            ) : (
              <>
                {filteredAgents.map(a => {
                  const color = getAgentColor(a, domainColorMap);
                  return (
                    <AgentCard key={a.id} agent={a} color={color}
                      domainName={domains.find(d => d.id === a.domain_id)?.name || "General"}
                      onManage={() => navigate(`/agents/edit/${a.id}`)}
                      onDelete={() => handleDelete(a.id)} />
                  );
                })}
                <div style={s.addCard} onClick={() => navigate("/agents/create")}>
                  <div style={s.addIcon}>+</div>
                  <div style={s.addTitle}>New Agent</div>
                  <p style={s.addText}>Define skills, tools, and LLM config</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#dcfce7" : "#fee2e2", color: toast.ok ? "#15803d" : "#dc2626" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent, color, domainName, onManage, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{ ...s.card, borderTop: `3px solid ${color}` }}>
      <div style={s.cardTop}>
        <div style={{ ...s.cardAvatar, background: color + "20", color }}>
          {agent.name[0]}
        </div>
        <span style={{ ...s.cardDomain, background: color + "15", color }}>{domainName}</span>
      </div>
      <div style={s.cardName}>{agent.name}</div>
      <div style={s.cardDesc}>{agent.skills?.slice(0, 80) || "No skills defined"}</div>
      <div style={s.cardFooter}>
        {confirming ? (
          <>
            <span style={{ fontSize: 11, color: "#64748b", flex: 1 }}>Delete agent?</span>
            <button style={s.confirmYes} onClick={() => { setConfirming(false); onDelete(); }}>Yes</button>
            <button style={s.confirmNo} onClick={() => setConfirming(false)}>No</button>
          </>
        ) : (
          <>
            <button style={{ ...s.manageBtn, background: color }} onClick={onManage}>Manage</button>
            <button style={s.deleteBtn} onClick={() => setConfirming(true)}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  container: { paddingBottom: 40 },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle: { fontSize: 26, fontWeight: 800, color: "var(--on-surface)" },

  content: { display: "grid", gridTemplateColumns: "240px 1fr", gap: 28, alignItems: "start" },

  sidebar: { background: "#fff", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(15,23,42,0.06)" },
  sideHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sideTitle: { fontSize: 13, fontWeight: 800, color: "#0f172a" },
  addBtn: { width: 24, height: 24, background: "#f1f5f9", borderRadius: 6, border: "none", fontSize: 16, fontWeight: 800, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  domainInput: { flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" },
  domainAddBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  domainList: { display: "flex", flexDirection: "column", gap: 3 },
  domainItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 150ms", borderLeft: "3px solid transparent" },
  domainDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  domainName: { flex: 1 },
  domainCount: { fontSize: 11, fontWeight: 700, color: "#94a3b8" },

  newDomainCard: { background: "#f8fafc", borderRadius: 12, padding: "16px", textAlign: "center", border: "1px dashed #e2e8f0", marginTop: 4 },
  newDomainIcon: { fontSize: 20, color: "#94a3b8", marginBottom: 8 },
  newDomainText: { fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 12 },
  newDomainBtn: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, color: "#475569", cursor: "pointer", width: "100%" },

  main: {},
  subtitle: { fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },

  card: { background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 10 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardAvatar: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 },
  cardDomain: { fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 20, letterSpacing: "0.04em" },
  cardName: { fontSize: 15, fontWeight: 800, color: "#0f172a" },
  cardDesc: { fontSize: 12, color: "#64748b", lineHeight: 1.5, flex: 1 },
  cardFooter: { display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid #f1f5f9", marginTop: "auto" },
  manageBtn: { flex: 1, color: "#fff", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  deleteBtn: { background: "transparent", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  confirmYes: { background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  confirmNo: { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" },

  addCard: { background: "transparent", border: "2px dashed #e2e8f0", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer", gap: 8 },
  addIcon: { width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  addTitle: { fontSize: 14, fontWeight: 800, color: "#0f172a" },
  addText: { fontSize: 11, color: "#94a3b8", lineHeight: 1.5 },

  empty: { padding: 40, textAlign: "center", color: "#94a3b8" },
  toast: { position: "fixed", bottom: 24, right: 24, padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 9999 },
};
