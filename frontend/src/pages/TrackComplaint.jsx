import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, MapPinned, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { complaintApi } from "../api";
import PortalEntryShell, { getPortalLanguage, setPortalLanguage } from "../components/Shared/PortalEntryShell";
import { StatusBadge, PriorityBadge, InfoSection, DetailItem, TimelineList } from "../components/Shared";
import { formatDate } from "../utils/helpers";

export default function TrackComplaint() {
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getPortalLanguage());
  const isHindi = language === "hi";

  const text = {
    title: "Jan Samadhan AI",
    subtitle: isHindi ? "पब्लिक टिकट ट्रैकिंग" : "Public ticket tracking",
    eyebrow: isHindi ? "विश्वसनीय डिजिटल जन शिकायत प्रणाली" : "Trusted digital public grievance system",
    description: isHindi
      ? "बिना लॉगिन शिकायत की स्थिति, असाइन अधिकारी, विभागीय हेड और पूरी रूटिंग टाइमलाइन देखें।"
      : "Track complaint status, assigned officer, department head, and the full routing timeline without signing in.",
    badges: isHindi ? ["बिना लॉगिन", "SLA दृश्यता", "रूटिंग टाइमलाइन"] : ["No login required", "SLA visibility", "Routing timeline"],
    asideTitle: isHindi ? "जजों को क्या दिखेगा" : "What judges will see",
    asideText: isHindi
      ? "यह स्क्रीन नागरिक पारदर्शिता का सबूत है — टिकट आईडी डालते ही विभाग, स्थानीय अधिकारी, हेड दृश्यता और समयरेखा सामने आती है।"
      : "This screen proves citizen transparency: one ticket ID reveals department, local officer, supervising head, and the exact complaint journey.",
    trackTitle: isHindi ? "अपनी शिकायत ट्रैक करें" : "Track your complaint",
    noLogin: isHindi ? "लॉगिन आवश्यक नहीं" : "No login required",
    ticketPlaceholder: isHindi ? "टिकट आईडी दर्ज करें (उदा. JSAB12CD)" : "Enter Ticket ID (e.g. JSAB12CD)",
    track: isHindi ? "ट्रैक करें" : "Track",
    notFound: isHindi ? "टिकट नहीं मिला। कृपया आईडी जांचें।" : "Ticket not found. Please check the ID.",
    backToLogin: isHindi ? "लॉगिन पर वापस जाएँ" : "Back to Login",
    routing: isHindi ? "रूटिंग" : "Routing",
    status: isHindi ? "स्थिति" : "Status",
    timeline: isHindi ? "टाइमलाइन" : "Timeline",
    department: isHindi ? "विभाग" : "Department",
    currentLevel: isHindi ? "वर्तमान स्तर" : "Current Level",
    assignedLocalOfficer: isHindi ? "स्थानीय अधिकारी" : "Assigned Local Officer",
    supervisingHead: isHindi ? "सुपरवाइजिंग हेड" : "Supervising Department Head",
    state: isHindi ? "राज्य" : "State",
    district: isHindi ? "जिला" : "District",
    block: isHindi ? "ब्लॉक / क्षेत्र" : "Block / Area",
    address: isHindi ? "पता" : "Address",
    coordinates: isHindi ? "कोऑर्डिनेट्स" : "Coordinates",
    category: isHindi ? "श्रेणी" : "Category",
    priority: isHindi ? "प्राथमिकता" : "Priority",
    sla: isHindi ? "SLA समयसीमा" : "SLA Deadline",
    submitted: isHindi ? "दर्ज" : "Submitted",
    updated: isHindi ? "अंतिम अपडेट" : "Last Updated",
    originalLanguage: isHindi ? "मूल भाषा" : "Original Language",
    resolved: isHindi ? "समाधान समय" : "Resolved",
    duplicateStatus: isHindi ? "डुप्लिकेट स्थिति" : "Duplicate Status",
    translatedDescription: isHindi ? "अनूदित विवरण" : "Translated Description",
    latestOfficerRemarks: isHindi ? "ताज़ा अधिकारी टिप्पणी" : "Latest officer remarks",
    closureFeedback: isHindi ? "नागरिक क्लोज़र फीडबैक" : "Citizen closure feedback",
    rating: isHindi ? "रेटिंग" : "Rating",
    assignedOfficer: isHindi ? "असाइन अधिकारी" : "Assigned Officer",
    escalatedOfficer: isHindi ? "एस्केलेट अधिकारी" : "Escalated Officer",
    head: isHindi ? "हेड" : "Head",
    primaryComplaint: isHindi ? "मुख्य शिकायत" : "Primary complaint",
    beingAssigned: isHindi ? "असाइन हो रहा है" : "Being assigned",
    willMonitor: isHindi ? "असाइनमेंट के बाद दिखेगा" : "Will monitor once assigned",
    emptyTimeline: isHindi ? "रूटिंग और एस्केलेशन अपडेट यहाँ दिखेंगे।" : "Routing and escalation updates will appear here.",
    openRegistration: isHindi ? "नागरिक पंजीकरण खोलें" : "Open citizen registration",
    needMore: isHindi ? "और चाहिए?" : "Need more?",
  };

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
    <PortalEntryShell
      language={language}
      onLanguageChange={handleLanguageChange}
      title={text.title}
      subtitle={text.subtitle}
      eyebrow={text.eyebrow}
      description={text.description}
      badges={text.badges}
      asideTitle={text.asideTitle}
      asideText={text.asideText}
      asidePoints={[
        {
          icon: Search,
          title: isHindi ? "टिकट से तुरंत खोज" : "Instant ticket lookup",
          text: isHindi
            ? "शिकायत आईडी डालते ही वर्तमान स्थिति और जिम्मेदार अधिकारी सामने आ जाते हैं।"
            : "A single ticket ID reveals the current status and responsible officers immediately.",
        },
        {
          icon: MapPinned,
          title: isHindi ? "लोकेशन संदर्भ" : "Location context",
          text: isHindi
            ? "राज्य, जिला, ब्लॉक और जीपीएस डेटा यह दिखाता है कि शिकायत किस शाखा तक गई।"
            : "State, district, block, and GPS data make the field routing story understandable at a glance.",
        },
        {
          icon: ShieldCheck,
          title: isHindi ? "जवाबदेही स्पष्ट" : "Clear accountability",
          text: isHindi
            ? "असाइन अधिकारी और सुपरवाइजिंग हेड दोनों दिखते हैं, इसलिए शिकायत अंधेरे में नहीं जाती।"
            : "Both the assigned officer and supervising head remain visible, so complaints never disappear into a black box.",
        },
      ]}
      footer={
        <div className="rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white">
          <strong>{text.needMore}</strong>{" "}
          <Link to="/register" className="font-semibold text-amber-300 hover:text-amber-200">
            {text.openRegistration} →
          </Link>
        </div>
      }
    >
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
                    value={result.is_duplicate ? `${isHindi ? "डुप्लिकेट ऑफ" : "Duplicate of"} #${result.duplicate_of || "master complaint"}` : text.primaryComplaint}
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
    </PortalEntryShell>
  );
}
