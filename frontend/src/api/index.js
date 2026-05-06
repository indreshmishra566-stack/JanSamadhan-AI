import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── API helpers ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (data) => api.post("/auth/login/", data),
  register: (data) => api.post("/auth/register/", data),
  me: () => api.get("/auth/me/"),
};

export const complaintApi = {
  list: (params) => api.get("/complaints/", { params }),
  create: (data) => api.post("/complaints/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  get: (id) => api.get(`/complaints/${id}/`),
  feedback: (id, data) => api.patch(`/complaints/${id}/feedback/`, data),
  track: (ticketId) => api.get(`/track/${ticketId}/`),
};

export const adminApi = {
  complaints: (params) => api.get("/admin/complaints/", { params }),
  updateComplaint: (id, data) => api.patch(`/admin/complaints/${id}/`, data),
  stats: () => api.get("/admin/stats/"),
  users: (params) => api.get("/admin/users/", { params }),
  createOfficer: (data) => api.post("/admin/create-officer/", data),
  updateOfficer: (id, data) => api.patch(`/admin/users/${id}/`, data),
  deleteOfficer: (id) => api.delete(`/admin/users/${id}/`),
};

export const officerApi = {
  complaints: () => api.get("/officer/complaints/"),
  update: (id, data) => api.patch(`/officer/complaints/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

export const notificationApi = {
  list: () => api.get("/notifications/"),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
};

export const departmentApi = {
  list: () => api.get("/departments/"),
};