import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

const ProfilePage = () => {
    const { collegeId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const data = await api.getStudentByCollegeId(collegeId);
                if (data.error) {
                    setError('Student not found');
                } else {
                    setStudent(data);
                }
            } catch (err) {
                setError('Error fetching student data');
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [collegeId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-500">Loading...</div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen p-4 md:p-12 max-w-6xl mx-auto">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-8 font-medium">
                    <ArrowLeft size={20} /> Back to Search
                </button>
                <div className="glass-card bg-white p-12 text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Student Not Found</h2>
                    <p className="text-gray-500">No student found with ID: {collegeId}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-12 max-w-6xl mx-auto">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-8 font-medium">
                <ArrowLeft size={20} /> Back to Search
            </button>

            <div className="glass-card bg-white p-8">
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-[#2d368e] border-b pb-4">Student Profile</h3>
                        <div className="grid grid-cols-[120px_1fr] gap-y-4 text-base">
                            <span className="text-gray-500 font-medium">Name</span> <span className="text-gray-900 font-semibold">{student.name}</span>
                            <span className="text-gray-500 font-medium">College ID</span> <span className="text-indigo-600 font-bold">{student.collegeId}</span>
                            <span className="text-gray-500 font-medium">Email</span> <span className="text-gray-900">{student.email}</span>
                            <span className="text-gray-500 font-medium">Branch</span> <span className="text-gray-900">{student.branch || student.department}</span>
                            <span className="text-gray-500 font-medium">Semester</span> <span className="text-gray-900">{student.semester || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-[#2d368e] border-b pb-4">Exam Schedule</h3>
                        {student.exams?.length > 0 ? (
                            <div className="space-y-4">
                                {student.exams.map(exam => (
                                    <div key={exam.examId} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="font-bold text-gray-800 text-lg mb-1">{exam.subject}</div>
                                        <div className="text-sm text-gray-500 flex flex-wrap gap-x-4">
                                            <span className="flex items-center gap-1"><Calendar size={14} /> {exam.date}</span>
                                            <span className="flex items-center gap-1">🕒 {exam.time}</span>
                                            <span className="flex items-center gap-1">🏛️ {exam.room}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 py-12 rounded-xl text-center text-gray-400 italic">
                                No exams scheduled for this student
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
