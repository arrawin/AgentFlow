import { useEffect, useState } from "react";
import api from "../api/client";

const TOOL_METADATA = {
  web_search:  { group: "WEB DISCOVERY", badge: "NETWORK",   badgeColor: "#64748b", badgeBg: "#f1f5f9", iconBg: "#d1fae5", iconColor: "#059669",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    desc: "Real-time web search and browsing via Tavily API" },
  file_reader: { group: "FILE SYSTEM",   badge: "ESSENTIAL", badgeColor: "#7c3aed", badgeBg: "#f5f3ff", iconBg: "#dbeafe", iconColor: "#3b82f6",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
    desc: "Read, write, and search across uploaded files and volumes" },
  file_search: { group: "FILE SYSTEM",   badge: "ESSENTIAL", badgeColor: "#7c3aed", badgeBg: "#f5f3ff", iconBg: "#dbeafe", iconColor: "#3b82f6",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
    desc: "Read, write, and search across uploaded files and volumes" },
  file_lines:  { group: "FILE SYSTEM",   badge: "ESSENTIAL", badgeColor: "#7c3aed", badgeBg: "#f5f3ff", iconBg: "#dbeafe", iconColor: "#3b82f6",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
    desc: "Read, write, and search across uploaded files and volumes" },
  file_writer: { group: "FILE SYSTEM",   badge: "ESSENTIAL", badgeColor: "#7c3aed", badgeBg: "#f5f3ff", iconBg: "#dbeafe", iconColor: "#3b82f6",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
    desc: "Read, write, and search across uploaded files and volumes" },
};

// Per-tool display names and descriptions
const TOOL_DISPLAY = {
  web_search:  { name: "Web Search",   desc: "Search the internet via Tavily" },
  file_reader: { name: "File Reader",  desc: "Read full file content" },
  file_search: { name: "File Search",  desc: "Search lines matching a query" },
  file_lines:  { name: "File Lines",   desc: "Read specific line ranges" },
  file_writer: { name: "File Writer",  desc: "Write output to a file" },
};

