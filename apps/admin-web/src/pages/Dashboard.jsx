import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setUnreachable(false);
        const [healthData, examsData] = await Promise.all([
          api.get('/health'),
          api.get('/exams'),
        ]);
        setHealth(healthData);
        setExams(Array.isArray(examsData) ? examsData : []);
      } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
          setUnreachable(false);
          setError('Too many requests. Please try again in a few minutes.');
          return;
        }
        const isUnreachable =
          !err.response &&
          (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'));
        setUnreachable(isUnreachable);
        setError(
          isUnreachable
            ? null
            : err.response?.data?.error || err.message || 'Failed to load dashboard'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="admin-card">
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error || unreachable) {
    return (
      <div className="admin-card">
        <p className="admin-status-err">
          {unreachable ? (
            <>API unreachable. Start the backend (e.g. <code>cd backend && npm run dev</code>).</>
          ) : (
            error
          )}
        </p>
      </div>
    );
  }

  const dbStatus = health?.checks?.database ?? 'unknown';
  const redisStatus = health?.checks?.redis ?? 'unknown';

  return (
    <>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem' }}>Dashboard</h1>
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-value">{exams.length}</div>
          <div className="admin-stat-label">Exams</div>
        </div>
        <div className="admin-stat">
          <div className={`admin-stat-value ${dbStatus === 'UP' ? 'admin-status-ok' : 'admin-status-err'}`}>
            {dbStatus}
          </div>
          <div className="admin-stat-label">Database</div>
        </div>
        <div className="admin-stat">
          <div className={`admin-stat-value ${redisStatus === 'UP' ? 'admin-status-ok' : 'admin-status-warn'}`}>
            {redisStatus}
          </div>
          <div className="admin-stat-label">Redis</div>
        </div>
      </div>
      <div className="admin-card">
        <h2>Quick actions</h2>
        <p>Use the sidebar to manage <strong>Exams</strong>, <strong>Rooms</strong>, <strong>Students</strong>, and <strong>Seating</strong>.</p>
      </div>
    </>
  );
};

export default Dashboard;
