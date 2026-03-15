import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button, Card, ExamCard, PageLayout, Skeleton } from '../components';
import { parseExamDateTime } from '../utils/dateUtils';

const StudentExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getStudentExams();
        const now = new Date();
        const withMeta = (data || []).map((exam) => {
          const dateTime = parseExamDateTime(exam.date, exam.time);
          return { ...exam, dateTime, isPassed: dateTime < now };
        });
        setExams(withMeta);
      } catch (err) {
        setError(err.message || 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
          <div className="flex justify-end mb-8">
            <Skeleton width="4rem" height="2rem" className="bg-blue-100" />
          </div>
          <Card>
            <Skeleton height="2rem" width="30%" className="mb-6 bg-blue-100" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="4rem" className="bg-gray-100" />
              ))}
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
          <Card className="mb-6">
            <p className="text-red-600 font-medium">{error}</p>
          </Card>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go back
          </Button>
        </div>
      </PageLayout>
    );
  }

  const upcoming = exams.filter((e) => !e.isPassed).sort((a, b) => a.dateTime - b.dateTime);
  const gone = exams.filter((e) => e.isPassed).sort((a, b) => b.dateTime - a.dateTime);

  return (
    <PageLayout>
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
        <div className="flex justify-end mb-8">
          <Button variant="danger" onClick={() => navigate('/')}>
            Back
          </Button>
        </div>

        <Card>
          <h3 className="text-2xl font-bold text-[#2d368e] border-b pb-4 mb-6">📅 My Exams</h3>

          {upcoming.length === 0 && gone.length === 0 ? (
            <div className="bg-slate-50 py-12 rounded-xl text-center text-gray-400 italic">
              No published exams available right now.
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <h4 className="text-lg font-semibold text-[#2d368e] mb-3">Upcoming exams</h4>
                  <div className="space-y-4 mb-8">
                    {upcoming.map((exam, idx) => (
                      <ExamCard key={exam.id} exam={exam} isNext={idx === 0} />
                    ))}
                  </div>
                </>
              )}

              {gone.length > 0 && (
                <>
                  <h4 className="text-lg font-semibold text-[#2d368e] mb-3">Gone exams</h4>
                  <div className="space-y-4">
                    {gone.map((exam) => (
                      <ExamCard key={exam.id} exam={exam} isNext={false} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default StudentExams;

