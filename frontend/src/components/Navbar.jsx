import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/agents", label: "Agents" },
  { to: "/tasks", label: "Tasks" },
  { to: "/llm", label: "LLM Settings" },
  { to: "/tools", label: "Tools" },
  { to: "/scheduler", label: "Scheduler" },
  { to: "/runs", label: "Run History" },
];

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>AgentFlow</div>
      <div style={styles.links}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.active : {}),
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", alignItems: "center", gap: 24,
    background: "#0f172a", borderBottom: "1px solid #1e293b",
    padding: "0 24px", height: 52, position: "sticky", top: 0, zIndex: 100,
  },
  brand: { fontWeight: 700, fontSize: 16, color: "#60a5fa", marginRight: 16 },
  links: { display: "flex", gap: 4 },
  link: {
    color: "#94a3b8", textDecoration: "none", fontSize: 13,
    padding: "6px 12px", borderRadius: 6,
  },
  active: { color: "#f1f5f9", background: "#1e293b" },
};
