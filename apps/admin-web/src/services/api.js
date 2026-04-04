import axios from 'axios';

// In dev, Vite proxies /api to backend. In production, set VITE_ADMIN_API_URL if API is on another origin.
const API_BASE = import.meta.env.VITE_ADMIN_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// X-Admin-Key still works for API/scripts.
api.interceptors.request.use((config) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY;
  if (adminKey) config.headers['X-Admin-Key'] = adminKey;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
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
