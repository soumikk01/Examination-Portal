import axios from 'axios';

// In dev, Vite proxies /api to backend. In production, set VITE_ADMIN_API_URL if API is on another origin.
const API_BASE = import.meta.env.VITE_ADMIN_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Browser auth is cookie-based ONLY (admin_token cookie set at login).
// The X-Admin-Key / ADMIN_API_KEY bypass is strictly for server-side scripts.
// NEVER put ADMIN_API_KEY in a VITE_ env var — it would be bundled into
// the public JS and readable by anyone in DevTools.

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    // Only trigger logout if the server explicitly says this session is unauthorized.
    // 403 means "wrong role" (not a session issue), so we don't auto-logout on 403.
    if (status === 401) {
      sessionStorage.removeItem('examination_portal_admin_staff');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

api.logout = async () => {
  try {
    await api.post('/auth/admin/logout');
  } catch (e) { /* ignore */ }
  sessionStorage.removeItem('examination_portal_admin_staff');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export default api;
