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

// Response interceptor for error handling
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

        const message = response?.data?.error || error.message || 'Network error';
        const status = response?.status || 0;
        const data = response?.data || null;

        const apiError = new Error(message);
        apiError.name = 'ApiError';
        apiError.status = status;
        apiError.data = data;
        
        return Promise.reject(apiError);
    }
);

export const api = {
    getHealth: () => apiClient.get('/health'),

    login: async (identifier, verification) => {
        const data = await apiClient.post('/auth/login', { 
            collegeId: identifier, 
            verification 
        });
        
        if (data.token) {
            localStorage.setItem('examination_portal_token', data.token);
            localStorage.setItem('examination_portal_student', JSON.stringify(data.student));
        }
        return data;
    },

    getStudentProfile: (collegeId) =>
        apiClient.get(`/student/${encodeURIComponent(collegeId)}`),

    logout: () => {
        localStorage.removeItem('examination_portal_token');
        localStorage.removeItem('examination_portal_student');
        window.location.href = '/';
    },

    // Legacy/Admin methods
    createStudent: (studentData) =>
        apiClient.post('/student', studentData),
};

export { apiClient as default };
