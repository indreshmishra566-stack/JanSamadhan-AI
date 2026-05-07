import { useState } from "react";
import { complaintApi } from "../api";
import { StatusBadge, PriorityBadge } from "../components/Shared";
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
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Category</p>
                  <p className="font-medium">{result.category}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Priority</p>
                  <PriorityBadge priority={result.priority} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Department</p>
                  <p className="font-medium">{result.department || "Being assigned"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">SLA Deadline</p>
                  <p className={`font-medium text-xs ${result.is_sla_breached ? "text-red-600" : ""}`}>
                    {formatDate(result.sla_deadline)}
                    {result.is_sla_breached && " ⚠️ Breached"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Submitted</p>
                  <p className="font-medium text-xs">{formatDate(result.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Last Updated</p>
                  <p className="font-medium text-xs">{formatDate(result.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="flex items-center gap-2 text-xs text-center">
              {["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((s, i) => {
                const statuses = ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
                const current = statuses.indexOf(result.status);
                const step = statuses.indexOf(s);
                const done = step <= current;
                return (
                  <div key={s} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${done ? "bg-blue-600" : "bg-gray-200 text-gray-400"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs leading-tight ${done ? "text-blue-700 font-medium" : "text-gray-400"}`}>{s}</p>
                    {i < 3 && <div className={`absolute h-0.5 w-full ${done ? "bg-blue-300" : "bg-gray-200"}`} />}
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
