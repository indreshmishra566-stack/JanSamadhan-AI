import { PRIORITY_COLORS, STATUS_COLORS, CATEGORY_ICONS } from "../../utils/helpers";
import { ArrowRight, ExternalLink, MapPin } from "lucide-react";

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
    <div className={`${s} border-2 border-cyan-100 border-t-cyan-500 rounded-full animate-spin`} />
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
    blue: "bg-cyan-50 text-cyan-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-sky-50 text-sky-700",
    red: "bg-rose-50 text-rose-700",
    purple: "bg-indigo-50 text-indigo-700",
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

export function LocationMap({ latitude, longitude, label = "Complaint location", className = "" }) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return (
      <div className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 ${className}`}>
        Map will appear after GPS coordinates are captured.
      </div>
    );
  }

  const delta = 0.004;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(",");
  const marker = `${lat},${lon}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
  const directionsUrl = `https://www.openstreetmap.org/directions?to=${encodeURIComponent(marker)}`;
  const viewUrl = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=18/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      <iframe
        title={label}
        src={mapUrl}
        className="h-56 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-xs">
        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
          <MapPin size={13} /> {lat.toFixed(6)}, {lon.toFixed(6)}
        </span>
        <div className="flex gap-2">
          <a href={viewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:underline">
            Open map <ExternalLink size={12} />
          </a>
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
            Directions <ExternalLink size={12} />
          </a>
        </div>
      </div>
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
    blue: "from-[#070b18] via-[#111a2e] to-[#1a2640]",
    emerald: "from-[#070b18] via-[#10233a] to-[#123449]",
    violet: "from-[#070b18] via-[#141d33] to-[#1f2d4a]",
  };

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${toneClasses[tone] || toneClasses.blue} p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] md:p-8`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_26%)]" />
      <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p> : null}
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
                  : "inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"}
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
    <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/85 p-2 shadow-sm">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={value === item.value
            ? "rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm"
            : "rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-cyan-50 hover:text-slate-800"}
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
