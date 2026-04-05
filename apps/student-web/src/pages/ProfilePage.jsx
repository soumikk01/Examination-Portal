import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LogOut, CalendarDays, User, Pin } from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '@exam-portal/ui';
import { Button, Card, Skeleton, ExamCard, PageLayout, NoticeModal } from '../components';
import { parseExamDateTime } from '../utils/dateUtils';



const ProfileCardSkeleton = () => (
        <Card
            className="mb-8 relative overflow-hidden skeleton-card"
            padding="24px 20px"
            style={{ backgroundColor: '#f0f4f8' }}
        >
            <div className="absolute top-3 right-4" style={{ animationDelay: '0.05s' }}>
                <Skeleton width="108px" height="10px" rounded="5px" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                 <Skeleton width="60px" height="60px" rounded="50%" />
                 <Skeleton height="1.85rem" width="52%" rounded="8px" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-base">
                <div className="flex gap-2 items-center">
                    <span className="text-gray-500 font-medium text-sm whitespace-nowrap">Student Code :</span>
                    <Skeleton width="7.5rem" height="1.05rem" />
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-gray-500 font-medium text-sm whitespace-nowrap">Student Reg :</span>
                    <Skeleton width="7rem" height="1.05rem" />
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-gray-500 font-medium text-sm whitespace-nowrap">Examination Sem :</span>
                    <Skeleton width="3rem" height="1.05rem" />
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-gray-500 font-medium text-sm whitespace-nowrap">Batch :</span>
                    <Skeleton width="10rem" height="1.05rem" />
                </div>
            </div>
        </Card>
);

const ExamScheduleSkeleton = () => (
        <Card style={{ backgroundColor: 'white' }}>
            <h3 className="text-xl md:text-2xl font-black border-b pb-4 mb-6 text-center flex items-center justify-center gap-3 tracking-[0.1em] uppercase">
                <CalendarDays className="w-8 h-8 text-indigo-600 drop-shadow-sm" />
                <span className="bg-gradient-to-r from-[#2d368e] via-indigo-700 to-blue-800 bg-clip-text text-transparent">
                    Exam Schedule
                </span>
            </h3>

            <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="skeleton-card bg-slate-50 rounded-xl border border-slate-100 p-5"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    >
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                            <Skeleton width={i === 0 ? '48%' : i === 1 ? '42%' : '52%'} height="1.2rem" rounded="6px" />
                            <Skeleton width="3.5rem" height="1.5rem" rounded="999px" />
                        </div>
                        <div className="flex gap-5 flex-wrap mt-2">
                            <Skeleton width="5.5rem" height="0.8rem" rounded="4px" />
                            <Skeleton width="4rem"  height="0.8rem" rounded="4px" />
                            <Skeleton width="3.5rem" height="0.8rem" rounded="4px" />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
);

/* ─── Main Profile Page ─── */
let hasVisitedProfileInSession = false;

