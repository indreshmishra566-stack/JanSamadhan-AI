import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PortalEntryShell, { getPortalLanguage, setPortalLanguage } from "../components/Shared/PortalEntryShell";
import { ClipboardList, ShieldCheck, Waves } from "lucide-react";
import toast from "react-hot-toast";

const HANDLER_ROLES = ["OFFICER"];

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getPortalLanguage());
  const { login } = useAuth();
  const navigate = useNavigate();

  const isHindi = language === "hi";
  const text = {
    title: "Jan Samadhan AI",
    subtitle: isHindi ? "जन शिकायत निवारण पोर्टल" : "Public grievance redressal portal",
    eyebrow: isHindi ? "विश्वसनीय डिजिटल जन शिकायत प्रणाली" : "Trusted digital public grievance system",
    description: isHindi ? "राष्ट्रीय डेस्क से स्थानीय अधिकारी तक शिकायत समाधान प्रवाह के लिए सुरक्षित लॉगिन" : "Secure sign-in for the grievance resolution flow from command desk to local operator.",
    badges: isHindi ? ["एडमिन", "अधिकारी", "नागरिक ट्रैकिंग"] : ["Admin", "Officer", "Citizen tracking"],
    asideTitle: isHindi ? "यह स्क्रीन क्या खोलती है" : "What this screen unlocks",
    asideText: isHindi ? "लॉगिन के बाद अधिकारी एस्केलेशन, विभागीय दृश्यता, प्रोफाइल प्रबंधन और शिकायत रूटिंग की पूरी कमांड परत खुलती है।" : "Once signed in, the command layer opens: officer escalation, supervisory visibility, profile management, and end-to-end complaint routing.",
    username: isHindi ? "यूज़रनेम" : "Username",
    password: isHindi ? "पासवर्ड" : "Password",
    enterUsername: isHindi ? "यूज़रनेम दर्ज करें" : "Enter username",
    enterPassword: isHindi ? "पासवर्ड दर्ज करें" : "Enter password",
    signIn: isHindi ? "साइन इन" : "Sign In",
    signingIn: isHindi ? "साइन इन हो रहा है..." : "Signing in...",
    newCitizen: isHindi ? "नए नागरिक?" : "New citizen?",
    registerHere: isHindi ? "यहाँ पंजीकरण करें" : "Register here",
    trackWithoutLogin: isHindi ? "बिना लॉगिन शिकायत ट्रैक करें" : "Track complaint without login",
    trackCta: isHindi ? "टिकट आईडी से ट्रैक करें" : "Track by Ticket ID",
    invalidCredentials: isHindi ? "अमान्य लॉगिन विवरण" : "Invalid credentials",
  };

  const handleLanguageChange = (next) => {
    setLanguage(next);
    setPortalLanguage(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) return;
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.first_name || user.username}!`);
      if (user.role === "ADMIN") navigate("/admin/dashboard");
      else if (HANDLER_ROLES.includes(user.role)) navigate("/officer/dashboard");
      else navigate("/citizen/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || text.invalidCredentials);
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
          icon: ClipboardList,
          title: isHindi ? "शिकायत संचालन" : "Complaint operations",
          text: isHindi ? "नागरिक से लेकर विभागीय अधिकारी तक पूरा वर्कफ़्लो तैयार है।" : "The full workflow is ready from citizen intake to departmental resolution.",
        },
        {
          icon: ShieldCheck,
          title: isHindi ? "अधिकारी नियंत्रण" : "Officer controls",
          text: isHindi ? "फॉरवर्ड, एस्केलेट, प्रूफ अपलोड और डुप्लिकेट चिन्हित करने जैसे एक्शन मौजूद हैं।" : "Forwarding, escalation, proof upload, and duplicate tagging are already in the working build.",
        },
        {
          icon: Waves,
          title: isHindi ? "मल्टी-डिपार्टमेंट फोकस" : "Multi-department ready",
          text: isHindi ? "वर्तमान बिल्ड किसी भी विभागीय शिकायत संरचना के लिए कॉन्फ़िगर किया जा सकता है।" : "The current build can be configured for any department grievance hierarchy.",
        },
      ]}
      footer={
        <div className="rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white">
          <strong>{text.trackWithoutLogin}:</strong>{" "}
          <Link to="/track" className="font-semibold text-amber-300 hover:text-amber-200">
            {text.trackCta} →
          </Link>
        </div>
      }
    >
      <div className="text-center mb-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-indigo-900/20">JS</div>
        <h1 className="text-2xl font-bold text-gray-900">{text.signIn}</h1>
        <p className="mt-1 text-sm text-gray-500">{text.subtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{text.username}</label>
          <input
            className="input"
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder={text.enterUsername}
            required
            autoComplete="username"
            maxLength={150}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{text.password}</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={text.enterPassword}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base shadow-lg shadow-blue-600/20">
          {loading ? text.signingIn : text.signIn}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        {text.newCitizen}{" "}
        <Link to="/register" className="font-medium text-blue-600 hover:underline">{text.registerHere}</Link>
      </p>
    </PortalEntryShell>
  );
}
