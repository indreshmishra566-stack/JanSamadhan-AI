import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ClipboardList, ShieldCheck, Waves } from "lucide-react";
import toast from "react-hot-toast";
import { getPortalLanguage, setPortalLanguage, getPublicText } from "../i18n/public";
import { PublicShell } from "./PublicPortal";

const HANDLER_ROLES = ["OFFICER"];

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getPortalLanguage());
  const { login, verifyCitizenOtp } = useAuth();
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
      const result = otpStep
        ? await verifyCitizenOtp({ ...form, otp })
        : await login(form);
      if (result?.otp_required) {
        setOtpStep(true);
        toast.success(result.detail || "OTP sent to your registered email and mobile number.");
        return;
      }
      const user = result;
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
              { icon: ClipboardList, ...text.points[0] },
              { icon: ShieldCheck, ...text.points[1] },
              { icon: Waves, ...text.points[2] },
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
            {otpStep && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Login OTP</label>
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
                  OTP was sent to your registered email and mobile number.
                </p>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base shadow-lg shadow-blue-600/20">
              {loading ? text.signingIn : otpStep ? "Verify OTP" : text.signIn}
            </button>
            {otpStep && (
              <button
                type="button"
                className="w-full text-sm font-medium text-blue-600 hover:underline"
                onClick={() => {
                  setOtp("");
                  setOtpStep(false);
                }}
              >
                Change username or resend OTP
              </button>
            )}
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            {text.newCitizen}{" "}
            <Link to="/register" className="font-medium text-blue-600 hover:underline">{text.registerHere}</Link>
          </p>
          <div className="portal-entry-footer-link">
            <strong>{text.trackWithoutLogin}:</strong>{" "}
            <Link to="/track">{text.trackCta} →</Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
