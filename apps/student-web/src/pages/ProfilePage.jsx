import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Button, Card, Skeleton, ExamCard, PageLayout } from '../components';
import { parseExamDateTime } from '../utils/dateUtils';

const ProfileSkeleton = () => (
    <PageLayout>
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
            <div className="flex justify-end mb-8">
                <Skeleton width="4rem" height="2rem" className="bg-blue-100" />
            </div>
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
            <Card style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                <Skeleton height="2rem" width="25%" className="mb-6 bg-blue-100" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                <Skeleton width="33%" height="1.5rem" className="bg-indigo-100" />
                                <Skeleton width="4rem" height="1.5rem" rounded="999px" className="bg-green-100" />
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

/* ─── Notice Popup Modal ─── */
const NoticeModal = ({ notice, onClose }) => {
    const hasNotice = notice && notice.trim() !== '';
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                animation: 'fadeInOverlay 0.2s ease',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: hasNotice ? '#fffdf0' : '#f0f9ff',
                    border: hasNotice ? '2px solid #e6e2c8' : '2px solid #bae6fd',
                    borderRadius: '12px', padding: '2rem',
                    maxWidth: '480px', width: '90%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    position: 'relative',
                    animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: 'none', border: 'none', fontSize: '1.4rem',
                        cursor: 'pointer', color: '#888', lineHeight: 1,
                        padding: '2px 6px', borderRadius: '4px',
                    }}
                >×</button>

                {hasNotice ? (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '2.5rem' }}>📌</span>
                        </div>
                        <h3 style={{
                            textAlign: 'center', fontSize: '1.15rem', fontWeight: 700,
                            color: '#374151', marginBottom: '1rem',
                            textDecoration: 'underline', textDecorationStyle: 'wavy',
                            textDecorationColor: '#e6e2c8',
                        }}>Important Notice</h3>
                        <p style={{
                            color: '#374151', lineHeight: '1.7',
                            whiteSpace: 'pre-wrap', textAlign: 'center',
                            fontWeight: 500, fontSize: '0.97rem',
                        }}>{notice}</p>
                    </>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        </div>
                        <p style={{ textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                            No active notices at this time.
                        </p>
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 24px', borderRadius: '20px',
                            border: 'none', background: '#4f46e5',
                            color: '#fff', fontWeight: 600,
                            fontSize: '0.9rem', cursor: 'pointer',
                        }}
                    >Close</button>
                </div>
            </div>
            <style>{`
                @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to   { transform: scale(1);   opacity: 1; }
                }
            `}</style>
        </div>
    );
};

