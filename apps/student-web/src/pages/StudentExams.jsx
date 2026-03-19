import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button, Card, PageLayout, Skeleton } from '../components';

const computeCurrentSemester = (admissionYear) => {
  const year = Number(admissionYear);
  if (!Number.isFinite(year) || year < 1900 || year > 3000) return '';
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const isJanToJun = month <= 5;
  const yearsElapsed = Math.max(0, currentYear - year);
  const semesterNumber = yearsElapsed * 2 + (isJanToJun ? 1 : 2);
  return String(Math.min(8, Math.max(1, semesterNumber)));
};

const StudentExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('REGULAR');
  const [scheduleType, setScheduleType] = useState('');
  const [student, setStudent] = useState(null);
  const [departmentCode, setDepartmentCode] = useState('');
  const [semester, setSemester] = useState('');
  const [level, setLevel] = useState('UG');

  const load = useCallback(async (filters) => {
    try {
      if (!filters?.departmentCode) {
        setExams([]);
        return;
      }
      setLoading(true);
      setError(null);
      const data = await api.getStudentExams(filters);
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load exam schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const studentJson = localStorage.getItem('examination_portal_student');
    const s = studentJson ? JSON.parse(studentJson) : null;
    if (!s?.collegeId) {
      navigate('/');
      return;
    }

    const dep = String(s.branch || s.department || '').toUpperCase();
    const sem = String(s.currentSemester || s.semester || computeCurrentSemester(s.admissionYear)).trim();
    const lv = String(s.level || 'UG').toUpperCase();

    setStudent(s);
    setDepartmentCode(dep);
    setSemester(sem);
    setLevel(lv);
  }, [navigate]);

  useEffect(() => {
    if (!departmentCode) return;
    load({
      level,
      departmentCode,
      semester: semester || undefined,
      mode: mode || undefined,
      scheduleType: scheduleType || undefined,
    });
  }, [departmentCode, level, load, mode, scheduleType, semester]);

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

  return (
    <PageLayout>
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px' }}>
        <div className="flex justify-end mb-8">
          <Button variant="danger" onClick={() => navigate('/')}>
            Back
          </Button>
        </div>

        <Card>
          <h3 className="text-2xl font-bold text-[#2d368e] border-b pb-4 mb-6">📅 Exam Schedule</h3>

          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div className="text-sm text-gray-600">
              <div className="font-semibold text-gray-900">{student?.name || 'Student'}</div>
              <div>
                <span className="text-gray-500">ID:</span> {student?.collegeId || '—'}
                <span className="mx-2">•</span>
                <span className="text-gray-500">Dept:</span> {departmentCode || '—'}
                <span className="mx-2">•</span>
                <span className="text-gray-500">Sem:</span> {semester || '—'}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500">Regular / Backlog</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="border rounded-lg px-3 py-2">
                  <option value="REGULAR">Regular</option>
                  <option value="BACKLOG">Backlog</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500">Exam type</label>
                <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} className="border rounded-lg px-3 py-2">
                  <option value="">All</option>
                  <option value="TEST_I">Test - I</option>
                  <option value="TEST_II">Test - II</option>
                  <option value="END_SEM_THEORY">Semester End (Theory)</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={() =>
                    load({
                      level,
                      departmentCode,
                      semester: semester || undefined,
                      mode: mode || undefined,
                      scheduleType: scheduleType || undefined,
                    })
                  }
                  disabled={!departmentCode}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="bg-slate-50 py-12 rounded-xl text-center text-gray-400 italic">
              No published schedule found for this selection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-gray-500 border-b">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Day</th>
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Paper code</th>
                    <th className="py-2 pr-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e) => (
                    <tr key={e.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4">
                        {e.examDate ? new Date(e.examDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 pr-4">{e.examDay || '—'}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{e.subject}</td>
                      <td className="py-3 pr-4">{e.paperCode || '—'}</td>
                      <td className="py-3 pr-4">{e.examTime || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default StudentExams;

