import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const ExamSchedule = () => {
  const [params] = useSearchParams();
  const initialUploadId = params.get('uploadId') || '';

  const [status, setStatus] = useState(initialUploadId ? 'DRAFT' : 'PUBLISHED');
  const [branch, setBranch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/exam/list', {
        params: {
          status,
          branch: branch || undefined,
          uploadId: initialUploadId || undefined,
        },
      })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => setError(getUserFriendlyApiError(err, 'Failed to load schedule')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, branch, initialUploadId]);

  const branches = useMemo(() => {
    return [...new Set(rows.map((r) => r.branch).filter(Boolean))].sort();
  }, [rows]);

  if (loading) {
    return (
      <div className="admin-card">
        <p>Loading schedule…</p>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.35rem' }}>Exam Schedule</h1>
      <p style={{ marginTop: 0, color: 'var(--admin-text-muted)' }}>
        View extracted schedules stored in the database. Students only see <b>published</b> rows.
      </p>

      {error && <p className="admin-status-err">{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8, minWidth: 180 }}
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>Branch</span>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8, minWidth: 240 }}
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        {initialUploadId && (
          <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
            Filtered by uploadId: <b>{initialUploadId}</b>
          </div>
        )}

        <button type="button" className="admin-btn" onClick={load} style={{ alignSelf: 'flex-end' }}>
          Refresh
        </button>
      </div>

      {rows.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>No rows found.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Branch</th>
                <th>Paper code</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Upload</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.status}</td>
                  <td>{r.branch}</td>
                  <td>{r.paperCode || '—'}</td>
                  <td>{r.subject}</td>
                  <td>{r.examDate ? new Date(r.examDate).toLocaleDateString() : '—'}</td>
                  <td>{r.examTime || '—'}</td>
                  <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                    {r.uploadId}
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

export default ExamSchedule;

