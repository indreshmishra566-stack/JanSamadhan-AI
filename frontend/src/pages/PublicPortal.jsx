import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ClipboardList,
  Droplets,
  FileCheck2,
  FileText,
  Globe2,
  Home,
  Languages,
  LogIn,
  MailCheck,
  MapPinned,
  MessageSquareText,
  MonitorCheck,
  Network,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  UserPlus,
  Users,
  Waves,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

const PORTAL_LANGUAGE_KEY = "portal_language";

const copy = {
  en: {
    trusted: "Trusted digital public grievance system",
    subtitle: "AI-assisted water grievance redressal portal",
    language: "Language",
    signIn: "Sign In",
    viewStatus: "View Status",
    officers: "Officers",
    process: "Redress Process",
    grievance: "Grievance",
    officerDashboard: "Officer Dashboard",
    mobileApp: "Mobile App",
    sitemap: "Sitemap",
    heroKicker: "Citizens -> Jan Samadhan Portal / App -> Water Department Redressal",
    heroTitle: "Water Grievance Command Platform",
    heroText: "Built for India-ready water governance: citizen complaint intake, AI classification, nearest field assignment, supervising head visibility, escalation, tracking, and closure feedback.",
    registerCitizen: "Register Citizen",
    openCitizenDesk: "Lodge Grievance",
    liveWorkflow: "See Workflow",
    stats: [
      { label: "Coverage Model", value: "Central to Village" },
      { label: "Routing Logic", value: "Nearest Officer + Head Visibility" },
      { label: "Service Focus", value: "Water Supply" },
      { label: "Citizen Flow", value: "Trackable by Ticket ID" },
    ],
    quickActionsTitle: "Core Workflows",
    quickActionsText: "Every primary action below opens a real working surface in the application: citizen intake, public tracking, officer handling, and administrative control.",
    quickActions: [
      { icon: ClipboardList, title: "Lodge a Water Complaint", text: "Citizen login, complaint form, GPS capture, attachment upload, AI classification, and assignment.", action: "Open Citizen Desk", to: "/citizen/dashboard" },
      { icon: Search, title: "Track Existing Ticket", text: "Public complaint lookup with assigned officer, supervising head, SLA, and routing timeline.", action: "Track Complaint", to: "/track" },
      { icon: ShieldCheck, title: "Officer Handling Console", text: "Update status, upload proof, forward to another officer, or escalate up the reporting chain.", action: "Open Officer Console", to: "/officer/dashboard" },
      { icon: BarChart3, title: "Admin Control Room", text: "Manage complaints, departments, officers, duplicates, and operational analytics from one place.", action: "Open Admin Dashboard", to: "/admin/dashboard" },
    ],
    architectureTitle: "Operational Coverage",
    architectureText: "The platform is structured for one production-style department rollout: central oversight, state command, division, district, block, panchayat, and village response layers working in one chain.",
    architecture: [
      { icon: Globe2, title: "Central Mission Desk", text: "Chief grievance oversight and national water mission supervision." },
      { icon: Waves, title: "State Water Directorate", text: "State-level routing, reporting control, and state escalation handling." },
      { icon: MapPinned, title: "Division & District Desk", text: "Regional operational leadership with visibility over district workload and SLA risk." },
      { icon: Droplets, title: "Block / Panchayat / Village", text: "Nearest field operators receive the complaint first, while the head retains visibility." },
    ],
    structureTitle: "How The Product Is Structured",
    structureText: "The UI mirrors the real application layers: public intake, AI and department routing, branch operations, and command monitoring.",
    structureCards: [
      { icon: ClipboardList, title: "Citizen Intake", text: "Registration, complaint submission, bilingual input, location capture, and attachment upload." },
      { icon: Globe2, title: "AI Routing Engine", text: "Complaint classification, department mapping, nearest branch assignment, and head visibility." },
      { icon: Users, title: "Officer Branch Operations", text: "Forwarding, escalation, proof upload, branch hierarchy, and field-response ownership." },
      { icon: BarChart3, title: "Command & Analytics", text: "Admin oversight, duplicate control, public tracking, SLA watch, and routing transparency." },
    ],
    hierarchyTitle: "Operational Water Hierarchy",
    hierarchyText: "The public portal now shows only the working service layers, from national command to village response, without exposing internal accounts or credentials.",
    hierarchyGroups: [
      {
        title: "Central & State",
        items: [
          { label: "National Grievance Desk", note: "Central command and policy oversight" },
          { label: "Water Mission Command", note: "Department-wide supervision and routing" },
          { label: "State Water Directorate", note: "State operations and escalation control" },
        ],
      },
      {
        title: "Regional & District",
        items: [
          { label: "Division Operations Desk", note: "Regional workload and SLA monitoring" },
          { label: "District Water Control Room", note: "District-level complaint supervision" },
          { label: "Block Response Unit", note: "Block routing and field coordination" },
        ],
      },
      {
        title: "Field Delivery",
        items: [
          { label: "Panchayat Field Lead", note: "Local branch ownership and dispatch" },
          { label: "Village Water Operator", note: "Nearest first responder for field action" },
          { label: "Mobile Maintenance Crew", note: "Proof upload and closure support" },
        ],
      },
    ],
    hierarchyHint: "Public visitors see the service structure only. Demo credentials stay out of the homepage and can be shared separately during testing.",
    hierarchyPrivacyNote: "Seeded usernames and passwords are intentionally hidden from the public portal.",
    flowTitle: "End-to-End Water Complaint Flow",
    flowNodes: [
      { icon: Users, title: "Citizens", text: "Submit water complaints through web portal or mobile workflow." },
      { icon: MonitorCheck, title: "Jan Samadhan Portal / App", text: "Single entry point for registration, login, complaints, tracking, and reminders." },
      { icon: ClipboardList, title: "Water Complaint Module", text: "Capture title, description, state, district, block, GPS location, and attachment." },
      { icon: Globe2, title: "AI + Department Mapping", text: "AI identifies water category and maps the grievance to the water department branch." },
      { icon: MapPinned, title: "Nearest Officer Routing", text: "The nearest branch operator gets the complaint first based on location context." },
      { icon: ShieldCheck, title: "Supervising Head Visibility", text: "Department head still sees the case for monitoring, intervention, and escalation." },
      { icon: Send, title: "Forward / Escalate / Resolve", text: "Field teams act first; unresolved cases move upward through the reporting chain." },
      { icon: Star, title: "Citizen Feedback", text: "Resolved complaints collect feedback, rating, and closure quality signals." },
    ],
    modulesTitle: "Platform Capabilities",
    modules: [
      { icon: ClipboardList, title: "Complaint Intake", text: "Hindi or English complaint intake with address, GPS, and file upload.", action: "Open Citizen Desk", to: "/citizen/dashboard" },
      { icon: Users, title: "Officer & Department Hierarchy", text: "Recursive branch structure for heads, sub-heads, child departments, and field operators.", action: "Officer Dashboard", to: "/officer/dashboard" },
      { icon: Activity, title: "Tracking & Transparency", text: "Public ticket tracking with assigned officer, supervising head, routing trail, and SLA.", action: "Track Ticket", to: "/track" },
    ],
    faqTitle: "Frequently Asked Questions",
    faq: [
      { q: "What happens when a citizen files a complaint?", a: "AI classifies the issue as water-related, maps it to the department, and routes it to the nearest branch officer while the supervising head still sees it." },
      { q: "Can officers escalate complaints upward?", a: "Yes. Field officers can forward cases to peer officers or escalate them upward through the reporting chain if local resolution is not possible." },
      { q: "Can citizens track complaints without login?", a: "Yes. Ticket lookup is public and shows department, assigned officer, supervising head, SLA, and timeline." },
      { q: "Does the platform support Hindi?", a: "Yes. The public portal switches between English and Hindi, and complaint submission accepts Hindi text as well." },
    ],
    contactTitle: "Process Visibility",
    contactText: "The process flow explains how a complaint moves from citizen intake to local officer response, department supervision, escalation, and closure.",
    contactCta: "Open Process Flow",
    mobileTitle: "Mobile-Ready Workflow",
    mobileText: "The same workflow is designed for progressive mobile rollout: citizen intake, field updates, photo proof, and public tracking.",
    mobileCta: "Open Public Tracking",
    footerLine1: "Jan Samadhan AI is configured here as an India-ready water grievance command platform.",
    footerLine2: "Current build includes central-to-village routing, officer hierarchy, escalation flow, and citizen tracking.",
    processTitle: "Water Redress Process Flow",
    processHeadline: "JAN SAMADHAN WATER PROCESS FLOW",
    sitemapTitle: "Sitemap",
    homePage: "Home page",
    appeal: "Appeal",
    sendReminder: "Send Reminder",
    userLogin: "User Login",
    forgotPassword: "Forgot Password",
    forgotUsername: "Forgot Username",
    userRegistration: "User Registration",
    lodgeGrievance: "Lodge Grievance",
    rateGrievance: "Rate Grievance",
    faqHelp: "FAQ / Help",
    contactUs: "Contact Us",
    aboutUs: "About Us",
    officerBranches: "Officer Branches",
  },
  hi: {
    trusted: "विश्वसनीय डिजिटल जन शिकायत प्रणाली",
    subtitle: "एआई-सहायित जल शिकायत निवारण पोर्टल",
    language: "भाषा",
    signIn: "साइन इन",
    viewStatus: "स्थिति देखें",
    officers: "अधिकारी",
    process: "निवारण प्रक्रिया",
    grievance: "शिकायत",
    officerDashboard: "अधिकारी डैशबोर्ड",
    mobileApp: "मोबाइल ऐप",
    sitemap: "साइटमैप",
    heroKicker: "नागरिक -> जन समाधान पोर्टल / ऐप -> जल विभाग निवारण",
    heroTitle: "जल शिकायत कमांड प्लेटफॉर्म",
    heroText: "भारत-उन्मुख जल प्रशासन के लिए तैयार प्रणाली: नागरिक शिकायत, एआई वर्गीकरण, निकटतम फील्ड अधिकारी असाइनमेंट, विभागीय निगरानी, एस्केलेशन, ट्रैकिंग और फीडबैक।",
    registerCitizen: "नागरिक पंजीकरण",
    openCitizenDesk: "शिकायत दर्ज करें",
    liveWorkflow: "वर्कफ़्लो देखें",
    stats: [
      { label: "कवरेज मॉडल", value: "केंद्र से गांव" },
      { label: "रूटिंग लॉजिक", value: "निकटतम अधिकारी + विभागीय निगरानी" },
      { label: "सेवा फोकस", value: "जल आपूर्ति" },
      { label: "नागरिक प्रवाह", value: "टिकट आईडी से ट्रैकिंग" },
    ],
    quickActionsTitle: "मुख्य वर्कफ़्लो",
    quickActionsText: "नीचे दिए गए सभी मुख्य एक्शन ऐप के वास्तविक कार्यशील स्क्रीन खोलते हैं: नागरिक शिकायत, पब्लिक ट्रैकिंग, अधिकारी संचालन और एडमिन नियंत्रण।",
    quickActions: [
      { icon: ClipboardList, title: "जल शिकायत दर्ज करें", text: "नागरिक लॉगिन, शिकायत फ़ॉर्म, जीपीएस, अटैचमेंट अपलोड, एआई वर्गीकरण और असाइनमेंट।", action: "नागरिक डेस्क खोलें", to: "/citizen/dashboard" },
      { icon: Search, title: "मौजूदा टिकट ट्रैक करें", text: "पब्लिक शिकायत ट्रैकिंग जिसमें असाइन अधिकारी, सुपरवाइजिंग हेड, SLA और टाइमलाइन दिखती है।", action: "शिकायत ट्रैक करें", to: "/track" },
      { icon: ShieldCheck, title: "अधिकारी संचालन कंसोल", text: "स्थिति अपडेट करें, प्रूफ अपलोड करें, आगे भेजें या रिपोर्टिंग चेन में ऊपर एस्केलेट करें।", action: "अधिकारी कंसोल खोलें", to: "/officer/dashboard" },
      { icon: BarChart3, title: "एडमिन कंट्रोल रूम", text: "एक ही जगह से शिकायत, विभाग, अधिकारी, डुप्लिकेट और विश्लेषण प्रबंधन।", action: "एडमिन डैशबोर्ड", to: "/admin/dashboard" },
    ],
    architectureTitle: "ऑपरेशनल कवरेज",
    architectureText: "यह प्लेटफॉर्म एक प्रोडक्शन-स्टाइल विभागीय रोलआउट के लिए संरचित है: केंद्रीय निगरानी, राज्य कमांड, डिविजन, जिला, ब्लॉक, पंचायत और गांव प्रतिक्रिया स्तर।",
    architecture: [
      { icon: Globe2, title: "केंद्रीय मिशन डेस्क", text: "मुख्य शिकायत निगरानी और राष्ट्रीय जल मिशन पर्यवेक्षण।" },
      { icon: Waves, title: "राज्य जल निदेशालय", text: "राज्य स्तरीय रूटिंग, रिपोर्टिंग नियंत्रण और एस्केलेशन।" },
      { icon: MapPinned, title: "डिविजन और जिला डेस्क", text: "क्षेत्रीय संचालन नेतृत्व और जिला-स्तरीय SLA निगरानी।" },
      { icon: Droplets, title: "ब्लॉक / पंचायत / गांव", text: "निकटतम फील्ड ऑपरेटर को शिकायत पहले मिलती है, पर विभागीय हेड को भी दृश्यता रहती है।" },
    ],
    structureTitle: "उत्पाद की संरचना",
    structureText: "UI ऐप की वास्तविक परतों को दर्शाता है: पब्लिक इंटेक, एआई रूटिंग, शाखा संचालन और कमांड मॉनिटरिंग।",
    structureCards: [
      { icon: ClipboardList, title: "नागरिक इंटेक", text: "पंजीकरण, शिकायत दर्ज करना, द्विभाषी इनपुट, लोकेशन कैप्चर और अटैचमेंट अपलोड।" },
      { icon: Globe2, title: "एआई रूटिंग इंजन", text: "शिकायत वर्गीकरण, विभाग मैपिंग, निकटतम शाखा असाइनमेंट और हेड दृश्यता।" },
      { icon: Users, title: "अधिकारी शाखा संचालन", text: "फॉरवर्डिंग, एस्केलेशन, प्रूफ अपलोड, शाखा पदानुक्रम और फील्ड रिस्पॉन्स स्वामित्व।" },
      { icon: BarChart3, title: "कमांड और एनालिटिक्स", text: "एडमिन निगरानी, डुप्लिकेट कंट्रोल, पब्लिक ट्रैकिंग, SLA मॉनिटरिंग और रूटिंग पारदर्शिता।" },
    ],
    hierarchyTitle: "ऑपरेशनल जल पदानुक्रम",
    hierarchyText: "पब्लिक पोर्टल अब केवल कार्यशील सेवा स्तर दिखाता है - राष्ट्रीय कमांड से गांव प्रतिक्रिया तक - बिना आंतरिक खातों या क्रेडेंशियल्स को दिखाए।",
    hierarchyGroups: [
      {
        title: "केंद्रीय और राज्य",
        items: [
          { label: "राष्ट्रीय शिकायत डेस्क", note: "केंद्रीय कमांड और नीति निगरानी" },
          { label: "जल मिशन कमांड", note: "विभाग-स्तरीय सुपरविजन और रूटिंग" },
          { label: "राज्य जल निदेशालय", note: "राज्य संचालन और एस्केलेशन नियंत्रण" },
        ],
      },
      {
        title: "क्षेत्रीय और जिला",
        items: [
          { label: "डिविजन ऑपरेशन डेस्क", note: "क्षेत्रीय वर्कलोड और SLA मॉनिटरिंग" },
          { label: "जिला जल कंट्रोल रूम", note: "जिला-स्तरीय शिकायत सुपरविजन" },
          { label: "ब्लॉक रिस्पॉन्स यूनिट", note: "ब्लॉक रूटिंग और फील्ड समन्वय" },
        ],
      },
      {
        title: "फील्ड डिलीवरी",
        items: [
          { label: "पंचायत फील्ड लीड", note: "स्थानीय शाखा नेतृत्व और डिस्पैच" },
          { label: "गांव जल ऑपरेटर", note: "फील्ड एक्शन के लिए निकटतम प्रथम प्रतिक्रिया" },
          { label: "मोबाइल मेंटेनेंस टीम", note: "प्रूफ अपलोड और क्लोज़र सपोर्ट" },
        ],
      },
    ],
    hierarchyHint: "पब्लिक विज़िटर केवल सेवा संरचना देखते हैं। डेमो क्रेडेंशियल्स होमपेज पर नहीं दिखाए जाते और टेस्टिंग के समय अलग से साझा किए जा सकते हैं।",
    hierarchyPrivacyNote: "सीडेड यूज़रनेम और पासवर्ड पब्लिक पोर्टल से जानबूझकर छिपाए गए हैं।",
    flowTitle: "शिकायत से समाधान तक पूरा प्रवाह",
    flowNodes: [
      { icon: Users, title: "नागरिक", text: "वेब या मोबाइल माध्यम से जल शिकायत दर्ज करते हैं।" },
      { icon: MonitorCheck, title: "जन समाधान पोर्टल / ऐप", text: "पंजीकरण, लॉगिन, शिकायत, ट्रैकिंग और रिमाइंडर के लिए एकल प्रवेश बिंदु।" },
      { icon: ClipboardList, title: "जल शिकायत मॉड्यूल", text: "शीर्षक, विवरण, राज्य, जिला, ब्लॉक, जीपीएस और अटैचमेंट कैप्चर।" },
      { icon: Globe2, title: "एआई + विभाग मैपिंग", text: "एआई शिकायत को जल श्रेणी में रखकर सही विभाग शाखा चुनता है।" },
      { icon: MapPinned, title: "निकटतम अधिकारी रूटिंग", text: "स्थान के आधार पर निकटतम शाखा अधिकारी को शिकायत पहले मिलती है।" },
      { icon: ShieldCheck, title: "विभागीय निगरानी", text: "विभाग प्रमुख को शिकायत की निगरानी, हस्तक्षेप और एस्केलेशन दृश्यता रहती है।" },
      { icon: Send, title: "फॉरवर्ड / एस्केलेट / रिज़ॉल्व", text: "फील्ड टीम पहले कार्रवाई करती है; जरूरत होने पर केस ऊपर भेजा जाता है।" },
      { icon: Star, title: "नागरिक फीडबैक", text: "समाधान के बाद नागरिक रेटिंग और फीडबैक दे सकता है।" },
    ],
    modulesTitle: "प्लेटफॉर्म क्षमताएँ",
    modules: [
      { icon: ClipboardList, title: "शिकायत पंजीकरण", text: "हिंदी या अंग्रेज़ी शिकायत, पता, जीपीएस और फ़ाइल अपलोड के साथ।", action: "नागरिक डेस्क", to: "/citizen/dashboard" },
      { icon: Users, title: "अधिकारी और विभाग पदानुक्रम", text: "हेड, सब-हेड, चाइल्ड विभाग और फील्ड ऑपरेटर के लिए रिकर्सिव संरचना।", action: "अधिकारी डैशबोर्ड", to: "/officer/dashboard" },
      { icon: Activity, title: "ट्रैकिंग और पारदर्शिता", text: "असाइन अधिकारी, हेड, SLA और टाइमलाइन के साथ पब्लिक ट्रैकिंग।", action: "टिकट ट्रैक करें", to: "/track" },
    ],
    faqTitle: "अक्सर पूछे जाने वाले प्रश्न",
    faq: [
      { q: "नागरिक शिकायत दर्ज करने पर क्या होता है?", a: "एआई उसे जल शिकायत के रूप में वर्गीकृत करता है, विभाग चुनता है और निकटतम शाखा अधिकारी को भेजता है, जबकि हेड को दृश्यता रहती है।" },
      { q: "क्या अधिकारी शिकायत ऊपर एस्केलेट कर सकते हैं?", a: "हाँ, फील्ड अधिकारी शिकायत को किसी अन्य अधिकारी को फॉरवर्ड कर सकते हैं या रिपोर्टिंग चेन में ऊपर भेज सकते हैं।" },
      { q: "क्या बिना लॉगिन टिकट ट्रैक किया जा सकता है?", a: "हाँ, टिकट आईडी से पब्लिक ट्रैकिंग उपलब्ध है।" },
      { q: "क्या हिंदी समर्थित है?", a: "हाँ, पब्लिक पोर्टल हिंदी और अंग्रेज़ी में स्विच होता है, और शिकायत विवरण हिंदी में भी स्वीकार करता है।" },
    ],
    contactTitle: "प्रक्रिया दृश्यता",
    contactText: "प्रोसेस फ्लो यह स्पष्ट दिखाता है कि शिकायत नागरिक इंटेक से स्थानीय अधिकारी, विभागीय सुपरविजन, एस्केलेशन और क्लोज़र तक कैसे जाती है।",
    contactCta: "प्रक्रिया देखें",
    mobileTitle: "मोबाइल-रेडी वर्कफ़्लो",
    mobileText: "यही वर्कफ़्लो मोबाइल रोलआउट के लिए भी उपयुक्त है: शिकायत, फोटो प्रूफ, फील्ड अपडेट और सार्वजनिक ट्रैकिंग।",
    mobileCta: "पब्लिक ट्रैकिंग खोलें",
    footerLine1: "जन समाधान एआई यहां भारत-उन्मुख जल शिकायत कमांड प्लेटफॉर्म के रूप में कॉन्फ़िगर किया गया है।",
    footerLine2: "वर्तमान बिल्ड में केंद्र से गांव तक रूटिंग, अधिकारी पदानुक्रम, एस्केलेशन फ्लो और नागरिक ट्रैकिंग शामिल है।",
    processTitle: "जल निवारण प्रक्रिया प्रवाह",
    processHeadline: "जन समाधान जल प्रक्रिया प्रवाह",
    sitemapTitle: "साइटमैप",
    homePage: "होम पेज",
    appeal: "अपील",
    sendReminder: "रिमाइंडर भेजें",
    userLogin: "यूज़र लॉगिन",
    forgotPassword: "पासवर्ड भूल गए",
    forgotUsername: "यूज़रनेम भूल गए",
    userRegistration: "यूज़र पंजीकरण",
    lodgeGrievance: "शिकायत दर्ज करें",
    rateGrievance: "शिकायत रेट करें",
    faqHelp: "FAQ / सहायता",
    contactUs: "संपर्क करें",
    aboutUs: "हमारे बारे में",
    officerBranches: "अधिकारी शाखाएँ",
  },
};