/* ─── Main Profile Page ─── */
const ProfilePage = () => {
    const { '*': splat, collegeId: paramId } = useParams();
    const collegeId = paramId ? paramId + (splat ? '/' + splat : '') : splat;
    const navigate = useNavigate();
    const location = useLocation();
    const [student, setStudent] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [examFilter, setExamFilter] = useState(location.state?.filter || 'Profile');
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
    const showAlert = (message, onConfirm) => setModalState({ isOpen: true, title: 'Alert', message, type: 'alert', onConfirm });

    const examFilterOptions = ['Profile', 'Regular', 'Backlog'];

    const { upcomingExams, goneExams } = React.useMemo(() => {
        if (!student?.exams) return { upcomingExams: [], goneExams: [] };
        const now = new Date();
        let exams = student.exams.map((exam) => {
            const dateTime = parseExamDateTime(exam.date, exam.time);
            return { ...exam, dateTime, isPassed: dateTime < now };
        });
        if (examFilter !== 'Profile') {
            const isCategory = ['ODD', 'EVEN'].includes(examFilter);
            exams = exams.filter((e) =>
                isCategory ? e.examCategory === examFilter : (e.examType || 'Regular') === examFilter
            );
        }
        const upcoming = exams.filter((e) => !e.isPassed).sort((a, b) => a.dateTime - b.dateTime);
        const gone = exams.filter((e) => e.isPassed).sort((a, b) => b.dateTime - a.dateTime);
        return { upcomingExams: upcoming, goneExams: gone };
    }, [student, examFilter]);

    useEffect(() => {
        // Instant Load from Cache
        const cached = api.getCachedProfile();
        if (cached) {
            setStudent(cached);
            setLoading(false);
        }

        const fetchStudent = async () => {
            try {
                if (!cached) setLoading(true);
                const [studentData, settingsData] = await Promise.all([
                    api.getStudentProfile(collegeId),
                    api.getSettings().catch(() => null),
                ]);

                if (settingsData?.maintenanceMode) {
                    showAlert('Portal is currently under maintenance. Please try again later.', () => {
                        api.logout();
                        navigate('/');
                    });
                    return;
                }

                setStudent(studentData);
                setSettings(settingsData);

                // Auto-open notice popup on first load if an active notice exists
                if (settingsData?.noticeBoardMessage && settingsData.noticeBoardMessage.trim() !== '') {
                    setShowNoticeModal(true);
                }
            } catch (err) {
                if (!cached) setError(err.message || 'Error fetching student data');
                if (err.status === 401) navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [collegeId, navigate]);

    useEffect(() => {
        if (!loading && error && !student) {
            const timer = setTimeout(() => navigate('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [loading, error, student, navigate]);

    if (loading) return <ProfileSkeleton />;
    if (!student) return null;

    const btnBase = {
        padding: '6px 14px', borderRadius: '20px',
        fontSize: '12px', fontWeight: 600, border: 'none',
        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'none',
    };

    const hasActiveNotice = settings?.noticeBoardMessage && settings.noticeBoardMessage.trim() !== '';

    return (
        <PageLayout>
            {showNoticeModal && (
                <NoticeModal notice={settings?.noticeBoardMessage} onClose={() => setShowNoticeModal(false)} />
            )}

            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4 mb-8">
                    {/* Scrollable Container for Mobile Buttons */}
                    <div 
                        className="flex gap-2 items-center overflow-x-auto pb-2 w-full md:w-auto no-scrollbar"
                        style={{ 
                            msOverflowStyle: 'none', 
                            scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        <div className="flex gap-2 flex-nowrap items-center min-w-max">
                        {/* Exam filter buttons */}
                        {examFilterOptions.map((opt) => {
                            const isSelected = examFilter === opt;
                            const colors = {
                                Profile: { base: '#e0e7ff', text: '#4f46e5', activeBg: '#4f46e5', shadow: 'rgba(79,70,229,0.35)' },
                                Regular: { base: '#d1fae5', text: '#059669', activeBg: '#059669', shadow: 'rgba(16,185,129,0.35)' },
                                Backlog: { base: '#ffedd5', text: '#ea580c', activeBg: '#ea580c', shadow: 'rgba(249,115,22,0.35)' },
                            }[opt];
                            return (
                                <button
                                    key={opt}
                                    onClick={() => setExamFilter(opt)}
                                    className="active:scale-95 transition-transform"
                                    style={{ ...btnBase, backgroundColor: isSelected ? colors.activeBg : colors.base, color: isSelected ? 'white' : colors.text, boxShadow: isSelected ? `0 4px 12px ${colors.shadow}` : 'none', flexShrink: 0 }}
                                >
                                    {opt}
                                </button>
                            );
                        })}

                        <div className="w-px h-6 bg-indigo-200 mx-1"></div>

                        {/* Room Search button */}
                        <button
                            onClick={() => navigate(`/student/${collegeId}/room`, { state: { roomName: upcomingExams[0]?.room, collegeId } })}
                            className="active:scale-95 transition-transform"
                            style={{ ...btnBase, backgroundColor: '#e0e7ff', color: '#4f46e5', flexShrink: 0 }}
                        >
                            Room
                        </button>

                        <div className="w-px h-6 bg-indigo-200 mx-1"></div>

                        {/* Notice button */}
                        <button
                            onClick={() => setShowNoticeModal(true)}
                            className="active:scale-95 transition-transform"
                            style={{ ...btnBase, backgroundColor: '#fef3c7', color: '#d97706', position: 'relative', flexShrink: 0 }}
                        >
                            Notice
                            {hasActiveNotice && (
                                <span style={{
                                    position: 'absolute', top: '-3px', right: '-3px',
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: '#ef4444', border: '1.5px solid white',
                                }} />
                            )}
                        </button>
                        </div>
                    </div>

                    <div className="flex w-full md:w-auto justify-end">
                        <Button variant="danger" onClick={() => navigate('/')} icon={ArrowLeft} className="w-full md:w-auto">Back</Button>
                    </div>
                </div>

                {/* Student Profile Card */}
                <Card className="mb-8" padding="24px 20px" style={{ backgroundColor: '#f0f4f8' }}>
                    <h3 className="text-2xl md:text-3xl font-bold text-[#2d368e] border-b pb-4 mb-6">{student.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-base">
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-500 font-medium text-sm">Student Code :</span>
                            <span className="text-gray-900 font-semibold">{student.studentCode || student.collegeId || 'N/A'}</span>
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
                            <span className="text-gray-900 font-semibold">
                                {[student.degree, student.department, student.batch].filter(Boolean).join(' - ') || 'N/A'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Exam Schedule Card */}
                <Card style={{ backgroundColor: 'white' }}>
                    <h3 className="text-2xl font-bold text-[#2d368e] border-b pb-4 mb-6">📅 Exam Schedule</h3>
                    {upcomingExams.length > 0 || goneExams.length > 0 ? (
                        <>
                            {upcomingExams.length === 0 && goneExams.length > 0 && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl mb-6 text-center">
                                    <span className="text-4xl mb-2 block">🎉</span>
                                    <h4 className="text-xl font-bold text-green-700 mb-2">All exams completed!</h4>
                                    <p className="text-green-600">
                                        {examFilter !== 'ALL' ? `All ${examFilter} exams are done.` : 'Congratulations! You have completed all your scheduled exams.'}
                                    </p>
                                </div>
                            )}
                            {upcomingExams.length > 0 && (
                                <>
                                    <h4 className="text-lg font-semibold text-[#2d368e] mb-3">Upcoming exams</h4>
                                    <div className="space-y-4 mb-8">
                                        {upcomingExams.map((exam, idx) => (
                                            <ExamCard key={exam.examId || exam.id} exam={exam} isNext={idx === 0} />
                                        ))}
                                    </div>
                                </>
                            )}
                            {goneExams.length > 0 && (
                                <>
                                    <h4 className="text-lg font-semibold text-[#2d368e] mb-3">Gone exams</h4>
                                    <div className="space-y-4">
                                        {goneExams.map((exam) => (
                                            <ExamCard key={exam.examId || exam.id} exam={exam} isNext={false} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="bg-slate-50 py-12 rounded-xl text-center text-gray-400 italic">
                            No exams scheduled for this student{examFilter !== 'Profile' && ` (filter: ${examFilter})`}
                        </div>
                    )}
                </Card>

                {/* Pinned Note Section (Recovered) */}
                <div className="mt-8 relative mx-auto max-w-2xl transform hover:rotate-0 transition-transform duration-300" 
                     style={{ transform: 'rotate(-1deg)' }}>
                    <div className="bg-[#fffdf0] border border-[#e6e2c8] p-6 rounded-lg shadow-[4px_6px_0px_rgba(230,226,200,1)] hover:shadow-[2px_4px_8px_rgba(0,0,0,0.1)] relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-400 rounded-full shadow-inner flex items-center justify-center opacity-80 mix-blend-multiply">
                            <div className="w-3 h-3 bg-red-900 rounded-full opacity-40"></div>
                        </div>
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

            <Modal 
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                onConfirm={modalState.onConfirm}
                onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
            />
        </PageLayout>
    );
};

export default ProfilePage;
