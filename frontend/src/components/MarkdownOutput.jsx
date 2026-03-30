export function parseInline(text, key) {
  const parts = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m, idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={`${key}-t${idx++}`}>{text.slice(last, m.index)}</span>);
    if (m[2]) parts.push(<strong key={`${key}-s${idx++}`}><em>{m[2]}</em></strong>);
    else if (m[3]) parts.push(<strong key={`${key}-b${idx++}`}>{m[3]}</strong>);
    else if (m[4]) parts.push(<em key={`${key}-i${idx++}`}>{m[4]}</em>);
    else if (m[5]) parts.push(<code key={`${key}-c${idx++}`} style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 3, fontSize: 11, color: "#0369a1", fontFamily: "monospace" }}>{m[5]}</code>);
    else if (m[6]) parts.push(<a key={`${key}-a${idx++}`} href={m[7]} target="_blank" rel="noreferrer" style={{ color: "#1a56db", textDecoration: "underline" }}>{m[6]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={`${key}-t${idx++}`}>{text.slice(last)}</span>);
  return parts.length ? parts : text;
}

// Light theme variant (for DryRunPanel, task outputs on white backgrounds)
export function MarkdownLight({ text }) {
  if (!text) return null;
  return (
    <div>
      {text.split("\n").map((line, i) => {
        if (/^### (.+)/.test(line)) return <h3 key={i} style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "10px 0 3px" }}>{parseInline(line.replace(/^### /, ""), i)}</h3>;
        if (/^## (.+)/.test(line)) return <h2 key={i} style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "12px 0 4px" }}>{parseInline(line.replace(/^## /, ""), i)}</h2>;
        if (/^# (.+)/.test(line)) return <h1 key={i} style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "14px 0 6px" }}>{parseInline(line.replace(/^# /, ""), i)}</h1>;
        if (/^> (.+)/.test(line)) return <blockquote key={i} style={{ borderLeft: "3px solid #cbd5e1", paddingLeft: 10, margin: "4px 0", color: "#64748b", fontSize: 12 }}>{parseInline(line.replace(/^> /, ""), i)}</blockquote>;
        if (/^[-*] (.+)/.test(line)) return <li key={i} style={{ fontSize: 12, color: "#334155", margin: "2px 0 2px 16px", lineHeight: 1.6 }}>{parseInline(line.replace(/^[-*] /, ""), i)}</li>;
        if (/^\d+\. (.+)/.test(line)) return <li key={i} style={{ fontSize: 12, color: "#334155", margin: "2px 0 2px 16px", lineHeight: 1.6, listStyleType: "decimal" }}>{parseInline(line.replace(/^\d+\. /, ""), i)}</li>;
        if (/^```/.test(line)) return null;
        if (line.trim() === "") return <br key={i} />;
        return <p key={i} style={{ fontSize: 12, color: "#334155", margin: "2px 0", lineHeight: 1.6 }}>{parseInline(line, i)}</p>;
      })}
    </div>
  );
}

// Dark theme variant (for RunHistory dark modal)
export default function MarkdownOutput({ text }) {
  if (!text) return null;
  return (
    <div>
      {text.split("\n").map((line, i) => {
        if (/^### (.+)/.test(line)) return <h3 key={i} style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0", margin: "12px 0 4px" }}>{parseInline(line.replace(/^### /, ""), i)}</h3>;
        if (/^## (.+)/.test(line)) return <h2 key={i} style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", margin: "14px 0 6px" }}>{parseInline(line.replace(/^## /, ""), i)}</h2>;
        if (/^# (.+)/.test(line)) return <h1 key={i} style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: "16px 0 8px" }}>{parseInline(line.replace(/^# /, ""), i)}</h1>;
        if (/^> (.+)/.test(line)) return <blockquote key={i} style={{ borderLeft: "3px solid #475569", paddingLeft: 10, margin: "4px 0", color: "#94a3b8", fontSize: 12 }}>{parseInline(line.replace(/^> /, ""), i)}</blockquote>;
        if (/^[-*] (.+)/.test(line)) return <li key={i} style={{ fontSize: 12, color: "#cbd5e1", margin: "2px 0 2px 16px", lineHeight: 1.6 }}>{parseInline(line.replace(/^[-*] /, ""), i)}</li>;
        if (/^\d+\. (.+)/.test(line)) return <li key={i} style={{ fontSize: 12, color: "#cbd5e1", margin: "2px 0 2px 16px", lineHeight: 1.6, listStyleType: "decimal" }}>{parseInline(line.replace(/^\d+\. /, ""), i)}</li>;
        if (/^```/.test(line)) return null;
        if (line.trim() === "") return <br key={i} />;
        return <p key={i} style={{ fontSize: 12, color: "#cbd5e1", margin: "2px 0", lineHeight: 1.6 }}>{parseInline(line, i)}</p>;
      })}
    </div>
  );
}