function usePortalLanguage() {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(PORTAL_LANGUAGE_KEY) || "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PORTAL_LANGUAGE_KEY, language);
      document.documentElement.lang = language === "hi" ? "hi" : "en";
    }
  }, [language]);

  return [language, setLanguage];
}

function SectionCard({ icon: Icon, title, text, action, to }) {
  return (
    <article className="portal-module portal-lift">
      <div className="portal-module-icon"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      <Link to={to}>{action}</Link>
    </article>
  );
}

function FlowNode({ icon: Icon, title, text }) {
  return (
    <div className="portal-flow-node portal-lift">
      <div className="portal-flow-icon"><Icon size={18} /></div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function getDashboardPath(role) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "OFFICER") return "/officer/dashboard";
  return "/citizen/dashboard";
}

function authAwarePath(user, role) {
  return user ? getDashboardPath(user.role) : role === "CITIZEN" ? "/register" : "/login";
}

function portalActionPath(user, actionKey) {
  if (actionKey === "citizen") return authAwarePath(user, "CITIZEN");
  if (actionKey === "officer") return user?.role === "OFFICER" ? "/officer/dashboard" : "/login";
  if (actionKey === "admin") return user?.role === "ADMIN" ? "/admin/dashboard" : "/login";
  return "/track";
}

