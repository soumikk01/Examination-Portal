const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

export const api = {
    getStudents: () => fetch(`${API_BASE_URL}/students`).then(res => res.json()),
    searchStudents: (query) => fetch(`${API_BASE_URL}/search?query=${query}`).then(res => res.json()),
    getStudentByCollegeId: (collegeId) => fetch(`${API_BASE_URL}/student/${collegeId}`).then(res => res.json()),
    createStudent: (studentData) => fetch(`${API_BASE_URL}/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
    }).then(res => res.json()),
    addExam: (collegeId, examData) => fetch(`${API_BASE_URL}/student/${collegeId}/exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData)
    }).then(res => res.json()),
    deleteStudent: (collegeId) => fetch(`${API_BASE_URL}/student/${collegeId}`, {
        method: 'DELETE'
    }),
    deleteExam: (collegeId, examId) => fetch(`${API_BASE_URL}/student/${collegeId}/exam/${examId}`, {
        method: 'DELETE'
    })
};
