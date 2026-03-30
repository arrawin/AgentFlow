import { useState } from "react";

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

export default function TopBar() {
  const [search, setSearch] = useState("");

  return (
    <header style={s.topBar}>
      <div style={s.container}>
        <div style={s.searchWrap}>
          <div style={s.searchIcon}><SearchIcon /></div>
          <input
            type="text"
            placeholder="Search agents, workflows, or logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        <div style={s.actions}>
          <div style={s.divider} />
          <div style={s.profileThumb}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}

const s = {
  topBar: { height: 72, background: "var(--background)", display: "flex", alignItems: "center", padding: "0 48px", position: "sticky", top: 0, zIndex: 900 },
  container: { width: "100%", maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  searchWrap: { position: "relative", width: 480, background: "var(--surface-bright)", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 16px", boxShadow: "var(--ambient-shadow)" },
  searchIcon: { color: "var(--on-surface-variant)", opacity: 0.5, marginRight: 12, display: "flex" },
  searchInput: { flex: 1, height: 44, background: "transparent", border: "none", fontSize: 13, fontWeight: 500, color: "var(--on-surface)", outline: "none" },
  actions: { display: "flex", alignItems: "center", gap: 12 },
  divider: { width: 1, height: 24, background: "var(--surface-container)", margin: "0 4px" },
  profileThumb: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4, boxShadow: "0 4px 12px rgba(30,27,75,0.2)" },
};
