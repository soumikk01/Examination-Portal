const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `HTTP Error: ${response.status}`,
      response.status,
      errorData
    );
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// Helper function to handle fetch errors
const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or other fetch error
    throw new ApiError(error.message || 'Network error. Please check your connection.', 0);
  }
};

export const api = {
  getStudents: () => safeFetch(`${API_BASE_URL}/students`),

  searchStudents: (query) => safeFetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`),

  getStudentByCollegeId: (collegeId) =>
    safeFetch(`${API_BASE_URL}/student/${encodeURIComponent(collegeId)}`),

  createStudent: (studentData) =>
    safeFetch(`${API_BASE_URL}/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    }),

  addExam: (collegeId, examData) =>
    safeFetch(`${API_BASE_URL}/student/${encodeURIComponent(collegeId)}/exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examData),
    }),

  deleteStudent: (collegeId) =>
    safeFetch(`${API_BASE_URL}/student/${encodeURIComponent(collegeId)}`, {
      method: 'DELETE',
    }),

  deleteExam: (collegeId, examId) =>
    safeFetch(
      `${API_BASE_URL}/student/${encodeURIComponent(collegeId)}/exam/${encodeURIComponent(examId)}`,
      {
        method: 'DELETE',
      }
    ),
};

export { ApiError };