function PortalHeader({ t, language, setLanguage, user, mobileOpen, setMobileOpen }) {
  const signInTarget = user ? getDashboardPath(user.role) : "/login";
  const grievanceTarget = authAwarePath(user, "CITIZEN");
  const officerTarget = user?.role === "OFFICER" ? "/officer/dashboard" : "/login";

  return (
    <header className="portal-header">
      <div className="portal-brandbar">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{t.trusted}</p>
          <div className="flex items-center gap-3">
            <div className="portal-emblem">JS</div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Jan Samadhan AI</h1>
              <p className="text-xs text-slate-500">{t.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="portal-menu-toggle md:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Languages size={15} />
          <span className="hidden sm:inline">{t.language}</span>
          <select className="portal-select" aria-label={t.language} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
          <Link to={signInTarget} className="portal-signin">
            <LogIn size={15} /> {user ? (language === "hi" ? "डैशबोर्ड" : "Dashboard") : t.signIn}
          </Link>
        </div>
      </div>
      <nav className="portal-nav hidden md:flex" aria-label="Portal navigation">
        <Link to="/track"><Search size={14} /> {t.viewStatus}</Link>
        <a href="#hierarchy"><Users size={14} /> {t.officers}</a>
        <Link to="/process-flow"><Network size={14} /> {t.process}</Link>
        <Link to={grievanceTarget}><FileText size={14} /> {t.grievance}</Link>
        <Link to={officerTarget}><ShieldCheck size={14} /> {t.officerDashboard}</Link>
        <a href="#mobile"><Smartphone size={14} /> {t.mobileApp}</a>
        <Link to="/sitemap" className="ml-auto hidden lg:inline-flex"><Network size={14} /> {t.sitemap}</Link>
      </nav>
      {mobileOpen && (
        <nav className="portal-mobile-nav md:hidden" aria-label="Mobile portal navigation">
          <Link to="/track" onClick={() => setMobileOpen(false)}><Search size={14} /> {t.viewStatus}</Link>
          <a href="#hierarchy" onClick={() => setMobileOpen(false)}><Users size={14} /> {t.officers}</a>
          <Link to="/process-flow" onClick={() => setMobileOpen(false)}><Network size={14} /> {t.process}</Link>
          <Link to={grievanceTarget} onClick={() => setMobileOpen(false)}><FileText size={14} /> {t.grievance}</Link>
          <Link to={officerTarget} onClick={() => setMobileOpen(false)}><ShieldCheck size={14} /> {t.officerDashboard}</Link>
          <a href="#mobile" onClick={() => setMobileOpen(false)}><Smartphone size={14} /> {t.mobileApp}</a>
          <Link to="/sitemap" onClick={() => setMobileOpen(false)}><Network size={14} /> {t.sitemap}</Link>
        </nav>
      )}
    </header>
  );
}

function PortalFooter({ t }) {
  return (
    <footer className="portal-footer">
      <div className="flex justify-center gap-3 py-3 text-white">
        <span className="portal-social">f</span>
        <span className="portal-social">x</span>
        <span className="portal-social">yt</span>
      </div>
      <p>{t.footerLine1}</p>
      <p className="text-[11px] opacity-80">{t.footerLine2}</p>
    </footer>
  );
}

export function ProcessFlowPage() {
  const [language, setLanguage] = usePortalLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const t = copy[language];

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader t={t} language={language} setLanguage={setLanguage} user={user} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="portal-page">
        <section className="portal-panel">
          <p className="text-center text-sm font-semibold text-slate-700 mb-6">{t.processTitle}</p>
          <h2 className="portal-title">{t.processHeadline}</h2>
          <div className="portal-process-canvas">
            <div className="process-citizen">
              <Users size={32} />
              <span>{t.flowNodes[0].title}</span>
            </div>
            <div className="process-box process-login">{language === "hi" ? "एक बार पंजीकरण व लॉगिन" : "One Time Registration & Login"}</div>
            <div className="process-box process-register">{language === "hi" ? "विभाग विवरण, टिकट आईडी और शिकायत निर्माण" : "Department Details, Ticket ID & Grievance Creation"}</div>
            <div className="process-box process-transfer">{language === "hi" ? "निकटतम शाखा अधिकारी को प्रेषण" : "Transmission to Nearest Branch Officer"}</div>
            <div className="process-box process-portal">{language === "hi" ? "जन समाधान वेब, मोबाइल, हेल्प डेस्क" : "Jan Samadhan Web, Mobile & Help Desk"}</div>
            <div className="process-box process-atr"><MailCheck size={22} /> {language === "hi" ? "SMS / Email द्वारा अपडेट" : "ATR via SMS / Email"}</div>
            <div className="process-pill process-resolution">{language === "hi" ? "समाधान" : "Resolution"}</div>
            <div className="process-time">{language === "hi" ? "समाधान समय" : "Resolution Time"}<br /><strong>21 {language === "hi" ? "दिन" : "days"}</strong></div>
            <div className="process-pill process-feedback">{language === "hi" ? "फीडबैक" : "Feedback"}</div>
            <div className="process-diamond">{language === "hi" ? "संतुष्ट?" : "Satisfied?"}</div>
            <div className="process-box process-closure">{language === "hi" ? "क्लोज़र" : "Closure"}</div>
            <div className="process-box process-appeal">{language === "hi" ? "वरिष्ठ समीक्षा / अपील डेस्क" : "Senior Review / Appeal Desk"}</div>
            <div className="process-pill process-final">{language === "hi" ? "अंतिम समाधान" : "Final Resolution"}</div>
            <svg className="process-lines" viewBox="0 0 960 480" aria-hidden="true">
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#111827" />
                </marker>
              </defs>
              <path d="M170 70 H330" markerEnd="url(#arrow)" />
              <path d="M470 70 H560" markerEnd="url(#arrow)" />
              <path d="M740 70 H835 V165" markerEnd="url(#arrow)" />
              <path d="M170 165 H835" markerEnd="url(#arrow)" />
              <path d="M835 215 V275 H625" markerEnd="url(#arrow)" />
              <path d="M555 275 H420" markerEnd="url(#arrow)" />
              <path d="M330 275 H205" markerEnd="url(#arrow)" />
              <path d="M160 305 V360 H290" markerEnd="url(#arrow)" />
              <path d="M390 360 H520" markerEnd="url(#arrow)" />
              <path d="M575 350 H660" markerEnd="url(#arrow)" />
              <path d="M545 386 V430 H390" markerEnd="url(#arrow)" />
              <path d="M300 430 H175" markerEnd="url(#arrow)" />
              <path d="M135 420 V80" markerEnd="url(#arrow)" />
            </svg>
          </div>
        </section>
      </main>
      <PortalFooter t={t} />
    </div>
  );
}

