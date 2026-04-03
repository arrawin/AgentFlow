import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import CustomSelect from "../components/CustomSelect";

export default function CreateAgent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [domains, setDomains] = useState([]);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [skillMode, setSkillMode] = useState("type");
  const [skillFile, setSkillFile] = useState(null);
  const [domainSearch, setDomainSearch] = useState("");
  const [form, setForm] = useState({ name: "", domain_id: "", skills: "", llm_config_id: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [domainSuggestion, setDomainSuggestion] = useState(null);
  const [userPickedDomain, setUserPickedDomain] = useState(false);
  const [dryRunPrompt, setDryRunPrompt] = useState("");
  const [dryRunResult, setDryRunResult] = useState(null);
  const [dryRunning, setDryRunning] = useState(false);

  const handleDryRun = async () => {
    if (!dryRunPrompt.trim()) return;
    setDryRunning(true);
    setDryRunResult(null);
    try {
      if (id) {
        const res = await api.post(`/agents/${id}/dry-run`, { sample_prompt: dryRunPrompt });
        setDryRunResult(res.data);
      } else {
        setDryRunResult({ output: "Save the agent first to run a live test.", tool_calls: [] });
      }
    } catch (e) {
      setDryRunResult({ output: e.response?.data?.detail || "Dry run failed", tool_calls: [] });
    } finally {
      setDryRunning(false);
    }
  };

  const suggestDomain = async (skillContent) => {
    if (!skillContent || skillContent.length < 20 || userPickedDomain) return;
    setSuggesting(true);
    try {
      const res = await api.post("/agents/suggest-domain", { skill_content: skillContent });
      setDomainSuggestion(res.data);
    } catch { }
    finally { setSuggesting(false); }
  };

  const applySuggestion = async () => {
    if (!domainSuggestion) return;
    if (!domainSuggestion.is_new) {
      setForm(f => ({ ...f, domain_id: String(domainSuggestion.domain_id) }));
    } else {
      try {
        const res = await api.post("/domains", { 
          name: domainSuggestion.domain, 
          description: domainSuggestion.description 
        });
        setDomains(prev => [...prev, res.data]);
        setForm(f => ({ ...f, domain_id: String(res.data.id) }));
      } catch { }
    }
    setDomainSuggestion(null);
  };

  useEffect(() => {
    api.get("/domains").then(r => setDomains(r.data)).catch(console.error);
    api.get("/llm-configs").then(r => setLlmConfigs(r.data)).catch(console.error);
    api.get("/tools").then(r => setAvailableTools(r.data)).catch(console.error);
    if (isEdit) {
      api.get(`/agents/${id}`).then(r => {
        const a = r.data;
        setForm({ name: a.name || "", domain_id: String(a.domain_id || ""), skills: a.skills || "", llm_config_id: a.llm_config_id || "" });
        setSelectedTools(a.allowed_tools || []);
      }).catch(console.error);
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!form.name) { setError("Agent name is required"); return; }
    if (!form.domain_id) { setError("Domain is required"); return; }
    setSaving(true); setError("");
    try {
      let skillsText = form.skills;
      if (skillMode === "upload" && skillFile) skillsText = await skillFile.text();
      const payload = { name: form.name, domain_id: parseInt(form.domain_id), skills: skillsText || null, llm_config_id: form.llm_config_id ? parseInt(form.llm_config_id) : null, allowed_tools: selectedTools };
      if (isEdit) await api.put(`/agents/${id}`, payload);
      else await api.post("/agents", payload);
      navigate("/agents");
    } catch (e) {
      setError(e.response?.data?.detail || "Error saving agent");
      setSaving(false);
    }
  };

  const filteredDomains = domains.filter(d => {
    if (d.name === "SYSTEM") return false;
    const s = domainSearch.toLowerCase();
    return d.name.toLowerCase().includes(s) || (d.description && d.description.toLowerCase().includes(s));
  });
  const selectedDomain = domains.find(d => String(d.id) === form.domain_id);

  return (
    <div className="animate-up" style={s.page}>
      {error && <div style={s.errorBar}>{error}</div>}

      {/* Basic Identity */}
      <section style={s.section}>
        <div style={s.sectionTitle}>Basic Identity</div>
        <div style={s.identityGrid}>
          <div style={s.field}>
            <label style={s.label}>AGENT NAME</label>
            <input style={s.input} placeholder="e.g. Sentinel-Alpha-8" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={s.field}>
            <label style={s.label}>OPERATIONAL DOMAIN</label>
            <div style={s.domainSearch}>
              <input style={{ ...s.input, paddingRight: 32 }} placeholder="Search domains (e.g. Cybersecurity, Finance...)"
                value={domainSearch} onChange={e => setDomainSearch(e.target.value)} />
              <svg style={s.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div style={s.domainTags}>
              {filteredDomains.slice(0, 8).map(d => (
                <button key={d.id}
                  style={{ ...s.domainTag, ...(form.domain_id === String(d.id) ? s.domainTagActive : {}) }}
                  onClick={() => { setForm(f => ({ ...f, domain_id: String(d.id) })); setUserPickedDomain(true); setDomainSuggestion(null); }}>
                  {d.name}
                </button>
              ))}
              {filteredDomains.length === 0 && domainSearch && (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>No domains found</span>
              )}
            </div>
            {selectedDomain && <div style={s.selectedDomain}>Selected: <strong>{selectedDomain.name}</strong></div>}
          </div>
        </div>
        <div style={{ ...s.field, marginTop: 16, maxWidth: 320 }}>
          <label style={s.label}>LLM CONFIG</label>
          <CustomSelect
            value={form.llm_config_id}
            onChange={val => setForm(f => ({ ...f, llm_config_id: val }))}
            options={[
              { value: "", label: "Default (Groq)" },
              ...llmConfigs.map(c => ({ value: String(c.id), label: `${c.provider} / ${c.model}` }))
            ]}
          />
        </div>
      </section>

      {/* Core Capabilities */}
      <section style={s.section}>
        <div style={s.sectionTitle}>Core Capabilities</div>
        <div style={s.skillTabs}>
          <button style={{ ...s.skillTab, ...(skillMode === "type" ? s.skillTabActive : {}) }} onClick={() => setSkillMode("type")}>Instruction Set</button>
          <button style={{ ...s.skillTab, ...(skillMode === "upload" ? s.skillTabActive : {}) }} onClick={() => setSkillMode("upload")}>Upload Knowledge Files</button>
        </div>

        {skillMode === "type" ? (
          <div style={s.textareaWrap}>
            <textarea style={s.textarea}
              placeholder="Describe the primary mission, personality, and operational constraints of this agent..."
              value={form.skills}
              onChange={e => { setForm(f => ({ ...f, skills: e.target.value })); setDomainSuggestion(null); }}
              onBlur={e => suggestDomain(e.target.value)}
            />
            <div style={s.textareaFooter}>
              {suggesting && <span style={{ fontSize: 11, color: "#94a3b8" }}>Suggesting domain...</span>}
              {domainSuggestion && !userPickedDomain && (
                <div style={s.suggestion}>
                  <span style={{ fontSize: 12, color: "#1d4ed8", flex: 1 }}>Suggested: <strong>{domainSuggestion.domain}</strong>{domainSuggestion.is_new ? " (new)" : ""}</span>
                  <button style={s.applyBtn} onClick={applySuggestion}>Apply</button>
                  <button style={s.dismissBtn} onClick={() => setDomainSuggestion(null)}>✕</button>
                </div>
              )}
              <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>{form.skills.length} chars</span>
            </div>
          </div>
        ) : (
          <div style={s.uploadArea}>
            <input type="file" accept=".md,.txt" id="skill-file" style={{ display: "none" }}
              onChange={e => { const f = e.target.files[0]; if (f) { setSkillFile(f); f.text().then(t => setForm(ff => ({ ...ff, skills: t }))); } }} />
            <label htmlFor="skill-file" style={s.uploadLabel}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: skillFile ? "var(--on-surface)" : "#94a3b8" }}>{skillFile ? skillFile.name : "Click to upload .md or .txt file"}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Markdown or plain text</span>
            </label>
            {skillFile && form.skills && (
              <div style={s.filePreview}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>PREVIEW</div>
                <pre style={{ fontSize: 11, color: "var(--on-surface-variant)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{form.skills.slice(0, 400)}{form.skills.length > 400 ? "..." : ""}</pre>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Tool Selection */}
      <section style={s.section}>
        <div style={s.sectionTitle}>Permissions & Tools</div>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Select which tools this agent can use during task execution. Unsafe tools run in an isolated sandbox container.</p>
        <div style={s.toolGrid}>
          {availableTools.map(t => {
            const on = selectedTools.includes(t.key);
            const isUnsafe = t.sandboxed;
            return (
              <div key={t.key}
                style={{ ...s.toolCard, ...(on ? s.toolCardActive : {}) }}
                onClick={() => setSelectedTools(prev => on ? prev.filter(k => k !== t.key) : [...prev, t.key])}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ ...s.toolCheck, background: on ? "#1a56db" : "transparent", border: on ? "none" : "2px solid #cbd5e1" }}>
                    {on && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  {isUnsafe && <span style={s.sandboxBadge}>🔒 Sandbox</span>}
                </div>
                <div style={s.toolName}>{t.name || t.key}</div>
                <div style={s.toolDesc}>{t.desc || ""}</div>
              </div>
            );
          })}
        </div>
        {selectedTools.length > 0 && (
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 12 }}>
            {selectedTools.length} tool{selectedTools.length !== 1 ? "s" : ""} selected: {selectedTools.join(", ")}
          </div>
        )}
      </section>

      {/* Interactive Dry Run */}
      <section style={s.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={s.sectionTitle}>Interactive Logic Dry Run</div>
          <span style={s.preBadge}>PRE-DEPLOYMENT TEST</span>
        </div>
        <div style={s.field}>
          <label style={s.label}>TEST PROMPT</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...s.input, flex: 1 }}
              placeholder="Enter a sample prompt to test this agent..."
              value={dryRunPrompt}
              onChange={e => setDryRunPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDryRun()}
            />
            <button style={s.runBtn} onClick={handleDryRun} disabled={dryRunning || !dryRunPrompt.trim()}>
              {dryRunning ? "Running..." : "Run Test"}
            </button>
          </div>
        </div>
        {dryRunResult && (
          <div style={s.dryRunOutput}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: 10 }}>OUTPUT</div>
            <pre style={{ fontSize: 12, color: "#334155", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{dryRunResult.output}</pre>
          </div>
        )}
        {!dryRunResult && (
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 12, fontStyle: "italic" }}>
            {isEdit ? "Enter a prompt above to test how this agent responds." : "Save the agent first to run a live test."}
          </div>
        )}
      </section>

      {/* Footer */}
      <div style={s.footer}>
        <button style={s.discardBtn} onClick={() => navigate("/agents")}>Discard Draft</button>
        <button className="btn-primary" style={s.deployBtn} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Finalize & Deploy Agent"}
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { paddingBottom: 60 },
  errorBar: { background: "var(--error-container)", color: "var(--error)", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 24 },
  section: { background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", border: "1px solid #f1f5f9", marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 20, borderLeft: "3px solid #1a56db", paddingLeft: 12 },
  identityGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em" },
  input: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit" },
  domainSearch: { position: "relative" },
  searchIcon: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" },
  domainTags: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 },
  domainTag: { fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", transition: "all 150ms" },
  domainTagActive: { background: "#dbeafe", color: "#1a56db", border: "1px solid #93c5fd", fontWeight: 800 },
  selectedDomain: { fontSize: 11, color: "#64748b", marginTop: 4 },
  skillTabs: { display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 16 },
  skillTab: { padding: "8px 16px", fontSize: 12, fontWeight: 600, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -1 },
  skillTabActive: { color: "#1a56db", fontWeight: 800, borderBottom: "2px solid #1a56db", background: "transparent", border: "none", borderBottom: "2px solid #1a56db", padding: "8px 16px", fontSize: 12, cursor: "pointer", marginBottom: -1 },
  textareaWrap: { position: "relative" },
  textarea: { width: "100%", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13, lineHeight: 1.7, minHeight: 180, outline: "none", resize: "vertical", fontFamily: "inherit", color: "#0f172a" },
  textareaFooter: { display: "flex", alignItems: "center", gap: 10, marginTop: 8 },
  suggestion: { display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe", flex: 1 },
  applyBtn: { background: "#1a56db", color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  dismissBtn: { background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 },
  uploadArea: { display: "flex", flexDirection: "column", gap: 12 },
  uploadLabel: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 32, border: "2px dashed #e2e8f0", borderRadius: 12, cursor: "pointer", background: "#f8fafc" },
  filePreview: { background: "#f1f5f9", borderRadius: 8, padding: 12 },
  infoRow: { display: "none" },
  infoCard: {}, infoCardIcon: {}, infoCardTitle: {}, infoCardText: {},
  preBadge: { fontSize: 10, fontWeight: 800, background: "#d1fae5", color: "#059669", padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em" },
  toolGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 },
  toolCard: { background: "#f8fafc", borderRadius: 12, padding: 16, border: "2px solid #e2e8f0", cursor: "pointer", transition: "all 150ms" },
  toolCardActive: { background: "#eff6ff", border: "2px solid #93c5fd" },
  toolCheck: { width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sandboxBadge: { fontSize: 9, fontWeight: 800, background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 10 },
  toolName: { fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 4 },
  toolDesc: { fontSize: 11, color: "#64748b", lineHeight: 1.4 },
  runBtn: { background: "#1a56db", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  dryRunOutput: { marginTop: 16, background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e2e8f0" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 },
  discardBtn: { background: "transparent", border: "none", fontSize: 13, fontWeight: 700, color: "#64748b", cursor: "pointer" },
  deployBtn: { padding: "12px 28px", borderRadius: 10, fontSize: 13, fontWeight: 800 },
};
