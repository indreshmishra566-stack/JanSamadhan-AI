import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hierarchyApi, departmentApi } from "../../api";
import {
  PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState,
} from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import {
  ArrowUpCircle, ArrowDownCircle, CheckCircle, Clock, AlertTriangle,
  Users, UserPlus, ChevronDown, ChevronUp, X,
} from "lucide-react";

const ROLE_LABELS = {
  PM: "PM / Super Admin",
  CM: "CM / State Admin",
  DISTRICT_OFFICER: "District Officer",
  BLOCK_OFFICER: "Block Officer",
  FIELD_OFFICER: "Field Officer",
  OFFICER: "Department Officer",
  ADMIN: "Admin",
};

const MANAGEABLE_ROLES = ["PM", "CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER", "OFFICER"];

function getOfficerLabel(user) {
  return user?.designation?.trim() || ROLE_LABELS[user?.role] || user?.role;
}

export default function HierarchyDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("complaints");
  const [filters, setFilters] = useState({ status: "", priority: "", search: "" });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", officer_remarks: "", proof_of_resolution: null });
  const [forwardModal, setForwardModal] = useState(null); // complaint object
  const [escalateModal, setEscalateModal] = useState(null);
  const [forwardForm, setForwardForm] = useState({ to_user_id: "", note: "" });
  const [escalateNote, setEscalateNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["hierarchy-complaints", filters],
    queryFn: () => hierarchyApi.complaints(filters).then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: departmentOfficersData } = useQuery({
    queryKey: ["department-officers"],
    queryFn: () => hierarchyApi.departmentOfficers().then((r) => r.data),
  });

  const { data: deptData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.list().then((r) => r.data),
  });

  const complaints = data?.results || data || [];
  const departmentOfficers = departmentOfficersData?.results || departmentOfficersData || [];
  const departments = deptData?.results || deptData || [];

  const stats = [
    { label: "Department Cases", value: complaints.length, icon: "📋", color: "blue" },
    { label: "In Progress", value: complaints.filter((c) => c.status === "IN_PROGRESS").length, icon: "🔄", color: "purple" },
    { label: "Escalated", value: complaints.filter((c) => c.status === "ESCALATED").length, icon: "🚨", color: "red" },
    { label: "Resolved", value: complaints.filter((c) => c.status === "RESOLVED").length, icon: "✅", color: "green" },
  ];

  // Update complaint status
  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => hierarchyApi.updateComplaint(id, fd),
    onSuccess: () => {
      qc.invalidateQueries(["hierarchy-complaints"]);
      toast.success("Complaint updated!");
      setEditingId(null);
    },
    onError: () => toast.error("Update failed"),
  });

  // Forward complaint
  const forwardMutation = useMutation({
    mutationFn: ({ id, data }) => hierarchyApi.forwardComplaint(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["hierarchy-complaints"]);
      toast.success("Complaint forwarded successfully!");
      setForwardModal(null);
      setForwardForm({ to_user_id: "", note: "" });
    },
    onError: (err) => toast.error(err.response?.data?.error || "Forward failed"),
  });

  // Escalate complaint
  const escalateMutation = useMutation({
    mutationFn: ({ id, data }) => hierarchyApi.escalateComplaint(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["hierarchy-complaints"]);
      toast.success("Complaint escalated to higher authority!");
      setEscalateModal(null);
      setEscalateNote("");
    },
    onError: (err) => toast.error(err.response?.data?.error || "Escalation failed"),
  });

  const handleUpdate = (id) => {
    const fd = new FormData();
    fd.append("status", editForm.status);
    fd.append("officer_remarks", editForm.officer_remarks);
    if (editForm.proof_of_resolution) fd.append("proof_of_resolution", editForm.proof_of_resolution);
    updateMutation.mutate({ id, fd });
  };

  const canCreateOfficers = ["PM", "CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER", "OFFICER", "ADMIN"].includes(user?.role);
  const canForwardEscalate = ["PM", "CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER", "OFFICER", "ADMIN"].includes(user?.role);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.department_name ? `${user.department_name} Nodal Dashboard` : `${ROLE_LABELS[user?.role] || "Nodal Officer"} Dashboard`}
        </h1>
        <p className="text-gray-500 text-sm">
          {user?.department_name && `${user.department_name} · Department/Nodal workflow · `}
          {user?.first_name} {user?.last_name}
          {user?.state && ` · ${user.district || user.state}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {["complaints", canCreateOfficers && "team"].filter(Boolean).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "team" ? "Department Officers" : t}
          </button>
        ))}
      </div>

      {/* ── COMPLAINTS TAB ── */}
      {tab === "complaints" && (
        <>
          {/* Filters */}
          <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input text-sm" placeholder="Search ticket / title..."
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select className="input text-sm" value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              {["PENDING", "ASSIGNED", "FORWARDED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "CLOSED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="input text-sm" value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All Priorities</option>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : complaints.length === 0 ? (
            <EmptyState icon="🎉" title="No grievances assigned" description="All clear for your department or desk." />
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="card p-4">
                  {/* Main row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl mt-0.5"><CategoryIcon category={c.category} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{c.title}</p>
                          <span className="text-xs font-mono text-gray-400">#{c.ticket_id}</span>
                          {c.is_sla_breached && (
                            <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertTriangle size={10} /> SLA Breach
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                        {c.location && <p className="text-xs text-gray-400 mt-0.5">📍 {c.location}</p>}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <StatusBadge status={c.status} />
                          <PriorityBadge priority={c.priority} />
                          {c.department_name && <span className="text-xs text-gray-500">🏛️ {c.department_name}</span>}
                          <span className="text-xs text-gray-500">👤 {c.citizen_name}</span>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
                      {c.sla_deadline && (
                        <p className={`text-xs flex items-center gap-1 ${c.is_sla_breached ? "text-red-600" : "text-gray-500"}`}>
                          <Clock size={11} /> {formatDate(c.sla_deadline)}
                        </p>
                      )}
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {/* Expand details */}
                        <button
                          onClick={() => setSelectedComplaint(selectedComplaint?.id === c.id ? null : c)}
                          className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                        >
                          {selectedComplaint?.id === c.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          Details
                        </button>
                        {/* Update status */}
                        {!["RESOLVED", "CLOSED"].includes(c.status) && editingId !== c.id && (
                          <button
                            onClick={() => { setEditingId(c.id); setEditForm({ status: c.status, officer_remarks: c.officer_remarks || "", proof_of_resolution: null }); }}
                            className="btn-primary text-xs py-1 px-2.5"
                          >Update</button>
                        )}
                        {/* Forward */}
                        {canForwardEscalate && !["RESOLVED", "CLOSED"].includes(c.status) && departmentOfficers.length > 0 && (
                          <button
                            onClick={() => { setForwardModal(c); setForwardForm({ to_user_id: "", note: "" }); }}
                            className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-green-700 border-green-300"
                          >
                            <ArrowDownCircle size={12} /> Forward
                          </button>
                        )}
                        {/* Escalate */}
                        {canForwardEscalate && !["RESOLVED", "CLOSED", "ESCALATED"].includes(c.status) && user?.role !== "PM" && user?.role !== "ADMIN" && (
                          <button
                            onClick={() => { setEscalateModal(c); setEscalateNote(""); }}
                            className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-orange-700 border-orange-300"
                          >
                            <ArrowUpCircle size={12} /> Escalate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedComplaint?.id === c.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                        <div><span className="text-gray-400 text-xs">AI Category:</span> <p className="font-medium">{c.ai_category} ({Math.round((c.ai_confidence || 0) * 100)}%)</p></div>
                        <div><span className="text-gray-400 text-xs">Current Level:</span> <p className="font-medium">{c.current_level}</p></div>
                        {c.officer_name && <div><span className="text-gray-400 text-xs">Assigned Officer:</span> <p className="font-medium">{c.officer_name}</p></div>}
                      </div>
                      {c.officer_remarks && (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm mb-3">
                          <span className="font-medium text-blue-700">Officer remarks: </span>{c.officer_remarks}
                        </div>
                      )}
                      {/* Forwarding trail */}
                      {c.forwarding_records?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Forwarding Trail</p>
                          <div className="space-y-1.5">
                            {c.forwarding_records.map((r, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                <span className={`font-medium px-2 py-0.5 rounded-full ${r.action === "ESCALATE" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                                  {r.action}
                                </span>
                                <span className="text-gray-600">{r.from_level} → {r.to_level}</span>
                                {r.note && <span className="text-gray-400">"{r.note}"</span>}
                                <span className="text-gray-400 ml-auto">{formatDate(r.created_at)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* History */}
                      {c.history?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Status History</p>
                          <div className="space-y-1">
                            {c.history.slice(0, 5).map((h, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0" />
                                <span>{h.old_status} → {h.new_status}</span>
                                {h.note && <span className="text-gray-400 truncate">({h.note})</span>}
                                <span className="ml-auto shrink-0">{formatDate(h.created_at)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline update form */}
                  {editingId === c.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Status</label>
                          <select className="input text-sm" value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                            {["ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Proof of Resolution</label>
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
                        <button onClick={() => setEditingId(null)} className="btn-secondary text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TEAM TAB ── */}
      {tab === "team" && canCreateOfficers && (
        <TeamManagement
          user={user}
          departmentOfficers={departmentOfficers}
          departments={departments}
          onCreated={() => qc.invalidateQueries(["department-officers"])}
        />
      )}

      {/* ── FORWARD MODAL ── */}
      {forwardModal && (
        <Modal title={`Forward Complaint #${forwardModal.ticket_id}`} onClose={() => setForwardModal(null)}>
          <p className="text-sm text-gray-600 mb-4">{forwardModal.title}</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Forward to Department Officer *</label>
              <select className="input text-sm" value={forwardForm.to_user_id}
                onChange={(e) => setForwardForm({ ...forwardForm, to_user_id: e.target.value })}>
                <option value="">-- Select department/officer recipient --</option>
                {departmentOfficers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({ROLE_LABELS[s.role] || s.role})
                    {s.department_name ? ` · ${s.department_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Note / Instructions</label>
              <textarea className="input text-sm" rows={3}
                value={forwardForm.note}
                onChange={(e) => setForwardForm({ ...forwardForm, note: e.target.value })}
                placeholder="Instructions for the receiving officer..." />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => forwardMutation.mutate({ id: forwardModal.id, data: forwardForm })}
                disabled={!forwardForm.to_user_id || forwardMutation.isPending}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <ArrowDownCircle size={14} />
                {forwardMutation.isPending ? "Forwarding..." : "Forward Complaint"}
              </button>
              <button onClick={() => setForwardModal(null)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ESCALATE MODAL ── */}
      {escalateModal && (
        <Modal title={`Escalate Complaint #${escalateModal.ticket_id}`} onClose={() => setEscalateModal(null)}>
          <p className="text-sm text-gray-600 mb-2">{escalateModal.title}</p>
          <p className="text-xs text-orange-600 bg-orange-50 rounded-lg p-3 mb-4">
            ⚠️ This will escalate the complaint to the next higher authority for urgent attention.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reason for Escalation</label>
              <textarea className="input text-sm" rows={3}
                value={escalateNote}
                onChange={(e) => setEscalateNote(e.target.value)}
                placeholder="Explain why this needs escalation (e.g. repeated violation, SLA breach, complexity)..." />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => escalateMutation.mutate({ id: escalateModal.id, data: { note: escalateNote } })}
                disabled={escalateMutation.isPending}
                className="btn-danger text-sm flex items-center gap-1"
              >
                <ArrowUpCircle size={14} />
                {escalateMutation.isPending ? "Escalating..." : "Escalate to Higher Authority"}
              </button>
              <button onClick={() => setEscalateModal(null)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Team Management Sub-Component ───────────────────────────────────────────
function TeamManagement({ user, departmentOfficers, departments, onCreated }) {
  const emptyForm = {
    username: "", email: "", password: "", phone: "",
    first_name: "", last_name: "", employee_id: "",
    department_id: user?.department || "", role: "OFFICER", designation: "", reports_to: "",
    state: user?.state || "", district: user?.district || "", block: user?.block || "",
  };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => hierarchyApi.createOfficer(data),
    onSuccess: () => {
      toast.success("Officer account created!");
      setShowForm(false);
      setForm(emptyForm);
      onCreated();
    },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to create officer"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Department Officers ({departmentOfficers.length})</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1">
          <UserPlus size={15} /> Add Officer
        </button>
      </div>

      {/* Create officer form */}
      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-medium mb-4">Create Department Officer</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[["first_name","First Name"],["last_name","Last Name"],["username","Username"],
              ["email","Email"],["phone","Phone"],["employee_id","Employee ID"]].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <input className="input text-sm" value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password *</label>
              <input className="input text-sm" type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Role *</label>
              <select className="input text-sm" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {MANAGEABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Department</label>
              <select className="input text-sm" value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="">-- Select --</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Designation / Title</label>
              <input className="input text-sm" value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reports To</label>
              <select className="input text-sm" value={form.reports_to}
                onChange={(e) => setForm({ ...form, reports_to: e.target.value })}>
                <option value="">-- Me / auto assign --</option>
                {departmentOfficers.map((member) => (
                  <option key={member.id} value={member.id}>{member.first_name} {member.last_name} ({getOfficerLabel(member)})</option>
                ))}
              </select>
            </div>
            {[["state","State"],["district","District"],["block","Block"]].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <input className="input text-sm" value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.username || !form.password}
              className="btn-primary text-sm"
            >
              {createMutation.isPending ? "Creating..." : "Create Officer"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Department officers list */}
      {departmentOfficers.length === 0 ? (
        <EmptyState icon="👥" title="No department officers yet"
          description="Create or assign officer accounts for this department."
          action={<button onClick={() => setShowForm(true)} className="btn-primary">Add Officer</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {departmentOfficers.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold shrink-0">
                  {s.first_name?.[0] || s.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-gray-500 truncate">{s.email || s.username}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <span className="badge bg-blue-50 text-blue-700">{getOfficerLabel(s)}</span>
                {s.department_name && <span className="badge bg-gray-100 text-gray-600">{s.department_name}</span>}
                {s.reports_to_name && <span className="badge bg-amber-50 text-amber-700">Reports to: {s.reports_to_name}</span>}
                {s.district && <span className="badge bg-green-50 text-green-700">{s.district}</span>}
              </div>
              {s.employee_id && <p className="text-xs text-gray-400 mt-2">ID: {s.employee_id}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
