import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintApi } from "../../api";
import { PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState, InfoSection, DetailItem, TimelineList, ProfilePanel, DashboardHero, TabPills } from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { Plus, X, MapPin, Navigation } from "lucide-react";

export default function CitizenDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("complaints");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profileEditRequest, setProfileEditRequest] = useState(0);
  const emptyForm = {
    title: "",
    description: "",
    state: user?.state || "",
    district: user?.district || "",
    block: user?.block || "",
    location: "",
    latitude: "",
    longitude: "",
    attachment: null,
  };
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: () => complaintApi.list().then((r) => r.data),
  });

  const complaints = data?.results || data || [];

  const createMutation = useMutation({
    mutationFn: (fd) => complaintApi.create(fd),
    onSuccess: () => {
      qc.invalidateQueries(["my-complaints"]);
      toast.success("Complaint submitted! AI is classifying it now.");
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Submission failed"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    if (form.state) fd.append("state", form.state);
    if (form.district) fd.append("district", form.district);
    if (form.block) fd.append("block", form.block);
    fd.append("location", form.location);
    if (form.latitude) fd.append("latitude", form.latitude);
    if (form.longitude) fd.append("longitude", form.longitude);
    if (form.attachment) fd.append("attachment", form.attachment);
    createMutation.mutate(fd);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location detection is not supported in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({
          ...prev,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        toast.success("Location coordinates added");
      },
      () => toast.error("Could not access your location")
    );
  };

  const stats = [
    { label: "Total Complaints", value: complaints.length, icon: "📋", color: "blue" },
    { label: "Pending", value: complaints.filter((c) => c.status === "PENDING").length, icon: "⏳", color: "yellow" },
    { label: "Resolved", value: complaints.filter((c) => c.status === "RESOLVED").length, icon: "✅", color: "green" },
    { label: "Escalated", value: complaints.filter((c) => c.status === "ESCALATED").length, icon: "🔴", color: "red" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <DashboardHero
        tone="blue"
        eyebrow="Citizen workspace"
        title={`Welcome, ${user?.first_name || user?.username}`}
        subtitle="File a new water grievance, track officer routing, review closure updates, and keep your identity details current from one place."
        badges={[
          user?.district || user?.state || "Public dashboard",
          "Hindi / English complaint input",
          "Ticket tracking enabled",
        ]}
        actions={[
          { label: "New Complaint", onClick: () => { setShowForm(true); setTab("complaints"); } },
          tab === "profile"
            ? { label: "Edit Profile", onClick: () => setProfileEditRequest((count) => count + 1), variant: "secondary" }
            : { label: "Profile", onClick: () => setTab("profile"), variant: "secondary" },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 mb-6 mt-6 md:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="mb-6">
        <TabPills
          value={tab}
          onChange={setTab}
          items={[
            { value: "complaints", label: "Complaints" },
            { value: "profile", label: "Profile" },
          ]}
        />
      </div>

      {tab === "profile" && <ProfilePanel editRequest={profileEditRequest} />}

      {tab === "complaints" && showForm && (
        <div className="card p-6 mb-6 border-blue-100 shadow-[0_20px_60px_rgba(29,78,216,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Submit New Complaint</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
          </div>
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            The stronger your location details are, the better the system can route this complaint to the nearest water branch operator.
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief title of your complaint" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(Hindi or English both accepted)</span>
              </label>
              <textarea className="input min-h-24 resize-y" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your complaint in detail. AI will auto-classify it." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input className="input pl-9" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ward no., area, city" />
                </div>
                <button type="button" onClick={detectLocation} className="btn-secondary flex items-center gap-2 shrink-0">
                  <Navigation size={15} /> GPS
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ["state", "State", "Uttar Pradesh"],
                ["district", "District", "Lucknow"],
                ["block", "Area / Block", "Chinhat"],
              ].map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    className="input"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            {(form.latitude || form.longitude) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input className="input" value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input className="input" value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
              <input type="file" accept="image/*,application/pdf" className="input text-sm"
                onChange={(e) => setForm({ ...form, attachment: e.target.files[0] })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? "Submitting..." : "Submit Complaint"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {tab === "complaints" && (isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : complaints.length === 0 ? (
        <EmptyState icon="📭" title="No complaints yet"
          description="Submit your first complaint and we'll route it to the right department."
          action={<button onClick={() => setShowForm(true)} className="btn-primary">Submit Complaint</button>} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge bg-green-50 text-green-700">Assigned to You</span>
            <span className="badge bg-orange-50 text-orange-700">Escalated to You</span>
            <span className="badge bg-indigo-50 text-indigo-700">Head</span>
          </div>
          {complaints.map((c) => (
            <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl"><CategoryIcon category={c.category} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{c.title}</p>
                      <span className="text-xs text-gray-400 font-mono">#{c.ticket_id}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{c.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      {c.department_name && <span className="text-xs text-gray-500">🏛️ {c.department_name}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(c.created_at)}</p>
              </div>
              {selected?.id === c.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <InfoSection title="Routing" icon="🧭">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailItem label="Department" value={c.department_name} accent />
                        <DetailItem label="Current Level" value={c.current_level} accent />
                        <DetailItem label="Assigned Local Officer" value={c.officer_name} />
                        <DetailItem label="Supervising Department Head" value={c.supervising_head_name} />
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
                        <DetailItem label="Submitted" value={formatDate(c.created_at)} />
                        <DetailItem label="Resolved" value={formatDate(c.resolved_at)} />
                        <DetailItem label="Duplicate Status" value={c.is_duplicate ? `Duplicate of #${c.duplicate_of || "master complaint"}` : "Primary complaint"} />
                      </div>
                      {c.translated_description && c.translated_description !== c.description && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-sm">
                          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Translated Description</p>
                          <p className="text-gray-700">{c.translated_description}</p>
                        </div>
                      )}
                      {(c.attachment || c.proof_of_resolution) && (
                        <div className="flex flex-wrap gap-3 mt-3 text-sm">
                          {c.attachment && (
                            <a href={c.attachment} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              View attachment
                            </a>
                          )}
                          {c.proof_of_resolution && (
                            <a href={c.proof_of_resolution} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              View proof of resolution
                            </a>
                          )}
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
                        emptyText="Routing and status updates will appear here."
                      />
                    </InfoSection>
                  </div>
                  {c.officer_remarks && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                      <span className="font-medium text-blue-700">Officer remarks:</span> {c.officer_remarks}
                    </div>
                  )}
                  {c.is_duplicate && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm">
                      <span className="font-medium text-amber-700">Duplicate intelligence:</span>{" "}
                      This complaint is linked to {c.duplicate_of ? `master ticket #${c.duplicate_of}` : "another primary complaint"} for combined action.
                    </div>
                  )}
                  {c.status === "RESOLVED" && !c.citizen_rating && (
                    <FeedbackForm complaintId={c.id} onDone={() => qc.invalidateQueries(["my-complaints"])} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FeedbackForm({ complaintId, onDone }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const mutation = useMutation({
    mutationFn: () => complaintApi.feedback(complaintId, { citizen_rating: rating, citizen_feedback: feedback }),
    onSuccess: () => { toast.success("Thank you for your feedback!"); onDone(); },
  });
  return (
    <div className="mt-3 p-4 bg-green-50 rounded-lg">
      <p className="text-sm font-medium text-green-800 mb-2">Rate your experience:</p>
      <div className="flex gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
        ))}
      </div>
      <textarea className="input text-sm mb-2" value={feedback} onChange={(e) => setFeedback(e.target.value)}
        placeholder="Any comments?" rows={2} />
      <button type="button" onClick={() => mutation.mutate()} disabled={!rating || mutation.isPending} className="btn-primary text-sm py-1.5">
        Submit Feedback
      </button>
    </div>
  );
}
