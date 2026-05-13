import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi } from "../../api";
import { useAuth } from "../../hooks/useAuth";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";

function Section({ title, icon, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Item({ label, value, accent = false }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-sm mt-1 ${accent ? "font-semibold text-gray-900" : "text-gray-700"}`}>{value || "—"}</p>
    </div>
  );
}

export default function ProfilePanel({ editRequest = 0 }) {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password2: "",
  });
  const [passwordVisible, setPasswordVisible] = useState({
    current_password: false,
    new_password: false,
    new_password2: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    state: user?.state || "",
    district: user?.district || "",
    locality: user?.locality || "",
    pincode: user?.pincode || "",
  });

  const resetPasswordForm = () => {
    setPasswordForm({ current_password: "", new_password: "", new_password2: "" });
    setPasswordError("");
    setPasswordVisible({ current_password: false, new_password: false, new_password2: false });
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => authApi.updateMe(payload),
    onSuccess: async () => {
      await refreshUser();
      toast.success("Profile updated");
      setEditing(false);
    },
    onError: (err) => {
      const errors = err.response?.data;
      const message = errors ? Object.values(errors).flat().join(" ") : "Failed to update profile";
      toast.error(message);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (payload) => authApi.changePassword(payload),
    onSuccess: () => {
      toast.success("Password changed successfully");
      resetPasswordForm();
    },
    onError: (err) => {
      const errors = err.response?.data;
      const message = errors
        ? Object.values(errors).flat().join(" ")
        : "Failed to change password";
      setPasswordError(message);
      toast.error(message);
    },
  });

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updatePasswordField = (key, value) => {
    setPasswordError("");
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  };
  const togglePasswordVisible = (key) => {
    setPasswordVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const submitPasswordChange = (e) => {
    e.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.new_password2) {
      setPasswordError("Please fill current password, new password, and confirmation.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password2) {
      setPasswordError("New passwords do not match.");
      return;
    }
    passwordMutation.mutate(passwordForm);
  };

  const startEdit = () => {
    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      state: user?.state || "",
      district: user?.district || "",
      locality: user?.locality || "",
      pincode: user?.pincode || "",
    });
    setEditing(true);
  };

  useEffect(() => {
    if (editRequest > 0) startEdit();
  }, [editRequest]);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Profile</h2>
            <p className="text-sm text-gray-500">Keep your identity and service-area details up to date.</p>
          </div>
          {editing && (
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate(form)}
                disabled={updateMutation.isPending}
                className="btn-primary text-sm"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Identity" icon="🪪">
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["first_name", "First Name"],
                ["last_name", "Last Name"],
                ["email", "Email"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[11px] uppercase tracking-wide text-gray-400 mb-1">{label}</label>
                  <input
                    className="input text-sm"
                    type={key === "email" ? "email" : "text"}
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Item label="Full Name" value={`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username} accent />
              <Item label="Username" value={user?.username} />
              <Item label="Email" value={user?.email} />
            </div>
          )}
        </Section>

        <Section title="Posting / Service Area" icon="📍">
          {editing ? (
            <div className="grid grid-cols-1 gap-3">
              {[
                ["state", "State"],
                ["district", "District"],
                ["locality", "Locality"],
                ["pincode", "Pincode"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[11px] uppercase tracking-wide text-gray-400 mb-1">{label}</label>
                  <input
                    className="input text-sm"
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Item label="State" value={user?.state} accent />
              <Item label="District" value={user?.district} />
              <Item label="Locality" value={user?.locality} />
              <Item label="Pincode" value={user?.pincode} />
            </div>
          )}
        </Section>
      </div>

      <Section title="Change Password" icon="🔐">
        <form onSubmit={submitPasswordChange} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Update account password</p>
              <p className="text-sm text-gray-500">Enter your current password before setting a new one.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} /> Secure change
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {[
              ["current_password", "Current Password", "current-password"],
              ["new_password", "New Password", "new-password"],
              ["new_password2", "Confirm New Password", "new-password"],
            ].map(([key, label, autoComplete]) => (
              <PasswordInput
                key={key}
                label={label}
                value={passwordForm[key]}
                visible={passwordVisible[key]}
                autoComplete={autoComplete}
                onChange={(value) => updatePasswordField(key, value)}
                onToggle={() => togglePasswordVisible(key)}
              />
            ))}
          </div>

          {passwordError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {passwordError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <KeyRound size={15} />
              {passwordMutation.isPending ? "Changing..." : "Change Password"}
            </button>
            <button type="button" onClick={resetPasswordForm} className="btn-secondary text-sm">
              Clear
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}

function PasswordInput({ label, value, visible, autoComplete, onChange, onToggle }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wide text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <input
          className="input pr-11 text-sm"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}
