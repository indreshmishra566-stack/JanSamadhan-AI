import { useState } from "react";
import { complaintApi } from "../api";
import { StatusBadge, PriorityBadge, InfoSection, DetailItem, TimelineList } from "../components/Shared";
import { formatDate } from "../utils/helpers";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function TrackComplaint() {
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setLoading(true);
    try {
      const { data } = await complaintApi.track(ticketId.trim().toUpperCase());
      setResult(data);
    } catch {
      toast.error("Ticket not found. Please check the ID.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-2">JS</div>
          <h1 className="text-xl font-bold text-gray-900">Track Your Complaint</h1>
          <p className="text-gray-500 text-sm">No login required</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2 mb-6">
          <input
            className="input flex-1"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Enter Ticket ID (e.g. JSAB12CD)"
            maxLength={12}
          />
          <button type="submit" disabled={loading} className="btn-primary px-5">
            {loading ? "..." : "Track"}
          </button>
        </form>

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-semibold text-blue-700">#{result.ticket_id}</span>
                <StatusBadge status={result.status} />
              </div>
              <h2 className="font-semibold text-gray-900 mb-3">{result.title}</h2>
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                {result.assigned_officer && (
                  <span className={`badge ${result.status === "ESCALATED" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}>
                    {result.status === "ESCALATED" ? `Escalated Officer: ${result.assigned_officer}` : `Assigned Officer: ${result.assigned_officer}`}
                  </span>
                )}
                {result.supervising_head && (
                  <span className="badge bg-indigo-50 text-indigo-700">Head: {result.supervising_head}</span>
                )}
                {result.department && (
                  <span className="badge bg-blue-50 text-blue-700">Department: {result.department}</span>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <InfoSection title="Routing" icon="🧭" className="bg-white/70">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailItem label="Department" value={result.department || "Being assigned"} accent />
                    <DetailItem label="Current Level" value={result.current_level} accent />
                    <DetailItem label="Assigned Local Officer" value={result.assigned_officer || "Being assigned"} />
                    <DetailItem label="Supervising Department Head" value={result.supervising_head || "Will monitor once assigned"} />
                    <DetailItem label="State" value={result.state} />
                    <DetailItem label="District" value={result.district} />
                    <DetailItem label="Block / Area" value={result.block} />
                    <DetailItem label="Address" value={result.location} />
                    <DetailItem label="Coordinates" value={result.latitude && result.longitude ? `${result.latitude}, ${result.longitude}` : ""} />
                  </div>
                </InfoSection>
                <InfoSection title="Status" icon="📌" className="bg-white/70">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailItem label="Category" value={result.category} accent />
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">Priority</p>
                      <div className="mt-1"><PriorityBadge priority={result.priority} /></div>
                    </div>
                    <DetailItem label="SLA Deadline" value={`${formatDate(result.sla_deadline)}${result.is_sla_breached ? " ⚠️ Breached" : ""}`} />
                    <DetailItem label="Submitted" value={formatDate(result.created_at)} />
                    <DetailItem label="Last Updated" value={formatDate(result.updated_at)} />
                    <DetailItem label="Original Language" value={result.original_language?.toUpperCase()} />
                    <DetailItem label="Resolved" value={formatDate(result.resolved_at)} />
                    <DetailItem label="Duplicate Status" value={result.is_duplicate ? `Duplicate of #${result.duplicate_of || "master complaint"}` : "Primary complaint"} />
                  </div>
                  {result.translated_description && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-sm">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Translated Description</p>
                      <p className="text-gray-700">{result.translated_description}</p>
                    </div>
                  )}
                  {result.officer_remarks && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                      <span className="font-medium text-blue-700">Latest officer remarks:</span> {result.officer_remarks}
                    </div>
                  )}
                  {(result.citizen_rating || result.citizen_feedback) && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                      <p className="font-medium text-green-700 mb-1">Citizen closure feedback</p>
                      {result.citizen_rating ? <p>Rating: {"★".repeat(result.citizen_rating)}</p> : null}
                      {result.citizen_feedback ? <p className="mt-1 text-gray-700">{result.citizen_feedback}</p> : null}
                    </div>
                  )}
                </InfoSection>
                <InfoSection title="Timeline" icon="🕒" className="bg-white/70">
                  <TimelineList
                    items={(result.forwarding_trail || []).map((item) => ({
                      top: `${item.action} · ${item.from_level} → ${item.to_level}`,
                      middle: `${item.from} → ${item.to}`,
                      note: item.note,
                      date: formatDate(item.date),
                    }))}
                    emptyText="Routing and escalation updates will appear here."
                  />
                </InfoSection>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge bg-green-50 text-green-700">Assigned Officer</span>
              <span className="badge bg-orange-50 text-orange-700">Escalated Officer</span>
              <span className="badge bg-indigo-50 text-indigo-700">Head</span>
              <span className="badge bg-blue-50 text-blue-700">Department</span>
            </div>
            {/* Status timeline */}
            <div className="flex items-center gap-2 text-xs text-center">
              {["PENDING", "DEPARTMENT", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((s, i) => {
                const statuses = ["PENDING", "DEPARTMENT", "ASSIGNED", "FORWARDED", "ESCALATED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
                const current = statuses.indexOf(result.status);
                const currentLevel = result.current_level === "DEPARTMENT" && ["ASSIGNED", "FORWARDED"].includes(result.status)
                  ? statuses.indexOf("DEPARTMENT")
                  : current;
                const step = statuses.indexOf(s);
                const done = step <= currentLevel || (s === "ASSIGNED" && ["ASSIGNED", "FORWARDED", "ESCALATED", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(result.status));
                return (
                  <div key={s} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${done ? "bg-blue-600" : "bg-gray-200 text-gray-400"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs leading-tight ${done ? "text-blue-700 font-medium" : "text-gray-400"}`}>{s === "DEPARTMENT" ? "NODAL" : s}</p>
                    {i < 4 && <div className={`absolute h-0.5 w-full ${done ? "bg-blue-300" : "bg-gray-200"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-blue-600 hover:underline">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
