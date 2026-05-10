import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, MapPinned, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { complaintApi } from "../api";
import { StatusBadge, PriorityBadge, InfoSection, DetailItem, TimelineList } from "../components/Shared";
import { formatDate } from "../utils/helpers";
import { getPortalLanguage, setPortalLanguage, getPublicText } from "../i18n/public";
import { PublicShell } from "./PublicPortal";

export default function TrackComplaint() {
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getPortalLanguage());
  const content = getPublicText(language);
  const common = content.common;
  const text = content.track;

  const handleLanguageChange = (next) => {
    setLanguage(next);
    setPortalLanguage(next);
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setLoading(true);
    try {
      const { data } = await complaintApi.track(ticketId.trim().toUpperCase());
      setResult(data);
    } catch {
      toast.error(text.notFound);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicShell language={language} setLanguage={handleLanguageChange}>
      <main className="portal-entry-page">
        <section className="portal-entry-info">
          <p className="portal-entry-kicker">{common.livePlatform}</p>
          <h2>{text.description}</h2>
          <div className="portal-entry-badges">
            {text.badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <div className="portal-entry-points">
            {[
              { icon: Search, ...text.points[0] },
              { icon: MapPinned, ...text.points[1] },
              { icon: ShieldCheck, ...text.points[2] },
            ].map((point) => (
              <article key={point.title}>
                <point.icon size={18} />
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="portal-entry-card portal-entry-card-wide">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-indigo-900/20">
              JS
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{text.trackTitle}</h1>
            <p className="text-sm text-gray-500">{text.noLogin}</p>
          </div>

          <form onSubmit={handleTrack} className="mb-6 flex gap-2">
            <input
              className="input flex-1"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder={text.ticketPlaceholder}
              maxLength={12}
            />
            <button type="submit" disabled={loading} className="btn-primary px-5 shadow-lg shadow-blue-600/20">
              {loading ? "..." : text.track}
            </button>
          </form>

      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-sm font-semibold text-blue-700">#{result.ticket_id}</span>
              <StatusBadge status={result.status} />
            </div>
            <h2 className="mb-3 font-semibold text-gray-900">{result.title}</h2>
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {result.assigned_officer && (
                <span className={`badge ${result.status === "ESCALATED" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}>
                  {result.status === "ESCALATED"
                    ? `${text.escalatedOfficer}: ${result.assigned_officer}`
                    : `${text.assignedOfficer}: ${result.assigned_officer}`}
                </span>
              )}
              {result.supervising_head && (
                <span className="badge bg-indigo-50 text-indigo-700">{text.head}: {result.supervising_head}</span>
              )}
              {result.department && (
                <span className="badge bg-blue-50 text-blue-700">{text.department}: {result.department}</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <InfoSection title={text.routing} icon="🧭" className="bg-white/70">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem label={text.department} value={result.department || text.beingAssigned} accent />
                  <DetailItem label={text.currentLevel} value={result.current_level} accent />
                  <DetailItem label={text.assignedLocalOfficer} value={result.assigned_officer || text.beingAssigned} />
                  <DetailItem label={text.supervisingHead} value={result.supervising_head || text.willMonitor} />
                  <DetailItem label={text.state} value={result.state} />
                  <DetailItem label={text.district} value={result.district} />
                  <DetailItem label={text.block} value={result.block} />
                  <DetailItem label={text.address} value={result.location} />
                  <DetailItem label={text.coordinates} value={result.latitude && result.longitude ? `${result.latitude}, ${result.longitude}` : ""} />
                </div>
              </InfoSection>

              <InfoSection title={text.status} icon="📌" className="bg-white/70">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem label={text.category} value={result.category} accent />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">{text.priority}</p>
                    <div className="mt-1">
                      <PriorityBadge priority={result.priority} />
                    </div>
                  </div>
                  <DetailItem label={text.sla} value={`${formatDate(result.sla_deadline)}${result.is_sla_breached ? " ⚠️ Breached" : ""}`} />
                  <DetailItem label={text.submitted} value={formatDate(result.created_at)} />
                  <DetailItem label={text.updated} value={formatDate(result.updated_at)} />
                  <DetailItem label={text.originalLanguage} value={result.original_language?.toUpperCase()} />
                  <DetailItem label={text.resolved} value={formatDate(result.resolved_at)} />
                  <DetailItem
                    label={text.duplicateStatus}
                    value={result.is_duplicate ? `${text.duplicateOf} #${result.duplicate_of || "master complaint"}` : text.primaryComplaint}
                  />
                </div>

                {result.translated_description && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">{text.translatedDescription}</p>
                    <p className="text-gray-700">{result.translated_description}</p>
                  </div>
                )}

                {result.officer_remarks && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm">
                    <span className="font-medium text-blue-700">{text.latestOfficerRemarks}:</span> {result.officer_remarks}
                  </div>
                )}

                {(result.citizen_rating || result.citizen_feedback) && (
                  <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm">
                    <p className="mb-1 font-medium text-green-700">{text.closureFeedback}</p>
                    {result.citizen_rating ? <p>{text.rating}: {"★".repeat(result.citizen_rating)}</p> : null}
                    {result.citizen_feedback ? <p className="mt-1 text-gray-700">{result.citizen_feedback}</p> : null}
                  </div>
                )}
              </InfoSection>

              <InfoSection title={text.timeline} icon="🕒" className="bg-white/70">
                <TimelineList
                  items={(result.forwarding_trail || []).map((item) => ({
                    top: `${item.action} · ${item.from_level} → ${item.to_level}`,
                    middle: `${item.from} → ${item.to}`,
                    note: item.note,
                    date: formatDate(item.date),
                  }))}
                  emptyText={text.emptyTimeline}
                />
              </InfoSection>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge bg-green-50 text-green-700">{text.assignedOfficer}</span>
            <span className="badge bg-orange-50 text-orange-700">{text.escalatedOfficer}</span>
            <span className="badge bg-indigo-50 text-indigo-700">{text.head}</span>
            <span className="badge bg-blue-50 text-blue-700">{text.department}</span>
          </div>

          <div className="flex items-center gap-2 text-center text-xs">
            {["PENDING", "DEPARTMENT", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((stepLabel, index) => {
              const statuses = ["PENDING", "DEPARTMENT", "ASSIGNED", "FORWARDED", "ESCALATED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
              const current = statuses.indexOf(result.status);
              const currentLevel = result.current_level === "DEPARTMENT" && ["ASSIGNED", "FORWARDED"].includes(result.status)
                ? statuses.indexOf("DEPARTMENT")
                : current;
              const step = statuses.indexOf(stepLabel);
              const done = step <= currentLevel || (stepLabel === "ASSIGNED" && ["ASSIGNED", "FORWARDED", "ESCALATED", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(result.status));

              return (
                <div key={stepLabel} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${done ? "bg-blue-600" : "bg-gray-200 text-gray-400"}`}>
                    {done ? "✓" : index + 1}
                  </div>
                  <p className={`text-xs leading-tight ${done ? "font-medium text-blue-700" : "text-gray-400"}`}>
                    {stepLabel === "DEPARTMENT" ? "NODAL" : stepLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="text-blue-600 hover:underline">← {text.backToLogin}</Link>
      </p>
          <div className="portal-entry-footer-link">
            <strong>{text.needMore}</strong>{" "}
            <Link to="/register">{text.openRegistration} →</Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
