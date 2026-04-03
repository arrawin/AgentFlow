import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => String(o.value) === String(value)) || options[0];

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--surface-bright)", border: isOpen ? "1px solid var(--primary)" : "1px solid var(--outline)",
          borderRadius: 8, padding: "7px 12px", fontSize: 13, cursor: "pointer",
          boxShadow: isOpen ? "0 0 0 3px rgba(26,86,219,0.10)" : "none",
          transition: "all 150ms",
          color: "var(--on-surface)"
        }}
      >
        <span style={{ fontWeight: 600 }}>{selectedOpt?.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
          background: "var(--surface-bright)", border: "1px solid var(--outline)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(15,23,42,0.12)",
          maxHeight: 250, overflowY: "auto", zIndex: 100,
          display: "flex", flexDirection: "column", padding: 4
        }}>
          {options.map(opt => {
            const isSelected = String(value) === String(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                onMouseEnter={(e) => { if(!isSelected) e.target.style.background = "var(--surface-container-low)"; }}
                onMouseLeave={(e) => { if(!isSelected) e.target.style.background = "transparent"; }}
                style={{
                  padding: "8px 12px", fontSize: 13, cursor: "pointer", borderRadius: 4,
                  color: isSelected ? "var(--primary)" : "var(--on-surface)",
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? "var(--surface-container)" : "transparent",
                  transition: "background 100ms"
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
