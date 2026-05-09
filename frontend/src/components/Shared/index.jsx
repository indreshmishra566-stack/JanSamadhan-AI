import { PRIORITY_COLORS, STATUS_COLORS, CATEGORY_ICONS } from "../../utils/helpers";
import { ArrowRight } from "lucide-react";

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

export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  badges = [],
  actions = [],
  tone = "blue",
}) {
  const toneClasses = {
    blue: "from-slate-950 via-blue-900 to-indigo-800",
    emerald: "from-slate-950 via-emerald-900 to-cyan-700",
    violet: "from-slate-950 via-indigo-900 to-violet-800",
  };

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${toneClasses[tone] || toneClasses.blue} p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] md:p-8`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_26%)]" />
      <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">{eyebrow}</p> : null}
          <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">{subtitle}</p> : null}
          {badges.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span key={badge} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={action.variant === "secondary"
                  ? "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                  : "inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"}
              >
                {action.label}
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TabPills({ value, onChange, items }) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={value === item.value
            ? "rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            : "rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export { default as NotificationsPanel } from "./NotificationsPanel";
export { default as ProfilePanel } from "./ProfilePanel";
export { default as PortalEntryShell } from "./PortalEntryShell";
