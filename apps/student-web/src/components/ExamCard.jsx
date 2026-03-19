import { Clock, MapPin, Calendar } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

/**
 * Exam Card Component
 * Displays individual exam information with professional design
 */
const ExamCard = ({ exam, isNext = false }) => {
    const isPassed = exam.isPassed;
    const date = formatDate(exam.date);

    return (
        <div
            className="flex flex-col sm:flex-row transition-all duration-300 relative overflow-hidden"
            style={{
                gap: '20px',
                padding: '20px',
                borderRadius: '16px',
                border: isPassed
                    ? '1px solid #e5e7eb'
                    : isNext
                        ? '2px solid #4f46e5'
                        : '2px solid #60a5fa',
                backgroundColor: !isPassed && !isNext ? '#eff6ff' : isPassed ? '#f9fafb' : 'white',
                opacity: isPassed ? 0.7 : 1,
                boxShadow: isNext
                    ? '0 10px 30px rgba(79, 70, 229, 0.25), 0 0 0 1px rgba(79, 70, 229, 0.1)'
                    : !isPassed
                        ? '0 4px 12px rgba(59, 130, 246, 0.15)'
                        : '0 2px 4px rgba(0, 0, 0, 0.05)',
                cursor: 'default',
            }}
            onMouseEnter={(e) => {
                if (!isPassed) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isNext
                        ? '0 12px 35px rgba(79, 70, 229, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.15)'
                        : '0 6px 16px rgba(59, 130, 246, 0.2)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isNext
                    ? '0 10px 30px rgba(79, 70, 229, 0.25), 0 0 0 1px rgba(79, 70, 229, 0.1)'
                    : !isPassed
                        ? '0 4px 12px rgba(59, 130, 246, 0.15)'
                        : '0 2px 4px rgba(0, 0, 0, 0.05)';
            }}
        >
            {/* Accent Line for Next Exam */}
            {isNext && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                    }}
                />
            )}

            {/* Date Block */}
            {!isPassed && (
                <div
                    className="flex flex-col items-center justify-center w-full sm:w-auto"
                    style={{
                        background: isNext
                            ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                            : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        color: isNext ? 'white' : '#1e40af',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        minWidth: '85px',
                        boxShadow: isNext
                            ? '0 4px 12px rgba(79, 70, 229, 0.3)'
                            : '0 2px 6px rgba(59, 130, 246, 0.15)',
                        border: isNext ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #93c5fd',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            opacity: isNext ? 0.9 : 0.8,
                        }}
                    >
                        {date.month}
                    </span>
                    <span
                        style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            lineHeight: 1,
                            margin: '4px 0',
                        }}
                    >
                        {date.day}
                    </span>
                    <span
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            opacity: isNext ? 0.8 : 0.7,
                        }}
                    >
                        {date.year}
                    </span>
                </div>
            )}

            {/* Exam Details */}
            <div className="flex-1 flex flex-col w-full" style={{ gap: '12px' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 w-full">
                    <div style={{ flex: 1 }}>
                        <h3
                            style={{
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                color: isPassed ? '#6b7280' : isNext ? '#1e40af' : '#1f2937',
                                margin: 0,
                                lineHeight: 1.4,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {exam.subject.replace('(Backlog)', '').trim()}
                        </h3>
                        <span
                            style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                fontWeight: 500,
                                marginTop: '2px',
                                display: 'inline-block',
                            }}
                        >
                            [{exam.examId}]
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                backgroundColor: exam.examType === 'Backlog' ? '#fff7ed' : '#f0fdf4',
                                color: exam.examType === 'Backlog' ? '#ea580c' : '#16a34a',
                                border: exam.examType === 'Backlog' ? '1px solid #fed7aa' : '1px solid #bbf7d0',
                                boxShadow:
                                    exam.examType === 'Backlog'
                                        ? '0 1px 3px rgba(234, 88, 12, 0.1)'
                                        : '0 1px 3px rgba(22, 163, 74, 0.1)',
                            }}
                        >
                            {exam.examType || 'Regular'}
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '20px',
                        flexWrap: 'wrap',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                    }}
                >
                    {isPassed && (
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: 500,
                            }}
                        >
                            <Calendar size={16} strokeWidth={2} />
                            {exam.date}
                        </span>
                    )}
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 500,
                        }}
                    >
                        <Clock size={16} strokeWidth={2} />
                        {exam.time}
                    </span>
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 500,
                        }}
                    >
                        <MapPin size={16} strokeWidth={2} />
                        {exam.room}
                    </span>
                </div>

                {exam.examCategory && (
                    <div>
                        <span
                            style={{
                                display: 'inline-block',
                                fontSize: '0.75rem',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#f3f4f6',
                                color: '#4b5563',
                                fontWeight: 600,
                                border: '1px solid #e5e7eb',
                            }}
                        >
                            {exam.examCategory}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamCard;
