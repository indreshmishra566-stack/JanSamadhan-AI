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
    quickActionsTitle: "Working Demo Actions",
    quickActionsText: "Every primary action below is wired into the current build, so judges can move from landing page to real workflow without broken buttons.",
    quickActions: [
      { icon: ClipboardList, title: "Lodge a Water Complaint", text: "Citizen login, complaint form, GPS capture, attachment upload, AI classification, and assignment.", action: "Open Citizen Desk", to: "/citizen/dashboard" },
      { icon: Search, title: "Track Existing Ticket", text: "Public complaint lookup with assigned officer, supervising head, SLA, and routing timeline.", action: "Track Complaint", to: "/track" },
      { icon: ShieldCheck, title: "Officer Handling Console", text: "Update status, upload proof, forward to another officer, or escalate up the reporting chain.", action: "Open Officer Console", to: "/officer/dashboard" },
      { icon: BarChart3, title: "Admin Control Room", text: "Manage complaints, departments, officers, duplicates, and operational analytics from one place.", action: "Open Admin Dashboard", to: "/admin/dashboard" },
    ],
    architectureTitle: "India Water Operations Map",
    architectureText: "The current seeded demo is structured exactly like an India rollout pilot for one department: central oversight, state command, division, district, block, panchayat, and village operator levels.",
    architecture: [
      { icon: Globe2, title: "Central Mission Desk", text: "Chief grievance oversight and national water mission supervision." },
      { icon: Waves, title: "State Water Directorate", text: "State-level routing, reporting control, and state escalation handling." },
      { icon: MapPinned, title: "Division & District Desk", text: "Regional operational leadership with visibility over district workload and SLA risk." },
      { icon: Droplets, title: "Block / Panchayat / Village", text: "Nearest field operators receive the complaint first, while the head retains visibility." },
    ],
    hierarchyTitle: "Live Water Hierarchy Demo",
    hierarchyText: "Use these seeded roles to demonstrate full chain visibility from central mission to village operator.",
    hierarchyGroups: [
      {
        title: "Central & State",
        items: ["chief_public_grievance", "central_water_mission_head", "up_water_director"],
      },
      {
        title: "Regional & District",
        items: ["lucknow_division_head", "lucknow_district_water_head", "bkt_block_water_head"],
      },
      {
        title: "Field Delivery",
        items: ["itaunja_panchayat_head", "nabinagar_village_operator", "hasanapur_village_operator"],
      },
    ],
    hierarchyHint: "All demo officer passwords use Officer@1234. Citizen demo users use Citizen@1234.",
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
    faqTitle: "Demo FAQs",
    faq: [
      { q: "What happens when a citizen files a complaint?", a: "AI classifies the issue as water-related, maps it to the department, and routes it to the nearest branch officer while the supervising head still sees it." },
      { q: "Can officers escalate complaints upward?", a: "Yes. Field officers can forward cases to peer officers or escalate them upward through the reporting chain if local resolution is not possible." },
      { q: "Can citizens track complaints without login?", a: "Yes. Ticket lookup is public and shows department, assigned officer, supervising head, SLA, and timeline." },
      { q: "Does the current demo support Hindi?", a: "The public portal now switches between English and Hindi for the main demo experience. Complaint submission also accepts Hindi text." },
    ],
    contactTitle: "Hackathon Demo Story",
    contactText: "Show judges a full operational story: citizen files a complaint, local operator receives it, department head sees it, and escalation works if field resolution fails.",
    contactCta: "Open Process Flow",
    mobileTitle: "Mobile-Ready Workflow",
    mobileText: "The same workflow is designed for progressive mobile rollout: citizen intake, field updates, photo proof, and public tracking.",
    mobileCta: "Open Public Tracking",
    footerLine1: "Jan Samadhan AI is configured here as an India-ready water grievance command platform.",
    footerLine2: "Current demo includes central-to-village routing, officer hierarchy, escalation flow, and citizen tracking.",
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
    quickActionsTitle: "वर्किंग डेमो एक्शन",
    quickActionsText: "नीचे दिए गए सभी मुख्य एक्शन वर्तमान बिल्ड से जुड़े हुए हैं, ताकि जज बिना टूटे बटन के सीधे वास्तविक वर्कफ़्लो में जा सकें।",
    quickActions: [
      { icon: ClipboardList, title: "जल शिकायत दर्ज करें", text: "नागरिक लॉगिन, शिकायत फ़ॉर्म, जीपीएस, अटैचमेंट अपलोड, एआई वर्गीकरण और असाइनमेंट।", action: "नागरिक डेस्क खोलें", to: "/citizen/dashboard" },
      { icon: Search, title: "मौजूदा टिकट ट्रैक करें", text: "पब्लिक शिकायत ट्रैकिंग जिसमें असाइन अधिकारी, सुपरवाइजिंग हेड, SLA और टाइमलाइन दिखती है।", action: "शिकायत ट्रैक करें", to: "/track" },
      { icon: ShieldCheck, title: "अधिकारी संचालन कंसोल", text: "स्थिति अपडेट करें, प्रूफ अपलोड करें, आगे भेजें या रिपोर्टिंग चेन में ऊपर एस्केलेट करें।", action: "अधिकारी कंसोल खोलें", to: "/officer/dashboard" },
      { icon: BarChart3, title: "एडमिन कंट्रोल रूम", text: "एक ही जगह से शिकायत, विभाग, अधिकारी, डुप्लिकेट और विश्लेषण प्रबंधन।", action: "एडमिन डैशबोर्ड", to: "/admin/dashboard" },
    ],
    architectureTitle: "भारत जल संचालन मानचित्र",
    architectureText: "वर्तमान सीडेड डेमो एक विभाग के भारत-स्तरीय पायलट की तरह संरचित है: केंद्रीय निगरानी, राज्य कमांड, डिविजन, जिला, ब्लॉक, पंचायत और गांव ऑपरेटर।",
    architecture: [
      { icon: Globe2, title: "केंद्रीय मिशन डेस्क", text: "मुख्य शिकायत निगरानी और राष्ट्रीय जल मिशन पर्यवेक्षण।" },
      { icon: Waves, title: "राज्य जल निदेशालय", text: "राज्य स्तरीय रूटिंग, रिपोर्टिंग नियंत्रण और एस्केलेशन।" },
      { icon: MapPinned, title: "डिविजन और जिला डेस्क", text: "क्षेत्रीय संचालन नेतृत्व और जिला-स्तरीय SLA निगरानी।" },
      { icon: Droplets, title: "ब्लॉक / पंचायत / गांव", text: "निकटतम फील्ड ऑपरेटर को शिकायत पहले मिलती है, पर विभागीय हेड को भी दृश्यता रहती है।" },
    ],
    hierarchyTitle: "लाइव जल विभाग पदानुक्रम",
    hierarchyText: "इन सीडेड लॉगिन के साथ केंद्रीय मिशन से गांव ऑपरेटर तक पूरी चेन प्रदर्शित करें।",
    hierarchyGroups: [
      { title: "केंद्रीय और राज्य", items: ["chief_public_grievance", "central_water_mission_head", "up_water_director"] },
      { title: "क्षेत्रीय और जिला", items: ["lucknow_division_head", "lucknow_district_water_head", "bkt_block_water_head"] },
      { title: "फील्ड डिलीवरी", items: ["itaunja_panchayat_head", "nabinagar_village_operator", "hasanapur_village_operator"] },
    ],
    hierarchyHint: "सभी डेमो अधिकारी खातों का पासवर्ड Officer@1234 है। नागरिक खातों का पासवर्ड Citizen@1234 है।",
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
    faqTitle: "डेमो FAQs",
    faq: [
      { q: "नागरिक शिकायत दर्ज करने पर क्या होता है?", a: "एआई उसे जल शिकायत के रूप में वर्गीकृत करता है, विभाग चुनता है और निकटतम शाखा अधिकारी को भेजता है, जबकि हेड को दृश्यता रहती है।" },
      { q: "क्या अधिकारी शिकायत ऊपर एस्केलेट कर सकते हैं?", a: "हाँ, फील्ड अधिकारी शिकायत को किसी अन्य अधिकारी को फॉरवर्ड कर सकते हैं या रिपोर्टिंग चेन में ऊपर भेज सकते हैं।" },
      { q: "क्या बिना लॉगिन टिकट ट्रैक किया जा सकता है?", a: "हाँ, टिकट आईडी से पब्लिक ट्रैकिंग उपलब्ध है।" },
      { q: "क्या हिंदी समर्थित है?", a: "हाँ, पब्लिक पोर्टल अब हिंदी और अंग्रेज़ी में स्विच होता है, और शिकायत विवरण हिंदी में भी स्वीकार करता है।" },
    ],
    contactTitle: "हैकाथॉन डेमो कहानी",
    contactText: "जजों को पूरा ऑपरेशनल प्रवाह दिखाएँ: नागरिक शिकायत करता है, स्थानीय ऑपरेटर को केस मिलता है, विभागीय हेड देखता है, और आवश्यकता होने पर एस्केलेशन चलता है।",
    contactCta: "प्रक्रिया देखें",
    mobileTitle: "मोबाइल-रेडी वर्कफ़्लो",
    mobileText: "यही वर्कफ़्लो मोबाइल रोलआउट के लिए भी उपयुक्त है: शिकायत, फोटो प्रूफ, फील्ड अपडेट और सार्वजनिक ट्रैकिंग।",
    mobileCta: "पब्लिक ट्रैकिंग खोलें",
    footerLine1: "जन समाधान एआई यहां भारत-उन्मुख जल शिकायत कमांड प्लेटफॉर्म के रूप में कॉन्फ़िगर किया गया है।",
    footerLine2: "वर्तमान डेमो में केंद्र से गांव तक रूटिंग, अधिकारी पदानुक्रम, एस्केलेशन फ्लो और नागरिक ट्रैकिंग शामिल है।",
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

