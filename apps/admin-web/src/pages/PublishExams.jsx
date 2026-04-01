import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '@exam-portal/ui';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

// ─── Style constants ─────────────────────────────────────────────────────────
const peThStyle = {
  padding: '0.45rem 0.7rem',
  textAlign: 'center',
  fontWeight: 700,
  color: 'var(--admin-text-muted)',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--admin-border)',
};
const peTdStyle = { padding: '0.4rem 0.7rem', textAlign: 'center' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function groupByUpload(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const key = r.uploadId || 'UNKNOWN';
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  }
  return [...map.entries()].map(([uploadId, items]) => {
    const branches = [...new Set(items.map((x) => x.branch).filter(Boolean))].sort();
    const dates = items.map((x) => (x.examDate ? new Date(x.examDate).getTime() : null)).filter(Boolean);
    const from = dates.length ? new Date(Math.min(...dates)) : null;
    const to = dates.length ? new Date(Math.max(...dates)) : null;
    const academicYear = items.find((x) => x.academicYear)?.academicYear || null;
    const semester = items.find((x) => x.semester)?.semester || null;
    return { uploadId, items, branches, from, to, academicYear, semester };
  });
}

function SemesterCategoryBadge({ semester, academicYear }) {
  const semNum = Number(semester);
  if (!Number.isFinite(semNum) || semNum <= 0) return null;
  const cat = semNum % 2 === 1 ? 'ODD' : 'EVEN';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.28rem 0.6rem',
        borderRadius: 999,
        border: '1px solid var(--admin-border)',
        fontSize: '0.85rem',
        fontWeight: 750,
        color: '#0f172a',
        background: cat === 'ODD' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
        whiteSpace: 'nowrap',
      }}
      title={`Semester ${semNum}`}
    >
      <span>{cat} Semester</span>
      {academicYear ? <span style={{ color: 'var(--admin-text-muted)', fontWeight: 700 }}>({academicYear})</span> : null}
    </span>
  );
}

function getModeColor(mode) {
  const m = String(mode || '').toUpperCase();
  if (m === 'REGULAR') return '#16a34a';
  if (m === 'BACKLOG') return '#ea580c';
  return 'var(--admin-text-muted)';
}

function formatDate(d) {
  try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
}

function sortByDateTime(a, b) {
  const at = a?.examDate ? new Date(a.examDate).getTime() : 0;
  const bt = b?.examDate ? new Date(b.examDate).getTime() : 0;
  if (at !== bt) return at - bt;
  return String(a?.examTime || '').localeCompare(String(b?.examTime || ''), undefined, { numeric: true });
}

