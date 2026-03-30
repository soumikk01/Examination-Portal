import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '@exam-portal/ui';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

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
        color: cat === 'ODD' ? '#0f172a' : '#0f172a',
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
  if (m === 'REGULAR') return '#16a34a'; // green
  if (m === 'BACKLOG') return '#ea580c'; // orange
  return 'var(--admin-text-muted)';
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
}

function sortByDateTime(a, b) {
  const at = a?.examDate ? new Date(a.examDate).getTime() : 0;
  const bt = b?.examDate ? new Date(b.examDate).getTime() : 0;
  if (at !== bt) return at - bt;
  return String(a?.examTime || '').localeCompare(String(b?.examTime || ''), undefined, { numeric: true });
}

function groupByDepartment(items) {
  const map = new Map(); // deptCode -> rows
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

function groupByDay(rows) {
  const map = new Map(); // yyyy-mm-dd -> rows
  for (const r of rows || []) {
    const key = r.examDate ? new Date(r.examDate).toISOString().slice(0, 10) : 'UNKNOWN';
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  }
  return [...map.entries()]
    .map(([iso, items]) => ({
      iso,
      items: items.slice().sort(sortByDateTime),
      dateLabel: iso === 'UNKNOWN' ? 'Date unknown' : formatDate(iso),
    }))
    .sort((a, b) => a.iso.localeCompare(b.iso));
}

const PublishExams = () => {
  const [params] = useSearchParams();
  const initialUploadId = params.get('uploadId') || '';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState('');
  const [deleting, setDeleting] = useState('');
  
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'confirm', onConfirm: null });
  const showConfirm = (message, onConfirm) => setModalState({ isOpen: true, title: 'Confirm Action', message, type: 'confirm', onConfirm });

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/exam/list', { params: { status: 'DRAFT' } })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => setError(getUserFriendlyApiError(err, 'Failed to load drafts')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    return groupByUpload(rows).sort((a, b) => {
      // If a specific uploadId is requested, pin it to the top.
      if (initialUploadId) {
        const aIsPinned = a.uploadId === initialUploadId;
        const bIsPinned = b.uploadId === initialUploadId;
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
      }

      // Otherwise (or after pinning), sort by uploadId desc for consistent ordering.
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
    return (
      <div className="admin-card">
        <p>Loading draft schedules…</p>
      </div>
    );
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Upload batch</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                      {g.uploadId}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                    <b>{g.items.length}</b> rows
                    {g.branches.length ? (
                      <>
                        {' '}
                        • branches: <b>{g.branches.join(', ')}</b>
                      </>
                    ) : null}
                    {g.from && g.to ? (
                      <>
                        {' '}
                        • dates: <b>{g.from.toLocaleDateString()}</b> → <b>{g.to.toLocaleDateString()}</b>
                      </>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

              {/* PDF-like preview: big department blocks, small schedule cards */}
              <div style={{ marginTop: '0.9rem' }}>
                <div
                  style={{
                    display: 'grid',
                    // Keep boxes aligned: 2 columns on typical screens, then wrap down.
                    gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))',
                    gap: '0.9rem',
                  }}
                >
                  {groupByDepartment(g.items).map((dept) => {
                    const days = groupByDay(dept.rows);
                    return (
                      <div
                        key={dept.code}
                        style={{
                          border: '1px solid var(--admin-border)',
                          borderRadius: 14,
                          background: 'white',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '0.75rem 0.85rem',
                            background: 'rgba(15,23,42,0.04)',
                            borderBottom: '1px solid var(--admin-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            alignItems: 'baseline',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 850, letterSpacing: '0.2px' }}>{dept.code}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                              {dept.name ? dept.name : 'Department schedule'}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            <b>{dept.rows.length}</b> rows
                          </div>
                        </div>

                        <div style={{ padding: '0.85rem' }}>
                          {days.slice(0, 3).map((day) => (
                            <div key={day.iso} style={{ marginBottom: '0.85rem' }}>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 750,
                                  color: '#0f172a',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: '0.75rem',
                                  alignItems: 'baseline',
                                  marginBottom: '0.45rem',
                                }}
                              >
                                <span>{day.dateLabel}</span>
                                <span style={{ color: 'var(--admin-text-muted)', fontWeight: 650 }}>
                                  {day.items[0]?.examDay || ''}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {day.items.slice(0, 5).map((r) => (
                                  <div
                                    key={r.id}
                                    style={{
                                      border: '1px solid var(--admin-border)',
                                      borderRadius: 12,
                                      padding: '0.65rem 0.75rem',
                                      background: 'rgba(255,255,255,0.9)',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                      <div style={{ fontWeight: 800, color: '#111827' }}>{r.subject}</div>
                                      <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 650 }}>
                                        {r.examTime || '—'}
                                      </div>
                                    </div>
                                    <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                                      Paper: <b>{r.paperCode || '—'}</b>
                                      {' • '}
                                      Mode:{' '}
                                      <span style={{ fontWeight: 700, color: getModeColor(r.mode) }}>
                                        {r.mode || 'REGULAR'}
                                      </span>
                                      {' • '}
                                      Status: <b>{r.status}</b>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {(days.length > 3 || days.some((d) => (d.items?.length || 0) > 5)) && (
                            <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                              Preview truncated. Use “Exam Schedule” page to view full rows.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default PublishExams;