const ProfilePage = () => {
    const { '*': splat, collegeId: paramId } = useParams();
    const collegeId = paramId ? paramId + (splat ? '/' + splat : '') : splat;
    const navigate = useNavigate();
    const location = useLocation();

    // Skip skeleton ONLY if we have cache AND we've already visited this page in the current JS session
    const shouldSkipSkeleton = () => {
        const cached = api.getCachedProfile();
        // A complete profile usually has a semester, so we only skip if we are SURE it's the full profile
        const hasFullData = cached && (cached.examinationSem || cached.semester);
        return !!hasFullData && hasVisitedProfileInSession;
    };

    const [student, setStudent] = useState(() => api.getCachedProfile());
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(() => !shouldSkipSkeleton());
    const [skeletonDone, setSkeletonDone] = useState(() => shouldSkipSkeleton());
    const [error, setError] = useState(null);
    const [examFilter, setExamFilter] = useState(location.state?.filter || 'Regular');
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
    const showAlert = (message, onConfirm) => setModalState({ isOpen: true, title: 'Alert', message, type: 'alert', onConfirm });

    const examFilterOptions = ['Regular', 'Backlog'];

    const { upcomingExams, goneExams } = React.useMemo(() => {
        if (!student?.exams) return { upcomingExams: [], goneExams: [] };
        const now = new Date();
        let exams = student.exams.map((exam) => {
            const dateTime = parseExamDateTime(exam.date, exam.time);
            return { ...exam, dateTime, isPassed: dateTime < now };
        });
        if (examFilter) {
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
        const cached = api.getCachedProfile();
        
        let skTimer;
        // Enforce the skeleton display time if we don't have cached data OR if this is the first visit this session
        if (!cached || !hasVisitedProfileInSession) {
            skTimer = setTimeout(() => setSkeletonDone(true), 600);
        }

        const fetchStudent = async () => {
            try {
                if (!cached || !hasVisitedProfileInSession) setLoading(true);
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
                if ([401, 403].includes(err.response?.status || err.status)) navigate('/');
            } finally {
                setLoading(false);
                hasVisitedProfileInSession = true;
            }
        };
        fetchStudent();

        return () => { if (skTimer) clearTimeout(skTimer); };
    }, [collegeId, navigate]);

    useEffect(() => {
        if (!loading && error && !student) {
            const timer = setTimeout(() => navigate('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [loading, error, student, navigate]);


    const btnBase = {
        padding: '6px 14px', borderRadius: '20px',
        fontSize: '12px', fontWeight: 600, border: 'none',
        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'none',
    };

    const hasActiveNotice = settings?.noticeBoardMessage && settings.noticeBoardMessage.trim() !== '';

    const renderTopNav = () => (
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
                        Regular: { base: '#d1fae5', text: '#059669', activeBg: '#059669', shadow: 'rgba(16,185,129,0.35)' },
                        Backlog: { base: '#ffedd5', text: '#ea580c', activeBg: '#ea580c', shadow: 'rgba(249,115,22,0.35)' },
                    }[opt];
                    return (
                        <button
                            key={opt}
                            onClick={() => setExamFilter(opt)}
                            className="active:scale-95 transition-transform"
                            style={{ ...btnBase, backgroundColor: isSelected ? colors.activeBg : colors.base, color: isSelected ? 'white' : colors.text, boxShadow: 'none', flexShrink: 0 }}
                        >
                            {opt}
                        </button>
                    );
                })}

                <div className="w-px h-6 bg-indigo-200 mx-1"></div>

                {/* Room Search button */}
                <button
                    onClick={() => {
                       const nextRoom = upcomingExams?.[0]?.room || '';
                       navigate(`/student/${collegeId}/room`, { state: { roomName: nextRoom, collegeId } });
                    }}
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
                <Button variant="logout" onClick={() => api.logout()} icon={LogOut} className="w-full md:w-auto">Logout</Button>
            </div>
        </div>
    );

    // Decouple loading logic
    const isPageLoading = loading || !skeletonDone;
    const profileHasData = student && !!(student.examinationSem || student.semester);
    
    // Only show profile skeleton on first load (no cache data). Refreshes skip profile skeleton.
    const showProfileSkeleton = isPageLoading && !profileHasData;
    // Always show exam skeleton while fetching the latest schedule.
    const showExamSkeleton = isPageLoading;

    if (!isPageLoading && !student) return null;




    return (
        <PageLayout>
            {showNoticeModal && (
                <NoticeModal notice={settings?.noticeBoardMessage} onClose={() => setShowNoticeModal(false)} />
            )}

            <div className="skeleton-fade-in" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
                {renderTopNav()}

                {/* Student Profile Card conditionally rendering */}
                {showProfileSkeleton ? <ProfileCardSkeleton /> : (
                <Card className="mb-8 relative overflow-hidden" padding="24px 20px" style={{ backgroundColor: '#f0f4f8' }}>
                    <div className="absolute top-1 right-4">
                        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.14em] uppercase bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 bg-clip-text text-transparent drop-shadow-sm opacity-90">
                            {(() => {
                                const sem = parseInt(student.examinationSem || student.semester || 0);
                                if (!sem) return ''; // Do not show 'SESSION' fallback during loading or missing data
                                const season = (sem % 2 !== 0 ? 'ODD' : 'EVEN');
                                const pgKeywords = ['M.TECH', 'MBA', 'MCA', 'M.SC', 'PG'];
                                const isPG = pgKeywords.some(k => 
                                    (student.degree || student.program || '').toUpperCase().includes(k)
                                );
                                return `JISCE / ${season} / ${isPG ? 'PG' : 'UG'}`;
                            })()}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ 
                            width: '64px', height: '64px', borderRadius: '50%', 
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4))', 
                            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            flexShrink: 0, 
                            border: '1px solid rgba(255,255,255,0.9)', 
                            boxShadow: '0 8px 16px -4px rgba(31, 38, 135, 0.1), inset 0 2px 4px rgba(255,255,255,0.8)'
                        }}>
                            <User size={30} strokeWidth={2.5} color="#2d368e" style={{ opacity: 0.85 }} />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#2d368e] m-0 leading-tight tracking-tight">{student.name}</h3>
                    </div>
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
                )}

                {/* Exam Schedule Card conditionally rendering */}
                {showExamSkeleton ? <ExamScheduleSkeleton /> : (
                <Card style={{ backgroundColor: 'white' }}>
                    <h3 className="text-xl md:text-2xl font-black border-b pb-4 mb-6 text-center flex items-center justify-center gap-3 tracking-[0.1em] uppercase">
                        <CalendarDays className="w-8 h-8 text-indigo-600 drop-shadow-sm" />
                        <span className="bg-gradient-to-r from-[#2d368e] via-indigo-700 to-blue-800 bg-clip-text text-transparent">
                            Exam Schedule
                        </span>
                    </h3>
                    {upcomingExams.length > 0 || goneExams.length > 0 ? (
                        <>
                            {upcomingExams.length === 0 && goneExams.length > 0 && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl mb-6 text-center">
                                    <span className="text-4xl mb-2 block">ðŸŽ‰</span>
                                    <h4 className="text-xl font-bold text-green-700 mb-2">All exams completed!</h4>
                                    <p className="text-green-600">
                                        Congratulations! You have completed all your scheduled exams.
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
                        <div className="bg-slate-50 py-12 rounded-xl text-center text-gray-400 italic font-medium">
                            No exams scheduled for this student
                            {' '}
                            (<span style={{ 
                                color: examFilter === 'Regular' ? '#059669' : examFilter === 'Backlog' ? '#ea580c' : 'inherit',
                            }}>
                                {examFilter}
                            </span>)
                        </div>
                    )}
                </Card>
                )}

                {/* Pinned Note Section (Recovered) */}
                <div className="mt-8 relative mx-auto max-w-2xl transform hover:rotate-0 transition-transform duration-300" 
                     style={{ transform: 'rotate(-1deg)' }}>
                    <div className="bg-[#fffdf0] border border-[#e6e2c8] p-6 rounded-lg shadow-[4px_6px_0px_rgba(230,226,200,1)] hover:shadow-[2px_4px_8px_rgba(0,0,0,0.1)] relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-400 rounded-full shadow-inner flex items-center justify-center opacity-80 mix-blend-multiply">
                            <div className="w-3 h-3 bg-red-900 rounded-full opacity-40"></div>
                        </div>
                <div className="text-center">
                            <h4 className="flex items-center justify-center gap-2 font-black text-xl mb-3 tracking-wider" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                <Pin className="w-5 h-5 text-red-500 drop-shadow-sm -rotate-45" strokeWidth={2.5} />
                                <span className="bg-gradient-to-r from-red-600 via-orange-600 to-red-500 bg-clip-text text-transparent">
                                    Remember Notice
                                </span>
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
