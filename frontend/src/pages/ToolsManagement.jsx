import { useEffect, useState } from "react";
import api from "../api/client";

const TOOL_INFO = {
  web_search:  { label: "Web Search",  desc: "Search the internet via Tavily API",        color: "#059669", bg: "#d1fae5", group: "Network"     },
  file_reader: { label: "File Reader", desc: "Read full content of uploaded files",        color: "#1a56db", bg: "#dbeafe", group: "File System" },
  file_search: { label: "File Search", desc: "Search lines matching a query in a file",   color: "#1a56db", bg: "#dbeafe", group: "File System" },
  file_lines:  { label: "File Lines",  desc: "Read a specific line range from a file",    color: "#1a56db", bg: "#dbeafe", group: "File System" },
  file_writer: { label: "File Writer", desc: "Write output to a downloadable file",       color: "#ea6c00", bg: "#fff0e0", group: "File System" },
  run_python:  { label: "Run Python",  desc: "Execute Python code in a sandbox container",color: "#7c3aed", bg: "#ede9fe", group: "Code Execution" },
};

const TOOL_GROUPS = {
  "FILE SYSTEM": { color: "#1a56db", tools: ["file_reader", "file_writer", "file_search", "file_lines"] },
  "NETWORK":     { color: "#059669", tools: ["web_search"] },
  "CODE":        { color: "#7c3aed", tools: ["run_python"] },
};

const AVATAR_COLORS = ["#ea6c00", "#1a56db", "#059669", "#7c3aed", "#0891b2", "#dc2626"];