const loginGrid = [
  "admin / Admin@1234",
  "central_water_mission_head / Officer@1234",
  "lucknow_district_water_head / Officer@1234",
  "nabinagar_village_operator / Officer@1234",
  "citizen_rahul / Citizen@1234",
];

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

function PortalHeader({ t, language, setLanguage, user }) {
  const signInTarget = user ? getDashboardPath(user.role) : "/login";

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
      <nav className="portal-nav" aria-label="Portal navigation">
        <Link to="/track"><Search size={14} /> {t.viewStatus}</Link>
        <a href="#hierarchy"><Users size={14} /> {t.officers}</a>
        <Link to="/process-flow"><Network size={14} /> {t.process}</Link>
        <Link to="/citizen/dashboard"><FileText size={14} /> {t.grievance}</Link>
        <Link to="/officer/dashboard"><ShieldCheck size={14} /> {t.officerDashboard}</Link>
        <a href="#mobile"><Smartphone size={14} /> {t.mobileApp}</a>
        <Link to="/sitemap" className="ml-auto hidden lg:inline-flex"><Network size={14} /> {t.sitemap}</Link>
      </nav>
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
  const { user } = useAuth();
  const t = copy[language];

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader t={t} language={language} setLanguage={setLanguage} user={user} />
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
  const { user } = useAuth();
  const t = copy[language];

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader t={t} language={language} setLanguage={setLanguage} user={user} />
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
  const { user } = useAuth();
  const t = copy[language];
  const heroStats = useMemo(() => t.stats, [t]);
  const quickActions = useMemo(
    () =>
      t.quickActions.map((item) => ({
        ...item,
        to: item.to === "/citizen/dashboard" ? authAwarePath(user, "CITIZEN") : item.to,
      })),
    [t, user]
  );
  const modules = useMemo(
    () =>
      t.modules.map((item) => ({
        ...item,
        to: item.to === "/citizen/dashboard" ? authAwarePath(user, "CITIZEN") : item.to,
      })),
    [t, user]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader t={t} language={language} setLanguage={setLanguage} user={user} />
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
          </div>

          <div className="portal-hero-board portal-board-3d" aria-label="Jan Samadhan system diagram">
            {t.flowNodes.slice(0, 6).map((step, index) => (
              <div key={step.title} className="portal-mini-step">
                <step.icon size={18} />
                <div>
                  <span>{step.title}</span>
                  <small>{step.text}</small>
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
                <p>{language === "hi" ? "राज्य, जिला, ब्लॉक और जीपीएस विवरण से यह साफ दिखता है कि शिकायत किस फील्ड शाखा तक पहुंची।" : "State, district, block, and GPS context make the field routing transparent to judges and users."}</p>
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
              <Link to="/login" className="portal-inline-link">{t.signIn}</Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {t.hierarchyGroups.map((group) => (
                <div key={group.title} className="portal-hierarchy-card portal-lift">
                  <h3>{group.title}</h3>
                  <div className="space-y-2 mt-4">
                    {group.items.map((item) => (
                      <div key={item} className="portal-login-pill">
                        <span>{item}</span>
                        <strong>Officer@1234</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">{t.hierarchyHint}</p>
            <div className="portal-demo-logins">
              {loginGrid.map((entry) => (
                <span key={entry} className="portal-login-chip">{entry}</span>
              ))}
            </div>
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