export default function ToolsManagement() {
  const [agents, setAgents] = useState([]);
  const [tools, setTools] = useState([]);
  const [permissions, setPermissions] = useState({});  // { agentId: Set of tool keys }
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // { msg, ok }
  const [saving, setSaving] = useState(null); // agentId being saved

  useEffect(() => {
    Promise.all([api.get("/agents"), api.get("/tools")])
      .then(([agentsRes, toolsRes]) => {
        setAgents(agentsRes.data.filter(a => !a.is_system));
        setTools(toolsRes.data);
        // Init permissions from agent.allowed_tools
        const perms = {};
        agentsRes.data.forEach(a => {
          perms[a.id] = new Set(a.allowed_tools || []);
        });
        setPermissions(perms);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const toggleTool = (agentId, toolKey) => {
    setPermissions(prev => {
      const updated = new Set(prev[agentId] || []);
      if (updated.has(toolKey)) updated.delete(toolKey);
      else updated.add(toolKey);
      return { ...prev, [agentId]: updated };
    });
  };

  const saveTools = async (agentId) => {
    setSaving(agentId);
    try {
      const allowed = Array.from(permissions[agentId] || []);
      await api.put(`/agents/${agentId}/tools`, { allowed_tools: allowed });
      showToast(`Tools saved for ${agents.find(a => a.id === agentId)?.name}`, true);
    } catch (e) {
      showToast(e.response?.data?.detail || "Error saving tools", false);
    } finally {
      setSaving(null);
    }
  };

  const showToast = (msg, ok) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Group tools by category
  const grouped = tools.reduce((acc, t) => {
    const g = TOOL_METADATA[t.key]?.group || "OTHER";
    if (!acc[g]) acc[g] = [];
    acc[g].push(t);
    return acc;
  }, {});

  return (
    <div className="animate-up" style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Tools Management</h1>
          <p style={s.pageSub}>Configure which tools each agent can access during task execution.</p>
        </div>
      </div>

      {/* Tool Category Cards */}
      <div style={s.categoryGrid}>
        {Object.entries(grouped).map(([group, groupTools]) => {
          const meta = TOOL_METADATA[groupTools[0]?.key] || {};
          return (
            <div key={group} style={s.categoryCard}>
              <div style={s.catCardTop}>
                <div style={{ ...s.catIconWrap, background: meta.iconBg, color: meta.iconColor }}>
                  {meta.icon}
                </div>
                <span style={{ ...s.catBadgePill, background: meta.badgeBg, color: meta.badgeColor }}>
                  {meta.badge || "TOOL"}
                </span>
              </div>
              <div style={s.catGroupName}>{group}</div>
              <div style={s.catGroupDesc}>{meta.desc}</div>
              <div style={s.catToolList}>
                {groupTools.map(t => (
                  <div key={t.key} style={s.catToolRow}>
                    <span style={s.catToolName}>{TOOL_DISPLAY[t.key]?.name || t.key}</span>
                    <div style={s.catToolDot} title="Available" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agents Tool Matrix */}
      <div style={s.matrixSection}>
        <div style={s.matrixHeader}>
          <div>
            <div style={s.sectionTitle}>Agent Tool Permissions</div>
            <div style={s.sectionSub}>Toggle tools per agent. Click Save to persist changes.</div>
          </div>
        </div>
        <div style={s.tableContainer}>
          <div style={s.tableWrap}>
            <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>AGENT</th>
                {tools.map(t => (
                  <th key={t.key} style={{ ...s.th, textAlign: "center" }}>{t.key}</th>
                ))}
                <th style={{ ...s.th, textAlign: "center" }}>STATUS</th>
                <th style={{ ...s.th, textAlign: "center" }}>SAVE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={tools.length + 3} style={s.emptyTd}>Loading agents...</td></tr>
              ) : agents.length === 0 ? (
                <tr><td colSpan={tools.length + 3} style={s.emptyTd}>No agents found. Create agents first.</td></tr>
              ) : agents.map(agent => {
                const agentTools = permissions[agent.id] || new Set();
                const hasAny = agentTools.size > 0;
                return (
                  <tr key={agent.id} style={s.tr}>
                    <td style={s.agentCell}>
                      <div style={s.agentDot}>{agent.name[0]}</div>
                      <div>
                        <div style={s.agentName}>{agent.name}</div>
                        <div style={s.agentMeta}>{agent.is_system ? "System" : "Custom"}</div>
                      </div>
                    </td>
                    {tools.map(t => (
                      <td key={t.key} style={{ textAlign: "center", padding: "12px 14px" }}>
                        <button style={s.permToggle} onClick={() => toggleTool(agent.id, t.key)}>
                          <div style={{
                            ...s.permDot,
                            background: agentTools.has(t.key) ? "var(--tertiary)" : "transparent",
                            border: agentTools.has(t.key) ? "none" : "2px solid var(--outline-variant)",
                          }}>
                            {agentTools.has(t.key) && (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>
                      </td>
                    ))}
                    <td style={{ textAlign: "center", padding: "12px 14px" }}>
                      <span style={{
                        ...s.statusPill,
                        background: hasAny ? "#dcfce7" : "#f3f4f6",
                        color: hasAny ? "#15803d" : "#6b7280",
                      }}>
                        {hasAny ? `${agentTools.size} TOOLS` : "NO TOOLS"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 14px" }}>
                      <button
                        style={{ ...s.saveBtn, opacity: saving === agent.id ? 0.6 : 1 }}
                        onClick={() => saveTools(agent.id)}
                        disabled={saving === agent.id}
                      >
                        {saving === agent.id ? "..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {tools.length > 4 && (
            <div style={s.scrollHint}>← scroll for more tools →</div>
          )}
        </div>
      </div>

      {/* Bottom: File Upload + Info */}
      <div style={s.bottomRow}>
        <FileUploadSection />
        <div style={s.infoCard}>
          <div style={s.infoIcon}>🔧</div>
          <div style={s.infoTitle}>How Tools Work</div>
          <p style={s.infoText}>
            Tools extend what agents can do during task execution. Assign tools to agents based on what they need to complete their tasks.
          </p>
          <ul style={s.infoList}>
            <li style={s.infoItem}><span style={s.infoCheck}>✓</span> web_search — searches the internet via Tavily</li>
            <li style={s.infoItem}><span style={s.infoCheck}>✓</span> file_reader — reads uploaded files</li>
            <li style={s.infoItem}><span style={s.infoCheck}>✓</span> file_search — searches within files</li>
            <li style={s.infoItem}><span style={s.infoCheck}>✓</span> file_lines — reads specific line ranges</li>
            <li style={s.infoItem}><span style={s.infoCheck}>✓</span> file_writer — writes output to a file for download</li>
          </ul>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#dcfce7" : "#fee2e2", color: toast.ok ? "#15803d" : "#dc2626", border: `1px solid ${toast.ok ? "#86efac" : "#fca5a5"}` }}>
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}
    </div>
  );
}

function FileUploadSection() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchFiles = () => api.get("/files").then(r => setFiles(r.data.files || [])).catch(() => {});

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg({ text: `✓ ${file.name} uploaded`, ok: true });
      fetchFiles();
    } catch {
      setMsg({ text: "✗ Upload failed", ok: false });
    } finally {
      setUploading(false);
      e.target.value = "";
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleDelete = async (filename) => {
    try {
      await api.delete(`/files/${filename}`);
      fetchFiles();
    } catch (e) {
      setMsg({ text: e.response?.data?.detail || "Delete failed", ok: false });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div style={s.uploadSection}>
      <div style={s.sectionTitle}>Uploaded Files</div>
      <div style={s.sectionSub}>Files here are accessible to agents via file tools during task execution.</div>

      <label style={s.uploadBtn}>
        {uploading ? "Uploading..." : "+ Upload File"}
        <input type="file" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
      </label>

      {msg && <div style={{ fontSize: 12, marginTop: 8, color: msg.ok ? "#15803d" : "#dc2626" }}>{msg.text}</div>}

      <div style={s.fileList}>
        {files.length === 0 ? (
          <div style={s.emptyFiles}>No files uploaded yet.</div>
        ) : files.map(f => (
          <div key={f} style={s.fileItem}>
            <span style={s.fileIcon}>📄</span>
            <span style={s.fileName}>{f}</span>
            <a href={`/api/files/download/${f}`} download={f} style={s.downloadBtn} title="Download">↓</a>
            <DeleteButton filename={f} onDelete={() => handleDelete(f)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DeleteButton({ filename, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>Delete?</span>
        <button style={db.yes} onClick={() => { setConfirming(false); onDelete(); }}>Yes</button>
        <button style={db.no} onClick={() => setConfirming(false)}>No</button>
      </div>
    );
  }

  return (
    <button style={db.x} onClick={() => setConfirming(true)} title="Delete file">✕</button>
  );
}

const db = {
  x:   { background: "transparent", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", fontSize: 13, padding: "0 4px", opacity: 0.6 },
  yes: { background: "var(--error-container)", color: "var(--error)", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  no:  { background: "var(--surface-container)", color: "var(--on-surface-variant)", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
};

const s = {
  page: { paddingBottom: 60, position: "relative" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  pageTitle: { fontSize: 26, fontWeight: 800, color: "var(--on-surface)", marginBottom: 6 },
  pageSub: { fontSize: 13, color: "var(--on-surface-variant)" },

  categoryGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 28 },
  categoryCard: { background: "#fff", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9" },
  catCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  catIconWrap: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" },
  catBadgePill: { fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em" },
  catGroupName: { fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 },
  catGroupDesc: { fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 16 },
  catToolList: { display: "flex", flexDirection: "column", gap: 10 },
  catToolRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc" },
  catToolName: { fontSize: 13, fontWeight: 600, color: "#334155" },
  catToolDot: { width: 10, height: 10, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b98166" },

  matrixSection: { background: "var(--surface-bright)", borderRadius: 14, padding: 24, boxShadow: "var(--ambient-shadow)", marginBottom: 28 },
  matrixHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 800, color: "var(--on-surface)", marginBottom: 4 },
  sectionSub: { fontSize: 12, color: "var(--on-surface-variant)" },
  tableContainer: { position: "relative" },
  tableWrap: { overflowX: "auto" },
  scrollHint: { textAlign: "center", fontSize: 11, color: "var(--on-surface-variant)", padding: "8px 0 0", opacity: 0.6 },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  theadRow: { background: "var(--surface-container-low)" },
  th: { padding: "10px 14px", fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--surface-container-low)", whiteSpace: "nowrap" },
  tr: { transition: "background 100ms" },
  agentCell: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", minWidth: 160 },
  agentDot: { width: 30, height: 30, borderRadius: 8, background: "var(--secondary-container)", color: "var(--on-secondary-container)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 },
  agentName: { fontSize: 13, fontWeight: 700, color: "var(--on-surface)" },
  agentMeta: { fontSize: 10, color: "var(--on-surface-variant)", marginTop: 1 },
  permToggle: { background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  permDot: { width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  statusPill: { fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em" },
  saveBtn: { background: "var(--secondary)", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  emptyTd: { padding: 40, textAlign: "center", color: "var(--on-surface-variant)" },

  bottomRow: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 },

  uploadSection: { background: "var(--surface-bright)", borderRadius: 14, padding: 24, boxShadow: "var(--ambient-shadow)" },
  uploadBtn: { display: "inline-block", background: "var(--secondary)", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 4 },
  fileList: { marginTop: 14, display: "flex", flexDirection: "column", gap: 6 },
  emptyFiles: { fontSize: 12, color: "var(--on-surface-variant)" },
  fileItem: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface-container-low)", borderRadius: 8, padding: "7px 12px" },
  fileIcon: { fontSize: 13 },
  fileName: { fontSize: 12, color: "var(--on-surface)", flex: 1 },
  deleteFileBtn: { background: "transparent", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", fontSize: 13, padding: "0 4px", lineHeight: 1, opacity: 0.6 },
  downloadBtn: { color: "var(--secondary)", fontSize: 14, fontWeight: 700, textDecoration: "none", padding: "0 4px", lineHeight: 1 },

  infoCard: { background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)", borderRadius: 14, padding: 24, color: "#fff" },
  infoIcon: { fontSize: 24, marginBottom: 12 },
  infoTitle: { fontSize: 15, fontWeight: 800, marginBottom: 10 },
  infoText: { fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: 16 },
  infoList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
  infoItem: { fontSize: 12, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "flex-start", gap: 8 },
  infoCheck: { color: "#34d399", fontWeight: 800, flexShrink: 0 },

  toast: {
    position: "fixed", bottom: 24, right: 24,
    padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
    boxShadow: "var(--shadow-md)", zIndex: 999,
    animation: "slideUp 200ms ease",
  },
};