function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ToolsManagement() {
  const [agents, setAgents] = useState([]);
  const [tools, setTools] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [toast, setToast] = useState(null);
  const [agentSearch, setAgentSearch] = useState("");
  const [toolFilter, setToolFilter] = useState("");
  const [page, setPage] = useState(1);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const PAGE_SIZE = 8;

  const toggleGroup = (group) => setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));

  useEffect(() => {
    Promise.all([api.get("/agents"), api.get("/tools")])
      .then(([ar, tr]) => {
        const nonSystem = ar.data.filter(a => !a.is_system);
        setAgents(nonSystem);
        setTools(tr.data);
        const perms = {};
        nonSystem.forEach(a => { perms[a.id] = new Set(a.allowed_tools || []); });
        setPermissions(perms);
      })
      .catch(console.error);
  }, []);

  const toggleSandbox = async (toolKey, currentSandboxed) => {
    try {
      await api.patch(`/tools/${toolKey}/sandbox`, { sandboxed: !currentSandboxed });
      setTools(prev => prev.map(t => t.key === toolKey ? { ...t, sandboxed: !currentSandboxed } : t));
    } catch (e) {
      setToast({ msg: "Failed to update sandbox setting", ok: false });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggle = (agentId, toolKey) => {    setPermissions(prev => {
      const next = new Set(prev[agentId] || []);
      next.has(toolKey) ? next.delete(toolKey) : next.add(toolKey);
      return { ...prev, [agentId]: next };
    });
  };

  const save = async (agentId) => {
    setSaving(agentId);
    try {
      await api.put(`/agents/${agentId}/tools`, { allowed_tools: Array.from(permissions[agentId] || []) });
      setSaved(agentId);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      setToast({ msg: e.response?.data?.detail || "Save failed", ok: false });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(null);
    }
  };

  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(agentSearch.toLowerCase()));
  const totalPages = Math.ceil(filteredAgents.length / PAGE_SIZE);
  const pagedAgents = filteredAgents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allToolKeys = Object.values(TOOL_GROUPS).flatMap(g => g.tools);
  const filteredTools = [
    ...allToolKeys.filter(k => tools.find(t => t.key === k)),
    ...tools.map(t => t.key).filter(k => !allToolKeys.includes(k)),
  ].filter(k => !toolFilter || (TOOL_INFO[k]?.label || k).toLowerCase().includes(toolFilter.toLowerCase()));

  return (
    <div className="animate-up" style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Tools Management</h1>
        <p style={s.sub}>Configure which tools each agent can access during task execution.</p>
      </div>

      <div style={s.sectionLabel}>TOOLS REGISTRY</div>
      <div style={s.toolsGrid}>
        {tools.map(t => {
          const info = TOOL_INFO[t.key] || { label: t.key, desc: "", color: "#64748b", bg: "#f1f5f9", group: "Other" };
          return (
            <div key={t.key} style={s.toolCard}>
              <div style={{ ...s.toolIconWrap, background: info.bg, color: info.color }}>
                <ToolIcon toolKey={t.key} />
              </div>
              <div style={s.toolCardBody}>
                <div style={s.toolName}>{info.label}</div>
                <div style={s.toolDesc}>{info.desc}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <span style={{ ...s.toolGroupBadge, background: info.bg, color: info.color }}>{info.group}</span>
                <button
                  style={{
                    fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                    border: "none", cursor: "pointer",
                    background: t.sandboxed ? "#fef3c7" : "#f1f5f9",
                    color: t.sandboxed ? "#92400e" : "#64748b",
                  }}
                  onClick={() => toggleSandbox(t.key, t.sandboxed)}
                  title={t.sandboxed ? "Running in sandbox container — click to disable" : "Running directly — click to sandbox"}
                >
                  {t.sandboxed ? "🔒 SANDBOXED" : "⚡ DIRECT"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...s.sectionLabel, marginTop: 36 }}>AGENT TOOL PERMISSIONS</div>
      <div style={s.matrixCard}>
        <div style={s.matrixTopBar}>
          <div style={{ display: "flex", gap: 12, flex: 1 }}>
            <input placeholder="Find agent..." value={agentSearch} onChange={e => { setAgentSearch(e.target.value); setPage(1); }} style={s.searchInput} />
            <input placeholder="Filter tools..." value={toolFilter} onChange={e => setToolFilter(e.target.value)} style={s.searchInput} />
          </div>
          <button
            style={{ background: "#1a56db", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            onClick={() => filteredAgents.forEach(a => save(a.id))}
          >
            Save All
          </button>
        </div>
        <div style={s.tableScroll}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.agentTh}>AGENT DETAILS</th>
                {Object.entries(TOOL_GROUPS).map(([group, meta]) => {
                  const groupTools = meta.tools.filter(k => filteredTools.includes(k));
                  if (!groupTools.length) return null;
                  const collapsed = collapsedGroups[group];
                  return (
                    <th key={group} colSpan={collapsed ? 1 : groupTools.length}
                      style={{ ...s.groupTh, color: meta.color, borderBottom: `2px solid ${meta.color}` }}>
                      <span style={{ ...s.groupDot, background: meta.color }} />
                      {group}
                      <button onClick={() => toggleGroup(group)} style={s.collapseBtn} title={collapsed ? "Expand" : "Collapse"}>
                        {collapsed ? "▶" : "▼"}
                      </button>
                    </th>
                  );
                })}
                <th style={{ ...s.groupTh, color: "var(--on-surface-variant)" }}>ACTIONS</th>
              </tr>
              <tr>
                <th style={s.agentTh} />
                {Object.entries(TOOL_GROUPS).map(([group, meta]) => {
                  const groupTools = meta.tools.filter(k => filteredTools.includes(k));
                  if (!groupTools.length) return null;
                  const collapsed = collapsedGroups[group];
                  if (collapsed) {
                    return (
                      <th key={group} style={{ ...s.toolTh, color: meta.color, fontStyle: "italic" }}>
                        {groupTools.length} tools
                      </th>
                    );
                  }
                  return groupTools.map(key => (
                    <th key={key} style={s.toolTh}>{TOOL_INFO[key]?.label || key}</th>
                  ));
                })}
                <th style={{ ...s.toolTh, position: "sticky", right: 0, background: "var(--surface-container-low)", zIndex: 2 }} />
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length === 0 ? (
                <tr><td colSpan={filteredTools.length + 2} style={s.emptyTd}>
                  {agents.length === 0 ? "No agents yet." : "No agents match your search."}
                </td></tr>
              ) : pagedAgents.map((agent, idx) => {
                const color = AVATAR_COLORS[((page - 1) * PAGE_SIZE + idx) % AVATAR_COLORS.length];
                const perms = permissions[agent.id] || new Set();
                const isSaving = saving === agent.id;
                const isSaved = saved === agent.id;
                return (
                  <tr key={agent.id} style={s.tr}>
                    <td style={{ ...s.agentCell, position: "sticky", left: 0, background: "#fff", zIndex: 1 }}>
                      <div style={{ ...s.cellAvatar, background: color + "18", color }}>{getInitials(agent.name)}</div>
                      <div>
                        <div style={s.cellName}>{agent.name}</div>
                        <div style={s.cellCount}>{perms.size} tool{perms.size !== 1 ? "s" : ""} enabled</div>
                      </div>
                    </td>
                    {Object.entries(TOOL_GROUPS).map(([group, meta]) => {
                      const groupTools = meta.tools.filter(k => filteredTools.includes(k));
                      if (!groupTools.length) return null;
                      const collapsed = collapsedGroups[group];
                      if (collapsed) {
                        const enabledCount = groupTools.filter(k => perms.has(k)).length;
                        return (
                          <td key={group} style={{ ...s.permCell, color: enabledCount ? meta.color : "var(--on-surface-variant)", fontWeight: 700, fontSize: 12 }}>
                            {enabledCount}/{groupTools.length}
                          </td>
                        );
                      }
                      return groupTools.map(key => {
                        const on = perms.has(key);
                        return (
                          <td key={key} style={s.permCell}>
                            <button style={s.toggleBtn} onClick={() => toggle(agent.id, key)}>
                              {on
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              }
                            </button>
                          </td>
                        );
                      });
                    })}
                    <td style={{ ...s.permCell, position: "sticky", right: 0, background: "#fff", zIndex: 1, borderLeft: "1px solid var(--outline)" }}>
                      <button
                        style={{ ...s.saveBtn, background: isSaved ? "#047857" : "#059669", opacity: isSaving ? 0.6 : 1 }}
                        onClick={() => save(agent.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? "..." : isSaved ? "✓" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={s.matrixFooter}>
          <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredAgents.length)}–{Math.min(page * PAGE_SIZE, filteredAgents.length)} of {filteredAgents.length} agents &nbsp;·&nbsp; {filteredTools.length} tools visible</span>
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button style={s.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{"‹"}</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} style={{ ...s.pageBtn, background: p === page ? "#1a56db" : "transparent", color: p === page ? "#fff" : "var(--on-surface-variant)", fontWeight: p === page ? 800 : 600 }} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button style={s.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{"›"}</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...s.sectionLabel, marginTop: 36 }}>UPLOADED FILES</div>
      <FileUploadSection />

      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#dcfce7" : "#fee2e2", color: toast.ok ? "#15803d" : "#dc2626" }}>
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}
    </div>
  );
}

function ToolIcon({ toolKey }) {
  if (toolKey === "web_search") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    );
  }
  if (toolKey === "file_writer") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  );
}

function FileUploadSection() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState({});
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("files"); // "files" | "inbox"

  const fetchFiles = () => api.get("/files").then(r => {
    setFiles(r.data.files || []);
    setFolders(r.data.folders || {});
  }).catch(() => {});
  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e, subfolder = "") => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (subfolder) fd.append("subfolder", subfolder);
    try {
      await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg({ text: file.name + " uploaded", ok: true });
      fetchFiles();
    } catch {
      setMsg({ text: "Upload failed", ok: false });
    } finally {
      setUploading(false);
      e.target.value = "";
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleDelete = async (filename, subfolder = "") => {
    const path = subfolder ? `${subfolder}/${filename}` : filename;
    try {
      await api.delete(`/files/${encodeURIComponent(path)}`);
      fetchFiles();
    } catch {
      setMsg({ text: "Delete failed", ok: false });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const FileRow = ({ f, subfolder }) => (
    <div style={s.fileRow}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span style={{ fontSize: 12, flex: 1 }}>{f}</span>
      <a href={`/api/files/download/${encodeURIComponent(subfolder ? subfolder+'/'+f : f)}`} download={f} style={{ color: "#1a56db", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>↓</a>
      <DeleteButton onDelete={() => handleDelete(f, subfolder)} />
    </div>
  );

  const inboxFiles = folders["inbox"] || [];

  return (
    <div style={s.uploadCard}>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--outline)" }}>
        {[
          { key: "files", label: "Files" },
          { key: "inbox", label: "Inbox", badge: inboxFiles.length > 0 ? inboxFiles.length : null },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "8px 16px", fontSize: 12, fontWeight: 700, border: "none", background: "transparent",
            borderBottom: activeTab === t.key ? "2px solid #1a56db" : "2px solid transparent",
            color: activeTab === t.key ? "#1a56db" : "var(--on-surface-variant)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            {t.badge && <span style={{ background: "#059669", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 10 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {msg && <div style={{ fontSize: 12, marginBottom: 8, color: msg.ok ? "#15803d" : "#dc2626" }}>{msg.text}</div>}

      {activeTab === "files" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Accessible to agents via file tools.</p>
            <label style={s.uploadBtn}>
              {uploading ? "Uploading..." : "+ Upload"}
              <input type="file" style={{ display: "none" }} onChange={e => handleUpload(e)} disabled={uploading} />
            </label>
          </div>
          <div style={s.fileList}>
            {files.length === 0
              ? <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>No files yet.</div>
              : files.map(f => <FileRow key={f} f={f} subfolder="" />)
            }
          </div>
        </>
      )}

      {activeTab === "inbox" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Files here trigger folder/file watch workflows.</p>
            <label style={{ ...s.uploadBtn, background: "#059669" }}>
              {uploading ? "Uploading..." : "+ Add to Inbox"}
              <input type="file" style={{ display: "none" }} onChange={e => handleUpload(e, "inbox")} disabled={uploading} />
            </label>
          </div>
          <div style={s.fileList}>
            {inboxFiles.length === 0
              ? <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Empty — upload a file to trigger your workflows.</div>
              : inboxFiles.map(f => <FileRow key={f} f={f} subfolder="inbox" />)
            }
          </div>
        </>
      )}
    </div>
  );
}

function DeleteButton({ onDelete }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>Delete?</span>
        <button
          style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          onClick={() => { setConfirming(false); onDelete(); }}
        >Yes</button>
        <button
          style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          onClick={() => setConfirming(false)}
        >No</button>
      </div>
    );
  }
  return (
    <button
      style={{ background: "transparent", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", fontSize: 13, opacity: 0.6 }}
      onClick={() => setConfirming(true)}
    >{"✕"}</button>
  );
}

const s = {
  page:         { paddingBottom: 60, position: "relative" },
  header:       { marginBottom: 28 },
  title:        { fontSize: 26, fontWeight: 800, color: "var(--on-surface)", marginBottom: 4 },
  sub:          { fontSize: 13, color: "var(--on-surface-variant)" },
  sectionLabel: { fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.1em", marginBottom: 14 },
  toolsGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  toolCard:     { background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 6px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 },
  toolIconWrap: { width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  toolCardBody: { flex: 1, minWidth: 0 },
  toolName:     { fontSize: 13, fontWeight: 700, color: "var(--on-surface)", marginBottom: 2 },
  toolDesc:     { fontSize: 11, color: "var(--on-surface-variant)", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  toolGroupBadge: { fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, letterSpacing: "0.05em", flexShrink: 0 },
  agentGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  agentCard:    { background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 10 },
  cardTop:      { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardAvatar:   { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800 },
  cardBadge:    { fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em" },
  cardName:     { fontSize: 15, fontWeight: 800, color: "#0f172a" },
  cardSkills:   { fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  toolToggles:  { display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 4 },
  toolChip:     { fontSize: 11, padding: "4px 10px", borderRadius: 20, cursor: "pointer", transition: "all 150ms" },
  cardFooter:   { paddingTop: 10, borderTop: "1px solid #f1f5f9", marginTop: "auto" },
  saveBtn:      { width: "100%", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "background 300ms" },
  uploadCard:   { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9" },
  uploadTop:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  uploadBtn:    { display: "inline-block", background: "#1a56db", color: "#fff", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  fileList:     { display: "flex", flexDirection: "column", gap: 6, marginTop: 12 },
  fileRow:      { display: "flex", alignItems: "center", gap: 8, background: "var(--surface-container-low)", borderRadius: 8, padding: "7px 12px" },
  empty:        { fontSize: 13, color: "var(--on-surface-variant)", padding: 32 },
  toast:        { position: "fixed", bottom: 24, right: 24, padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "var(--shadow-md)", zIndex: 999 },
  matrixCard:   { background: "#fff", borderRadius: 14, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" },
  matrixTopBar: { display: "flex", gap: 12, padding: "14px 16px", borderBottom: "1px solid #f1f5f9" },
  searchInput:  { width: 180, fontSize: 12, padding: "7px 12px", borderRadius: 8 },
  tableScroll:  { overflowX: "auto" },
  table:        { width: "100%", borderCollapse: "collapse" },
  agentTh:      { padding: "10px 16px", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", color: "var(--on-surface-variant)", background: "var(--surface-container-low)", textAlign: "left", borderBottom: "1px solid var(--outline)", minWidth: 240, borderRight: "1px solid var(--outline)" },
  groupTh:      { padding: "8px 16px", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", background: "var(--surface-container-low)", textAlign: "center", borderLeft: "1px solid var(--outline)" },
  groupDot:     { display: "inline-block", width: 7, height: 7, borderRadius: "50%", marginRight: 6, verticalAlign: "middle" },
  collapseBtn:  { background: "none", border: "none", cursor: "pointer", fontSize: 9, marginLeft: 6, opacity: 0.6, padding: "0 2px", verticalAlign: "middle" },
  toolTh:       { padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "var(--on-surface)", background: "var(--surface-container-lowest)", textAlign: "center", borderLeft: "1px solid var(--outline)", borderBottom: "1px solid var(--outline)", whiteSpace: "nowrap" },
  tr:           { borderBottom: "1px solid var(--outline)" },
  agentCell:    { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRight: "1px solid var(--outline)", minWidth: 240 },
  cellAvatar:   { width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 },
  cellName:     { fontSize: 13, fontWeight: 700, color: "var(--on-surface)" },
  cellCount:    { fontSize: 10, color: "var(--on-surface-variant)", marginTop: 1 },
  permCell:     { textAlign: "center", padding: "14px 16px", borderLeft: "1px solid var(--outline)" },
  toggleBtn:    { background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6 },
  saveBtn:      { color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "background 300ms", whiteSpace: "nowrap" },
  matrixFooter: { padding: "10px 16px", fontSize: 11, color: "var(--on-surface-variant)", borderTop: "1px solid var(--outline)", background: "var(--surface-container-lowest)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pageBtn:      { background: "transparent", border: "1px solid var(--outline)", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)", cursor: "pointer" },
};
