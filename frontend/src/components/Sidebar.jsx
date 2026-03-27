import { NavLink } from "react-router-dom";

// Components & Icons (Hoisted via function declaration or moved above)
function DashboardIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function AgentsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>;
}
function WorkflowsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function SchedulerIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function ToolsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
}
function LogsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function SettingsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 001 19.4a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}

const navItems = [
  { name: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { name: "Agents", path: "/agents", icon: <AgentsIcon /> },
  { name: "Workflows", path: "/tasks", icon: <WorkflowsIcon /> },
  { name: "Scheduler", path: "/scheduler", icon: <SchedulerIcon /> },
  { name: "Tools", path: "/tools", icon: <ToolsIcon /> },
  { name: "Logs", path: "/runs", icon: <LogsIcon /> },
  { name: "Settings", path: "/llm", icon: <SettingsIcon /> },
];

export default function Sidebar() {
  return (
    <aside style={s.sidebar}>
      {/* Brand Section */}
      <div style={s.brand}>
        <div style={s.logoWrap}>
          <div style={s.logo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={s.brandTitle}>AgentFlow</div>
            <div style={s.brandSub}>AI MANAGEMENT</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={s.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              ...s.navLink,
              ...(isActive ? s.navLinkActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && <div style={s.activeBar} />}
                <span style={{ ...s.icon, color: isActive ? "var(--secondary)" : "var(--on-surface-variant)" }}>
                  {item.icon}
                </span>
                <span style={{ fontWeight: isActive ? 600 : 500 }}>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile */}
      <div style={s.footer}>
        <div style={s.footerLinks}>
          <a href="#" style={s.footerLink}>Help</a>
        </div>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width: 240,
    background: "var(--background)", 
    display: "flex",
    flexDirection: "column",
    padding: "32px 16px",
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
  },
  brand: {
    padding: "0 12px",
    marginBottom: 40,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 800,
    fontFamily: "'Manrope', sans-serif",
    color: "var(--on-surface)",
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--secondary)",
    marginTop: 2,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    color: "var(--on-surface-variant)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
    position: "relative",
    transition: "all 150ms ease",
  },
  navLinkActive: {
    background: "var(--surface-container-low)",
    color: "var(--secondary)",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: "15%",
    height: "70%",
    width: 3,
    backgroundColor: "var(--secondary)",
    borderRadius: 4,
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "0 8px",
  },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px",
    borderRadius: 12,
    background: "var(--surface-bright)",
    boxShadow: "var(--ambient-shadow)",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "var(--surface-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--on-surface-variant)",
  },
  profileInfo: {},
  profileName: { fontSize: 13, fontWeight: 700, color: "var(--on-surface)", lineHeight: 1.1 },
  profileSub: { fontSize: 11, color: "var(--on-surface-variant)", marginTop: 2 },
  upgradeBtn: {
    background: "var(--secondary)",
    color: "#fff",
    padding: "10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    width: "100%",
    boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)",
  },
  footerLinks: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 4px",
  },
  footerLink: {
    fontSize: 12,
    color: "var(--on-surface-variant)",
    textDecoration: "none",
    fontWeight: 500,
  },
};
