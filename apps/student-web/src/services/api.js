import axios from 'axios';

// In dev, Vite proxies /api to backend (8787). In production, set VITE_API_URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('examination_portal_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: never expose raw Axios messages (e.g. "Request failed with status code 429")
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const { response } = error;
        
        // Handle session expiration
        if (response && response.status === 401 && !window.location.pathname.includes('/login')) {
            localStorage.removeItem('examination_portal_token');
            localStorage.removeItem('examination_portal_student');
            window.location.href = '/';
        }

        let message;
        if (response?.status === 429) {
            message = 'Too many requests. Please try again in a few minutes.';
        } else if (!response) {
            message = 'Connection problem. Please try again.';
        } else {
            message = response?.data?.error || 'Something went wrong. Please try again.';
        }
        const status = response?.status || 0;
        const data = response?.data || null;

        const apiError = new Error(message);
        apiError.name = 'ApiError';
        apiError.status = status;
        apiError.data = data;
        
        return Promise.reject(apiError);
    }
);

// Helper to handle sessionStorage cache
const cache = {
    set: (key, data) => {
        try { sessionStorage.setItem(`ep_cache_${key}`, JSON.stringify(data)); } catch (e) {}
    },
    get: (key) => {
        try {
            const val = sessionStorage.getItem(`ep_cache_${key}`);
            return val ? JSON.parse(val) : null;
        } catch (e) { return null; }
    },
    clear: () => sessionStorage.clear()
};

export const api = {
    getHealth: () => apiClient.get('/health'),
    getSettings: async () => {
        const cached = cache.get('settings');
        if (cached) return cached;
        const data = await apiClient.get('/settings');
        cache.set('settings', data);
        return data;
    },

    login: async (identifier, verification) => {
        const data = await apiClient.post('/auth/login', { 
            collegeId: identifier, 
            verification 
        });
        
        if (data.token) {
            localStorage.setItem('examination_portal_token', data.token);
            localStorage.setItem('examination_portal_student', JSON.stringify(data.student));
            // Initialize cache
            cache.set('profile', data.student);
        }
        return data;
    },

    getStudentProfile: async (collegeId) => {
        const data = await apiClient.get(`/student/${encodeURIComponent(collegeId)}`);
        cache.set('profile', data);
        return data;
    },

    getSeating: async () => {
        const data = await apiClient.get('/student/seating');
        cache.set('seating', data);
        return data;
    },

    // Cache retrieval for Instant Load
    getCachedProfile: () => cache.get('profile'),
    getCachedSeating: () => cache.get('seating'),
    getCachedSettings: () => cache.get('settings'),

    logout: () => {
        localStorage.removeItem('examination_portal_token');
        localStorage.removeItem('examination_portal_student');
        cache.clear();
        window.location.href = '/';
    },

    getExamScheduleFilters: ({ mode, level } = {}) =>
        apiClient.get('/student/exams/filters', { params: { mode, level } }),

    getStudentExams: ({ departmentCode, semester, mode, scheduleType, level } = {}) =>
        apiClient.get('/student/exams', { params: { departmentCode, semester, mode, scheduleType, level } }),

    // Legacy/Admin methods
    createStudent: (studentData) =>
        apiClient.post('/student', studentData),
};

export { apiClient as default };
