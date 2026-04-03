import { NavLink } from "react-router-dom";

function DashboardIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function AgentsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Robot head */}
      <rect x="4" y="8" width="16" height="11" rx="2"/>
      {/* Antenna */}
      <line x1="12" y1="8" x2="12" y2="4"/>
      <circle cx="12" cy="3" r="1"/>
      {/* Eyes */}
      <circle cx="9" cy="13" r="1.5"/>
      <circle cx="15" cy="13" r="1.5"/>
      {/* Mouth */}
      <line x1="9" y1="17" x2="15" y2="17"/>
      {/* Ears */}
      <line x1="4" y1="12" x2="2" y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
    </svg>
  );
}
function WorkflowsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function SchedulerIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function ToolsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>; }
function LogsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/", icon: <DashboardIcon /> },
    ]
  },
  {
    label: "BUILD",
    items: [
      { name: "Agents",    path: "/agents",    icon: <AgentsIcon /> },
      { name: "Tools",     path: "/tools",     icon: <ToolsIcon /> },
      { name: "Tasks",     path: "/tasks",     icon: <WorkflowsIcon /> },
    ]
  },
  {
    label: "AUTOMATE",
    items: [
      { name: "Scheduler", path: "/scheduler", icon: <SchedulerIcon /> },
    ]
  },
  {
    label: "MONITOR",
    items: [
      { name: "Run History", path: "/runs", icon: <LogsIcon /> },
    ]
  },
  {
    label: "CONFIGURE",
    items: [
      { name: "LLM Settings", path: "/llm", icon: <SettingsIcon /> },
    ]
  },
];

export const SIDEBAR_EXPANDED  = 220;
export const SIDEBAR_COLLAPSED = 60;

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside style={{ ...s.sidebar, width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}>

      {/* Logo */}
      <div style={{ ...s.logoRow, justifyContent: collapsed ? "center" : "flex-start" }}>
        <div style={s.logoBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={s.brandTitle}>AgentFlow</div>
            <div style={s.brandSub}>AI MANAGEMENT</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {navGroups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div style={s.divider} />}
            {!collapsed && <div style={s.groupLabel}>{group.label}</div>}
            {group.items.map(item => (
              <NavLink key={item.name} to={item.path} title={item.name}
                style={({ isActive }) => ({
                  ...s.link,
                  ...(isActive ? s.linkActive : {}),
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px 0" : "10px 12px",
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div style={s.activeBar} />}
                    <span style={{ ...s.iconWrap, color: isActive ? "var(--secondary)" : "var(--on-surface-variant)" }}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden" }}>
                        {item.name}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle — always at bottom */}
      <div style={{ marginTop: "auto" }}>
        <button style={{ ...s.toggleBtn, justifyContent: collapsed ? "center" : "flex-start" }} onClick={onToggle}>
          <span style={s.iconWrap}>
            {collapsed
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            }
          </span>
          {!collapsed && <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Collapse</span>}
        </button>
      </div>

    </aside>
  );
}

const s = {
  sidebar: {
    background: "var(--background)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 10px 20px",
    position: "fixed",
    top: 0, bottom: 0, left: 0,
    zIndex: 1000,
    transition: "width 220ms ease",
    overflow: "hidden",
    borderRight: "1px solid var(--outline)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
    paddingLeft: 2,
  },
  logoBox: {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandTitle: { fontSize: 15, fontWeight: 800, color: "var(--on-surface)", lineHeight: 1.2 },
  brandSub: { fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "var(--secondary)", marginTop: 2 },
  nav: { display: "flex", flexDirection: "column", gap: 1 },
  groupLabel: { fontSize: 9, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.1em", padding: "10px 12px 4px", opacity: 0.6 },
  divider: { height: 1, background: "var(--outline)", margin: "8px 4px" },
  link: {
    display: "flex", alignItems: "center", gap: 10,
    borderRadius: 8, textDecoration: "none",
    color: "var(--on-surface-variant)",
    position: "relative", transition: "background 150ms",
  },
  linkActive: { background: "var(--surface-container-low)", color: "var(--secondary)" },
  activeBar: {
    position: "absolute", left: 0, top: "15%", height: "70%",
    width: 3, background: "var(--secondary)", borderRadius: 4,
  },
  iconWrap: { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 20 },
  toggleBtn: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "10px 12px", borderRadius: 8,
    background: "transparent", border: "none",
    color: "var(--on-surface-variant)", cursor: "pointer",
    fontSize: 12, transition: "background 150ms",
  },
};
