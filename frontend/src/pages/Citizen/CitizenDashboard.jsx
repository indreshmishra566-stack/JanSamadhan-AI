import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { complaintApi } from "../../api";
import { PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState, InfoSection, DetailItem, TimelineList, ProfilePanel, DashboardHero, TabPills } from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { X, MapPin, Navigation, Mic, MicOff, ImagePlus, Trash2 } from "lucide-react";

export default function CitizenDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") === "profile" ? "profile" : "complaints";
  const [tab, setTabState] = useState(requestedTab);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profileEditRequest, setProfileEditRequest] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("hi-IN");
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const recognitionRef = useRef(null);
  const voiceBaseRef = useRef("");
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

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        recognitionRef.current = null;
      }
    }
    setIsListening(false);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: () => complaintApi.list().then((r) => r.data),
  });

  const complaints = data?.results || data || [];

  useEffect(() => {
    const nextTab = searchParams.get("tab") === "profile" ? "profile" : "complaints";
    setTabState(nextTab);
    if (nextTab === "profile" && searchParams.get("edit") === "1") {
      setProfileEditRequest((count) => count + 1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!form.attachment || !form.attachment.type?.startsWith("image/")) {
      setAttachmentPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(form.attachment);
    setAttachmentPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.attachment]);

  useEffect(() => () => stopVoiceInput(), [stopVoiceInput]);

  const setTab = (nextTab) => {
    setTabState(nextTab);
    setSearchParams(nextTab === "profile" ? { tab: "profile" } : {});
  };

  const createMutation = useMutation({
    mutationFn: (fd) => complaintApi.create(fd),
    onSuccess: () => {
      qc.invalidateQueries(["my-complaints"]);
      toast.success("Complaint submitted! AI is classifying it now.");
      stopVoiceInput();
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

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    voiceBaseRef.current = form.description.trim();

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      const separator = voiceBaseRef.current && transcript ? " " : "";
      setForm((prev) => ({
        ...prev,
        description: `${voiceBaseRef.current}${separator}${transcript}`.trimStart(),
      }));
    };
    recognition.onerror = () => {
      toast.error("Could not capture voice input");
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      toast.success("Listening for complaint description");
    } catch {
      recognitionRef.current = null;
      toast.error("Could not start voice input");
    }
  };

  const handleAttachmentChange = (file) => {
    if (!file) {
      setForm((prev) => ({ ...prev, attachment: null }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setForm((prev) => ({ ...prev, attachment: file }));
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
        subtitle="File complaints, track department and officer action, review closure updates, and keep your profile details current."
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
            <button onClick={() => { stopVoiceInput(); setShowForm(false); }} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
          </div>
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Clear location details help Jan Samadhan AI route this complaint to the right department and officer.
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short issue title" required />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description <span className="text-gray-400 font-normal">(Hindi or English both accepted)</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={voiceLanguage}
                    onChange={(e) => setVoiceLanguage(e.target.value)}
                    disabled={isListening}
                    aria-label="Voice input language"
                  >
                    <option value="hi-IN">Hindi</option>
                    <option value="en-IN">English</option>
                  </select>
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      isListening
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                    }`}
                    aria-pressed={isListening}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                    {isListening ? "Stop voice" : "Voice input"}
                  </button>
                </div>
              </div>
              <textarea className="input min-h-24 resize-y" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue clearly. AI will classify and route it." required />
              {isListening && (
                <p className="mt-1 text-xs font-medium text-cyan-700">Listening now. Speak clearly and stop when the description is complete.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input className="input pl-9" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Street, ward, landmark, or area" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Image proof (optional)</label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-cyan-200 bg-cyan-50/50 px-4 py-5 text-center transition hover:bg-cyan-50">
                <ImagePlus size={24} className="text-cyan-700" />
                <span className="text-sm font-semibold text-gray-800">
                  {form.attachment ? form.attachment.name : "Upload or capture an image"}
                </span>
                <span className="text-xs text-gray-500">Photos from camera or gallery are accepted</span>
                <input
                  key={form.attachment ? form.attachment.name : "empty-attachment"}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => handleAttachmentChange(e.target.files?.[0])}
                />
              </label>
              {attachmentPreview && (
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <img src={attachmentPreview} alt="Selected complaint proof" className="h-48 w-full object-cover" />
                  <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-gray-600">
                    <span className="truncate">{form.attachment?.name}</span>
                    <button
                      type="button"
                      onClick={() => handleAttachmentChange(null)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? "Submitting..." : "Submit Complaint"}
              </button>
              <button type="button" onClick={() => { stopVoiceInput(); setShowForm(false); }} className="btn-secondary">Cancel</button>
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
