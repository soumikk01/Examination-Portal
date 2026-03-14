import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { Button, Card, Skeleton, ExamCard, PageLayout } from '../components';
import { parseExamDateTime } from '../utils/dateUtils';


const ProfilePage = () => {
    const { collegeId: paramId, '*': splat } = useParams();
    // Support nested paths if any, but usually collegeId is the main identifier
    const collegeId = paramId + (splat ? '/' + splat : '');
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [examTypeFilter, setExamTypeFilter] = useState('ALL');

    const examTypes = ['ALL', 'ODD', 'EVEN', 'TEST-I', 'TEST-II'];

    const processedExams = React.useMemo(() => {
        if (!student?.exams) return [];

        const now = new Date();
        let exams = student.exams.map((exam) => {
            const dateTime = parseExamDateTime(exam.date, exam.time);
            return {
                ...exam,
                dateTime,
                isPassed: dateTime < now,
            };
        });

        // Filter by exam type if not ALL
        if (examTypeFilter !== 'ALL') {
            exams = exams.filter((e) => e.examCategory && e.examCategory === examTypeFilter);
        }

        const upcoming = exams.filter((e) => !e.isPassed).sort((a, b) => a.dateTime - b.dateTime);
        const past = exams.filter((e) => e.isPassed).sort((a, b) => b.dateTime - a.dateTime);

        return [...upcoming, ...past];
    }, [student, examTypeFilter]);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                setLoading(true);
                // Fetch data
                const data = await api.getStudentProfile(collegeId);
                setStudent(data);
            } catch (err) {
                setError(err.message || 'Error fetching student data');
                
                // If unauthorized or not found, we should eventually redirect
                // but let's show the error state first
                if (err.status === 401) {
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [collegeId, navigate]);

    // Redirect to home only if there was an explicit AUTH error or critical failure after showing error
    useEffect(() => {
        if (!loading && error && !student) {
            const timer = setTimeout(() => navigate('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [loading, error, student, navigate]);

    if (loading) {
        return (
            <PageLayout>
                <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
                    <div className="flex justify-end mb-8">
                        <Skeleton width="4rem" height="2rem" className="bg-blue-100" />
                    </div>

                    {/* Skeleton Profile Card */}
                    <Card className="mb-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
                        <Skeleton height="2rem" width="33%" className="mb-6 bg-blue-100" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <Skeleton width="6rem" height="1rem" className="bg-gray-100" />
                                    <Skeleton width="8rem" height="1rem" className="bg-gray-200" />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Skeleton Exam Schedule */}
                    <Card style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                        <Skeleton height="2rem" width="25%" className="mb-6 bg-blue-100" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                        <Skeleton width="33%" height="1.5rem" className="bg-indigo-100" />
                                        <Skeleton
                                            width="4rem"
                                            height="1.5rem"
                                            rounded="999px"
                                            className="bg-green-100"
                                        />
                                    </div>
                                    <div className="flex justify-between gap-4 flex-wrap">
                                        <Skeleton width="6rem" height="1rem" className="bg-gray-100" />
                                        <Skeleton width="6rem" height="1rem" className="bg-gray-100" />
                                        <Skeleton width="6rem" height="1rem" className="bg-gray-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </PageLayout>
        );
    }

    if (!student) {
        return null;
    }

    return (
        <PageLayout>
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
                                    e.currentTarget.style.boxShadow =
                                        examTypeFilter === type ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none';
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
                                    boxShadow: examTypeFilter === type ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    {/* Back Button - Right Side */}
                    <Button variant="danger" onClick={() => navigate('/')} icon={ArrowLeft}>
                        Back
                    </Button>
                </div>

                {/* Student Profile Card */}
                <Card className="mb-8" style={{ backgroundColor: '#f0f4f8' }}>
                    <h3 className="text-3xl font-bold text-[#2d368e] border-b pb-4 mb-6">{student.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-base">
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Student Code :</span>
                            <span className="text-gray-900 font-semibold">
                                {student.studentCode || student.collegeId || 'N/A'}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Student Roll :</span>
                            <span className="text-gray-900 font-semibold">
                                {student.studentRoll || student.roll || 'N/A'}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Student Reg :</span>
                            <span className="text-gray-900 font-semibold">
                                {student.studentReg || student.registration || 'N/A'}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Examination Sem :</span>
                            <span className="text-gray-900 font-semibold">
                                {student.examinationSem || student.semester || 'N/A'}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Batch :</span>
                            <span className="text-gray-900 font-semibold">
                                {[student.degree, student.department, student.batch].filter(Boolean).join(' - ') || 'N/A'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Exam Schedule Card */}
                <Card style={{ backgroundColor: 'white' }}>
                    <h3 className="text-2xl font-bold text-[#2d368e] border-b pb-4 mb-6">📅 Exam Schedule</h3>
                    {processedExams.length > 0 ? (
                        <>
                            {/* Show message if all exams are completed */}
                            {processedExams.every((e) => e.isPassed) && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl mb-6 text-center">
                                    <span className="text-4xl mb-2 block">🎉</span>
                                    <h4 className="text-xl font-bold text-green-700 mb-2">
                                        {examTypeFilter !== 'ALL'
                                            ? `All ${examTypeFilter} Exams Completed!`
                                            : 'All Exams Completed!'}
                                    </h4>
                                    <p className="text-green-600">
                                        {examTypeFilter !== 'ALL'
                                            ? `You have completed all your ${examTypeFilter} semester exams.`
                                            : 'Congratulations! You have completed all your scheduled exams. Enjoy your break!'}
                                    </p>
                                </div>
                            )}
                            <div className="space-y-4">
                                {processedExams.map((exam) => {
                                    const isFirstUpcoming =
                                        !exam.isPassed && processedExams.filter((e) => !e.isPassed).indexOf(exam) === 0;
                                    return <ExamCard key={exam.examId} exam={exam} isNext={isFirstUpcoming} />;
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="bg-slate-50 py-12 rounded-xl text-center text-gray-400 italic">
                            No exams scheduled for this student
                        </div>
                    )}
                </Card>

                {/* Pinned Note Section */}
                <div
                    className="mt-8 relative mx-auto max-w-2xl transform hover:rotate-0 transition-transform duration-300"
                    style={{ transform: 'rotate(-1deg)' }}
                >
                    <div className="bg-[#fffdf0] border border-[#e6e2c8] p-6 rounded-sm shadow-[2px_4px_8px_rgba(0,0,0,0.1)] relative">
                        <div className="text-center">
                            <h4 className="flex items-center justify-center gap-2 font-bold text-gray-800 text-lg mb-2 underline decoration-wavy decoration-[#e6e2c8]">
                                <span>📌</span> Important Notice
                            </h4>
                            <p className="text-gray-700 font-medium leading-relaxed">
                                Please report to your assigned room{' '}
                                <span className="text-red-600 font-bold">at least 15 minutes</span> before the
                                scheduled examination time. Students must wear the{' '}
                                <span className="font-bold">college uniform</span> and bring their{' '}
                                <span className="text-[#2d368e] font-bold">college ID card</span> along with all
                                required documents.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default ProfilePage;
