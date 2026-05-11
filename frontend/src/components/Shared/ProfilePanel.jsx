import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi } from "../../api";
import { useAuth } from "../../hooks/useAuth";

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
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    state: user?.state || "",
    district: user?.district || "",
    block: user?.block || "",
  });

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

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const startEdit = () => {
    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      state: user?.state || "",
      district: user?.district || "",
      block: user?.block || "",
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
            <p className="text-sm text-gray-500">Maintain your contact and service-area details.</p>
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
                ["block", "Block / Area"],
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
              <Item label="Block / Area" value={user?.block} />
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
