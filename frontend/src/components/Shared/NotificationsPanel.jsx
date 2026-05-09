import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../../api";
import { timeAgo } from "../../utils/helpers";

const TYPE_COLORS = {
  ASSIGNED: "bg-cyan-100 text-cyan-700",
  STATUS_UPDATE: "bg-indigo-100 text-indigo-700",
  SLA_BREACH: "bg-rose-100 text-rose-700",
  ESCALATION: "bg-sky-100 text-sky-700",
  FORWARDED: "bg-slate-100 text-slate-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

const TYPE_ICONS = {
  ASSIGNED: "📋",
  STATUS_UPDATE: "🔄",
  SLA_BREACH: "🚨",
  ESCALATION: "⬆️",
  FORWARDED: "➡️",
  RESOLVED: "✅",
};

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list().then((r) => r.data),
    refetchInterval: 30000,
  });

  const notifications = data?.results || data || [];
  const unread = notifications.filter((n) => !n.is_read);

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries(["notifications"]),
  });

  const markAllRead = () => {
    unread.forEach((n) => markReadMutation.mutate(n.id));
  };

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
              {unread.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {unread.length} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-cyan-600 hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-0.5 hover:bg-gray-200 rounded text-gray-400">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !n.is_read ? "bg-cyan-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">{TYPE_ICONS[n.notification_type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!n.is_read ? "text-gray-900" : "text-gray-600"}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-cyan-500 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLORS[n.notification_type] || "bg-gray-100 text-gray-600"}`}>
                          {n.notification_type?.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
