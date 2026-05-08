import { PRIORITY_COLORS, STATUS_COLORS, CATEGORY_ICONS } from "../../utils/helpers";

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-700"}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export function CategoryIcon({ category }) {
  return <span title={category}>{CATEGORY_ICONS[category] || "📋"}</span>;
}

export function LoadingSpinner({ size = "md" }) {
  const s = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";
  return (
    <div className={`${s} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon || "📭"}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon, color = "blue", sub }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{label}</p>
        <span className={`p-1.5 rounded-lg text-lg ${colors[color]}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export function InfoSection({ title, icon, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-gray-50/70 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-sm">{icon}</span>}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function DetailItem({ label, value, accent = false }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-sm mt-1 ${accent ? "font-semibold text-gray-900" : "text-gray-700"}`}>{value || "—"}</p>
    </div>
  );
}

export function TimelineList({ items, emptyText = "No timeline events yet." }) {
  if (!items?.length) {
    return <p className="text-sm text-gray-400">{emptyText}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          {item.top && <div className="text-xs font-semibold text-gray-700 mb-1">{item.top}</div>}
          {item.middle && <div className="text-sm text-gray-700">{item.middle}</div>}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            {item.note && <span className="truncate">{item.note}</span>}
            {item.date && <span className="ml-auto shrink-0">{item.date}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export { default as NotificationsPanel } from "./NotificationsPanel";
