import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, departmentApi } from "../../api";
import {
  PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState,
} from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";
import { Trash2, ChevronDown, ChevronUp, Plus, Building2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#1D6FA5","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#6b7280"];

const ROLE_LABELS = {
  CITIZEN: "Citizen",
  ADMIN: "Admin",
  PM: "PM / Super Admin",
  CM: "CM / State Admin",
  DISTRICT_OFFICER: "District Officer",
  BLOCK_OFFICER: "Block Officer",
  FIELD_OFFICER: "Field Officer",
  OFFICER: "Officer",
};

const ALL_ROLES = ["PM", "CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER", "OFFICER", "CITIZEN", "ADMIN"];
const OFFICER_ROLES = ["PM", "CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER", "OFFICER"];

function getOfficerLabel(user) {
  return user?.designation?.trim() || ROLE_LABELS[user?.role] || user?.role;
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("complaints");
  const [filters, setFilters] = useState({ status: "", department: "", priority: "", search: "" });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ["admin-complaints", filters],
    queryFn: () => adminApi.complaints(filters).then((r) => r.data),
  });

  const { data: deptData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.list().then((r) => r.data),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", userRoleFilter],
    queryFn: () => adminApi.users(userRoleFilter ? { role: userRoleFilter } : {}).then((r) => r.data),
    enabled: tab === "users",
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateComplaint(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["admin-complaints"]);
      qc.invalidateQueries(["admin-stats"]);
      toast.success("Complaint updated successfully");
      setEditing(null);
    },
    onError: () => toast.error("Update failed"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => adminApi.deleteOfficer(id),
    onSuccess: () => {
      qc.invalidateQueries(["admin-users"]);
      qc.invalidateQueries(["all-officers"]);
      toast.success("User deleted");
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const complaints = complaintsData?.results || complaintsData || [];
  const departments = deptData?.results || deptData || [];
  const users = usersData?.results || usersData || [];

  // All officers for assigning
  const { data: allOfficers } = useQuery({
    queryKey: ["all-officers"],
    queryFn: () => adminApi.users().then((r) => r.data),
  });
  const officers = (allOfficers?.results || allOfficers || []).filter((u) => OFFICER_ROLES.includes(u.role));

  const statCards = stats ? [
    { label: "Total Complaints", value: stats.total, icon: "📋", color: "blue" },
    { label: "Pending", value: stats.pending, icon: "⏳", color: "yellow" },
    { label: "Resolved", value: stats.resolved, icon: "✅", color: "green" },
    { label: "SLA Breached", value: stats.sla_breached, icon: "🚨", color: "red" },
    { label: "Avg. Rating", value: stats.average_rating ? `${stats.average_rating}★` : "—", icon: "⭐", color: "purple" },
  ] : [];

  const categoryChartData = stats?.by_category
    ? Object.entries(stats.by_category).map(([k, v]) => ({ name: k, value: v }))
    : [];
  const deptChartData = stats?.by_department || [];

  const startEdit = (c) => {
    setEditing(c.id);
    setEditForm({
      category: c.category, priority: c.priority, status: c.status,
      department: c.department || "", assigned_officer: c.assigned_officer || "",
      admin_override_note: c.admin_override_note || "",
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Manage grievances by department, nodal officers, and users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statsLoading
          ? Array(5).fill(0).map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)
          : statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {["complaints", "analytics", "users", "officers", "departments"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── COMPLAINTS TAB ── */}
      {tab === "complaints" && (
        <>
          <div className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="input text-sm" placeholder="Search ticket / title..."
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select className="input text-sm" value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              {["PENDING","ASSIGNED","IN_PROGRESS","RESOLVED","ESCALATED","FORWARDED","CLOSED","REJECTED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="input text-sm" value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All Priorities</option>
              {["LOW","MEDIUM","HIGH","CRITICAL"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input text-sm" value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {complaintsLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : complaints.length === 0 ? (
            <EmptyState icon="✅" title="No complaints match filters" />
          ) : (
            <div className="space-y-2">
              {complaints.map((c) => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl mt-0.5"><CategoryIcon category={c.category} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{c.title}</p>
                          <span className="text-xs font-mono text-gray-400">#{c.ticket_id}</span>
                          {c.is_sla_breached && <span className="badge bg-red-100 text-red-700">⚠️ SLA Breach</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <StatusBadge status={c.status} />
                          <PriorityBadge priority={c.priority} />
                          <span className="text-xs text-gray-500">👤 {c.citizen_name}</span>
                          {c.department_name && <span className="text-xs text-gray-500">🏛️ {c.department_name}</span>}
                          <span className="text-xs text-gray-500">Level: {c.current_level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                          className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1">
                          {expandedId === c.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} Details
                        </button>
                        {editing === c.id ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => updateMutation.mutate({ id: c.id, data: editForm })}
                              disabled={updateMutation.isPending} className="btn-primary text-xs py-1 px-3">
                              {updateMutation.isPending ? "..." : "Save"}
                            </button>
                            <button onClick={() => setEditing(null)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(c)} className="btn-primary text-xs py-1 px-3">Edit</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === c.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div><span className="text-xs text-gray-400">AI Category:</span><p className="font-medium">{c.ai_category} ({Math.round((c.ai_confidence||0)*100)}%)</p></div>
                        <div><span className="text-xs text-gray-400">Current Level:</span><p className="font-medium">{c.current_level}</p></div>
                        {c.officer_name && <div><span className="text-xs text-gray-400">Officer:</span><p className="font-medium">{c.officer_name}</p></div>}
                        {c.citizen_rating && <div><span className="text-xs text-gray-400">Rating:</span><p className="font-medium">{"★".repeat(c.citizen_rating)}</p></div>}
                      </div>
                      {/* Forwarding trail */}
                      {c.forwarding_records?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Forwarding Trail</p>
                          <div className="space-y-1">
                            {c.forwarding_records.map((r, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-3 py-1.5">
                                <span className={`font-medium px-1.5 py-0.5 rounded-full ${r.action === "ESCALATE" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{r.action}</span>
                                <span className="text-gray-600">{r.from_level} → {r.to_level}</span>
                                {r.note && <span className="text-gray-400 truncate">"{r.note}"</span>}
                                <span className="text-gray-400 ml-auto">{formatDate(r.created_at)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* History */}
                      {c.history?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Status History</p>
                          {c.history.slice(0, 5).map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0" />
                              <span>{h.old_status} → {h.new_status}</span>
                              {h.note && <span className="text-gray-400 truncate">({h.note})</span>}
                              <span className="ml-auto shrink-0">{formatDate(h.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {editing === c.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        ["status","Status",["PENDING","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED","ESCALATED","FORWARDED","REJECTED"]],
                        ["priority","Priority",["LOW","MEDIUM","HIGH","CRITICAL"]],
                        ["category","Category",["ELECTRICITY","WATER","SANITATION","ROADS","PUBLIC_SERVICES","HEALTH","EDUCATION","OTHER"]],
                      ].map(([k, l, opts]) => (
                        <div key={k}>
                          <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                          <select className="input text-sm" value={editForm[k]}
                            onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}>
                            {opts.map((o) => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Department</label>
                        <select className="input text-sm" value={editForm.department || ""}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}>
                          <option value="">-- Select --</option>
                          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Assign Officer</label>
                        <select className="input text-sm" value={editForm.assigned_officer || ""}
                          onChange={(e) => setEditForm({ ...editForm, assigned_officer: e.target.value })}>
                          <option value="">-- Select --</option>
                          {officers.map((o) => (
                            <option key={o.id} value={o.id}>{o.first_name} {o.last_name} ({getOfficerLabel(o)})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Override Note</label>
                        <input className="input text-sm" value={editForm.admin_override_note}
                          onChange={(e) => setEditForm({ ...editForm, admin_override_note: e.target.value })}
                          placeholder="Reason for override..." />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === "analytics" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {categoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Top Departments by Volume</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptChartData.slice(0, 6)}>
                <XAxis dataKey="department__name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1D6FA5" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.by_status || {}).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28">{status}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">By Handling Level</h3>
            <div className="space-y-2">
              {Object.entries(stats.by_level || {}).map(([level, count]) => (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">{level}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Users</h2>
            <select className="input text-sm w-48" value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          {usersLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : users.length === 0 ? (
            <EmptyState icon="👥" title="No users found" />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Name","Username","Role","Department","State/District","Employee ID","Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">
                            {u.first_name?.[0] || u.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.first_name} {u.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-blue-50 text-blue-700">{getOfficerLabel(u)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.department_name || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.district || u.state || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.employee_id || "—"}</td>
                      <td className="px-4 py-3">
                        {u.role !== "ADMIN" && (
                          <button onClick={() => setDeleteConfirm(u)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── OFFICERS TAB ── */}
      {tab === "officers" && (
        <OfficerManagement departments={departments} onChanged={() => {
          qc.invalidateQueries(["all-officers"]);
          qc.invalidateQueries(["admin-users"]);
        }} officers={officers} />
      )}

      {/* ── DEPARTMENTS TAB ── */}
      {tab === "departments" && (
        <DepartmentManagement departments={departments} officers={officers} onChanged={() => qc.invalidateQueries(["departments"])} />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Delete User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.first_name} {deleteConfirm.last_name} ({deleteConfirm.username})</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => deleteUserMutation.mutate(deleteConfirm.id)}
                disabled={deleteUserMutation.isPending}
                className="btn-danger text-sm flex-1">
                {deleteUserMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OfficerManagement({ departments, officers, onChanged }) {
  const ROLES = ["PM","CM","DISTRICT_OFFICER","BLOCK_OFFICER","FIELD_OFFICER","OFFICER"];
  const emptyForm = {
    username:"", email:"", password:"", phone:"", first_name:"", last_name:"",
    employee_id:"", department_id:"", role:"OFFICER", designation:"",
    state:"", district:"", block:"", reports_to:""
  };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({});

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createOfficer(data),
    onSuccess: () => { toast.success("Officer account created!"); setShowForm(false); setForm(emptyForm); onChanged(); },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to create officer"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateOfficer(id, data),
    onSuccess: () => { toast.success("Officer updated!"); setEditingOfficer(null); onChanged(); },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to update officer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteOfficer(id),
    onSuccess: () => { toast.success("Officer deleted!"); onChanged(); },
    onError: () => toast.error("Delete failed"),
  });

  const startEdit = (o) => {
    setEditingOfficer(o.id);
    setEditForm({
      first_name: o.first_name||"", last_name: o.last_name||"", email: o.email||"",
      phone: o.phone||"", employee_id: o.employee_id||"", department: o.department||"",
      role: o.role||"OFFICER", designation: o.designation||"", state: o.state||"",
      district: o.district||"", block: o.block||"", reports_to: o.reports_to || "",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Officer Management ({officers.length})</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingOfficer(null); }} className="btn-primary text-sm">+ Add Officer</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-medium mb-4">Create Officer Account</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[["first_name","First Name"],["last_name","Last Name"],["username","Username"],["email","Email"],["phone","Phone"],["employee_id","Employee ID"]].map(([k,l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <input className="input text-sm" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password *</label>
              <input className="input text-sm" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Role</label>
              <select className="input text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Designation / Title</label>
              <input className="input text-sm" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Joint Director, Area Lead, Sub Head..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Department</label>
              <select className="input text-sm" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="">-- Select --</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reports To</label>
              <select className="input text-sm" value={form.reports_to} onChange={(e) => setForm({ ...form, reports_to: e.target.value })}>
                <option value="">-- Auto assign --</option>
                {officers.map((o) => <option key={o.id} value={o.id}>{o.first_name} {o.last_name} ({getOfficerLabel(o)})</option>)}
              </select>
            </div>
            {[["state","State"],["district","District"],["block","Block"]].map(([k,l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <input className="input text-sm" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.username || !form.password} className="btn-primary text-sm">
              {createMutation.isPending ? "Creating..." : "Create Officer"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {officers.map((o) => (
          <div key={o.id} className="card p-4">
            {editingOfficer === o.id ? (
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
                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                    <select className="input text-xs py-1" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                    </select>
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
                      {officers.filter((candidate) => candidate.id !== o.id).map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>{candidate.first_name} {candidate.last_name} ({getOfficerLabel(candidate)})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateMutation.mutate({ id: o.id, data: editForm })} disabled={updateMutation.isPending} className="btn-primary text-xs py-1 px-3">
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditingOfficer(null)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                      {o.first_name?.[0] || o.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{o.first_name} {o.last_name}</p>
                      <p className="text-xs text-gray-500">{o.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(o)} className="text-xs text-blue-600 hover:underline px-2">Edit</button>
                    <button onClick={() => deleteMutation.mutate(o.id)} className="text-xs text-red-500 hover:underline px-2">Delete</button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="badge bg-blue-50 text-blue-700">{getOfficerLabel(o)}</span>
                  {o.department_name && <span className="badge bg-gray-100 text-gray-600">{o.department_name}</span>}
                  {o.reports_to_name && <span className="badge bg-amber-50 text-amber-700">Reports to: {o.reports_to_name}</span>}
                  {o.employee_id && <span className="badge bg-gray-100 text-gray-600">ID: {o.employee_id}</span>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DepartmentManagement({ departments, officers, onChanged }) {
  const emptyForm = { name: "", code: "", description: "", email: "", head_officer: "", sub_head_officer: "" };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => departmentApi.create(data),
    onSuccess: () => {
      toast.success("Department created");
      setShowForm(false);
      setForm(emptyForm);
      onChanged();
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Failed to create department"),
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

  const submit = () => {
    createMutation.mutate({
      ...form,
      head_officer: form.head_officer || null,
      sub_head_officer: form.sub_head_officer || null,
      code: form.code.trim().toUpperCase(),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Departments ({departments.length})</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1">
          <Plus size={15} /> Add Department
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-medium mb-4">Create Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input className="input text-sm" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Code *</label>
              <input className="input text-sm uppercase" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input className="input text-sm" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nodal Officer</label>
              <select className="input text-sm" value={form.head_officer}
                onChange={(e) => setForm({ ...form, head_officer: e.target.value })}>
                <option value="">-- Select --</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>{o.first_name} {o.last_name} ({getOfficerLabel(o)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Sub Head Officer</label>
              <select className="input text-sm" value={form.sub_head_officer}
                onChange={(e) => setForm({ ...form, sub_head_officer: e.target.value })}>
                <option value="">-- Select --</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>{o.first_name} {o.last_name} ({getOfficerLabel(o)})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input className="input text-sm" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={submit} disabled={createMutation.isPending || !form.name || !form.code} className="btn-primary text-sm">
              {createMutation.isPending ? "Creating..." : "Create Department"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {departments.length === 0 ? (
        <EmptyState icon="🏛️" title="No departments found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((d) => (
            <div key={d.id} className="card p-4">
              {editingDepartment?.id === d.id ? (
                <div className="space-y-3">
                  <input className="input text-sm" value={editingDepartment.name}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })} />
                  <input className="input text-sm uppercase" value={editingDepartment.code}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, code: e.target.value.toUpperCase() })} />
                  <input className="input text-sm" value={editingDepartment.email || ""}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, email: e.target.value })} />
                  <input className="input text-sm" value={editingDepartment.description || ""}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, description: e.target.value })} />
                  <select className="input text-sm" value={editingDepartment.head_officer || ""}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, head_officer: e.target.value || null })}>
                    <option value="">-- Head officer --</option>
                    {officers.map((o) => <option key={o.id} value={o.id}>{o.first_name} {o.last_name} ({getOfficerLabel(o)})</option>)}
                  </select>
                  <select className="input text-sm" value={editingDepartment.sub_head_officer || ""}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, sub_head_officer: e.target.value || null })}>
                    <option value="">-- Sub head officer --</option>
                    {officers.map((o) => <option key={o.id} value={o.id}>{o.first_name} {o.last_name} ({getOfficerLabel(o)})</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMutation.mutate({
                        id: d.id,
                        data: {
                          ...editingDepartment,
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
                      <p className="font-semibold text-gray-900">{d.name}</p>
                      <p className="text-xs font-mono text-gray-400">{d.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${d.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {d.is_active ? "Active" : "Inactive"}
                      </span>
                      <button onClick={() => setEditingDepartment({ ...d })} className="text-xs text-blue-600 hover:underline">Edit</button>
                    </div>
                  </div>
                  {d.description && <p className="text-sm text-gray-500 mt-3 line-clamp-2">{d.description}</p>}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="badge bg-blue-50 text-blue-700">{d.complaint_count || 0} active complaints</span>
                    {d.head_officer_name && <span className="badge bg-indigo-50 text-indigo-700">Head: {d.head_officer_name}</span>}
                    {d.sub_head_officer_name && <span className="badge bg-amber-50 text-amber-700">Sub Head: {d.sub_head_officer_name}</span>}
                    {d.email && <span className="badge bg-gray-100 text-gray-600">{d.email}</span>}
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
