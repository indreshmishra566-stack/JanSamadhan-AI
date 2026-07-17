import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { complaintApi } from "../../api";
import { PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState, InfoSection, DetailItem, TimelineList, ProfilePanel, DashboardHero, TabPills, LocationMap, LocationPickerMap } from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { getPublicText } from "../../i18n/public";
import toast from "react-hot-toast";
import {
  AlertCircle,
  BellRing,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileAudio,
  FileText,
  FileVideo,
  ImagePlus,
  MapPin,
  MessageCircle,
  MessageSquareReply,
  Mic,
  MicOff,
  Navigation,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  Video,
  VideoOff,
  X,
} from "lucide-react";

const COMPLAINT_ATTACHMENT_ACCEPT = "image/*,application/pdf,audio/*,video/*";

const getAttachmentKind = (file) => {
  if (!file?.type) return "file";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "file";
};

const isAllowedComplaintAttachment = (file) => {
  if (!file) return false;
  return ["image", "audio", "video", "pdf"].includes(getAttachmentKind(file));
};

const getComplaintHandlers = (complaint) => {
  const handlers = complaint?.assigned_handlers || [];
  if (handlers.length) return handlers;
  if (complaint?.assigned_officer) {
    return [{
      id: complaint.assigned_officer,
      name: complaint.officer_name || "Assigned officer/admin",
      role: "OFFICER",
      source: "Current assignment",
      rating: complaint.citizen_rating || null,
      feedback: complaint.citizen_feedback || "",
    }];
  }
  return [];
};

const getVoiceInputErrorMessage = (errorCode) => {
  const messages = {
    "not-allowed": "Microphone permission is blocked. Allow microphone access from the browser address bar, then try again.",
    "service-not-allowed": "This browser blocked online speech-to-text. Try Chrome/Edge, or use audio recording proof.",
    "audio-capture": "No microphone was found. Connect or enable a microphone, then try again.",
    network: "Speech-to-text service is not reachable from this browser. Try Chrome/Edge, or use audio recording proof.",
    "no-speech": "No speech was detected. Speak clearly near the microphone and try again.",
    aborted: "Voice input was stopped.",
  };
  return messages[errorCode] || "Could not capture voice input. Try Chrome/Edge or use audio recording proof.";
};

const CHAT_QUICK_PROMPTS = [
  "How do I file a complaint?",
  "Show my pending complaints",
  "How to use GPS?",
  "How to rate officer?",
];

