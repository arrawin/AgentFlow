// Shared domain/agent color palette — consistent across all pages
export const DOMAIN_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#84cc16", // lime
];

export const getDomainColor = (index) => DOMAIN_COLORS[index % DOMAIN_COLORS.length];

// Build a map of { domainId: color } from a domains array
export const buildDomainColorMap = (domains) => {
  const map = {};
  domains.forEach((d, i) => { map[d.id] = getDomainColor(i); });
  return map;
};

// Get agent color from its domain
export const getAgentColor = (agent, domainColorMap) => {
  return domainColorMap[agent.domain_id] || "#6366f1";
};
