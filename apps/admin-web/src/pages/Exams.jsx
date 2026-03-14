import { useState, useEffect } from 'react';
import api from '../services/api';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/exams')
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-card"><p>Loading exams…</p></div>;
  if (error) return <div className="admin-card"><p className="admin-status-err">{error}</p></div>;

  return (
    <>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem' }}>Exams</h1>
      <div className="admin-card">
        <h2>Exam list</h2>
        {exams.length === 0 ? (
          <p>No exams in the system yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Room</th>
                <th>Type</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Exams;
