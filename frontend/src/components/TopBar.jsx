import { useState, useEffect, useRef } from "react";
import api from "../api/client";

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function BellIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}

const STATUS_COLORS = {
  completed: "#10b981",
  failed: "#ef4444",
  in_progress: "#f59e0b",
  not_started: "#94a3b8",
};

export default function TopBar() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [tasks, setTasks] = useState([]);
  const lastSeenAt = useRef(null);
  const dropdownRef = useRef(null);

  const fetchRuns = () => {
    api.get("/runs").then(r => {
      const scheduled = r.data.filter(run => run.triggered_by === "scheduler").slice(0, 10);
      setNotifications(scheduled);
      // Only badge runs newer than last time the dropdown was opened
      const newCount = scheduled.filter(run => {
        if (!lastSeenAt.current) return false; // no badge on first load
        return new Date(run.started_at) > lastSeenAt.current;
      }).length;
      setUnread(newCount);
    }).catch(() => {});
  };

  useEffect(() => {
    api.get("/tasks").then(r => setTasks(r.data)).catch(() => {});
    fetchRuns();
    const interval = setInterval(fetchRuns, 30000);
    return () => clearInterval(interval);
  }, []); // runs once — no dependency churn

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getTaskName = (taskId) => {
    const t = tasks.find(t => t.id === taskId);
    return t ? t.name : `Task #${taskId}`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

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
          {/* Bell */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button style={s.iconBtn} onClick={() => {
              setOpen(o => !o);
              setUnread(0);
              lastSeenAt.current = new Date();
            }}>
              <BellIcon />
              {unread > 0 && <div style={s.badge}>{unread}</div>}
            </button>

            {open && (
              <div style={s.dropdown}>
                <div style={s.dropHeader}>
                  <span style={s.dropTitle}>Scheduled Runs</span>
                  <span style={s.dropCount}>{notifications.length}</span>
                </div>
                {notifications.length === 0 ? (
                  <div style={s.dropEmpty}>No scheduled runs yet.</div>
                ) : notifications.map(run => (
                  <div key={run.id} style={s.dropItem}>
                    <div style={{ ...s.statusDot, background: STATUS_COLORS[run.status] || "#94a3b8" }} />
                    <div style={s.dropItemBody}>
                      <div style={s.dropItemName}>{getTaskName(run.task_id)}</div>
                      <div style={s.dropItemMeta}>
                        <span style={{ ...s.statusLabel, color: STATUS_COLORS[run.status] }}>{run.status}</span>
                        <span style={s.dropItemTime}>{formatTime(run.started_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={s.dropFooter}>
                  <a href="/runs" style={s.dropFooterLink}>View all in Run History →</a>
                </div>
              </div>
            )}
          </div>

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
  iconBtn: { width: 48, height: 48, borderRadius: 12, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--on-surface-variant)", cursor: "pointer", position: "relative" },
  badge: { position: "absolute", top: 6, right: 6, minWidth: 16, height: 16, background: "#ef4444", borderRadius: 8, border: "2px solid var(--background)", fontSize: 9, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" },
  divider: { width: 1, height: 24, background: "var(--surface-container)", margin: "0 4px" },
  profileThumb: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4, boxShadow: "0 4px 12px rgba(30,27,75,0.2)" },

  // Dropdown
  dropdown: { position: "absolute", top: 48, right: 0, width: 300, background: "var(--surface-bright)", borderRadius: 14, boxShadow: "0 8px 32px rgba(15,23,42,0.15)", border: "1px solid var(--outline)", zIndex: 1000, overflow: "hidden" },
  dropHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px", borderBottom: "1px solid var(--surface-container-low)" },
  dropTitle: { fontSize: 12, fontWeight: 800, color: "var(--on-surface)", letterSpacing: "0.04em" },
  dropCount: { fontSize: 10, fontWeight: 800, background: "var(--secondary-container)", color: "var(--on-secondary-container)", padding: "2px 8px", borderRadius: 10 },
  dropEmpty: { padding: "24px 16px", textAlign: "center", fontSize: 12, color: "var(--on-surface-variant)" },
  dropItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--surface-container-low)" },
  statusDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 4 },
  dropItemBody: { flex: 1, minWidth: 0 },
  dropItemName: { fontSize: 13, fontWeight: 600, color: "var(--on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dropItemMeta: { display: "flex", alignItems: "center", gap: 8, marginTop: 3 },
  statusLabel: { fontSize: 10, fontWeight: 700, textTransform: "capitalize" },
  dropItemTime: { fontSize: 10, color: "var(--on-surface-variant)" },
  dropFooter: { padding: "10px 16px" },
  dropFooterLink: { fontSize: 12, fontWeight: 700, color: "var(--secondary)", textDecoration: "none" },
};
