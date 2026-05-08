import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const HANDLER_ROLES = ["OFFICER"];

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">JS</div>
          <h1 className="text-2xl font-bold text-gray-900">Jan Samadhan AI</h1>
          <p className="text-gray-500 text-sm mt-1">Citizen Grievance Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              className="input"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username"
              required
              autoComplete="username"
              maxLength={150}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          New citizen?{" "}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">Register here</Link>
        </p>
        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <strong>Track complaint without login:</strong>{" "}
          <Link to="/track" className="underline">Track by Ticket ID →</Link>
        </div>
      </div>
    </div>
  );
}
