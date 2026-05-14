import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// ─── Sanitize helper (prevents XSS in submitted strings) ─────────────────────
function sanitizeString(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function sanitizePayload(data) {
  if (!data || typeof data !== "object") return data;
  if (data instanceof FormData) return data;
  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    clean[k] = typeof v === "string" ? sanitizeString(v) : v;
  }
  return clean;
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data && !(config.data instanceof FormData)) {
    config.data = sanitizePayload(config.data);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh });
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (data) => api.post("/auth/login/", data),
  register: (data) => api.post("/auth/register/", data),
  resendRegistrationOtp: (data) => api.post("/auth/register/resend-otp/", data),
  verifyRegistrationOtp: (data) => api.post("/auth/register/verify-otp/", data),
  me: () => api.get("/auth/me/"),
  updateMe: (data) => api.patch("/auth/me/", data),
  changePassword: (data) => api.post("/auth/change-password/", data),
};

export const complaintApi = {
  list: (params) => api.get("/complaints/", { params }),
  create: (data) => api.post("/complaints/", data, { headers: { "Content-Type": "multipart/form-data" } }),
  get: (id) => api.get(`/complaints/${id}/`),
  feedback: (id, data) => api.patch(`/complaints/${id}/feedback/`, data),
  rateHandler: (id, officerId, data) => api.patch(`/complaints/${id}/handlers/${officerId}/rating/`, data),
  track: (ticketId) => api.get(`/track/${ticketId}/`),
};

export const adminApi = {
  complaints: (params) => api.get("/admin/complaints/", { params }),
  updateComplaint: (id, data) => api.patch(`/admin/complaints/${id}/`, data),
  stats: () => api.get("/admin/stats/"),
  users: (params) => api.get("/admin/users/", { params }),
  getUser: (id) => api.get(`/admin/users/${id}/`),
  createOfficer: (data) => api.post("/admin/create-officer/", data),
  updateOfficer: (id, data) => api.patch(`/admin/users/${id}/`, data),
  deleteOfficer: (id) => api.delete(`/admin/users/${id}/`),
};

export const hierarchyApi = {
  complaints: (params) => api.get("/hierarchy/complaints/", { params }),
  updateComplaint: (id, fd) => api.patch(`/hierarchy/complaints/${id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
  forwardComplaint: (id, data) => api.post(`/complaints/${id}/forward/`, data),
  escalateComplaint: (id, data) => api.post(`/complaints/${id}/escalate/`, data),
  createOfficer: (data) => api.post("/hierarchy/create-officer/", data),
  updateOfficer: (id, data) => api.patch(`/hierarchy/officers/${id}/`, data),
  departmentOfficers: () => api.get("/hierarchy/subordinates/"),
};

export const notificationApi = {
  list: () => api.get("/notifications/"),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
};

export const departmentApi = {
  list: () => api.get("/departments/"),
  get: (id) => api.get(`/departments/${id}/`),
  create: (data) => api.post("/departments/", data),
  update: (id, data) => api.patch(`/departments/${id}/`, data),
  delete: (id) => api.delete(`/departments/${id}/`),
};
