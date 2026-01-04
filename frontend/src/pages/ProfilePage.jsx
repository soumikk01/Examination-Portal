import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

const parseExamDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, minutes);
};

const ProfilePage = () => {
    const location = useLocation();
    // Extract collegeId from path: /student/jis/2000/000 -> jis/2000/000
    const collegeId = location.pathname.replace('/student/', '');
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [examTypeFilter, setExamTypeFilter] = useState('ALL');

    const examTypes = ['ALL', 'ODD', 'EVEN', 'TEST-I', 'TEST-II'];

    const processedExams = React.useMemo(() => {
        if (!student?.exams) return [];

        const now = new Date();
        let exams = student.exams.map(exam => {
            const dateTime = parseExamDateTime(exam.date, exam.time);
            return {
                ...exam,
                dateTime,
                isPassed: dateTime < now
            };
        });

        // Filter by exam type if not ALL
        if (examTypeFilter !== 'ALL') {
            exams = exams.filter(e => e.examCategory === examTypeFilter);
        }

        const upcoming = exams.filter(e => !e.isPassed).sort((a, b) => a.dateTime - b.dateTime);
        const past = exams.filter(e => e.isPassed).sort((a, b) => b.dateTime - a.dateTime);

        return [...upcoming, ...past];
    }, [student, examTypeFilter]);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                // Fetch data and wait for at least 400ms simultaneously
                const [data] = await Promise.all([
                    api.getStudentByCollegeId(collegeId),
                    new Promise(resolve => setTimeout(resolve, 400))
                ]);

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
            <div style={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                backgroundColor: '#cbd5e1',
                margin: 0
            }}>
                {/* Top Left Gradient Blob */}
                <div style={{
                    position: 'absolute',
                    top: '-150px',
                    left: '-150px',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, #86bafa4d 0%, #5c8cf533 100%)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    zIndex: 0
                }} />

                {/* Bottom Right Gradient Blob */}
                <div style={{
                    position: 'absolute',
                    bottom: '-150px',
                    right: '-150px',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, hsla(158, 87%, 73%, 0.30) 0%, #72f1c933 100%)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
                    <div className="flex justify-end mb-8">
                        <div className="skeleton skeleton-text w-16 bg-blue-100"></div>
                    </div>

                    {/* Skeleton Profile Card */}
                    <div className="glass-card p-8 mb-8 bg-white/50 backdrop-blur-sm">
                        <div className="skeleton skeleton-text h-8 w-1/3 mb-6 bg-blue-100"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <div className="skeleton skeleton-text w-24 bg-gray-100"></div>
                                    <div className="skeleton skeleton-text w-32 bg-gray-200"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skeleton Exam Schedule */}
                    <div className="glass-card bg-white/80 p-8">
                        <div className="skeleton skeleton-text h-8 w-1/4 mb-6 bg-blue-100"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                        <div className="skeleton skeleton-text w-1/3 bg-indigo-100"></div>
                                        <div className="skeleton skeleton-text w-16 rounded-full bg-green-100"></div>
                                    </div>
                                    <div className="flex justify-between gap-4 flex-wrap">
                                        <div className="skeleton skeleton-text w-24 bg-gray-100"></div>
                                        <div className="skeleton skeleton-text w-24 bg-gray-100"></div>
                                        <div className="skeleton skeleton-text w-24 bg-gray-100"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen p-4 md:p-12 max-w-6xl mx-auto">
                <div className="flex justify-end mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 font-medium"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.backgroundColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.backgroundColor = '#ef4444';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(0.95)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.2)';
                        }}
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)'
                        }}
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} /> Back
                    </button>
                </div>
                <div className="glass-card bg-white p-12 text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Student Not Found</h2>
                    <p className="text-gray-500">No student found with ID: {collegeId}</p>
                </div>
            </div>
        );
    }



    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            backgroundColor: '#cbd5e1',
            margin: 0
        }}>
            {/* Top Left Gradient Blob */}
            <div style={{
                position: 'absolute',
                top: '-150px',
                left: '-150px',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, #86bafa4d 0%, #5c8cf533 100%)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                zIndex: 0
            }} />

            {/* Bottom Right Gradient Blob */}
            <div style={{
                position: 'absolute',
                bottom: '-150px',
                right: '-150px',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, hsla(158, 87%, 73%, 0.30) 0%, #72f1c933 100%)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
                <div className="flex justify-between items-center mb-8">
                    {/* Filter Buttons - Left Side */}
                    <div className="flex gap-2 flex-wrap">
                        {examTypes.map((type) => (
                            <button
                                key={type}
                                onClick={() => setExamTypeFilter(type)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.35)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = examTypeFilter === type ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none';
                                }}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(0.95)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.35)';
                                }}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backgroundColor: examTypeFilter === type ? '#4f46e5' : '#e0e7ff',
                                    color: examTypeFilter === type ? 'white' : '#4f46e5',
                                    boxShadow: examTypeFilter === type ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    {/* Back Button - Right Side */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 font-medium"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.backgroundColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.backgroundColor = '#ef4444';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(0.95)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.2)';
                        }}
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)'
                        }}
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} /> Back
                    </button>
                </div>

                {/* Student Profile Card */}
                <div className="glass-card p-8 mb-8" style={{ backgroundColor: '#f0f4f8' }}>
                    <h3 className="text-2xl font-bold text-[#2d368e] border-b pb-4 mb-6">{student.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-base">
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Student Code :</span>
                            <span className="text-gray-900 font-semibold">{student.studentCode || student.collegeId || 'N/A'}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Student Roll :</span>
                            <span className="text-gray-900 font-semibold">{student.studentRoll || student.roll || 'N/A'}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Student Reg :</span>
                            <span className="text-gray-900 font-semibold">{student.studentReg || student.registration || 'N/A'}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Examination Sem :</span>
                            <span className="text-gray-900 font-semibold">{student.examinationSem || student.semester || 'N/A'}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Batch :</span>
                            <span className="text-gray-900 font-semibold">{student.batch || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Exam Schedule Card */}
                <div className="glass-card bg-white p-8">
                    <h3 className="text-2xl font-bold text-[#2d368e] border-b pb-4 mb-6">📅 Exam Schedule</h3>
                    {processedExams.length > 0 ? (
                        <>
                            {/* Show message if all exams are completed */}
                            {processedExams.every(e => e.isPassed) && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl mb-6 text-center">
                                    <span className="text-4xl mb-2 block">🎉</span>
                                    <h4 className="text-xl font-bold text-green-700 mb-2">All Exams Completed!</h4>
                                    <p className="text-green-600">Congratulations! You have completed all your scheduled exams. Enjoy your break!</p>
                                </div>
                            )}
                            <div className="space-y-4">
                                {processedExams.map((exam, index) => {
                                    const isFirstUpcoming = !exam.isPassed && processedExams.filter(e => !e.isPassed).indexOf(exam) === 0;
                                    return (
                                        <div
                                            key={exam.examId}
                                            className={`p-6 rounded-xl border transition-all duration-300 ${exam.isPassed
                                                ? 'bg-gray-100 border-gray-300 ring-2 ring-gray-400 opacity-70 hover:opacity-100'
                                                : isFirstUpcoming
                                                    ? 'bg-indigo-100 border-indigo-400 ring-4 ring-indigo-500 shadow-2xl shadow-indigo-300 scale-[1.03] hover:shadow-2xl hover:scale-[1.04]'
                                                    : 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500 shadow-lg shadow-indigo-200 scale-[1.01] hover:shadow-xl hover:scale-[1.02]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#2d368e] text-xl">{exam.subject}</span>
                                                </div>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '9999px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase',
                                                    backgroundColor: exam.examType === 'Backlog' ? '#fed7aa' : '#bbf7d0',
                                                    color: exam.examType === 'Backlog' ? '#ea580c' : '#16a34a'
                                                }}>
                                                    {exam.examType || 'Regular'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1', minWidth: '100px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={16} style={{ color: '#6366f1' }} /> {exam.date || 'N/A'}
                                                </div>
                                                <div style={{ flex: '1', minWidth: '100px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    🕒 {exam.time || 'N/A'}
                                                </div>
                                                <div style={{ flex: '1', minWidth: '100px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    🏛️ {exam.room || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="bg-slate-50 py-12 rounded-xl text-center text-gray-400 italic">
                            No exams scheduled for this student
                        </div>
                    )}
                </div>
                {/* Pinned Note Section */}
                < div className="mt-8 relative mx-auto max-w-2xl transform hover:rotate-0 transition-transform duration-300" style={{ transform: 'rotate(-1deg)' }}>
                    <div className="bg-[#fffdf0] border border-[#e6e2c8] p-6 rounded-sm shadow-[2px_4px_8px_rgba(0,0,0,0.1)] relative">
                        <div className="text-center">
                            <h4 className="flex items-center justify-center gap-2 font-bold text-gray-800 text-lg mb-2 underline decoration-wavy decoration-[#e6e2c8]">
                                <span>📌</span> Important Notice
                            </h4>
                            <p className="text-gray-700 font-medium leading-relaxed">
                                Please report to your assigned room <span className="text-red-600 font-bold">at least 15 minutes</span> before the scheduled examination time.
                                Students must wear the <span className="font-bold">college uniform</span> and bring their <span className="text-[#2d368e] font-bold">college ID card</span> along with all required documents.
                            </p>
                        </div>
                    </div>
                </div >

            </div >
        </div >
    );
};



export default ProfilePage;

