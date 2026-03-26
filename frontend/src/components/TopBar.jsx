import { useState } from "react";

// Icons (Hoisted or moved above)
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function BellIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function HelpIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}

export default function TopBar() {
  const [search, setSearch] = useState("");

  return (
    <header style={s.topBar}>
      <div style={s.container}>
        {/* Search Bar - Signature Digital Architect Style */}
        <div style={s.searchWrap}>
          <div style={s.searchIcon}><SearchIcon /></div>
          <input
            type="text"
            placeholder="Search agents, workflows, or logs... (Cmd + K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        {/* Action Icons */}
        <div style={s.actions}>
          <button style={s.iconBtn} aria-label="Notifications">
            <BellIcon />
            <div style={s.badge} />
          </button>
          <button style={s.iconBtn} aria-label="Help Center">
            <HelpIcon />
          </button>
          
          <div style={s.divider} />
          
          {/* Active Unit Badge */}
          <div style={s.unitBadge}>
            <div style={s.unitDot} />
            <span style={s.unitText}>US-EAST-1 ACTIVE</span>
          </div>

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
  topBar: {
    height: 72,
    background: "var(--background)",
    display: "flex",
    alignItems: "center",
    padding: "0 48px",
    position: "sticky",
    top: 0,
    zIndex: 900,
  },
  container: {
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchWrap: {
    position: "relative",
    width: 480,
    background: "var(--surface-bright)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    boxShadow: "var(--ambient-shadow)",
  },
  searchIcon: {
    color: "var(--on-surface-variant)",
    opacity: 0.5,
    marginRight: 12,
    display: "flex",
  },
  searchInput: {
    flex: 1,
    height: 44,
    background: "transparent",
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--on-surface)",
    outline: "none",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--on-surface-variant)",
    cursor: "pointer",
    position: "relative",
    transition: "background 150ms ease",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    background: "var(--error)",
    borderRadius: "50%",
    border: "2px solid var(--background)",
  },
  divider: {
    width: 1,
    height: 24,
    background: "var(--surface-container)",
    margin: "0 8px",
  },
  unitBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    borderRadius: 8,
    background: "var(--surface-container-low)",
  },
  unitDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--tertiary)",
    boxShadow: "0 0 8px var(--tertiary)",
  },
  unitText: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.06em",
    color: "var(--on-surface-variant)",
  },
  profileThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    boxShadow: "0 4px 12px rgba(30, 27, 75, 0.2)",
  },
};