export function SitemapPage() {
  const [language, setLanguage] = usePortalLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const t = copy[language];

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader t={t} language={language} setLanguage={setLanguage} user={user} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="portal-page">
        <section className="portal-panel overflow-x-auto">
          <h2 className="text-xl font-semibold text-slate-900 mb-8">{t.sitemapTitle}</h2>
          <div className="sitemap-tree min-w-[820px]">
            <div className="sitemap-level">
              <Link to="/" className="sitemap-box sitemap-home"><Home size={14} /> {t.homePage}</Link>
            </div>
            <div className="sitemap-branches four">
              <div className="sitemap-column">
                <div className="sitemap-box">#Home</div>
                <a href="/#contact" className="sitemap-box small">{t.contactUs}</a>
                <a href="/#architecture" className="sitemap-box small">{t.aboutUs}</a>
                <a href="/#faq" className="sitemap-box small">{t.faqHelp}</a>
                <a href="/#hierarchy" className="sitemap-box small">{t.officerBranches}</a>
                <Link to="/process-flow" className="sitemap-box small">{t.process}</Link>
                <ChevronDown className="mx-auto text-slate-600" size={16} />
              </div>
              <div className="sitemap-column">
                <div className="sitemap-box">#{t.appeal}</div>
                <Link to="/track" className="sitemap-box small">{t.viewStatus}</Link>
              </div>
              <div className="sitemap-column">
                <div className="sitemap-box">#{t.grievance}</div>
                <Link to="/track" className="sitemap-box small">{t.viewStatus}</Link>
              </div>
              <div className="sitemap-column">
                <Link to="/track" className="sitemap-box">{t.sendReminder}</Link>
              </div>
            </div>
            <div className="sitemap-branches login-row">
              <div className="sitemap-column">
                <Link to="/login" className="sitemap-box small">{t.userLogin}</Link>
                <Link to="/citizen/dashboard" className="sitemap-box small">{t.lodgeGrievance}</Link>
                <Link to="/track" className="sitemap-box small">{t.viewStatus}</Link>
                <Link to="/citizen/dashboard" className="sitemap-box small">{t.rateGrievance}</Link>
              </div>
              <Link to="/register" className="sitemap-box small">{t.userRegistration}</Link>
              <Link to="/login" className="sitemap-box small">{t.forgotPassword}</Link>
              <Link to="/login" className="sitemap-box small">{t.forgotUsername}</Link>
            </div>
          </div>
        </section>
      </main>
      <PortalFooter t={t} />
    </div>
  );
}

