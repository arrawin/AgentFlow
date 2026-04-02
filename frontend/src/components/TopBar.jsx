import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const SEEN_KEY = "notif_last_seen_run_id";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TopBar() {
  const [search, setSearch] = useState("");
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/notifications");
      const data = res.data;
      setNotifs(data);
      const lastSeen = parseInt(localStorage.getItem(SEEN_KEY) || "0");
      const latestId = data[0]?.run_id || 0;
      setHasNew(latestId > lastSeen);
    } catch { }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open && notifs.length > 0) {
      // Mark as seen
      localStorage.setItem(SEEN_KEY, String(notifs[0].run_id));
      setHasNew(false);
    }
  };

  return (
    <header style={s.topBar}>
      <div style={s.container}>
        <div style={s.searchWrap}>
          <div style={s.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input type="text" placeholder="Search agents, workflows, or logs..."
            value={search} onChange={e => setSearch(e.target.value)} style={s.searchInput} />
        </div>

        <div style={s.actions}>
          {/* Bell */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button style={s.bellBtn} onClick={handleOpen}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {hasNew && <span style={s.redDot} />}
            </button>

            {open && (
              <div style={s.dropdown}>
                <div style={s.dropdownHeader}>
                  <span style={s.dropdownTitle}>Notifications</span>
                  {hasNew && <span style={s.newBadge}>New</span>}
                </div>
                {notifs.length === 0 ? (
                  <div style={s.empty}>No recent runs</div>
                ) : notifs.map(n => (
                  <div key={n.run_id} style={s.notifItem}>
                    <div style={{ ...s.statusDot, background: n.status === "completed" ? "#059669" : "#dc2626" }} />
                    <div style={s.notifBody}>
                      <div style={s.notifTask}>{n.task_name}</div>
                      <div style={s.notifMeta}>
                        <span style={{ ...s.statusPill, background: n.status === "completed" ? "#dcfce7" : "#fef2f2", color: n.status === "completed" ? "#059669" : "#dc2626" }}>
                          {n.status}
                        </span>
                        <span style={s.notifTime}>{timeAgo(n.ended_at)}</span>
                        <span style={s.notifTrigger}>{n.triggered_by}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button style={s.viewAllBtn} onClick={() => { setOpen(false); navigate("/runs"); }}>
                  View Run History →
                </button>
              </div>
            )}
          </div>

          <div style={s.divider} />
          <div style={s.profileThumb}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
  bellBtn: { position: "relative", background: "none", border: "none", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 },
  redDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#dc2626", border: "2px solid var(--background)" },
  dropdown: { position: "absolute", top: 44, right: 0, width: 320, background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(15,23,42,0.14)", border: "1px solid var(--outline)", zIndex: 1000, overflow: "hidden" },
  dropdownHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--outline)" },
  dropdownTitle: { fontSize: 13, fontWeight: 800, color: "var(--on-surface)" },
  newBadge: { fontSize: 9, fontWeight: 800, background: "#dc2626", color: "#fff", padding: "2px 7px", borderRadius: 10 },
  empty: { padding: "24px 16px", fontSize: 12, color: "var(--on-surface-variant)", textAlign: "center" },
  notifItem: { display: "flex", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--outline)", alignItems: "flex-start", transition: "background 150ms" },
  statusDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 4 },
  notifBody: { flex: 1, minWidth: 0 },
  notifTask: { fontSize: 13, fontWeight: 700, color: "var(--on-surface)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  notifMeta: { display: "flex", alignItems: "center", gap: 6 },
  statusPill: { fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10 },
  notifTime: { fontSize: 11, color: "var(--on-surface-variant)" },
  notifTrigger: { fontSize: 10, color: "var(--on-surface-variant)", opacity: 0.7 },
  viewAllBtn: { width: "100%", padding: "11px 16px", background: "var(--surface-container-low)", border: "none", borderTop: "1px solid var(--outline)", fontSize: 12, fontWeight: 700, color: "var(--on-surface-variant)", cursor: "pointer", textAlign: "left" },
  profileThumb: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4, boxShadow: "0 4px 12px rgba(30,27,75,0.2)" },
};
