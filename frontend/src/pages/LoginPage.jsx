import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AlertCircle, ClipboardList, Eye, EyeOff, ShieldCheck, Waves } from "lucide-react";
import toast from "react-hot-toast";
import { getPortalLanguage, setPortalLanguage, getPublicText } from "../i18n/public";
import { PublicShell } from "./PublicPortal";

const HANDLER_ROLES = ["OFFICER"];

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
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
    setLoginError("");
    if (!form.username.trim() || !form.password) {
      setLoginError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.first_name || user.username}!`);
      if (user.role === "ADMIN") navigate("/admin/dashboard");
      else if (HANDLER_ROLES.includes(user.role)) navigate("/officer/dashboard");
      else navigate("/citizen/dashboard");
    } catch (err) {
      const message = err.response?.data?.detail || text.invalidCredentials || "Invalid username or password.";
      setLoginError(message);
      toast.error(message, { duration: 5000 });
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Email / Username</label>
              <input
                className="input"
                type="text"
                value={form.username}
                onChange={(e) => {
                  setLoginError("");
                  setForm({ ...form, username: e.target.value });
                }}
                placeholder="Citizen users: enter your registered email address"
                required
                autoComplete="username"
                maxLength={150}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{text.password}</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => {
                    setLoginError("");
                    setForm({ ...form, password: e.target.value });
                  }}
                  placeholder={text.enterPassword}
                  required
                  autoComplete="current-password"
                  aria-invalid={Boolean(loginError)}
                  aria-describedby={loginError ? "login-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {loginError && (
              <div id="login-error" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base shadow-lg shadow-blue-600/20">
              {loading ? text.signingIn : text.signIn}
            </button>
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
