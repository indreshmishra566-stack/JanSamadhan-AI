export const PRIORITY_COLORS = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-cyan-50 text-cyan-700",
  HIGH: "bg-sky-100 text-sky-800",
  CRITICAL: "bg-rose-100 text-rose-700",
};

export const STATUS_COLORS = {
  PENDING: "bg-slate-100 text-slate-700",
  ASSIGNED: "bg-cyan-100 text-cyan-800",
  FORWARDED: "bg-sky-100 text-sky-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
  ESCALATED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const CATEGORY_ICONS = {
  ELECTRICITY: "⚡",
  WATER: "💧",
  SANITATION: "🗑️",
  ROADS: "🛣️",
  PUBLIC_SERVICES: "🏛️",
  HEALTH: "🏥",
  EDUCATION: "📚",
  OTHER: "📋",
};

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
