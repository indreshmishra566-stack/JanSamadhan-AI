import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { Globe2, MapPinned, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { getPortalLanguage, setPortalLanguage, getPublicText } from "../i18n/public";
import { PublicShell } from "./PublicPortal";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "", email: "", phone: "", first_name: "", last_name: "", password: "", password2: "",
  });
  const [otp, setOtp] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getPortalLanguage());
  const navigate = useNavigate();
  const content = getPublicText(language);
  const common = content.common;
  const text = content.register;
  const labels = text.labels;
  const placeholders = text.placeholders;

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
      if (verificationStep) {
        const { data } = await authApi.verifyRegistrationOtp({ username: form.username, otp });
        toast.success(data.detail || "Email verified. Please login.");
        navigate("/login");
        return;
      }

      const { data } = await authApi.register(form);
      if (data.verification_required) {
        setVerificationStep(true);
        toast.success(data.detail || "OTP sent to your email.");
      } else {
        toast.success(text.accountCreated);
        navigate("/login");
      }
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors?.detail || (errors ? Object.values(errors).flat().join(" ") : text.registrationFailed);
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
    <PublicShell language={language} setLanguage={handleLanguageChange}>
      <main className="portal-entry-page">
        <section className="portal-entry-info">
          <p className="portal-entry-kicker">{common.livePlatform}</p>
          <h2>{text.description}</h2>
          <div className="portal-entry-badges">
            {text.badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <div className="portal-entry-points">
            {[
              { icon: UserPlus, ...text.points[0] },
              { icon: MapPinned, ...text.points[1] },
              { icon: Globe2, ...text.points[2] },
            ].map((point) => (
              <article key={point.title}>
                <point.icon size={18} />
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="portal-entry-card">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-indigo-900/20">JS</div>
            <h1 className="text-2xl font-bold text-gray-900">{text.createAccount}</h1>
            <p className="mt-1 text-sm text-gray-500">{text.subtitle}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!verificationStep ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {field("first_name", labels.first_name, "text", placeholders.first_name)}
                  {field("last_name", labels.last_name, "text", placeholders.last_name)}
                </div>
                {field("username", labels.username, "text", placeholders.username)}
                {field("email", labels.email, "email", placeholders.email)}
                {field("phone", labels.phone, "tel", placeholders.phone)}
                {field("password", labels.password, "password", placeholders.password)}
                {field("password2", labels.password2, "password", placeholders.password2)}
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email OTP</label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  required
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">
                  OTP was sent to {form.email}. Verify your email to activate this account.
                </p>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 shadow-lg shadow-blue-600/20">
              {loading ? text.creating : verificationStep ? "Verify Email" : text.createAccount}
            </button>
            {verificationStep && (
              <button
                type="button"
                className="w-full text-sm font-medium text-blue-600 hover:underline"
                onClick={() => {
                  setOtp("");
                  setVerificationStep(false);
                }}
              >
                Change registration details
              </button>
            )}
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            {text.alreadyRegistered}{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">{text.signIn}</Link>
          </p>
        </section>
      </main>
    </PublicShell>
  );
}