export default function PublicPortal() {
  const [language, setLanguage] = usePortalLanguage();
  const [faqOpen, setFaqOpen] = useState(0);
  const [heroScenario, setHeroScenario] = useState("citizen");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const t = copy[language];
  const heroStats = useMemo(() => t.stats, [t]);
  const quickActions = useMemo(
    () =>
      t.quickActions.map((item) => ({
        ...item,
        to:
          item.to === "/citizen/dashboard"
            ? portalActionPath(user, "citizen")
            : item.to === "/officer/dashboard"
              ? portalActionPath(user, "officer")
              : item.to === "/admin/dashboard"
                ? portalActionPath(user, "admin")
                : item.to,
      })),
    [t, user]
  );
  const modules = useMemo(
    () =>
      t.modules.map((item) => ({
        ...item,
        to:
          item.to === "/citizen/dashboard"
            ? portalActionPath(user, "citizen")
            : item.to === "/officer/dashboard"
              ? portalActionPath(user, "officer")
              : item.to,
      })),
    [t, user]
  );
  const heroScenarios = useMemo(
    () =>
      language === "hi"
        ? [
            {
              key: "citizen",
              label: "नागरिक",
              title: "नागरिक से फील्ड अधिकारी तक",
              text: "एक नागरिक जल रिसाव दर्ज करता है, एआई उसे वर्गीकृत करता है और सिस्टम निकटतम पंचायत या गांव ऑपरेटर तक शिकायत पहुंचाता है।",
              metrics: ["भाषा इनपुट", "GPS + ब्लॉक", "पब्लिक ट्रैकिंग"],
            },
            {
              key: "field",
              label: "फील्ड",
              title: "स्थानीय समाधान पहले",
              text: "ब्लॉक, पंचायत और गांव स्तर का अधिकारी केस को संभालता है, फोटो प्रूफ जोड़ता है और आवश्यकता होने पर ऊपर एस्केलेट करता है।",
              metrics: ["निकटतम असाइनमेंट", "फोटो प्रूफ", "एस्केलेशन"],
            },
            {
              key: "command",
              label: "कमांड",
              title: "हेड की निगरानी बनी रहती है",
              text: "सुपरवाइजिंग विभागीय हेड पूरे केस को लाइव देखता है, SLA जोखिम पकड़ता है और शाखा स्तर पर हस्तक्षेप कर सकता है।",
              metrics: ["हेड दृश्यता", "SLA मॉनिटरिंग", "डुप्लिकेट कंट्रोल"],
            },
          ]
        : [
            {
              key: "citizen",
              label: "Citizen",
              title: "Citizen to field response",
              text: "A resident reports a water issue, AI classifies it, and the system routes it straight to the nearest panchayat or village operator.",
              metrics: ["Language input", "GPS + block", "Public tracking"],
            },
            {
              key: "field",
              label: "Field",
              title: "Local resolution happens first",
              text: "The block, panchayat, or village officer works the case, uploads proof, and escalates upward only when local resolution is not enough.",
              metrics: ["Nearest assignment", "Photo proof", "Escalation"],
            },
            {
              key: "command",
              label: "Command",
              title: "Department head never loses visibility",
              text: "The supervising head sees the complaint live, catches SLA risk, and can intervene across the branch without waiting for manual forwarding.",
              metrics: ["Head visibility", "SLA watch", "Duplicate control"],
            },
          ],
    [language]
  );
  const activeScenario = heroScenarios.find((item) => item.key === heroScenario) || heroScenarios[0];
  const heroBoardSteps = useMemo(
    () =>
      t.flowNodes.slice(0, 6).map((step, index) => ({
        ...step,
        badge: language === "hi" ? `चरण ${String(index + 1).padStart(2, "0")}` : `Step ${String(index + 1).padStart(2, "0")}`,
      })),
    [language, t]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader t={t} language={language} setLanguage={setLanguage} user={user} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main>
        <section className="portal-hero">
          <div className="portal-hero-copy">
            <p className="portal-kicker">{t.heroKicker}</p>
            <h2>{t.heroTitle}</h2>
            <p>{t.heroText}</p>
            <div className="flex flex-wrap gap-3">
              <Link to={authAwarePath(user, "CITIZEN")} className="portal-primary"><UserPlus size={17} /> {t.registerCitizen}</Link>
              <Link to={authAwarePath(user, "CITIZEN")} className="portal-secondary"><ClipboardList size={17} /> {t.openCitizenDesk}</Link>
              <Link to="/process-flow" className="portal-secondary"><Network size={17} /> {t.liveWorkflow}</Link>
            </div>
            <div className="portal-stat-strip">
              {heroStats.map((item) => (
                <div key={item.label} className="portal-stat-tile portal-lift">
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="portal-scenario-shell">
              <div className="portal-scenario-tabs" role="tablist" aria-label="Service scenarios">
                {heroScenarios.map((scenario) => (
                  <button
                    key={scenario.key}
                    type="button"
                    className={scenario.key === activeScenario.key ? "portal-scenario-tab active" : "portal-scenario-tab"}
                    onClick={() => setHeroScenario(scenario.key)}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
              <div className="portal-scenario-panel portal-lift">
                <div>
                  <p className="portal-scenario-kicker">{language === "hi" ? "सेवा फोकस" : "Service focus"}</p>
                  <h3>{activeScenario.title}</h3>
                  <p>{activeScenario.text}</p>
                </div>
                <div className="portal-scenario-metrics">
                  {activeScenario.metrics.map((metric) => (
                    <span key={metric}>{metric}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="portal-hero-board portal-board-3d" aria-label="Jan Samadhan system diagram">
            {heroBoardSteps.map((step, index) => (
              <div key={step.title} className="portal-mini-step">
                <step.icon size={18} />
                <div>
                  <span>{step.title}</span>
                  <small>{step.badge}</small>
                </div>
                {index < 5 && <i />}
              </div>
            ))}
          </div>
        </section>

        <section className="portal-page" id="modules">
          <div className="portal-section-head">
            <div>
              <h2 className="portal-section-title">{t.quickActionsTitle}</h2>
              <p className="text-sm text-slate-600">{t.quickActionsText}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {quickActions.map((card) => (
              <SectionCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="portal-page" id="architecture">
          <div className="portal-panel portal-panel-accent">
            <div className="portal-section-head">
              <div>
                <h2 className="portal-section-title">{t.architectureTitle}</h2>
                <p className="text-sm text-slate-600 max-w-3xl">{t.architectureText}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {t.architecture.map((item) => (
                <div key={item.title} className="portal-module portal-lift">
                  <div className="portal-module-icon"><item.icon size={22} /></div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="portal-page">
          <div className="portal-panel">
            <div className="portal-section-head">
              <div>
                <h2 className="portal-section-title">{t.structureTitle}</h2>
                <p className="text-sm text-slate-600 max-w-3xl">{t.structureText}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {t.structureCards.map((item) => (
                <div key={item.title} className="portal-module portal-lift">
                  <div className="portal-module-icon"><item.icon size={22} /></div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="portal-page" id="track">
          <div className="portal-panel portal-panel-accent">
            <div className="portal-section-head">
              <div>
                <h2 className="portal-section-title">{t.viewStatus}</h2>
                <p className="text-sm text-slate-600">
                  {language === "hi"
                    ? "बिना लॉगिन भी टिकट आईडी के माध्यम से शिकायत की स्थिति, असाइन अधिकारी, विभागीय हेड और टाइमलाइन देखी जा सकती है।"
                    : "Even without login, anyone can verify ticket status, assigned officer, supervising head, and routing timeline using the complaint ID."}
                </p>
              </div>
              <Link to="/track" className="portal-inline-link">
                {t.viewStatus} <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="portal-module portal-lift">
                <div className="portal-module-icon"><Search size={22} /></div>
                <h3>{language === "hi" ? "पब्लिक टिकट ट्रैकिंग" : "Public Ticket Lookup"}</h3>
                <p>{language === "hi" ? "नागरिक या विभागीय स्टाफ किसी भी सक्रिय शिकायत की स्थिति सार्वजनिक ट्रैक पेज से देख सकता है।" : "Citizens or staff can open the public tracker to inspect any active complaint journey."}</p>
              </div>
              <div className="portal-module portal-lift">
                <div className="portal-module-icon"><MapPinned size={22} /></div>
                <h3>{language === "hi" ? "लोकेशन इंटेलिजेंस" : "Location Intelligence"}</h3>
                <p>{language === "hi" ? "राज्य, जिला, ब्लॉक और जीपीएस विवरण से यह साफ दिखता है कि शिकायत किस फील्ड शाखा तक पहुंची।" : "State, district, block, and GPS context make the field routing transparent to citizens and operations teams."}</p>
              </div>
              <div className="portal-module portal-lift">
                <div className="portal-module-icon"><FileCheck2 size={22} /></div>
                <h3>{language === "hi" ? "जवाबदेही" : "Accountability View"}</h3>
                <p>{language === "hi" ? "सिस्टम असाइन स्थानीय अधिकारी और सुपरवाइजिंग हेड दोनों दिखाता है, ताकि जिम्मेदारी साफ रहे।" : "The system exposes both the assigned local officer and supervising head so accountability is never ambiguous."}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="portal-page" id="hierarchy">
          <div className="portal-panel">
            <div className="portal-section-head">
              <div>
                <h2 className="portal-section-title">{t.hierarchyTitle}</h2>
                <p className="text-sm text-slate-600">{t.hierarchyText}</p>
              </div>
              <Link to={user ? getDashboardPath(user.role) : "/login"} className="portal-inline-link">{user ? (language === "hi" ? "डैशबोर्ड" : "Dashboard") : t.signIn}</Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {t.hierarchyGroups.map((group) => (
                <div key={group.title} className="portal-hierarchy-card portal-lift">
                  <h3>{group.title}</h3>
                  <div className="space-y-2 mt-4">
                    {group.items.map((item) => (
                      <div key={item.label} className="portal-login-pill">
                        <span>{item.label}</span>
                        <strong>{item.note}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">{t.hierarchyHint}</p>
            <div className="portal-hierarchy-note">{t.hierarchyPrivacyNote}</div>
          </div>
        </section>

        <section className="portal-page">
          <div className="portal-panel">
            <h2 className="portal-section-title">{t.flowTitle}</h2>
            <div className="portal-flow-grid">
              {t.flowNodes.map((step) => <FlowNode key={step.title} {...step} />)}
            </div>
          </div>
        </section>

        <section className="portal-page">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modules.map((card) => (
              <SectionCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="portal-page grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4" id="faq">
          <div className="portal-panel">
            <h2 className="portal-section-title">{t.faqTitle}</h2>
            <div className="space-y-3">
              {t.faq.map((item, index) => (
                <button
                  key={item.q}
                  onClick={() => setFaqOpen(index === faqOpen ? -1 : index)}
                  className="portal-faq"
                >
                  <div className="portal-faq-head">
                    <span>{item.q}</span>
                    <ChevronDown size={16} className={index === faqOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                  </div>
                  {index === faqOpen && <p>{item.a}</p>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4" id="contact">
            <div className="portal-info portal-lift">
              <MessageSquareText size={22} />
              <h3>{t.contactTitle}</h3>
              <p>{t.contactText}</p>
              <Link to="/process-flow">{t.contactCta}</Link>
            </div>
            <div className="portal-info portal-lift" id="mobile">
              <Smartphone size={22} />
              <h3>{t.mobileTitle}</h3>
              <p>{t.mobileText}</p>
              <Link to="/track">{t.mobileCta}</Link>
            </div>
          </div>
        </section>
      </main>
      <PortalFooter t={t} />
    </div>
  );
}
