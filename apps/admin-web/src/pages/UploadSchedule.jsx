import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

// ─── sessionStorage helpers (keyed by card mode: "REGULAR" | "BACKLOG") ───────
function storageKey(mode) { return `upload_schedule_parsed_${mode}`; }

function loadPersisted(mode) {
  try {
    const raw = sessionStorage.getItem(storageKey(mode));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function savePersisted(mode, data) {
  try { sessionStorage.setItem(storageKey(mode), JSON.stringify(data)); } catch { /* noop */ }
}

function clearPersisted(mode) {
  try { sessionStorage.removeItem(storageKey(mode)); } catch { /* noop */ }
}

// ─── Group helpers ────────────────────────────────────────────────────────────
function groupBySemesterBlock(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const key = `${r.level || '—'}|${r.semester || '—'}|${r.batch || '—'}`;
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  }
  return [...map.entries()].map(([key, items]) => {
    const [level, semester, batch] = key.split('|');
    const deps = [...new Set(items.map((x) => x.departmentCode).filter(Boolean))].sort();
    return { key, level, semester, batch, items, deps };
  });
}

function groupByDept(items) {
  const map = new Map();
  for (const r of items || []) {
    const code = (r.departmentCode || 'UNKNOWN').toString().toUpperCase();
    const arr = map.get(code) || [];
    arr.push(r);
    map.set(code, arr);
  }
  return [...map.entries()]
    .map(([code, rows]) => ({ code, name: rows.find((x) => x.department)?.department || null, rows }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

// ─── Style constants ──────────────────────────────────────────────────────────
const thStyle = {
  padding: '0.45rem 0.7rem',
  textAlign: 'center',
  fontWeight: 700,
  color: 'var(--admin-text-muted)',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--admin-border)',
};
const tdStyle = { padding: '0.4rem 0.7rem', textAlign: 'center' };

// ─── Schedule type badge ──────────────────────────────────────────────────────
const ScheduleTypeBadge = ({ meta }) => {
  const type = meta?.scheduleType || 'UNKNOWN';
  const label =
    type === 'TEST_I' ? 'TEST - I'
    : type === 'TEST_II' ? 'TEST - II'
    : type === 'END_SEM_THEORY' ? 'SEM END (THEORY)'
    : 'UNKNOWN';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem',
      borderRadius: 999, border: '1px solid var(--admin-border)', fontSize: '0.8rem',
      color: 'var(--admin-text-muted)', background: 'rgba(0,0,0,0.02)',
    }}>
      {label}
    </span>
  );
};

