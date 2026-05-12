import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { useAuth } from "../hooks/useAuth";
import { Globe2, MapPinned, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { getPortalLanguage, setPortalLanguage, getPublicText } from "../i18n/public";
import { PublicShell } from "./PublicPortal";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    gender: "",
    address_line: "",
    sub_locality: "",
    locality: "",
    country: "India",
    state: "",
    district: "",
    block: "",
    pincode: "",
    password: "",
    password2: "",
  });
  const [otp, setOtp] = useState("");
  const [registeredUsername, setRegisteredUsername] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getPortalLanguage());
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const content = getPublicText(language);
  const common = content.common;
  const text = content.register;
  const labels = text.labels;
  const placeholders = text.placeholders;

  const handleLanguageChange = (next) => {
    setLanguage(next);
    setPortalLanguage(next);
  };

  const getEmailUsername = () => form.email.trim().toLowerCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      return toast.error(text.passwordsMismatch);
    }
    setLoading(true);
    try {
      if (verificationStep) {
        const { data } = await authApi.verifyRegistrationOtp({ username: registeredUsername || getEmailUsername(), otp });
        if (data.access && data.refresh) {
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          await refreshUser();
          toast.success(data.detail || "Email verified. Welcome!");
          navigate("/citizen/dashboard");
        } else {
          toast.success(data.detail || "Email verified. Please login.");
          navigate("/login");
        }
        return;
      }

      const username = getEmailUsername();
      const payload = { ...form, username };
      const { data } = await authApi.register(payload);
      if (data.verification_required) {
        setRegisteredUsername(data.username || username);
        setVerificationStep(true);
        if (data.email_sent === false) {
          if (data.dev_otp) {
            toast.success(`Use OTP ${data.dev_otp} to verify this registration.`);
          } else {
            toast.error(data.delivery_note || data.detail || "OTP email could not be sent.");
          }
        } else {
          toast.success(data.detail || "OTP sent to your email.");
        }
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

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const username = registeredUsername || getEmailUsername();
      const { data } = await authApi.resendRegistrationOtp({ username, email: form.email });
      setRegisteredUsername(data.username || username);
      toast.success(data.dev_otp ? `Use OTP ${data.dev_otp} to verify this registration.` : data.detail || "OTP resent to your email.");
    } catch (err) {
      const errors = err.response?.data;
      if (errors?.dev_otp) {
        toast.success(`Use OTP ${errors.dev_otp} to verify this registration.`);
      } else {
        const msg = errors?.delivery_note || errors?.detail || (errors ? Object.values(errors).flat().join(" ") : "Could not resend OTP");
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const requiredMark = <span className="text-red-600"> *</span>;

  const field = (name, label, type = "text", placeholder = "", required = true) => (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-800">
        {label}{required ? requiredMark : null}
      </label>
      <input
        className="input"
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  const selectField = (name, label, options, required = true) => (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-800">
        {label}{required ? requiredMark : null}
      </label>
      <select
        className="input"
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        required={required}
      >
        <option value="">--Select {label.toLowerCase()}--</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
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

        <section className="portal-entry-card portal-entry-card-wide">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-indigo-900/20">JS</div>
            <h1 className="text-2xl font-bold text-gray-900">{text.createAccount}</h1>
            <p className="mt-1 text-sm text-gray-500">{text.subtitle}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!verificationStep ? (
              <>
                <div className="mb-2 flex flex-col gap-2 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-base font-bold text-fuchsia-900">Enter Details</h2>
                  <p className="text-sm font-semibold text-fuchsia-900">Fields marked with * are mandatory</p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {field("first_name", "First Name", "text", placeholders.first_name)}
                    {field("last_name", "Last Name", "text", placeholders.last_name)}
                  </div>
                  <fieldset className="rounded-lg border border-gray-200 px-4 py-3">
                    <legend className="px-1 text-sm font-semibold text-gray-800">Gender{requiredMark}</legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        ["MALE", "Male"],
                        ["FEMALE", "Female"],
                        ["TRANSGENDER", "Transgender"],
                      ].map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <input
                            type="radio"
                            name="gender"
                            value={value}
                            checked={form.gender === value}
                            onChange={(e) => setForm({ ...form, gender: e.target.value })}
                            required
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="space-y-3">
                    {field("address_line", "Address", "text", "Premise Number or Name")}
                    {field("locality", "Locality", "text", "Locality")}
                    {selectField("state", "State", ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Madhya Pradesh", "Maharashtra", "Rajasthan", "Tamil Nadu", "Uttar Pradesh", "West Bengal"])}
                    {field("pincode", "Pincode", "text", "", false)}
                  </div>

                  <div className="space-y-3">
                    {field("sub_locality", "Sub-locality", "text", "Sub-locality", false)}
                    {selectField("country", "Country", ["India"])}
                    {field("district", "District", "text", "District")}
                    {field("block", "Block / Area", "text", "Block or area", false)}
                  </div>

                  <div className="lg:col-span-2">
                    {field("email", "E-mail address", "email", placeholders.email)}
                  </div>

                  <div>
                    {field("password", labels.password, "password", placeholders.password)}
                  </div>
                  <div>
                    {field("password2", labels.password2, "password", placeholders.password2)}
                  </div>
                </div>
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
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:underline"
                  onClick={() => {
                    setOtp("");
                    setVerificationStep(false);
                  }}
                >
                  Change registration details
                </button>
              </div>
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
