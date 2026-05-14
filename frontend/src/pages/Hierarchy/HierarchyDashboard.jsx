import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hierarchyApi, departmentApi } from "../../api";
import {
  PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState, InfoSection, DetailItem, TimelineList, ProfilePanel, DashboardHero, TabPills,
} from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import {
  ArrowUpCircle, ArrowDownCircle, CheckCircle, Clock, AlertTriangle,
  Users, UserPlus, ChevronDown, ChevronUp, X,
} from "lucide-react";

const ROLE_LABELS = {
  OFFICER: "Officer",
  ADMIN: "Admin",
};

const MANAGEABLE_ROLES = ["OFFICER"];

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
  const profileDepartment = departments.find((department) => department.id === user?.department)
    || (user?.department_name ? { name: user.department_name } : null);
  const createdDepartments = departments.filter((department) => department.created_by === user?.id);

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

  const canCreateOfficers = user?.role && user.role !== "CITIZEN";
  const canForwardEscalate = user?.role && user.role !== "CITIZEN";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <DashboardHero
        tone="emerald"
        eyebrow="Officer operations"
        title={user?.department_name ? `${user.department_name} Command Desk` : `${ROLE_LABELS[user?.role] || "Officer"} Dashboard`}
        subtitle="Handle assigned complaints, update status, upload proof, forward or escalate cases, and manage your reporting branch."
        badges={[
          profileDepartment?.name ? `Assigned: ${profileDepartment.name}` : "Department branch",
          user?.designation ? `Title: ${user.designation}` : "Officer role",
          user?.reports_to_name ? `Reports to: ${user.reports_to_name}` : "Top of branch",
        ]}
        actions={[
          { label: "Complaints", onClick: () => setTab("complaints") },
          ...(canCreateOfficers ? [{ label: "Team", onClick: () => setTab("team"), variant: "secondary" }] : []),
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <TabPills
          value={tab}
          onChange={setTab}
          items={["complaints", canCreateOfficers && "team", "departments", "profile"].filter(Boolean).map((t) => ({
            value: t,
            label: t === "team" ? "Department Officers" : t === "departments" ? "Departments" : t.charAt(0).toUpperCase() + t.slice(1),
          }))}
        />
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
          <div className="flex flex-wrap gap-2 text-xs mb-4">
            <span className="badge bg-green-50 text-green-700">Assigned to You</span>
            <span className="badge bg-orange-50 text-orange-700">Escalated to You</span>
            <span className="badge bg-indigo-50 text-indigo-700">Head</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : complaints.length === 0 ? (
            <EmptyState icon="🎉" title="No complaints assigned" description="Your reporting branch has no active complaints right now." />
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
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {c.officer_name && (
                            <span className={`badge ${c.assigned_officer === user?.id ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                              {c.assigned_officer === user?.id ? "Assigned to You" : `Assigned: ${c.officer_name}`}
                            </span>
                          )}
                          {c.status === "ESCALATED" && c.assigned_officer === user?.id && (
                            <span className="badge bg-orange-50 text-orange-700">Escalated to You</span>
                          )}
                          {c.supervising_head_name && (
                            <span className="badge bg-indigo-50 text-indigo-700">Head: {c.supervising_head_name}</span>
                          )}
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
                        {canForwardEscalate && !["RESOLVED", "CLOSED", "ESCALATED"].includes(c.status) && user?.role !== "ADMIN" && (
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
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-3">
                        <InfoSection title="Routing" icon="🧭">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DetailItem label="Department" value={c.department_name} accent />
                            <DetailItem label="Current Level" value={c.current_level} accent />
                            <DetailItem label="Assigned Local Officer" value={c.officer_name} />
                            <DetailItem label="Supervising Department Head" value={c.supervising_head_name} />
                            <DetailItem label="Citizen" value={c.citizen_name} />
                            <DetailItem label="Location" value={c.location} />
                            <DetailItem label="State" value={c.state} />
                            <DetailItem label="District" value={c.district} />
                            <DetailItem label="Block / Area" value={c.block} />
                            <DetailItem label="Coordinates" value={c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : ""} />
                          </div>
                        </InfoSection>
                        <InfoSection title="Status" icon="📌">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DetailItem label="AI Category" value={`${c.ai_category} (${Math.round((c.ai_confidence || 0) * 100)}%)`} accent />
                            <DetailItem label="Priority" value={c.priority} />
                            <DetailItem label="Original Language" value={c.original_language?.toUpperCase()} />
                            <DetailItem label="SLA Deadline" value={formatDate(c.sla_deadline)} />
                            <DetailItem label="Created" value={formatDate(c.created_at)} />
                            <DetailItem label="Resolved" value={formatDate(c.resolved_at)} />
                            <DetailItem label="Duplicate Status" value={c.is_duplicate ? `Duplicate of #${c.duplicate_of || "master complaint"}` : "Primary complaint"} />
                          </div>
                          {c.translated_description && c.translated_description !== c.description && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-sm">
                              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Translated Description</p>
                              <p className="text-gray-700">{c.translated_description}</p>
                            </div>
                          )}
                        </InfoSection>
                        <InfoSection title="Timeline" icon="🕒">
                          <TimelineList
                            items={[
                              ...(c.forwarding_records || []).slice(0, 4).map((r) => ({
                                top: `${r.action} · ${r.from_level} → ${r.to_level}`,
                                middle: `${r.from_user_name} → ${r.to_user_name}`,
                                note: r.note,
                                date: formatDate(r.created_at),
                              })),
                              ...(c.history || []).slice(0, 3).map((h) => ({
                                top: "Status Update",
                                middle: `${h.old_status || "—"} → ${h.new_status || "—"}`,
                                note: h.note,
                                date: formatDate(h.created_at),
                              })),
                            ].slice(0, 5)}
                            emptyText="Forwarding and status updates will appear here."
                          />
                        </InfoSection>
                      </div>
                      {c.officer_remarks && (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm mb-3">
                          <span className="font-medium text-blue-700">Officer remarks: </span>{c.officer_remarks}
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

      {tab === "departments" && (
        <DepartmentBranchManagement
          user={user}
          departments={createdDepartments}
          parentOptions={departments}
          profileDepartment={profileDepartment}
          departmentOfficers={departmentOfficers}
          onChanged={() => {
            qc.invalidateQueries(["departments"]);
            qc.invalidateQueries(["department-officers"]);
          }}
        />
      )}

      {tab === "profile" && <ProfilePanel />}

      {/* ── FORWARD MODAL ── */}
      {forwardModal && (
        <Modal title={`Forward Complaint #${forwardModal.ticket_id}`} onClose={() => setForwardModal(null)}>
          <p className="text-sm text-gray-600 mb-4">{forwardModal.title}</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Forward to Officer *</label>
              <select className="input text-sm" value={forwardForm.to_user_id}
                onChange={(e) => setForwardForm({ ...forwardForm, to_user_id: e.target.value })}>
                <option value="">-- Select officer recipient --</option>
                {departmentOfficers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({getOfficerLabel(s)})
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
            This sends the complaint upward in the reporting chain for urgent attention.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reason for Escalation</label>
              <textarea className="input text-sm" rows={3}
                value={escalateNote}
                onChange={(e) => setEscalateNote(e.target.value)}
                placeholder="Explain why this needs escalation..." />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => escalateMutation.mutate({ id: escalateModal.id, data: { note: escalateNote } })}
                disabled={escalateMutation.isPending}
                className="btn-danger text-sm flex items-center gap-1"
              >
                <ArrowUpCircle size={14} />
                {escalateMutation.isPending ? "Escalating..." : "Escalate Upward"}
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
    email: "", password: "", phone: "",
    first_name: "", last_name: "", employee_id: "",
    department_id: user?.department || "", role: "OFFICER", designation: "", reports_to: "",
    state: user?.state || "", district: user?.district || "", block: user?.block || "",
  };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({});

  const createMutation = useMutation({
    mutationFn: (data) => hierarchyApi.createOfficer(data),
    onSuccess: ({ data }) => {
      toast.success(data?.credentials_email_sent
        ? "Officer account created and credentials emailed!"
        : `Officer account created. ${data?.credentials_email_note || "Credentials email was not sent."}`);
      setShowForm(false);
      setForm(emptyForm);
      onCreated();
    },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to create officer"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => hierarchyApi.updateOfficer(id, data),
    onSuccess: () => {
      toast.success("Officer updated!");
      setEditingOfficer(null);
      onCreated();
    },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to update officer"),
  });

  const startEdit = (officer) => {
    setEditingOfficer(officer.id);
    setEditForm({
      first_name: officer.first_name || "",
      last_name: officer.last_name || "",
      email: officer.email || "",
      phone: officer.phone || "",
      employee_id: officer.employee_id || "",
      department: officer.department || "",
      role: officer.role || "OFFICER",
      designation: officer.designation || "",
      state: officer.state || "",
      district: officer.district || "",
      block: officer.block || "",
      reports_to: officer.reports_to || "",
      password: "",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Officers In Your Branch ({departmentOfficers.length})</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1">
          <UserPlus size={15} /> Add Officer
        </button>
      </div>

      {/* Create officer form */}
      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-medium mb-4">Create Officer</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[["first_name","First Name"],["last_name","Last Name"],
              ["email","Email / Login ID"],["phone","Phone"],["employee_id","Employee ID"]].map(([k, l]) => (
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
              <label className="text-xs text-gray-500 mb-1 block">Access Role</label>
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
              disabled={createMutation.isPending || !form.email || !form.password}
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
              {editingOfficer === s.id ? (
                <div>
                  <h4 className="font-medium mb-3 text-sm">Edit Officer</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[["first_name","First Name"],["last_name","Last Name"],["email","Email"],["phone","Phone"],["employee_id","Employee ID"],["state","State"],["district","District"],["block","Block"]].map(([k,l]) => (
                      <div key={k}>
                        <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                        <input className="input text-xs py-1" value={editForm[k]} onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">New Password</label>
                      <input
                        className="input text-xs py-1"
                        type="text"
                        value={editForm.password || ""}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Department</label>
                      <select className="input text-xs py-1" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}>
                        <option value="">-- Select --</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Designation</label>
                      <input className="input text-xs py-1" value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Reports To</label>
                      <select className="input text-xs py-1" value={editForm.reports_to} onChange={(e) => setEditForm({ ...editForm, reports_to: e.target.value })}>
                        <option value="">-- None --</option>
                        {departmentOfficers.filter((candidate) => candidate.id !== s.id).map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>{candidate.first_name} {candidate.last_name} ({getOfficerLabel(candidate)})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateMutation.mutate({ id: s.id, data: editForm })}
                      disabled={updateMutation.isPending}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditingOfficer(null)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold shrink-0">
                      {s.first_name?.[0] || s.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-gray-500 truncate">{s.email || s.username}</p>
                    </div>
                    {(s.created_by === user?.id || s.reports_to === user?.id) && (
                      <button onClick={() => startEdit(s)} className="text-xs text-blue-600 hover:underline px-2">Edit</button>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="badge bg-blue-50 text-blue-700">{getOfficerLabel(s)}</span>
                    {s.department_name && <span className="badge bg-gray-100 text-gray-600">{s.department_name}</span>}
                    {s.reports_to_name && <span className="badge bg-amber-50 text-amber-700">Reports to: {s.reports_to_name}</span>}
                    {s.district && <span className="badge bg-green-50 text-green-700">{s.district}</span>}
                    {s.is_verified && <span className="badge bg-emerald-50 text-emerald-700">Verified</span>}
                    {!s.is_active && <span className="badge bg-red-50 text-red-700">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {s.employee_id ? `ID: ${s.employee_id} · ` : ""}Posting: {[s.state, s.district, s.block].filter(Boolean).join(" / ") || "Not mapped"}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentBranchManagement({ user, departments, parentOptions, profileDepartment, departmentOfficers, onChanged }) {
  const emptyForm = {
    name: "", code: "", description: "", email: "",
    parent: user?.department || "", head_officer: "", sub_head_officer: "",
  };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => departmentApi.create(data),
    onSuccess: () => {
      toast.success("Department branch created");
      setShowForm(false);
      setForm(emptyForm);
      onChanged();
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Failed to create department branch"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => departmentApi.update(id, data),
    onSuccess: () => {
      toast.success("Department updated");
      setEditingDepartment(null);
      onChanged();
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Failed to update department"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Departments In Your Branch</h2>
          <p className="text-sm text-gray-500">Create child departments and assign the next head and sub head under your branch.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1">
          <UserPlus size={15} /> Add Department
        </button>
      </div>

      {profileDepartment?.name && (
        <div className="card p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assigned Department</p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{profileDepartment.name}</p>
              {profileDepartment.code && <p className="text-xs font-mono text-gray-400">{profileDepartment.code}</p>}
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {profileDepartment.head_officer_name && <span className="badge bg-indigo-50 text-indigo-700">Head: {profileDepartment.head_officer_name}</span>}
              {profileDepartment.sub_head_officer_name && <span className="badge bg-amber-50 text-amber-700">Sub Head: {profileDepartment.sub_head_officer_name}</span>}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-medium mb-4">Create Department Branch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input text-sm" placeholder="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input text-sm uppercase" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="input text-sm" placeholder="Department email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="input text-sm" value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">-- Root within my branch --</option>
              {parentOptions.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
            <select className="input text-sm" value={form.head_officer} onChange={(e) => setForm({ ...form, head_officer: e.target.value })}>
              <option value="">-- Assign head officer --</option>
              {departmentOfficers.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name} ({getOfficerLabel(member)})</option>)}
            </select>
            <select className="input text-sm" value={form.sub_head_officer} onChange={(e) => setForm({ ...form, sub_head_officer: e.target.value })}>
              <option value="">-- Assign sub head officer --</option>
              {departmentOfficers.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name} ({getOfficerLabel(member)})</option>)}
            </select>
            <div className="md:col-span-3">
              <input className="input text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => createMutation.mutate({
                ...form,
                parent: form.parent || null,
                head_officer: form.head_officer || null,
                sub_head_officer: form.sub_head_officer || null,
                code: form.code.trim().toUpperCase(),
              })}
              disabled={createMutation.isPending || !form.name || !form.code}
              className="btn-primary text-sm"
            >
              {createMutation.isPending ? "Creating..." : "Create Department"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {departments.length === 0 ? (
        <EmptyState
          icon="🏛️"
          title="No created departments yet"
          description="Your assigned department is shown above. Departments you create will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {departments.map((department) => (
          <div key={department.id} className="card p-4">
            {editingDepartment?.id === department.id ? (
              <div className="space-y-3">
                <input className="input text-sm" value={editingDepartment.name} onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })} />
                <input className="input text-sm uppercase" value={editingDepartment.code} onChange={(e) => setEditingDepartment({ ...editingDepartment, code: e.target.value.toUpperCase() })} />
                <input className="input text-sm" value={editingDepartment.email || ""} onChange={(e) => setEditingDepartment({ ...editingDepartment, email: e.target.value })} />
                <select className="input text-sm" value={editingDepartment.parent || ""} onChange={(e) => setEditingDepartment({ ...editingDepartment, parent: e.target.value || null })}>
                  <option value="">-- Root within my branch --</option>
                  {parentOptions.filter((item) => item.id !== department.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <select className="input text-sm" value={editingDepartment.head_officer || ""} onChange={(e) => setEditingDepartment({ ...editingDepartment, head_officer: e.target.value || null })}>
                  <option value="">-- Head officer --</option>
                  {departmentOfficers.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name} ({getOfficerLabel(member)})</option>)}
                </select>
                <select className="input text-sm" value={editingDepartment.sub_head_officer || ""} onChange={(e) => setEditingDepartment({ ...editingDepartment, sub_head_officer: e.target.value || null })}>
                  <option value="">-- Sub head officer --</option>
                  {departmentOfficers.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name} ({getOfficerLabel(member)})</option>)}
                </select>
                <input className="input text-sm" value={editingDepartment.description || ""} onChange={(e) => setEditingDepartment({ ...editingDepartment, description: e.target.value })} />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMutation.mutate({
                      id: department.id,
                      data: {
                        ...editingDepartment,
                        parent: editingDepartment.parent || null,
                        head_officer: editingDepartment.head_officer || null,
                        sub_head_officer: editingDepartment.sub_head_officer || null,
                      },
                    })}
                    disabled={updateMutation.isPending}
                    className="btn-primary text-xs py-1 px-3"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditingDepartment(null)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{department.name}</p>
                    <p className="text-xs font-mono text-gray-400">{department.code}</p>
                  </div>
                  <button onClick={() => setEditingDepartment({ ...department })} className="text-xs text-blue-600 hover:underline">Edit</button>
                </div>
                {department.description && <p className="text-sm text-gray-500 mt-3 line-clamp-2">{department.description}</p>}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {department.parent_name && <span className="badge bg-slate-100 text-slate-700">Parent: {department.parent_name}</span>}
                  {department.head_officer_name && <span className="badge bg-indigo-50 text-indigo-700">Head: {department.head_officer_name}</span>}
                  {department.sub_head_officer_name && <span className="badge bg-amber-50 text-amber-700">Sub Head: {department.sub_head_officer_name}</span>}
                  {typeof department.child_count === "number" && <span className="badge bg-emerald-50 text-emerald-700">{department.child_count} child</span>}
                </div>
              </>
            )}
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