// ─── Parsed preview table ─────────────────────────────────────────────────────
const ParsedPreview = ({ parsed }) => (
  <div style={{ marginTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
    {groupBySemesterBlock(parsed.preview || []).map((blk) => (
      <div key={blk.key} style={{ border: '1px solid var(--admin-border)', borderRadius: 14, overflow: 'hidden', background: 'white' }}>
        {/* Block header */}
        <div style={{
          padding: '0.75rem 0.9rem', background: 'rgba(15,23,42,0.05)',
          borderBottom: '1px solid var(--admin-border)', display: 'flex',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center',
        }}>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>
            {blk.level} — Semester <b>{blk.semester}</b>{' '}
            <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>(Batch {blk.batch})</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
            <b>{blk.items.length}</b> entries &nbsp;•&nbsp; departments: <b>{blk.deps.join(', ') || '—'}</b>
          </div>
        </div>

        {/* Department tables */}
        <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupByDept(blk.items).map((dept) => (
            <div key={dept.code} style={{ border: '1px solid var(--admin-border)', borderRadius: 10, overflow: 'hidden' }}>
              {/* Department header */}
              <div style={{
                padding: '0.55rem 0.8rem', background: 'rgba(37,99,235,0.07)',
                borderBottom: '1px solid var(--admin-border)', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ fontWeight: 800 }}>
                  {dept.code}
                  {dept.name ? <span style={{ fontWeight: 500, color: 'var(--admin-text-muted)', marginLeft: '0.5rem' }}>({dept.name})</span> : null}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}><b>{dept.rows.length}</b> rows</div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Day</th>
                      <th style={thStyle}>Time</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Subject</th>
                      <th style={thStyle}>Paper Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dept.rows
                      .slice()
                      .sort((a, b) =>
                        String(a.examDateIso || '').localeCompare(String(b.examDateIso || '')) ||
                        String(a.examTime || '').localeCompare(String(b.examTime || ''), undefined, { numeric: true })
                      )
                      .map((r, idx) => (
                        <tr key={`${r.paperCode || 'x'}-${r.subject}-${idx}`}
                          style={{ borderBottom: '1px solid var(--admin-border)', background: idx % 2 === 0 ? 'white' : 'rgba(0,0,0,0.018)' }}>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{r.examDateIso || r.examDate || '—'}</td>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--admin-text-muted)' }}>{r.examDay || '—'}</td>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{r.examTime || '—'}</td>
                          <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>{r.subject || '—'}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.paperCode || '—'}</td>
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

    {(parsed.preview || []).length < (parsed.count || 0) && (
      <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
        Showing preview only ({(parsed.preview || []).length} of {parsed.count}). Save to store full data in DB.
      </div>
    )}
  </div>
);

// ─── Dropzone card ────────────────────────────────────────────────────────────
const DropzoneCard = ({ title, mode, onSaved }) => {
  // Restore parsed + saved from sessionStorage on mount so navigation doesn't wipe them
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(() => loadPersisted(mode));
  const [saved, setSaved] = useState(null);   // { uploadId, count } — cleared after save
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Keep sessionStorage in sync whenever parsed changes
  useEffect(() => {
    if (parsed) savePersisted(mode, parsed);
    else clearPersisted(mode);
  }, [parsed, mode]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles?.[0];
    if (!file) return;
    setError('');
    setParsed(null);
    setSaved(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const data = await api.post('/exam/parse-pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setParsed({ ...data, sourceFile: file.name });
    } catch (err) {
      setError(getUserFriendlyApiError(err, 'Failed to parse schedule PDF'));
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading || saving || publishing || deleting,
  });

  const helper = useMemo(() => {
    if (uploading) return 'Reading and analyzing PDF…';
    if (isDragActive) return 'Drop the PDF here…';
    return 'Drag & drop a PDF here, or click to select';
  }, [isDragActive, uploading]);

  const save = async () => {
    if (!parsed?.preview?.length) return;
    setSaving(true);
    setError('');
    try {
      const data = await api.post('/exam/save-draft', {
        meta: parsed.meta,
        rows: parsed.preview,
        mode,
        sourceFile: parsed.sourceFile,
      });
      setSaved(data);
      onSaved?.(data?.uploadId || '');
      // Clear from the card and sessionStorage — data is now in DB / PublishExams
      clearPersisted(mode);
      setParsed(null);
    } catch (err) {
      setError(getUserFriendlyApiError(err, 'Failed to save draft schedule'));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!saved?.uploadId) return;
    setPublishing(true);
    setError('');
    try {
      await api.post('/exam/publish', { uploadId: saved.uploadId });
      setSaved(null);
    } catch (err) {
      setError(getUserFriendlyApiError(err, 'Failed to publish schedule'));
    } finally {
      setPublishing(false);
    }
  };

  const del = async () => {
    if (saved?.uploadId) {
      // Saved to DB — delete from DB
      setDeleting(true);
      setError('');
      try {
        await api.delete(`/exam/batch/${encodeURIComponent(saved.uploadId)}`);
        setSaved(null);
        setParsed(null);
        clearPersisted(mode);
      } catch (err) {
        setError(getUserFriendlyApiError(err, 'Failed to delete batch'));
      } finally {
        setDeleting(false);
      }
    } else {
      // Not yet saved — just discard the local parsed preview
      setParsed(null);
      clearPersisted(mode);
      setError('');
    }
  };

  return (
    <div style={{ border: '1px solid var(--admin-border)', borderRadius: 14, padding: '1rem', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
            Mode: <b style={{ color: mode === 'REGULAR' ? '#16a34a' : mode === 'BACKLOG' ? '#ea580c' : 'inherit' }}>{mode}</b>
          </div>
        </div>
        {parsed?.meta && <ScheduleTypeBadge meta={parsed.meta} />}
      </div>

      {error && <p className="admin-status-err" style={{ marginTop: '0.75rem' }}>{error}</p>}

      {/* Drop zone — only visible when no data yet parsed */}
      {!parsed && (
        <div
          {...getRootProps()}
          style={{
            marginTop: '0.75rem', border: '2px dashed var(--admin-border)', borderRadius: 12,
            padding: '1.5rem 1.25rem', textAlign: 'center',
            background: isDragActive ? 'rgba(37,99,235,0.06)' : 'transparent',
            cursor: uploading ? 'not-allowed' : 'pointer', userSelect: 'none',
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: '1rem', fontWeight: 650 }}>{helper}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
            Only PDF files. Max 15MB.
          </div>
        </div>
      )}

      {acceptedFiles?.[0] && !parsed && !error && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
          Selected: <b>{acceptedFiles[0].name}</b>
        </p>
      )}

      {/* Saved-success banner */}
      {saved?.uploadId && !parsed && (
        <div style={{
          marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 10,
          background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
          display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#15803d' }}>
            ✓ Saved to database. Go to <b>Publish Exams</b> to publish it.
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="admin-btn"
              onClick={publish} disabled={publishing}
              style={{ background: 'var(--admin-primary, #2563eb)', color: 'white' }}>
              {publishing ? 'Publishing…' : 'Publish now'}
            </button>
            <button type="button" className="admin-btn"
              onClick={del} disabled={deleting}
              style={{ background: '#ef4444', color: 'white' }}>
              {deleting ? 'Deleting…' : 'Delete batch'}
            </button>
          </div>
        </div>
      )}

      {/* Parsed preview + action buttons */}
      {parsed && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="admin-status-ok" style={{ margin: 0 }}>
              Parsed <b>{parsed.count}</b> rows.
            </div>
            {(parsed?.meta?.title || parsed?.meta?.academicYear || parsed?.meta?.regulation) && (
              <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                {parsed?.meta?.title ? <b>{parsed.meta.title}</b> : null}
                {parsed?.meta?.academicYear ? <> • {parsed.meta.academicYear}</> : null}
                {parsed?.meta?.regulation ? <> • <b>{parsed.meta.regulation}</b></> : null}
              </div>
            )}
          </div>

          <ParsedPreview parsed={parsed} />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
            <button type="button" className="admin-btn" onClick={del} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Discard'}
            </button>
            <button type="button" className="admin-btn" onClick={save} disabled={saving}
              style={{ background: 'var(--admin-primary, #2563eb)', color: 'white' }}>
              {saving ? 'Saving…' : 'Save to database'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const UploadSchedule = () => {
  const navigate = useNavigate();
  const [lastUploadId, setLastUploadId] = useState('');

  return (
    <div className="admin-card">
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.35rem' }}>Upload Exam Schedule</h1>
      <p style={{ marginTop: 0, color: 'var(--admin-text-muted)' }}>
        Upload the exam schedule PDF(s). The data will be extracted and shown below.
        Click <b>Save to database</b> to store it as a draft, then go to <b>Publish Exams</b> to make it visible to students.
        Navigating away will <b>not</b> lose your parsed data.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <DropzoneCard title="Regular schedule PDF" mode="REGULAR" onSaved={(id) => setLastUploadId(id)} />
        <DropzoneCard title="Backlog schedule PDF"  mode="BACKLOG" onSaved={(id) => setLastUploadId(id)} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button type="button" className="admin-btn" onClick={() => navigate('/publish-exams')}>
          Go to Publish Exams
        </button>
        <button type="button" className="admin-btn"
          onClick={() => navigate(lastUploadId ? `/exam-schedule?uploadId=${encodeURIComponent(lastUploadId)}` : '/exam-schedule')}
          style={{ background: 'transparent', border: '1px solid var(--admin-border)' }}>
          View schedules
        </button>
      </div>
    </div>
  );
};

export default UploadSchedule;
