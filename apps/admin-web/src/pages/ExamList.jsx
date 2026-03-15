import { useEffect, useState } from 'react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadExams = () => {
    setLoading(true);
    api
      .get('/exams', { params: { status: 'DRAFT' } })
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(getUserFriendlyApiError(err, 'Failed to load exams')),
      )
      .finally(() => setLoading(false));
  };

  const changeStatus = (id, status, extra = {}) => {
    setUpdatingId(id);
    api
      .patch(`/exams/${id}/status`, { status, ...extra })
      .then(() => loadExams())
      .catch((err) =>
        setError(getUserFriendlyApiError(err, 'Failed to update exam')),
      )
      .finally(() => setUpdatingId(null));
  };

  useEffect(() => {
    loadExams();
  }, []);

  if (loading)
    return (
      <div className="admin-card">
        <p>Loading exams…</p>
      </div>
    );

  if (error)
    return (
      <div className="admin-card">
        <p className="admin-status-err">{error}</p>
      </div>
    );

  return (
    <div className="admin-card">
      <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem' }}>Exam list</h1>
      {exams.length === 0 ? (
        <p>No exams in the system yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Program</th>
                <th>Branch</th>
                <th>Semester</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Room</th>
                <th>Type</th>
                <th>Category</th>
                <th>Student</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td>{exam.status ?? '—'}</td>
                  <td>{exam.program ?? '—'}</td>
                  <td>{exam.branch ?? '—'}</td>
                  <td>{exam.semester ?? '—'}</td>
                  <td>{exam.subject ?? '—'}</td>
                  <td>{exam.date ?? '—'}</td>
                  <td>{exam.time ?? '—'}</td>
                  <td>{exam.room ?? '—'}</td>
                  <td>{exam.examType ?? '—'}</td>
                  <td>{exam.examCategory ?? '—'}</td>
                  <td>
                    {exam.student
                      ? `${exam.student.collegeId} (${exam.student.name})`
                      : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={updatingId === exam.id}
                        onClick={() =>
                          changeStatus(exam.id, 'PUBLISHED', {
                            visibleFrom: new Date().toISOString(),
                          })
                        }
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={updatingId === exam.id}
                        onClick={() => changeStatus(exam.id, 'CANCELLED')}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={updatingId === exam.id}
                        onClick={() => changeStatus(exam.id, 'ARCHIVED')}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExamList;