function buildCitizenBotReply(message, context) {
  const text = message.trim().toLowerCase();
  const { complaints, pendingComplaints, assignedWithoutRating, latestComplaint, openLodgeForm, openProfile } = context;

  if (!text) {
    return "Please type your question. I can help with filing a complaint, tracking status, GPS, attachments, reminders, or officer rating.";
  }

  if (text.includes("file") || text.includes("complaint") || text.includes("grievance") || text.includes("submit") || text.includes("lodge")) {
    return {
      text: "To file a complaint, tap Lodge Grievance, add a clear title, describe one issue, use GPS Fill for location, attach photo/PDF/audio/video proof if available, then submit.",
      action: openLodgeForm,
      actionLabel: "Open complaint form",
    };
  }

  if (text.includes("pending") || text.includes("status") || text.includes("track")) {
    if (!complaints.length) return "You have not filed any complaints yet. Start with Lodge Grievance.";
    if (!pendingComplaints.length) return "You have no pending complaints right now.";
    const latestPending = pendingComplaints[0];
    return `You have ${pendingComplaints.length} pending complaint${pendingComplaints.length > 1 ? "s" : ""}. Latest: ${latestPending.ticket_id} - ${latestPending.title} (${latestPending.status}).`;
  }

  if (text.includes("gps") || text.includes("location") || text.includes("address")) {
    return "Use GPS Fill in the complaint form. If accuracy is poor, turn on device location/precise location, move near a window, press GPS Fill again, or type the exact area manually.";
  }

  if (text.includes("photo") || text.includes("pdf") || text.includes("audio") || text.includes("video") || text.includes("record") || text.includes("attachment")) {
    return "You can upload photo, PDF, audio, or video proof. You can also record voice or video directly from the complaint form and it will attach automatically.";
  }

  if (text.includes("rate") || text.includes("rating") || text.includes("feedback") || text.includes("officer")) {
    if (assignedWithoutRating.length) {
      const complaint = assignedWithoutRating[0];
      return `You can rate the assigned handler on complaint ${complaint.ticket_id} - ${complaint.title}. Open its details and use Rate Assigned Handler.`;
    }
    return "Ratings appear inside complaint details after a complaint has an assigned officer/admin. Your current assigned handlers are already rated or no complaint is assigned yet.";
  }

  if (text.includes("reminder") || text.includes("follow")) {
    if (!pendingComplaints.length) return "No pending complaint needs a reminder right now.";
    return `You can send a reminder from complaint details. Your latest active case is ${pendingComplaints[0].ticket_id}.`;
  }

  if (text.includes("profile") || text.includes("password") || text.includes("change")) {
    return {
      text: "Open Profile to update your details or change password.",
      action: openProfile,
      actionLabel: "Open profile",
    };
  }

  if (text.includes("latest") || text.includes("last")) {
    if (!latestComplaint) return "No complaint is registered yet.";
    return `Latest complaint: ${latestComplaint.ticket_id} - ${latestComplaint.title}. Status: ${latestComplaint.status}. Department: ${latestComplaint.department_name || "routing pending"}.`;
  }

  return "I can help with filing complaints, GPS/location, uploading media proof, tracking status, sending reminders, and rating the assigned officer/admin. Try asking: How do I file a complaint?";
}

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const content = getPublicText(language);
  
  // Debug logging
  useEffect(() => {
    console.log("🌐 CitizenDashboard language changed to:", language);
    console.log("📝 Translations loaded:", content.dashboard.statTotalLabel);
  }, [language, content]);
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") === "profile" ? "profile" : "complaints";
  const [tab, setTabState] = useState(requestedTab);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profileEditRequest, setProfileEditRequest] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("hi-IN");
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [gpsNote, setGpsNote] = useState("");
  const [showAdvancedGps, setShowAdvancedGps] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "Hi, I can help you file complaints, use GPS, track status, attach proof, send reminders, and rate the assigned officer/admin.",
    },
  ]);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoRecorderRef = useRef(null);
  const videoStreamRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoChunksRef = useRef([]);
  const voiceBaseRef = useRef("");
  const speechTranscriptRef = useRef("");
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        mediaRecorderRef.current = null;
      }
    }
    setIsListening(false);
    setIsRecordingAudio(false);
  }, []);

  const stopVideoRecording = useCallback(() => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== "inactive") {
      try {
        videoRecorderRef.current.stop();
        return;
      } catch {
        videoRecorderRef.current = null;
      }
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    setIsRecordingVideo(false);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: () => complaintApi.list().then((r) => r.data),
  });

  const complaints = data?.results || data || [];
  const disposedStatuses = ["RESOLVED", "CLOSED", "REJECTED"];
  const pendingComplaints = complaints.filter((c) => !disposedStatuses.includes(c.status));
  const disposedComplaints = complaints.filter((c) => disposedStatuses.includes(c.status));
  const assignedWithoutRating = complaints.filter((c) => getComplaintHandlers(c).some((handler) => !handler.rating));
  const escalatedComplaints = complaints.filter((c) => c.status === "ESCALATED");
  const latestComplaint = complaints[0];

  const filteredComplaints = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return complaints.filter((complaint) => {
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "PENDING_WORK" ? !disposedStatuses.includes(complaint.status) : complaint.status === statusFilter);
      const searchable = [
        complaint.ticket_id,
        complaint.title,
        complaint.description,
        complaint.department_name,
        complaint.officer_name,
        complaint.location,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [complaints, searchText, statusFilter]);

  useEffect(() => {
    const nextTab = searchParams.get("tab") === "profile" ? "profile" : "complaints";
    setTabState(nextTab);
    if (nextTab === "profile" && searchParams.get("edit") === "1") {
      setProfileEditRequest((count) => count + 1);
    }
  }, [searchParams]);

  useEffect(() => {
    const kind = getAttachmentKind(form.attachment);
    if (!form.attachment || !["image", "audio", "video"].includes(kind)) {
      setAttachmentPreview(null);
      return undefined;
    }

    const previewUrl = URL.createObjectURL(form.attachment);
    setAttachmentPreview({ kind, url: previewUrl });
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.attachment]);

  useEffect(() => () => {
    stopVoiceInput();
    stopVideoRecording();
  }, [stopVoiceInput, stopVideoRecording]);

  useEffect(() => {
    if (isRecordingVideo && videoPreviewRef.current && videoStreamRef.current) {
      videoPreviewRef.current.srcObject = videoStreamRef.current;
    }
  }, [isRecordingVideo]);

  const setTab = (nextTab) => {
    setTabState(nextTab);
    setSearchParams(nextTab === "profile" ? { tab: "profile" } : {});
  };

  const createMutation = useMutation({
    mutationFn: (fd) => complaintApi.create(fd),
    onSuccess: ({ data: complaint }) => {
      qc.invalidateQueries(["my-complaints"]);
      toast.success(
        complaint?.ticket_id
          ? `Complaint submitted. Tracking ID: ${complaint.ticket_id}`
          : "Complaint submitted! AI is classifying it now.",
        { duration: 6000 }
      );
      stopVoiceInput();
      stopVideoRecording();
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

  const attachRecordedAudio = (blob) => {
    const file = new File([blob], `complaint-recording-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
    setForm((prev) => ({
      ...prev,
      attachment: file,
      description: prev.description.trim()
        ? prev.description
        : "Audio recording attached as complaint description proof.",
    }));
    toast.success("Audio recording attached to complaint proof");
  };

  const attachRecordedVideo = (blob) => {
    const extension = blob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([blob], `complaint-video-${Date.now()}.${extension}`, { type: blob.type || "video/webm" });
    setForm((prev) => ({
      ...prev,
      attachment: file,
      description: prev.description.trim()
        ? prev.description
        : "Video recording attached as complaint proof.",
    }));
    toast.success("Video recording attached to complaint proof");
  };

  const startAudioRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error("Audio recording is not supported in this browser");
      return;
    }

    try {
      stopVideoRecording();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecordingAudio(false);
        setIsListening(false);
        if (audioChunksRef.current.length) {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          attachRecordedAudio(blob);
        }
        mediaRecorderRef.current = null;
      };
      recorder.start();
      setIsRecordingAudio(true);
      setIsListening(true);
      toast.success("Recording started. Speak your complaint, then press Stop.");
    } catch {
      toast.error("Microphone permission is needed for audio recording");
    }
  };

  const startVideoRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error("Video recording is not supported in this browser");
      return;
    }

    try {
      stopVoiceInput();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoStreamRef.current = stream;
      videoChunksRef.current = [];
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      const preferredTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      videoRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) videoChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
        setIsRecordingVideo(false);
        if (videoChunksRef.current.length) {
          const blob = new Blob(videoChunksRef.current, { type: recorder.mimeType || "video/webm" });
          attachRecordedVideo(blob);
        }
        videoRecorderRef.current = null;
      };

      recorder.start();
      setIsRecordingVideo(true);
      toast.success("Video recording started. Press Stop video when complete.");
    } catch {
      toast.error("Camera and microphone permission are needed for video recording");
      stopVideoRecording();
    }
  };

  const toggleVideoRecording = async () => {
    if (isRecordingVideo) {
      stopVideoRecording();
      return;
    }
    await startVideoRecording();
  };

  const toggleVoiceInput = async () => {
    if (isListening) {
      stopVoiceInput();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Voice-to-text is not supported in this browser. Recording audio proof instead.", { duration: 6000 });
      await startAudioRecording();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    voiceBaseRef.current = form.description.trim();
    speechTranscriptRef.current = "";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      speechTranscriptRef.current = transcript;
      const separator = voiceBaseRef.current && transcript ? " " : "";
      setForm((prev) => ({
        ...prev,
        description: `${voiceBaseRef.current}${separator}${transcript}`.trimStart(),
      }));
    };
    recognition.onerror = async (event) => {
      const message = getVoiceInputErrorMessage(event.error);
      toast.error(message, { duration: 7000 });
      setIsListening(false);
      recognitionRef.current = null;
      try {
        recognition.stop();
      } catch {
        // Browser may already have stopped the speech recognizer.
      }
      const shouldFallbackToRecording = ["network", "service-not-allowed", "audio-capture"].includes(event.error);
      if (shouldFallbackToRecording && !speechTranscriptRef.current) {
        toast("Switching to audio recording proof for this browser.", { duration: 5000 });
        await startAudioRecording();
      }
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
    if (!isAllowedComplaintAttachment(file)) {
      toast.error("Please select a photo, PDF, audio, or video file");
      return;
    }
    setForm((prev) => ({ ...prev, attachment: file }));
  };

  const selectedAttachmentKind = getAttachmentKind(form.attachment);
  const AttachmentIcon = selectedAttachmentKind === "audio"
    ? FileAudio
    : selectedAttachmentKind === "video"
      ? FileVideo
      : selectedAttachmentKind === "pdf"
        ? FileText
        : selectedAttachmentKind === "image"
          ? ImagePlus
          : Paperclip;

  const reverseGeocode = async (latitude, longitude) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    if (!response.ok) throw new Error("Reverse geocoding failed");
    return response.json();
  };

  const getBestGpsPosition = () => new Promise((resolve, reject) => {
    let bestPosition = null;
    let settled = false;
    const finish = (position) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timeoutId);
      resolve(position);
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timeoutId);
      if (bestPosition) resolve(bestPosition);
      else reject(error);
    };
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }
        if (position.coords.accuracy <= 75) finish(position);
      },
      fail,
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
    const timeoutId = window.setTimeout(() => {
      if (bestPosition) finish(bestPosition);
      else fail(new Error("GPS timeout"));
    }, 12000);
  });

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Location detection is not supported in this browser");
      return;
    }
    setIsDetectingLocation(true);
    setGpsNote("");
    try {
      const position = await getBestGpsPosition();
      const { coords } = position;
      const latitude = coords.latitude.toFixed(6);
      const longitude = coords.longitude.toFixed(6);
      const accuracy = Math.round(coords.accuracy || 0);
      const preciseEnough = accuracy > 0 && accuracy <= 1000;
      let locationPatch = { latitude, longitude };

      try {
        const place = await reverseGeocode(latitude, longitude);
        const address = place.address || {};
        const preciseArea = [
          address.neighbourhood,
          address.suburb,
          address.residential,
          address.quarter,
          address.city_district,
          address.village,
          address.town,
          address.city,
        ].filter(Boolean).find((part, index, parts) => parts.indexOf(part) === index);
        const preciseAddress = [
          address.house_number && address.road ? `${address.house_number} ${address.road}` : address.road,
          preciseArea,
          address.city || address.town || address.village,
          address.state,
          address.postcode,
          address.country,
        ].filter(Boolean).filter((part, index, parts) => parts.indexOf(part) === index).join(", ");
        locationPatch = {
          ...locationPatch,
          location: preciseEnough ? (preciseAddress || place.display_name || form.location) : form.location,
          state: address.state || form.state,
          district: address.state_district || address.county || address.city_district || address.city || address.town || form.district,
          block: preciseEnough ? (preciseArea || address.road || form.block) : form.block,
        };
        setGpsNote(
          preciseEnough
            ? `Precise GPS filled ${preciseArea ? preciseArea : "your area"} details. Accuracy: about ${accuracy} meters.`
            : `GPS is approximate (${accuracy} meters), so exact locality like Saket Nagar cannot be trusted. Turn on device location/precise location, move near a window, then press GPS Fill again; or type your exact area manually.`
        );
      } catch {
        setGpsNote(`GPS coordinates filled. Address lookup failed, so please type address details manually. Accuracy: about ${accuracy} meters.`);
      }

      setForm((prev) => ({ ...prev, ...locationPatch }));
      if (preciseEnough) toast.success("Precise GPS location details added");
      else toast.error("GPS is too approximate for exact locality");
    } catch (error) {
      const denied = error?.code === 1;
      toast.error(denied ? "Please allow location permission for GPS autofill" : "Could not access your GPS location");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const sendReminder = (complaint) => {
    toast.success(`Reminder noted for ${complaint.ticket_id}. Officer notification API can be connected next.`);
  };

  const openFeedback = (complaint) => {
    setSelected(complaint);
    toast("Rating form is available inside complaint details.");
  };

  const handleMapPick = ({ latitude, longitude }) => {
    setForm((prev) => ({ ...prev, latitude, longitude }));
    setGpsNote("Exact map pin selected manually. Officers will see this pinned location.");
    toast.success("Exact complaint pin updated");
  };

  const openLodgeForm = () => {
    setTab("complaints");
    setShowForm(true);
    setChatOpen(false);
  };

  const openProfileFromChat = () => {
    setTab("profile");
    setChatOpen(false);
  };

  const sendChatMessage = (message = chatText) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: trimmed,
    };
    const reply = buildCitizenBotReply(trimmed, {
      complaints,
      pendingComplaints,
      assignedWithoutRating,
      latestComplaint,
      openLodgeForm,
      openProfile: openProfileFromChat,
    });
    const botMessage = {
      id: Date.now() + 1,
      role: "bot",
      text: typeof reply === "string" ? reply : reply.text,
      action: typeof reply === "string" ? null : reply.action,
      actionLabel: typeof reply === "string" ? "" : reply.actionLabel,
    };

    setChatMessages((messages) => [...messages, userMessage, botMessage]);
    setChatText("");
  };

  const stats = useMemo(() => {
    const currentContent = getPublicText(language);
    return [
      { label: currentContent.dashboard.statTotalLabel, value: complaints.length, icon: "📋", color: "blue", sub: currentContent.dashboard.statTotalSub },
      { label: currentContent.dashboard.statPendingLabel, value: pendingComplaints.length, icon: "⏳", color: "yellow", sub: currentContent.dashboard.statPendingSub },
      { label: currentContent.dashboard.statDisposedLabel, value: disposedComplaints.length, icon: "✅", color: "green", sub: currentContent.dashboard.statDisposedSub },
      { label: currentContent.dashboard.statEscalatedLabel, value: escalatedComplaints.length, icon: "🔴", color: "red", sub: currentContent.dashboard.statEscalatedSub },
    ];
  }, [language, complaints.length, pendingComplaints.length, disposedComplaints.length, escalatedComplaints.length]);

  const serviceCards = useMemo(() => {
    const currentContent = getPublicText(language);
    return [
    {
      title: currentContent.dashboard.cardLodgeTitle,
      text: currentContent.dashboard.cardLodgeText,
      icon: ClipboardList,
      action: () => { setShowForm(true); setTab("complaints"); },
      cta: currentContent.dashboard.cardLodgeCTA,
    },
    {
      title: currentContent.dashboard.cardViewTitle,
      text: latestComplaint ? `${currentContent.dashboard.registerIdLatestPrefix} ${latestComplaint.ticket_id}` : currentContent.dashboard.noLatestComplaint,
      icon: Search,
      action: () => { setShowForm(false); setTab("complaints"); },
      cta: currentContent.dashboard.cardViewCTA,
    },
    {
      title: currentContent.dashboard.cardReminderTitle,
      text: pendingComplaints.length ? `${pendingComplaints.length} ${pendingComplaints.length > 1 ? currentContent.dashboard.activeCasesFollowUpPlural : currentContent.dashboard.activeCasesFollowUp} can be followed up.` : currentContent.dashboard.noPendingReminder,
      icon: BellRing,
      action: () => pendingComplaints[0] ? sendReminder(pendingComplaints[0]) : toast.success("No pending reminders right now."),
      cta: currentContent.dashboard.cardReminderCTA,
    },
    {
      title: currentContent.dashboard.cardFeedbackTitle,
      text: assignedWithoutRating.length ? `${assignedWithoutRating.length} ${assignedWithoutRating.length > 1 ? currentContent.dashboard.assignedCasesRatingPlural : currentContent.dashboard.assignedCasesRating} ${currentContent.dashboard.awaitingRating}` : currentContent.dashboard.allHandlersRated,
      icon: Star,
      action: () => assignedWithoutRating[0] ? openFeedback(assignedWithoutRating[0]) : toast("No assigned case is awaiting rating."),
      cta: currentContent.dashboard.cardFeedbackCTA,
    },
    ];
  }, [language, pendingComplaints, assignedWithoutRating, sendReminder, openFeedback, latestComplaint]);

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <DashboardHero
        tone="blue"
        eyebrow={content.dashboard.eyebrow}
        title={`${content.dashboard.welcome}, ${user?.first_name || user?.username}`}
        subtitle={content.dashboard.subtitle}
        badges={[
          user?.district || user?.state || content.dashboard.badges[0],
          content.dashboard.badges[1],
          content.dashboard.badges[2],
        ]}
        actions={[
          { label: content.dashboard.lodgeGrievanceBtn, onClick: () => { setShowForm(true); setTab("complaints"); } },
          tab === "profile"
            ? { label: content.dashboard.editProfileBtn, onClick: () => setProfileEditRequest((count) => count + 1), variant: "secondary" }
            : { label: content.dashboard.profileBtn, onClick: () => setTab("profile"), variant: "secondary" },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {serviceCards.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={item.action}
            className="card group flex min-h-36 flex-col items-start p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
          >
            <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <item.icon size={20} />
            </span>
            <span className="text-sm font-bold text-slate-900">{item.title}</span>
            <span className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{item.text}</span>
            <span className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold uppercase tracking-wide text-cyan-700">
              {item.cta}
              <Send size={13} className="transition group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 mt-6 md:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="mb-6">
        <TabPills
          value={tab}
          onChange={setTab}
          items={[
            { value: "complaints", label: content.dashboard.tabComplaints },
            { value: "profile", label: content.dashboard.tabProfile },
          ]}
        />
      </div>

      {tab === "profile" && <ProfilePanel editRequest={profileEditRequest} />}

      {tab === "complaints" && showForm && (
        <div className="card mb-6 overflow-hidden border-blue-100 shadow-[0_20px_60px_rgba(29,78,216,0.08)]">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700">{content.dashboard.formSubtitle}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">{content.dashboard.formTitle}</h2>
              </div>
              <button onClick={() => { stopVoiceInput(); stopVideoRecording(); setShowForm(false); }} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900"><X size={18} /></button>
            </div>
          </div>
          <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-cyan-700"><ShieldCheck size={13} /> AI classification</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"><MapPin size={13} /> Location routing</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700"><Paperclip size={13} /> Photo, PDF, audio, video</span>
            </div>
          </div>
          <div className="mb-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{content.dashboard.formAlert}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{content.dashboard.formTitleLabel}</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={content.dashboard.formTitlePlaceholder} required />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  {content.dashboard.formDescriptionLabel} <span className="text-gray-400 font-normal">{content.dashboard.formDescriptionSubtext}</span>
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
                    {isRecordingAudio ? "Stop recording" : isListening ? "Stop voice" : "Voice / Record"}
                  </button>
                  <button
                    type="button"
                    onClick={toggleVideoRecording}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      isRecordingVideo
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                    aria-pressed={isRecordingVideo}
                  >
                    {isRecordingVideo ? <VideoOff size={14} /> : <Video size={14} />}
                    {isRecordingVideo ? "Stop video" : "Video / Record"}
                  </button>
                </div>
              </div>
              <textarea className="input min-h-24 resize-y" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={content.dashboard.formTitlePlaceholder} required />
              {isRecordingAudio ? (
                <p className="mt-1 text-xs font-medium text-red-700">{content.dashboard.voiceRecordingInProgress}</p>
              ) : isRecordingVideo ? (
                <p className="mt-1 text-xs font-medium text-red-700">{content.dashboard.videoRecordingInProgress}</p>
              ) : isListening && (
                <p className="mt-1 text-xs font-medium text-cyan-700">{content.dashboard.voiceListeningInProgress}</p>
              )}
              {!isListening && !isRecordingAudio && (
                <p className="mt-1 text-xs text-gray-500">{content.dashboard.voiceInfoText}</p>
              )}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700">{content.dashboard.formLocationLabel}</label>
                <span className="text-xs font-medium text-gray-500">{content.dashboard.formLocationSubtext}</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input className="input pl-9" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder={content.dashboard.formLocationPlaceholder} />
                </div>
                <button type="button" onClick={detectLocation} disabled={isDetectingLocation} className="btn-secondary flex items-center gap-2 shrink-0">
                  <Navigation size={15} /> {isDetectingLocation ? content.dashboard.formGPSDetecting : content.dashboard.formGPSButton}
                </button>
              </div>
              {gpsNote && (
                <p className={`mt-2 rounded-md px-3 py-2 text-xs font-medium ${
                  gpsNote.includes("approximate") ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"
                }`}>
                  {gpsNote}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <Navigation size={15} /> Address details
                  </div>
                  <p className="mt-1 text-xs text-emerald-700">Coordinates are kept for officer map routing and nearby assignment.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedGps((open) => !open)}
                  className="rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  {showAdvancedGps ? "Hide coordinates" : "Map coordinates"}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
              {showAdvancedGps && (
                <div className="mt-3 grid grid-cols-1 gap-3 border-t border-emerald-100 pt-3 md:grid-cols-2">
                  {[
                    ["latitude", "Latitude", "23.259933"],
                    ["longitude", "Longitude", "77.412613"],
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
                  <p className="text-xs leading-5 text-emerald-700 md:col-span-2">
                    Latitude and longitude are map numbers. Citizens can leave them as GPS filled values; officers use them to find the spot accurately.
                  </p>
                  <div className="md:col-span-2">
                    <LocationPickerMap
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onPick={handleMapPick}
                    />
                  </div>
                  <LocationMap latitude={form.latitude} longitude={form.longitude} label="Selected complaint location" className="md:col-span-2" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment proof (optional)</label>
              {isRecordingVideo && (
                <div className="mb-3 overflow-hidden rounded-lg border border-red-200 bg-black">
                  <video ref={videoPreviewRef} autoPlay muted playsInline className="max-h-80 w-full object-contain" />
                  <div className="flex items-center justify-between bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    <span>Camera recording in progress</span>
                    <button type="button" onClick={stopVideoRecording} className="rounded-md bg-white px-2 py-1 hover:bg-red-100">
                      Stop video
                    </button>
                  </div>
                </div>
              )}
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-cyan-200 bg-cyan-50/50 px-4 py-5 text-center transition hover:bg-cyan-50">
                <AttachmentIcon size={24} className="text-cyan-700" />
                <span className="text-sm font-semibold text-gray-800">
                  {form.attachment ? form.attachment.name : "Upload photo, PDF, audio, or video"}
                </span>
                <span className="text-xs text-gray-500">Camera photos, documents, recordings, and videos are accepted</span>
                <input
                  key={form.attachment ? form.attachment.name : "empty-attachment"}
                  type="file"
                  accept={COMPLAINT_ATTACHMENT_ACCEPT}
                  className="sr-only"
                  onChange={(e) => handleAttachmentChange(e.target.files?.[0])}
                />
              </label>
              {form.attachment && (
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {attachmentPreview?.kind === "image" && (
                    <img src={attachmentPreview.url} alt="Selected complaint proof" className="h-48 w-full object-cover" />
                  )}
                  {attachmentPreview?.kind === "audio" && (
                    <div className="bg-gray-50 p-4">
                      <audio src={attachmentPreview.url} controls className="w-full" />
                    </div>
                  )}
                  {attachmentPreview?.kind === "video" && (
                    <video src={attachmentPreview.url} controls className="max-h-72 w-full bg-black object-contain" />
                  )}
                  {selectedAttachmentKind === "pdf" && (
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-5">
                      <FileText size={28} className="shrink-0 text-cyan-700" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">{form.attachment.name}</p>
                        <p className="text-xs text-gray-500">PDF document selected</p>
                      </div>
                    </div>
                  )}
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
                {createMutation.isPending ? "Submitting..." : "Submit Grievance"}
              </button>
              <button type="button" onClick={() => { stopVoiceInput(); stopVideoRecording(); setShowForm(false); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
          </div>
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
          <div className="card p-4">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Case Register</p>
                <h2 className="text-lg font-bold text-slate-950">My lodged grievances</h2>
                <p className="mt-1 text-sm text-slate-500">Search, filter, open details, copy registration ID, send reminder, and rate the assigned officer/admin.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_220px]">
                <div className="relative min-w-0">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    className="input pl-9"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by registration ID, subject, department, officer, or place"
                  />
                </div>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter grievances by status"
                >
                  <option value="ALL">All grievances</option>
                  <option value="PENDING_WORK">Pending work</option>
                  <option value="PENDING">Pending</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-700">Registration ID</span>
                <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">Officer tracking</span>
                <span className="rounded-full bg-orange-50 px-3 py-1 font-medium text-orange-700">Reminder</span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">Feedback</span>
              </div>
            </div>
          </div>
          {filteredComplaints.length === 0 ? (
            <EmptyState
              icon="🔎"
              title="No matching grievances"
              description="Change the search or status filter to view more records."
              action={<button type="button" onClick={() => { setSearchText(""); setStatusFilter("ALL"); }} className="btn-secondary">Reset filters</button>}
            />
          ) : filteredComplaints.map((c) => (
            <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl"><CategoryIcon category={c.category} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{c.title}</p>
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-semibold text-slate-600">Reg. ID {c.ticket_id}</span>
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
                      {getComplaintHandlers(c).some((handler) => handler.rating) && (
                        <span className="badge bg-yellow-50 text-yellow-700">
                          {getComplaintHandlers(c).filter((handler) => handler.rating).length}/{getComplaintHandlers(c).length} rated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="hidden min-w-36 text-right sm:block">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Submitted</p>
                  <p className="text-xs font-medium text-slate-500">{formatDate(c.created_at)}</p>
                </div>
              </div>
              {selected?.id === c.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button type="button" onClick={(event) => { event.stopPropagation(); sendReminder(c); }} className="btn-secondary inline-flex items-center gap-2 text-sm">
                      <BellRing size={15} /> Send Reminder
                    </button>
                    <button type="button" onClick={(event) => { event.stopPropagation(); navigator.clipboard?.writeText(c.ticket_id); toast.success("Registration ID copied"); }} className="btn-secondary inline-flex items-center gap-2 text-sm">
                      <ClipboardList size={15} /> Copy Registration ID
                    </button>
                    {getComplaintHandlers(c).some((handler) => !handler.rating) && (
                      <button type="button" onClick={(event) => { event.stopPropagation(); openFeedback(c); }} className="btn-primary inline-flex items-center gap-2 text-sm">
                        <MessageSquareReply size={15} /> Rate Assigned Officers
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <InfoSection title="Routing and Office" icon="🧭">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailItem label="Department" value={c.department_name} accent />
                        <DetailItem label="Current Level" value={c.current_level} accent />
                        <DetailItem label="Assigned Local Officer" value={c.officer_name} />
                        <DetailItem label="Supervising Department Head" value={c.supervising_head_name} />
                        <DetailItem
                          label="Officer Ratings"
                          value={`${getComplaintHandlers(c).filter((handler) => handler.rating).length}/${getComplaintHandlers(c).length || 0} rated`}
                        />
                        <DetailItem label="Location" value={c.location} />
                        <DetailItem label="State" value={c.state} />
                        <DetailItem label="District" value={c.district} />
                        <DetailItem label="Block / Area" value={c.block} />
                        <DetailItem label="Coordinates" value={c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : ""} />
                        <div className="sm:col-span-2">
                          <LocationMap latitude={c.latitude} longitude={c.longitude} label={`Complaint ${c.ticket_id} map`} />
                        </div>
                      </div>
                    </InfoSection>
                    <InfoSection title="Status and SLA" icon="📌">
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
                    <InfoSection title="Action Timeline" icon="🕒">
                      <TimelineList
                        items={[
                          {
                            top: "Grievance Registered",
                            middle: `Registration ID ${c.ticket_id}`,
                            note: c.department_name ? `Routed to ${c.department_name}` : "AI routing in progress",
                            date: formatDate(c.created_at),
                          },
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
                    <div className="mt-3 flex gap-3 rounded-lg bg-blue-50 p-3 text-sm">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-blue-700" />
                      <p><span className="font-medium text-blue-700">Officer remarks:</span> {c.officer_remarks}</p>
                    </div>
                  )}
                  {c.is_duplicate && (
                    <div className="mt-3 flex gap-3 rounded-lg bg-amber-50 p-3 text-sm">
                      <RotateCcw size={18} className="mt-0.5 shrink-0 text-amber-700" />
                      <p><span className="font-medium text-amber-700">Duplicate intelligence:</span>{" "}
                      This complaint is linked to {c.duplicate_of ? `master ticket #${c.duplicate_of}` : "another primary complaint"} for combined action.</p>
                    </div>
                  )}
                  {getComplaintHandlers(c).length > 0 && (
                    <div className="mt-3 rounded-lg bg-yellow-50 p-4 text-sm">
                      <div className="mb-3 flex items-center gap-2 font-semibold text-yellow-800">
                        <Star size={18} /> Rate every officer/admin assigned to this complaint
                      </div>
                      <div className="space-y-3">
                        {getComplaintHandlers(c).map((handler) => (
                          handler.rating ? (
                            <div key={handler.id} className="rounded-lg border border-yellow-100 bg-white px-3 py-2">
                              <p className="font-medium text-slate-800">{handler.name}</p>
                              <p className="mt-1 text-xs text-yellow-700">Rated {handler.rating}/5{handler.feedback ? ` · ${handler.feedback}` : ""}</p>
                            </div>
                          ) : (
                            <FeedbackForm
                              key={handler.id}
                              complaintId={c.id}
                              officerId={handler.id}
                              handlerName={handler.name || "assigned admin/officer"}
                              onDone={() => qc.invalidateQueries(["my-complaints"])}
                            />
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <CitizenChatbot
        open={chatOpen}
        onToggle={() => setChatOpen((open) => !open)}
        messages={chatMessages}
        input={chatText}
        onInputChange={setChatText}
        onSend={sendChatMessage}
        pendingCount={pendingComplaints.length}
        ratingCount={assignedWithoutRating.length}
      />
    </div>
  );
}

function CitizenChatbot({ open, onToggle, messages, input, onInputChange, onSend, pendingCount, ratingCount }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open && (
        <div className="w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-cyan-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                <Bot size={19} />
              </span>
              <div>
                <p className="text-sm font-bold">Citizen Help Chat</p>
                <p className="text-xs text-slate-300">Complaint, GPS, status, rating</p>
              </div>
            </div>
            <button type="button" onClick={onToggle} className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
              <X size={17} />
            </button>
          </div>
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-lg bg-white px-3 py-2 font-medium text-slate-600 shadow-sm">{pendingCount} pending</span>
              <span className="rounded-lg bg-white px-3 py-2 font-medium text-slate-600 shadow-sm">{ratingCount} to rate</span>
            </div>
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={message.role === "user"
                  ? "max-w-[82%] rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white"
                  : "max-w-[86%] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"}
                >
                  <p>{message.text}</p>
                  {message.action && (
                    <button
                      type="button"
                      onClick={message.action}
                      className="mt-2 rounded-md bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700 hover:bg-cyan-100"
                    >
                      {message.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {CHAT_QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSend(prompt)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onSend();
              }}
            >
              <input
                className="input text-sm"
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                placeholder="Ask about complaint, GPS, status..."
              />
              <button type="submit" className="btn-primary inline-flex items-center gap-1 px-3 text-sm">
                <Send size={15} /> Send
              </button>
            </form>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-400"
        aria-label={open ? "Close citizen chatbot" : "Open citizen chatbot"}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}

function FeedbackForm({ complaintId, officerId, handlerName, onDone }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const mutation = useMutation({
    mutationFn: () => complaintApi.rateHandler(complaintId, officerId, { rating, feedback }),
    onSuccess: () => { toast.success("Officer/admin rating saved!"); onDone(); },
  });
  return (
    <div className="rounded-lg bg-green-50 p-4" onClick={(event) => event.stopPropagation()}>
      <p className="text-sm font-medium text-green-800 mb-1">Rate assigned officer/admin</p>
      <p className="mb-2 text-xs text-green-700">This rating is saved for {handlerName || "the assigned handler"} on this complaint.</p>
      <div className="flex gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
        ))}
      </div>
      <textarea className="input text-sm mb-2" value={feedback} onChange={(e) => setFeedback(e.target.value)}
        placeholder="Write comment about officer/admin response, if any" rows={2} />
      <button type="button" onClick={() => mutation.mutate()} disabled={!rating || mutation.isPending} className="btn-primary text-sm py-1.5">
        Submit Rating
      </button>
    </div>
  );
}