function groupByDepartment(items) {
  const map = new Map();
  for (const r of items || []) {
    const code = (r.departmentCode || r.branch || 'UNKNOWN').toString().toUpperCase();
    const arr = map.get(code) || [];
    arr.push(r);
    map.set(code, arr);
  }
  return [...map.entries()]
    .map(([code, rows]) => ({
      code,
      name: rows.find((x) => x.department)?.department || null,
      rows: rows.slice().sort(sortByDateTime),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

// ─── Main component ───────────────────────────────────────────────────────────
const PublishExams = () => {
  const [params] = useSearchParams();
  const initialUploadId = params.get('uploadId') || '';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState('');
  const [deleting, setDeleting] = useState('');

  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'confirm', onConfirm: null });
  const showConfirm = (message, onConfirm) =>
    setModalState({ isOpen: true, title: 'Confirm Action', message, type: 'confirm', onConfirm });

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/exam/list', { params: { status: 'DRAFT' } })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => setError(getUserFriendlyApiError(err, 'Failed to load drafts')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const groups = useMemo(() => {
    return groupByUpload(rows).sort((a, b) => {
      if (initialUploadId) {
        if (a.uploadId === initialUploadId) return -1;
        if (b.uploadId === initialUploadId) return 1;
      }
      if (a.uploadId < b.uploadId) return 1;
      if (a.uploadId > b.uploadId) return -1;
      return 0;
    });
  }, [rows, initialUploadId]);

  const publish = async (uploadId) => {
    setPublishing(uploadId);
    setError('');
    try {
      await api.post('/exam/publish', { uploadId });
      load();
    } catch (err) {
      setError(getUserFriendlyApiError(err, 'Failed to publish schedule'));
    } finally {
      setPublishing('');
    }
  };

  const del = (uploadId) => {
    showConfirm('Delete this draft batch? This cannot be undone.', async () => {
      setDeleting(uploadId);
      setError('');
      try {
        await api.delete(`/exam/batch/${encodeURIComponent(uploadId)}`);
        load();
      } catch (err) {
        setError(getUserFriendlyApiError(err, 'Failed to delete batch'));
      } finally {
        setDeleting('');
      }
    });
  };

  if (loading) {
    return <div className="admin-card"><p>Loading draft schedules…</p></div>;
  }

  return (
    <div className="admin-card">
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.35rem' }}>Publish Exams</h1>
      <p style={{ marginTop: 0, color: 'var(--admin-text-muted)' }}>
        Draft schedules are created when you upload a PDF. Publish a batch to make it visible to students (branch-wise).
      </p>

      {error && <p className="admin-status-err">{error}</p>}

      {groups.length === 0 ? (
        <p>No draft schedules found. Upload a PDF first.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {groups.map((g) => (
            <div
              key={g.uploadId}
              style={{
                border: '1px solid var(--admin-border)',
                borderRadius: 12,
                padding: '0.9rem',
                background: g.uploadId === initialUploadId ? 'rgba(37,99,235,0.06)' : 'transparent',
              }}
            >
              {/* Batch header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Upload batch</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace' }}>{g.uploadId}</span>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                    <b>{g.items.length}</b> rows
                    {g.branches.length ? <> • branches: <b>{g.branches.join(', ')}</b></> : null}
                    {g.from && g.to ? (
                      <> • dates: <b>{g.from.toLocaleDateString()}</b> → <b>{g.to.toLocaleDateString()}</b></>
                    ) : null}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <SemesterCategoryBadge semester={g.semester} academicYear={g.academicYear} />
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={publishing === g.uploadId}
                    onClick={() => publish(g.uploadId)}
                    style={{ background: 'var(--admin-primary, #2563eb)', color: 'white', border: '1px solid transparent' }}
                  >
                    {publishing === g.uploadId ? 'Publishing…' : 'Publish schedule'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={publishing === g.uploadId || deleting === g.uploadId}
                    onClick={() => del(g.uploadId)}
                    style={{ background: '#ef4444', color: 'white', border: '1px solid transparent' }}
                  >
                    {deleting === g.uploadId ? 'Deleting…' : 'Delete batch'}
                  </button>
                </div>
              </div>

              {/* Department tables — full data, properly structured */}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupByDepartment(g.items).map((dept) => (
                  <div
                    key={dept.code}
                    style={{ border: '1px solid var(--admin-border)', borderRadius: 10, overflow: 'hidden' }}
                  >
                    {/* Department header */}
                    <div
                      style={{
                        padding: '0.55rem 0.85rem',
                        background: 'rgba(37,99,235,0.07)',
                        borderBottom: '1px solid var(--admin-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>
                        {dept.code}
                        {dept.name
                          ? <span style={{ fontWeight: 500, color: 'var(--admin-text-muted)', marginLeft: '0.5rem' }}>({dept.name})</span>
                          : null}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                        <b>{dept.rows.length}</b> rows
                      </div>
                    </div>

                    {/* Schedule table — all rows, date-sorted */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                            <th style={peThStyle}>Date</th>
                            <th style={peThStyle}>Day</th>
                            <th style={peThStyle}>Time</th>
                            <th style={{ ...peThStyle, textAlign: 'left' }}>Subject</th>
                            <th style={peThStyle}>Paper Code</th>
                            <th style={peThStyle}>Mode</th>
                            <th style={peThStyle}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dept.rows.slice().sort(sortByDateTime).map((r, idx) => (
                            <tr
                              key={r.id || idx}
                              style={{
                                borderBottom: '1px solid var(--admin-border)',
                                background: idx % 2 === 0 ? 'white' : 'rgba(0,0,0,0.018)',
                              }}
                            >
                              <td style={{ ...peTdStyle, whiteSpace: 'nowrap' }}>
                                {r.examDate ? formatDate(r.examDate) : '—'}
                              </td>
                              <td style={{ ...peTdStyle, whiteSpace: 'nowrap', color: 'var(--admin-text-muted)' }}>
                                {r.examDay || '—'}
                              </td>
                              <td style={{ ...peTdStyle, whiteSpace: 'nowrap' }}>
                                {r.examTime || '—'}
                              </td>
                              <td style={{ ...peTdStyle, textAlign: 'left', fontWeight: 600 }}>
                                {r.subject || '—'}
                              </td>
                              <td style={{ ...peTdStyle, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {r.paperCode || '—'}
                              </td>
                              <td style={{ ...peTdStyle, fontWeight: 700, color: getModeColor(r.mode) }}>
                                {r.mode || 'REGULAR'}
                              </td>
                              <td style={peTdStyle}>{r.status || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default PublishExams;
