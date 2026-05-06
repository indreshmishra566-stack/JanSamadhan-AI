import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, departmentApi } from "../../api";
import { PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState } from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#1D6FA5", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#6b7280"];

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("complaints"); // complaints | analytics | officers
  const [filters, setFilters] = useState({ status: "", department: "", priority: "", search: "" });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const { data: officersData } = useQuery({
    queryKey: ["officers"],
    queryFn: () => adminApi.users({ role: "OFFICER" }).then((r) => r.data),
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

  const complaints = complaintsData?.results || complaintsData || [];
  const departments = deptData?.results || deptData || [];
  const officers = officersData?.results || officersData || [];

  const statCards = stats ? [
    { label: "Total Complaints", value: stats.total, icon: "📋", color: "blue" },
    { label: "Pending", value: stats.pending, icon: "⏳", color: "yellow" },
    { label: "Resolved", value: stats.resolved, icon: "✅", color: "green" },
    { label: "SLA Breached", value: stats.sla_breached, icon: "🚨", color: "red" },
    { label: "Avg. Rating", value: stats.average_rating || "—", icon: "⭐", color: "purple" },
  ] : [];

  const categoryChartData = stats?.by_category
    ? Object.entries(stats.by_category).map(([k, v]) => ({ name: k, value: v }))
    : [];

  const deptChartData = stats?.by_department || [];

  const startEdit = (c) => {
    setEditing(c.id);
    setEditForm({
      category: c.category,
      priority: c.priority,
      status: c.status,
      department: c.department,
      assigned_officer: c.assigned_officer || "",
      admin_override_note: c.admin_override_note || "",
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Manage all grievances and monitor system performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statsLoading
          ? Array(5).fill(0).map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)
          : statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {["complaints", "analytics", "officers"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── COMPLAINTS TAB ── */}
      {tab === "complaints" && (
        <>
          {/* Filters */}
          <div className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="input text-sm" placeholder="Search ticket / title..."
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select className="input text-sm" value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              {["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "CLOSED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="input text-sm" value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All Priorities</option>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p}>{p}</option>)}
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
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
                      {editing === c.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => updateMutation.mutate({ id: c.id, data: editForm })}
                            disabled={updateMutation.isPending}
                            className="btn-primary text-xs py-1 px-3">Save</button>
                          <button onClick={() => setEditing(null)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(c)} className="btn-secondary text-xs py-1 px-3">Edit</button>
                      )}
                    </div>
                  </div>

                  {editing === c.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select className="input text-sm" value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                          {["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "ESCALATED", "REJECTED"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                        <select className="input text-sm" value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Category</label>
                        <select className="input text-sm" value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                          {["ELECTRICITY", "WATER", "SANITATION", "ROADS", "PUBLIC_SERVICES", "HEALTH", "EDUCATION", "OTHER"].map((cat) => (
                            <option key={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
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
                            <option key={o.id} value={o.id}>{o.first_name} {o.last_name} ({o.department_name})</option>
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
                <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
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
                <Bar dataKey="count" fill="#1D6FA5" radius={[4, 4, 0, 0]} />
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
            <h3 className="font-semibold text-gray-800 mb-4">Priority Breakdown</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(stats.by_priority || {}).map(([p, count]) => (
                <div key={p} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <PriorityBadge priority={p} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── OFFICERS TAB ── */}
      {tab === "officers" && <OfficerManagement departments={departments} onCreated={() => qc.invalidateQueries(["officers"])} officers={officers} />}
    </div>
  );
}

function OfficerManagement({ departments, officers, onCreated }) {
  const emptyForm = { username: "", email: "", password: "", phone: "", first_name: "", last_name: "", employee_id: "", department_id: "" };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({});

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createOfficer(data),
    onSuccess: () => { toast.success("Officer account created!"); setShowForm(false); setForm(emptyForm); onCreated(); },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to create officer"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateOfficer(id, data),
    onSuccess: () => { toast.success("Officer updated!"); setEditingOfficer(null); onCreated(); },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to update officer"),
  });

  const startEdit = (o) => {
    setEditingOfficer(o.id);
    setEditForm({
      first_name: o.first_name || "",
      last_name: o.last_name || "",
      email: o.email || "",
      phone: o.phone || "",
      employee_id: o.employee_id || "",
      department_id: o.department?.id || "",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Officer Management</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingOfficer(null); }} className="btn-primary text-sm">+ Add Officer</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-medium mb-4">Create Officer Account</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[["first_name", "First Name"], ["last_name", "Last Name"], ["username", "Username"],
              ["email", "Email"], ["phone", "Phone"], ["employee_id", "Employee ID"]].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <input className="input text-sm" value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password</label>
              <input className="input text-sm" type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Department</label>
              <select className="input text-sm" value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="">-- Select --</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary text-sm">
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
                  {[["first_name", "First Name"], ["last_name", "Last Name"], ["email", "Email"], ["phone", "Phone"], ["employee_id", "Employee ID"]].map(([k, l]) => (
                    <div key={k}>
                      <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                      <input className="input text-xs py-1" value={editForm[k]}
                        onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Department</label>
                    <select className="input text-xs py-1" value={editForm.department_id}
                      onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}>
                      <option value="">-- Select --</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateMutation.mutate({ id: o.id, data: editForm })}
                    disabled={updateMutation.isPending} className="btn-primary text-xs py-1 px-3">
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
                  <button onClick={() => startEdit(o)} className="text-xs text-blue-600 hover:underline">Edit</button>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="badge bg-blue-50 text-blue-700">{o.department_name || "No Dept"}</span>
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