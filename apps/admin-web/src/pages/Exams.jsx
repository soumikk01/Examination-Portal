import { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const EXAM_TYPES = ['Regular', 'Backlog', 'Test', 'Supply', 'Re-evaluation'];
const EXAM_CATEGORIES = ['ODD', 'EVEN'];

const initialForm = {
  examId: '',
  subject: '',
  date: '',
  time: '',
  room: '',
  examType: 'Regular',
  examCategory: 'ODD',
  studentId: '',
};

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadExams = () => {
    api.get('/exams').then((data) => setExams(Array.isArray(data) ? data : [])).catch(() => {});
  };

  useEffect(() => {
    Promise.all([api.get('/exams'), api.get('/students').catch(() => [])])
      .then(([examsData, studentsData]) => {
        setExams(Array.isArray(examsData) ? examsData : []);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      })
      .catch((err) => setError(getUserFriendlyApiError(err, 'Failed to load exams')))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'studentId' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);
    const payload = {
      examId: form.examId.trim(),
      subject: form.subject.trim(),
      date: form.date,
      time: form.time.trim() || undefined,
      room: form.room.trim() || undefined,
      examType: form.examType,
      examCategory: form.examCategory,
      ...(form.studentId ? { studentId: form.studentId } : {}),
    };
    api
      .post('/exams', payload)
      .then(() => {
        setMessage('Exam added successfully.');
        setForm({ ...initialForm });
        loadExams();
      })
      .catch((err) => setMessage(getUserFriendlyApiError(err, 'Failed to add exam')))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <div className="admin-card"><p>Loading exams…</p></div>;
  if (error) return <div className="admin-card"><p className="admin-status-err">{error}</p></div>;

  return (
    <>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem' }}>Exam schedule</h1>

      <div className="exams-page-layout">
        {/* Left sidebar: Exam list */}
        <div
          className="admin-card exams-sidebar"
          style={{
            position: 'sticky',
            top: '1rem',
            maxHeight: 'calc(100vh - 2rem)',
            overflow: 'auto',
          }}
        >
          <h2>Exam list</h2>
          {exams.length === 0 ? (
            <p>No exams in the system yet. Add one in the form.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Student</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id}>
                      <td>{exam.subject ?? '—'}</td>
                      <td>{exam.date ?? '—'}</td>
                      <td>{exam.time ?? '—'}</td>
                      <td>{exam.room ?? '—'}</td>
                      <td>{exam.examType ?? '—'}</td>
                      <td>{exam.examCategory ?? '—'}</td>
                      <td>{exam.student ? `${exam.student.collegeId} (${exam.student.name})` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Main: Add exam form */}
        <div className="admin-card">
          <h2>Add exam</h2>
          <p style={{ marginBottom: '1rem' }}>Add an exam with date, room, subject. Choose type (Regular, Backlog, Test, etc.) and category (ODD/EVEN). Optionally assign to a student.</p>
          {message && (
            <p className={message.includes('success') ? 'admin-status-ok' : 'admin-status-err'} style={{ marginBottom: '0.75rem' }}>
              {message}
            </p>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', maxWidth: 720 }}>
            <input
              type="text"
              name="examId"
              placeholder="Exam code (e.g. CSE101-ODD)"
              value={form.examId}
              onChange={handleChange}
              required
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            />
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={form.subject}
              onChange={handleChange}
              required
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            />
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            />
            <input
              type="text"
              name="time"
              placeholder="Time (e.g. 09:00 AM)"
              value={form.time}
              onChange={handleChange}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            />
            <input
              type="text"
              name="room"
              placeholder="Room"
              value={form.room}
              onChange={handleChange}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            />
            <select
              name="examType"
              value={form.examType}
              onChange={handleChange}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            >
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              name="examCategory"
              value={form.examCategory}
              onChange={handleChange}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            >
              {EXAM_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            >
              <option value="">No student (schedule only)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.collegeId} – {s.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--admin-primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Adding…' : 'Add exam'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Exams;
