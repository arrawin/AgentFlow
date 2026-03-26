import { useEffect, useState } from "react";
import api from "../api/client";

function AnthropicIcon() {
   return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>;
}
function OpenAIIcon() {
   return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></svg>;
}
function GeminiIcon() {
   return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z"/></svg>;
}
function LlamaIcon() {
   return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>;
}

const PROVIDER_ICONS = { anthropic: <AnthropicIcon />, openai: <OpenAIIcon />, gemini: <GeminiIcon />, groq: <LlamaIcon />, ollama: <LlamaIcon /> };

export default function LLMSettings() {
  const [configs, setConfigs] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("groq");
  const [form, setForm] = useState({ model: "", api_key: "", base_url: "", temperature: 0.7, max_tokens: 2048 });
  const [msg, setMsg] = useState({ text: "", ok: true });

  useEffect(() => { api.get("/llm-configs").then(r => setConfigs(r.data)); }, []);

  const handleSave = async () => {
    setMsg({ text: "", ok: true });
    try {
      await api.post("/llm-configs", { ...form, provider: selectedProvider });
      setMsg({ text: "Config saved successfully", ok: true });
      setForm({ model: "", api_key: "", base_url: "", temperature: 0.7, max_tokens: 2048 });
      api.get("/llm-configs").then(r => setConfigs(r.data));
    } catch (e) {
      setMsg({ text: e.response?.data?.detail || "Error saving config", ok: false });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this config?")) return;
    await api.delete(`/llm-configs/${id}`);
    api.get("/llm-configs").then(r => setConfigs(r.data));
  };

  const providers = ["groq", "openai", "anthropic", "gemini", "ollama"];

  return (
    <div className="animate-up" style={s.container}>
      <div style={s.header}>
        <div style={s.breadcrumb}>LLM Engine Settings / <span style={s.activeCrumb}>Configuration</span></div>
        <div style={s.headerRow}>
          <div>
            <h1 style={s.title}>Engine Configuration</h1>
            <p style={s.subtitle}>Configure LLM providers for your agents</p>
          </div>
          <div style={s.actions}>
            <button className="btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </div>

      <div style={s.layout}>
        <div style={s.main}>
          {/* Provider Selection */}
          <section style={s.section}>
            <div style={s.sectionHeader}>LLM PROVIDER</div>
            <div style={s.providerGrid}>
              {providers.map(p => (
                <div key={p} style={{ ...s.providerCard, ...(selectedProvider === p ? s.providerActive : {}) }}
                  onClick={() => setSelectedProvider(p)}>
                  <div style={s.providerIcon}>{PROVIDER_ICONS[p] || <LlamaIcon />}</div>
                  <div style={s.providerName}>{p}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Model Config */}
          <section style={s.section}>
            <div style={s.sectionHeader}>MODEL CONFIGURATION</div>
            {msg.text && <div style={{ fontSize: 12, marginBottom: 12, color: msg.ok ? "var(--tertiary)" : "var(--error)" }}>{msg.text}</div>}
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>MODEL NAME</label>
                <input type="text" placeholder="e.g. llama-3.1-8b-instant" value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>BASE URL (OPTIONAL)</label>
                <input type="text" placeholder="Leave blank for default" value={form.base_url}
                  onChange={e => setForm({ ...form, base_url: e.target.value })} />
              </div>
            </div>
            <div style={{ ...s.field, marginTop: 16 }}>
              <label style={s.label}>API KEY</label>
              <div style={s.inputWrap}>
                <input type="password" placeholder="sk-..." value={form.api_key}
                  onChange={e => setForm({ ...form, api_key: e.target.value })} />
              </div>
              <p style={s.hint}>Stored with Fernet encryption. Never returned to frontend.</p>
            </div>
          </section>

          {/* Saved Configs */}
          {configs.length > 0 && (
            <section style={s.section}>
              <div style={s.sectionHeader}>SAVED CONFIGURATIONS</div>
              {configs.map(c => (
                <div key={c.id} style={s.configRow}>
                  <div style={s.configLeft}>
                    <span style={s.configProvider}>{c.provider}</span>
                    <span style={s.configModel}>{c.model}</span>
                    {c.is_default && <span style={s.defaultTag}>DEFAULT</span>}
                  </div>
                  <div style={s.configMeta}>API Key: sk-••••••••  ·  Temp: {c.temperature}</div>
                  <button style={s.deleteBtn} onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              ))}
            </section>
          )}

          <div style={s.contextCard}>
            <div style={s.contextIcon}>⚙️</div>
            <div>
              <div style={s.contextTitle}>Dynamic Context Compression</div>
              <div style={s.contextText}>Enabled: Automatically optimizing prompt tokens based on active window.</div>
            </div>
            <div style={s.contextStatus}>• SYSTEM SYNCED</div>
          </div>
        </div>

        <div style={s.sidebar}>
          <section style={s.sideSection}>
            <div style={s.sideHeader}>
              <div style={s.sectionHeader}>PARAMETER TUNING</div>
              <span style={s.advancedTag}>ADVANCED</span>
            </div>
            <div style={s.tuningList}>
              <div style={s.tuneItem}>
                <div style={s.tuneLabel}><span>🌡️ Temperature</span><span style={s.tuneVal}>{form.temperature}</span></div>
                <input type="range" min="0" max="2" step="0.1" value={form.temperature}
                  onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })} style={s.range} />
                <div style={s.rangeLabels}><span>PRECISE</span><span>CREATIVE</span></div>
              </div>
              <div style={s.tuneItem}>
                <div style={s.tuneLabel}><span>📊 Max Tokens</span><span style={s.tuneVal}>{form.max_tokens}</span></div>
                <input type="range" min="512" max="8192" step="512" value={form.max_tokens}
                  onChange={e => setForm({ ...form, max_tokens: parseInt(e.target.value) })} style={s.range} />
              </div>
            </div>
          </section>

          <section style={s.sideSection}>
            <div style={s.sectionHeader}>SAFETY & FILTERS</div>
            <p style={s.safetyText}>Configure active monitoring for PII, toxic content, and hallucination detection protocols.</p>
            <div style={s.checkList}>
              <div style={s.checkItem}>✅ PII Redaction Active</div>
              <div style={s.checkItem}>✅ Toxicity Score Filter &gt; 0.8</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { paddingBottom: 40 },
  header: { marginBottom: 32 },
  breadcrumb: { fontSize: 11, fontWeight: 700, color: "var(--on-surface-variant)", marginBottom: 8, letterSpacing: "0.04em" },
  activeCrumb: { color: "var(--secondary)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  title: { fontSize: 28, fontWeight: 800 },
  subtitle: { fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 },
  actions: { display: "flex", gap: 12 },
  layout: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 },
  main: { display: "flex", flexDirection: "column", gap: 32 },
  section: { background: "var(--surface-bright)", borderRadius: 16, padding: 24, boxShadow: "var(--ambient-shadow)" },
  sectionHeader: { fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.1em", marginBottom: 20 },
  providerGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 },
  providerCard: { background: "var(--surface-container-low)", borderRadius: 12, padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, border: "2px solid transparent", cursor: "pointer", transition: "all 200ms ease" },
  providerActive: { background: "#fff", borderColor: "var(--secondary)", boxShadow: "0 4px 12px rgba(79,70,229,0.12)" },
  providerIcon: { width: 40, height: 40, borderRadius: 10, background: "var(--surface-container)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--on-surface)" },
  providerName: { fontSize: 11, fontWeight: 800, textAlign: "center", textTransform: "capitalize" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em" },
  inputWrap: { position: "relative" },
  hint: { fontSize: 11, color: "var(--on-surface-variant)", marginTop: 8 },
  configRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--outline)" },
  configLeft: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  configProvider: { background: "var(--secondary-container)", color: "var(--on-secondary-container)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" },
  configModel: { fontSize: 13, fontWeight: 600 },
  defaultTag: { background: "var(--tertiary-container)", color: "var(--on-tertiary-container)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 },
  configMeta: { fontSize: 11, color: "var(--on-surface-variant)" },
  deleteBtn: { background: "transparent", color: "var(--error)", border: "1px solid var(--error)", borderRadius: 6, padding: "4px 10px", fontSize: 11 },
  contextCard: { background: "var(--surface-container-low)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 },
  contextIcon: { fontSize: 20 },
  contextTitle: { fontSize: 13, fontWeight: 800, color: "var(--on-surface)" },
  contextText: { fontSize: 12, color: "var(--on-surface-variant)", marginTop: 2 },
  contextStatus: { marginLeft: "auto", fontSize: 10, fontWeight: 800, color: "var(--secondary)", letterSpacing: "0.05em" },
  sidebar: { display: "flex", flexDirection: "column", gap: 24 },
  sideSection: { background: "var(--surface-bright)", borderRadius: 16, padding: 24, boxShadow: "var(--ambient-shadow)" },
  sideHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  advancedTag: { fontSize: 9, fontWeight: 900, background: "var(--secondary-container)", color: "var(--on-secondary-container)", padding: "2px 6px", borderRadius: 4 },
  tuningList: { display: "flex", flexDirection: "column", gap: 24 },
  tuneItem: {},
  tuneLabel: { display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 12, fontWeight: 700 },
  tuneVal: { color: "var(--secondary)" },
  range: { width: "100%", cursor: "pointer" },
  rangeLabels: { display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.05em" },
  safetyText: { fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.5, marginBottom: 16 },
  checkList: { display: "flex", flexDirection: "column", gap: 8 },
  checkItem: { fontSize: 11, fontWeight: 700, color: "var(--on-tertiary-container)" },
};
