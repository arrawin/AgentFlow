import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

export default function CreateAgent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [domains, setDomains] = useState([]);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [skillMode, setSkillMode] = useState("type"); // type | upload
  const [skillFile, setSkillFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    domain_id: "",
    skills: "",
    llm_config_id: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/domains").then(r => {
      setDomains(r.data);
      if (!isEdit && r.data.length > 0) {
        setForm(f => ({ ...f, domain_id: String(r.data[0].id) }));
      }
    }).catch(console.error);
    api.get("/llm-configs").then(r => setLlmConfigs(r.data)).catch(console.error);

    if (isEdit) {
      api.get(`/agents/${id}`).then(r => {
        const a = r.data;
        setForm({
          name: a.name || "",
          domain_id: String(a.domain_id || ""),
          skills: a.skills || "",
          llm_config_id: a.llm_config_id || "",
        });
      }).catch(console.error);
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!form.name) { setError("Agent name is required"); return; }
    if (!form.domain_id) { setError("Domain is required"); return; }
    setSaving(true);
    setError("");
    try {
      let skillsText = form.skills;

      // If file uploaded, read its content
      if (skillMode === "upload" && skillFile) {
        skillsText = await skillFile.text();
      }

      const payload = {
        name: form.name,
        domain_id: parseInt(form.domain_id),
        skills: skillsText || null,
        llm_config_id: form.llm_config_id ? parseInt(form.llm_config_id) : null,
      };

      if (isEdit) {
        await api.put(`/agents/${id}`, payload);
      } else {
        await api.post("/agents", payload);
      }
      navigate("/agents");
    } catch (e) {
      setError(e.response?.data?.detail || "Error saving agent");
      setSaving(false);
    }
  };

  const DOMAIN_ICONS = ["🎧", "📊", "⌨️", "✨", "🔬", "🛡️", "🧬", "🚀", "💡", "🤖"];

  return (
    <div className="animate-up" style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>{isEdit ? "Edit Agent" : "Create New Agent"}</h1>
          <p style={s.pageSub}>Define persona, skills, and configuration for your AI agent.</p>
        </div>
        <div style={s.headerActions}>
          <button style={s.cancelBtn} onClick={() => navigate("/agents")}>Cancel</button>
          <button className="btn-primary" style={s.createBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Agent"}
          </button>
        </div>
      </div>

      {error && <div style={s.errorBar}>{error}</div>}

      <div style={s.layout}>
        {/* Left Col: Domains */}
        <div style={s.leftCol}>
          <div style={s.sectionLabel}>AGENT DOMAIN</div>
          <div style={s.domainList}>
            {domains.map((d, i) => (
              <div
                key={d.id}
                style={{ ...s.domainItem, ...(form.domain_id === String(d.id) ? s.domainItemActive : {}) }}
                onClick={() => setForm(f => ({ ...f, domain_id: String(d.id) }))}
              >
                <span style={s.domainIcon}>{DOMAIN_ICONS[i % DOMAIN_ICONS.length]}</span>
                <span style={s.domainName}>{d.name}</span>
              </div>
            ))}
            {domains.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--on-surface-variant)", padding: "8px 0" }}>
                No domains yet. Create one in Agent Management.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Form */}
        <div style={s.rightCol}>
          {/* Core Identity */}
          <div style={s.formSection}>
            <div style={s.formSectionHeader}>◆ CORE IDENTITY</div>
            <div style={s.formGrid}>
              <div style={s.inputGroup}>
                <label style={s.inputLabel}>Agent Name</label>
                <input
                  style={s.input}
                  placeholder="e.g. Research Agent"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div style={s.inputGroup}>
                <label style={s.inputLabel}>Domain</label>
                <select
                  style={s.input}
                  value={form.domain_id}
                  onChange={e => setForm(f => ({ ...f, domain_id: e.target.value }))}
                >
                  <option value="">Select domain</option>
                  {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ ...s.inputGroup, marginTop: 20 }}>
              <label style={s.inputLabel}>LLM Config</label>
              <select
                style={s.input}
                value={form.llm_config_id}
                onChange={e => setForm(f => ({ ...f, llm_config_id: e.target.value }))}
              >
                <option value="">Default (Groq)</option>
                {llmConfigs.map(c => <option key={c.id} value={c.id}>{c.provider} / {c.model}</option>)}
              </select>
            </div>
          </div>

          {/* Cognitive Skills */}
          <div style={s.formSection}>
            <div style={s.formSectionHeader}>◆ COGNITIVE SKILLS</div>
            <div style={s.skillsTabs}>
              <button
                style={skillMode === "type" ? s.skillTabActive : s.skillTab}
                onClick={() => setSkillMode("type")}
              >
                Type Skill
              </button>
              <button
                style={skillMode === "upload" ? s.skillTabActive : s.skillTab}
                onClick={() => setSkillMode("upload")}
              >
                Upload .md
              </button>
            </div>

            {skillMode === "type" ? (
              <textarea
                style={s.textarea}
                placeholder="Define the agent's behavior, constraints, and operational goals here..."
                value={form.skills}
                onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
              />
            ) : (
              <div style={s.uploadArea}>
                <input
                  type="file"
                  accept=".md,.txt"
                  id="skill-file"
                  style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setSkillFile(file);
                      // Preview content
                      file.text().then(text => setForm(f => ({ ...f, skills: text })));
                    }
                  }}
                />
                <label htmlFor="skill-file" style={s.uploadLabel}>
                  {skillFile ? (
                    <>
                      <span style={{ fontSize: 20 }}>📄</span>
                      <span style={s.uploadFileName}>{skillFile.name}</span>
                      <span style={s.uploadHint}>Click to change file</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 24 }}>📁</span>
                      <span style={s.uploadFileName}>Click to upload .md file</span>
                      <span style={s.uploadHint}>Markdown or plain text</span>
                    </>
                  )}
                </label>
                {skillFile && (
                  <button
                    style={s.clearFileBtn}
                    onClick={() => {
                      setSkillFile(null);
                      setForm(f => ({ ...f, skills: "" }));
                      document.getElementById("skill-file").value = "";
                    }}
                  >
                    ✕ Remove {skillFile.name}
                  </button>
                )}
                {form.skills && (
                  <div style={s.filePreview}>
                    <div style={s.filePreviewLabel}>Preview:</div>
                    <pre style={s.filePreviewText}>{form.skills.slice(0, 300)}{form.skills.length > 300 ? "..." : ""}</pre>
                  </div>
                )}
              </div>
            )}
            <div style={s.hintText}>✦ Skills define how the agent behaves and what it focuses on.</div>
          </div>

          {/* Footer */}
          <div style={s.footer}>
            <button style={s.discardBtn} onClick={() => navigate("/agents")}>Discard</button>
            <button className="btn-primary" style={s.deployBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Deploy Agent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { paddingBottom: 60 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  pageTitle: { fontSize: 26, fontWeight: 800, color: "var(--on-surface)" },
  pageSub: { fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 },
  headerActions: { display: "flex", gap: 12 },
  cancelBtn: { background: "var(--surface-container)", color: "var(--on-surface)", padding: "10px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none" },
  createBtn: { padding: "10px 24px", fontSize: 12 },
  errorBar: { background: "var(--error-container)", color: "var(--error)", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 24 },
  layout: { display: "grid", gridTemplateColumns: "220px 1fr", gap: 40 },
  leftCol: {},
  sectionLabel: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.1em", marginBottom: 16 },
  domainList: { display: "flex", flexDirection: "column", gap: 6 },
  domainItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", transition: "all 150ms", color: "var(--on-surface-variant)" },
  domainItemActive: { background: "var(--surface-bright)", boxShadow: "var(--shadow-sm)", color: "var(--on-surface)", fontWeight: 700 },
  domainIcon: { width: 24, display: "inline-block", textAlign: "center" },
  domainName: { fontSize: 13 },
  rightCol: { display: "flex", flexDirection: "column", gap: 32 },
  formSection: {},
  formSectionHeader: { fontSize: 11, fontWeight: 800, color: "var(--on-surface)", letterSpacing: "0.08em", marginBottom: 20 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: 700, color: "var(--on-surface-variant)" },
  input: { background: "var(--surface-bright)", border: "1px solid var(--outline)", borderRadius: 10, padding: "12px 14px", fontSize: 13 },
  skillsTabs: { display: "flex", gap: 2, marginBottom: 12, background: "var(--surface-container-low)", padding: 3, borderRadius: 8, width: "fit-content" },
  skillTab: { background: "transparent", border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", cursor: "pointer" },
  skillTabActive: { background: "var(--surface-bright)", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 800, color: "var(--secondary)", boxShadow: "var(--shadow-sm)", border: "none", cursor: "pointer" },
  textarea: { width: "100%", padding: 16, borderRadius: 12, border: "1px solid var(--outline)", background: "var(--surface-bright)", fontSize: 13, lineHeight: 1.6, minHeight: 160, outline: "none", resize: "vertical" },
  uploadArea: { display: "flex", flexDirection: "column", gap: 12 },
  clearFileBtn: { background: "var(--error-container)", color: "var(--error)", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" },  uploadLabel: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 32, border: "2px dashed var(--outline)", borderRadius: 12, cursor: "pointer", background: "var(--surface-container-low)", transition: "border-color 150ms" },
  uploadFileName: { fontSize: 13, fontWeight: 600, color: "var(--on-surface)" },
  uploadHint: { fontSize: 11, color: "var(--on-surface-variant)" },
  filePreview: { background: "var(--surface-container-low)", borderRadius: 8, padding: 12 },
  filePreviewLabel: { fontSize: 10, fontWeight: 700, color: "var(--on-surface-variant)", marginBottom: 6 },
  filePreviewText: { fontSize: 11, color: "var(--on-surface-variant)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  hintText: { fontSize: 11, color: "var(--on-surface-variant)", marginTop: 10, opacity: 0.7 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--outline)", paddingTop: 24 },
  discardBtn: { background: "transparent", border: "none", fontSize: 13, fontWeight: 800, color: "var(--error)", cursor: "pointer" },
  deployBtn: { padding: "12px 32px", borderRadius: 10, fontSize: 13, fontWeight: 800 },
};
