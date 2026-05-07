import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { officerApi } from "../../api";
import { PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState } from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function OfficerDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", officer_remarks: "", proof_of_resolution: null });
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["officer-complaints"],
    queryFn: () => officerApi.complaints().then((r) => r.data),
    refetchInterval: 60000,
  });

  const complaints = (data?.results || data || []).filter((c) => {
    if (filter === "active") return ["ASSIGNED", "IN_PROGRESS"].includes(c.status);
    if (filter === "resolved") return c.status === "RESOLVED";
    if (filter === "escalated") return c.status === "ESCALATED";
    return true;
  });

  const all = data?.results || data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => officerApi.update(id, fd),
    onSuccess: () => {
      qc.invalidateQueries(["officer-complaints"]);
      toast.success("Complaint updated!");
      setEditing(null);
    },
    onError: () => toast.error("Update failed"),
  });

  const handleUpdate = (id) => {
    const fd = new FormData();
    fd.append("status", editForm.status);
    fd.append("officer_remarks", editForm.officer_remarks);
    if (editForm.proof_of_resolution) fd.append("proof_of_resolution", editForm.proof_of_resolution);
    updateMutation.mutate({ id, fd });
  };

  const stats = [
    { label: "Total Assigned", value: all.length, icon: "📋", color: "blue" },
    { label: "In Progress", value: all.filter((c) => c.status === "IN_PROGRESS").length, icon: "🔄", color: "purple" },
    { label: "Resolved", value: all.filter((c) => c.status === "RESOLVED").length, icon: "✅", color: "green" },
    { label: "Escalated", value: all.filter((c) => c.status === "ESCALATED").length, icon: "🚨", color: "red" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Officer Dashboard</h1>
        <p className="text-gray-500 text-sm">
          {user?.department_name || "Department"} — {user?.first_name} {user?.last_name}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {["all", "active", "resolved", "escalated"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${filter === f ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : complaints.length === 0 ? (
        <EmptyState icon="🎉" title="No complaints here" description="Check another filter tab." />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} className="card p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl"><CategoryIcon category={c.category} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{c.title}</p>
                      <span className="text-xs font-mono text-gray-400">#{c.ticket_id}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{c.description}</p>
                    {c.location && (
                      <p className="text-xs text-gray-400 mt-1">📍 {c.location}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      {c.is_sla_breached && (
                        <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle size={10} /> SLA Breached
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
                  {c.sla_deadline && (
                    <p className={`text-xs flex items-center gap-1 ${c.is_sla_breached ? "text-red-600" : "text-gray-500"}`}>
                      <Clock size={11} />
                      SLA: {formatDate(c.sla_deadline)}
                    </p>
                  )}
                  {editing !== c.id && !["RESOLVED", "CLOSED"].includes(c.status) && (
                    <button
                      onClick={() => { setEditing(c.id); setEditForm({ status: c.status, officer_remarks: c.officer_remarks || "", proof_of_resolution: null }); }}
                      className="btn-primary text-xs py-1 px-3">
                      Update
                    </button>
                  )}
                </div>
              </div>

              {/* Citizen info */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-sm text-gray-500">
                <span>👤 {c.citizen_name}</span>
                <span>AI: {c.ai_category} ({Math.round(c.ai_confidence * 100)}%)</span>
              </div>

              {/* History */}
              {c.history?.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Last update: {c.history[0].new_status} — {formatDate(c.history[0].created_at)}
                </div>
              )}

              {/* Edit form */}
              {editing === c.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Update Status</label>
                      <select className="input text-sm" value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Upload Proof</label>
                      <input type="file" accept="image/*,application/pdf" className="input text-xs"
                        onChange={(e) => setEditForm({ ...editForm, proof_of_resolution: e.target.files[0] })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Officer Remarks</label>
                    <textarea className="input text-sm" rows={3}
                      value={editForm.officer_remarks}
                      onChange={(e) => setEditForm({ ...editForm, officer_remarks: e.target.value })}
                      placeholder="Describe action taken, findings, or reason..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(c.id)} disabled={updateMutation.isPending}
                      className="btn-primary text-sm flex items-center gap-1">
                      <CheckCircle size={14} />
                      {updateMutation.isPending ? "Saving..." : "Save Update"}
                    </button>
                    <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {/* Resolved proof */}
              {c.status === "RESOLVED" && c.proof_of_resolution && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a href={c.proof_of_resolution} target="_blank" rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline">📎 View proof of resolution</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
