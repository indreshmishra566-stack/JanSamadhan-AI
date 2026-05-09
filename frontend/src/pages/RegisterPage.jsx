import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import PortalEntryShell, { getPortalLanguage, setPortalLanguage } from "../components/Shared/PortalEntryShell";
import { Globe2, MapPinned, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "", email: "", phone: "", first_name: "", last_name: "", password: "", password2: "",
  });
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getPortalLanguage());
  const navigate = useNavigate();
  const isHindi = language === "hi";

  const text = {
    title: "Jan Samadhan AI",
    subtitle: isHindi ? "नागरिक पंजीकरण" : "Citizen registration",
    eyebrow: isHindi ? "विश्वसनीय डिजिटल जन शिकायत प्रणाली" : "Trusted digital public grievance system",
    description: isHindi ? "नागरिकों के लिए त्वरित खाता निर्माण ताकि वे किसी भी विभाग की शिकायत दर्ज कर सकें, ट्रैक कर सकें और समाधान के बाद फीडबैक दे सकें।" : "Fast citizen onboarding for filing grievances, tracking progress, and giving closure feedback across departments.",
    badges: isHindi ? ["हिंदी इनपुट", "टिकट ट्रैकिंग", "मोबाइल रेडी"] : ["Hindi input", "Ticket tracking", "Mobile ready"],
    asideTitle: isHindi ? "यह स्क्रीन क्यों महत्वपूर्ण है" : "Why this screen matters",
    asideText: isHindi ? "यही एंट्री नागरिक भरोसे को बनाती है — आसान पंजीकरण, स्पष्ट पहचान और शिकायत प्रवाह तक तेज पहुंच।" : "This is the citizen trust moment: fast onboarding, clear identity, and a direct path into the grievance workflow.",
    createAccount: isHindi ? "नागरिक खाता बनाएँ" : "Create citizen account",
    creating: isHindi ? "खाता बनाया जा रहा है..." : "Creating account...",
    accountCreated: isHindi ? "खाता बन गया। कृपया लॉगिन करें।" : "Account created! Please login.",
    registrationFailed: isHindi ? "पंजीकरण असफल रहा" : "Registration failed",
    passwordsMismatch: isHindi ? "पासवर्ड मेल नहीं खाते" : "Passwords do not match",
    alreadyRegistered: isHindi ? "पहले से पंजीकृत?" : "Already registered?",
    signIn: isHindi ? "साइन इन करें" : "Sign in",
  };

  const labels = {
    first_name: isHindi ? "पहला नाम" : "First Name",
    last_name: isHindi ? "अंतिम नाम" : "Last Name",
    username: isHindi ? "यूज़रनेम" : "Username",
    email: "Email",
    phone: isHindi ? "मोबाइल नंबर" : "Phone",
    password: isHindi ? "पासवर्ड" : "Password",
    password2: isHindi ? "पासवर्ड की पुष्टि करें" : "Confirm Password",
  };

  const placeholders = {
    first_name: isHindi ? "राहुल" : "Rahul",
    last_name: isHindi ? "कुमार" : "Kumar",
    username: isHindi ? "rahul_kumar" : "rahul_kumar",
    email: "rahul@example.com",
    phone: "+91 9876543210",
    password: isHindi ? "कम से कम 8 अक्षर" : "Min 8 characters",
    password2: isHindi ? "पासवर्ड दोहराएँ" : "Repeat password",
  };

  const handleLanguageChange = (next) => {
    setLanguage(next);
    setPortalLanguage(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      return toast.error(text.passwordsMismatch);
    }
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success(text.accountCreated);
      navigate("/login");
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors ? Object.values(errors).flat().join(" ") : text.registrationFailed;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        className="input"
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder}
        required
      />
    </div>
  );

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
          icon: UserPlus,
          title: isHindi ? "तेज़ ऑनबोर्डिंग" : "Fast onboarding",
          text: isHindi ? "केवल बुनियादी जानकारी से नागरिक खाता तैयार हो जाता है और उपयोगकर्ता सीधे शिकायत प्रवाह में जा सकता है।" : "A citizen can get into the complaint workflow quickly with just the essential identity fields.",
        },
        {
          icon: MapPinned,
          title: isHindi ? "लोकेशन-सक्षम शिकायतें" : "Location-aware complaints",
          text: isHindi ? "पंजीकरण के बाद नागरिक शिकायत दर्ज करते समय लोकेशन, ब्लॉक और GPS संदर्भ जोड़ सकता है।" : "Once registered, the citizen can add location, block, and GPS context to complaints.",
        },
        {
          icon: Globe2,
          title: isHindi ? "भाषा लचीलेपन" : "Language flexibility",
          text: isHindi ? "इंटरफेस हिंदी और अंग्रेज़ी दोनों के साथ द्विभाषी नागरिक अनुभव को सपोर्ट करता है।" : "The onboarding experience already supports a bilingual Hindi-English citizen journey.",
        },
      ]}
    >
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-indigo-900/20">JS</div>
        <h1 className="text-2xl font-bold text-gray-900">{text.createAccount}</h1>
        <p className="mt-1 text-sm text-gray-500">{text.subtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {field("first_name", labels.first_name, "text", placeholders.first_name)}
          {field("last_name", labels.last_name, "text", placeholders.last_name)}
        </div>
        {field("username", labels.username, "text", placeholders.username)}
        {field("email", labels.email, "email", placeholders.email)}
        {field("phone", labels.phone, "tel", placeholders.phone)}
        {field("password", labels.password, "password", placeholders.password)}
        {field("password2", labels.password2, "password", placeholders.password2)}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 shadow-lg shadow-blue-600/20">
          {loading ? text.creating : text.createAccount}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        {text.alreadyRegistered}{" "}
        <Link to="/login" className="text-blue-600 hover:underline font-medium">{text.signIn}</Link>
      </p>
    </PortalEntryShell>
  );
}
