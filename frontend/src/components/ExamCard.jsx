import { Clock, MapPin, Calendar } from 'lucide-react';

/**
 * Exam Card Component
 * Displays individual exam information with different styling for upcoming vs past exams
 */
const ExamCard = ({ exam, isNext = false }) => {
  const isPassed = exam.isPassed;

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return { day: '--', month: '---', year: '----' };
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return {
      day: day,
      month: months[parseInt(month) - 1] || '---',
      year: year,
    };
  };

  const date = formatDate(exam.date);

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        borderRadius: '12px',
        border: isPassed ? '1px solid #e5e7eb' : '2px solid #3b82f6',
        backgroundColor: !isPassed && !isNext ? '#eff6ff' : isPassed ? '#f9fafb' : 'white',
        opacity: isPassed ? 0.7 : 1,
        boxShadow: isNext
          ? '0 8px 20px rgba(45, 54, 142, 0.3)'
          : !isPassed
            ? '0 2px 8px rgba(59, 130, 246, 0.1)'
            : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Date Block */}
      {!isPassed && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isNext ? '#2d368e' : 'transparent',
            color: isNext ? 'white' : '#2d368e',
            padding: '12px 16px',
            borderRadius: '10px',
            minWidth: '70px',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            {date.month}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{date.day}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{date.year}</span>
        </div>
      )}

      {/* Exam Details */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '8px',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: isPassed ? '#6b7280' : '#1f2937',
              margin: 0,
            }}
          >
            {exam.subject.replace('(Backlog)', '').trim()}{' '}
            <span style={{ fontSize: '0.9em', color: '#4b5563', marginLeft: '6px' }}>
              [{exam.examId}]
            </span>
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontWeight: 600,
                textTransform: 'uppercase',
                backgroundColor: exam.examType === 'Backlog' ? '#ffedd5' : '#dcfce7',
                color: exam.examType === 'Backlog' ? '#c2410c' : '#15803d',
              }}
            >
              {exam.examType || 'Regular'}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            fontSize: '0.875rem',
            color: '#6b7280',
          }}
        >
          {isPassed && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> {exam.date}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} /> {exam.time}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} /> {exam.room}
          </span>
        </div>

        {exam.examCategory && (
          <span
            style={{
              display: 'inline-block',
              marginTop: '8px',
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
            }}
          >
            {exam.examCategory}
          </span>
        )}
      </div>
    </div>
  );
};

export default ExamCard;
