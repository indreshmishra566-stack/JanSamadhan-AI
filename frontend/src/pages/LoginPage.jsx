import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PortalEntryShell from "../components/Shared/PortalEntryShell";
import { ClipboardList, ShieldCheck, Waves } from "lucide-react";
import toast from "react-hot-toast";
import { getPortalLanguage, setPortalLanguage, getPublicText } from "../i18n/public";

const HANDLER_ROLES = ["OFFICER"];

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getPortalLanguage());
  const { login } = useAuth();
  const navigate = useNavigate();
  const content = getPublicText(language);
  const common = content.common;
  const text = content.login;

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
      title={common.title}
      subtitle={text.subtitle}
      eyebrow={common.eyebrow}
      description={text.description}
      badges={text.badges}
      asideTitle={text.asideTitle}
      asideText={text.asideText}
      asidePoints={[
        { icon: ClipboardList, ...text.points[0] },
        { icon: ShieldCheck, ...text.points[1] },
        { icon: Waves, ...text.points[2] },
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
        <p className="mt-1 text-sm text-gray-500">{common.portalSubtitle}</p>
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
