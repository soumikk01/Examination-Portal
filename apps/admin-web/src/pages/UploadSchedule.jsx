import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

function groupBySemesterBlock(rows) {
  const map = new Map(); // key -> rows
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
    .map(([code, rows]) => ({
      code,
      name: rows.find((x) => x.department)?.department || null,
      rows,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

function groupByDate(rows) {
  const map = new Map(); // iso -> rows
  for (const r of rows || []) {
    const key = r.examDateIso || 'UNKNOWN';
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  }
  const sortKey = (iso) => (iso === 'UNKNOWN' ? '9999-99-99' : iso);
  return [...map.entries()]
    .map(([iso, items]) => ({
      iso,
      items: items.slice().sort((a, b) => String(a.examTime || '').localeCompare(String(b.examTime || ''), undefined, { numeric: true })),
    }))
    .sort((a, b) => sortKey(a.iso).localeCompare(sortKey(b.iso)));
}

const ScheduleTypeBadge = ({ meta }) => {
  const type = meta?.scheduleType || 'UNKNOWN';
  const label =
    type === 'TEST_I'
      ? 'TEST - I'
      : type === 'TEST_II'
        ? 'TEST - II'
        : type === 'END_SEM_THEORY'
          ? 'SEM END (THEORY)'
          : 'UNKNOWN';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.5rem',
        borderRadius: 999,
        border: '1px solid var(--admin-border)',
        fontSize: '0.8rem',
        color: 'var(--admin-text-muted)',
        background: 'rgba(0,0,0,0.02)',
      }}
    >
      {label}
    </span>
  );
};

const ParsedPreview = ({ parsed }) => (
  <div style={{ marginTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
    {groupBySemesterBlock(parsed.preview || []).map((blk) => (
      <div
        key={blk.key}
        style={{
          border: '1px solid var(--admin-border)',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'white',
        }}
      >
        <div
          style={{
            padding: '0.75rem 0.9rem',
            background: 'rgba(15,23,42,0.04)',
            borderBottom: '1px solid var(--admin-border)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'baseline',
          }}
        >
          <div style={{ fontWeight: 850 }}>
            {blk.level} - Sem <b>{blk.semester}</b>{' '}
            <span style={{ color: 'var(--admin-text-muted)', fontWeight: 700 }}>
              (Batch {blk.batch})
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
            <b>{blk.items.length}</b> rows • depts: <b>{blk.deps.join(', ') || '—'}</b>
          </div>
        </div>

        <div
          style={{
            padding: '0.9rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {groupByDept(blk.items).map((dept) => (
            <div
              key={dept.code}
              style={{
                border: '1px solid var(--admin-border)',
                borderRadius: 14,
                overflow: 'hidden',
                background: 'white',
              }}
            >
              <div
                style={{
                  padding: '0.7rem 0.85rem',
                  background: 'rgba(37,99,235,0.05)',
                  borderBottom: '1px solid var(--admin-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  alignItems: 'baseline',
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{dept.code}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                    {dept.name || 'Department'}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                  <b>{dept.rows.length}</b> rows
                </div>
              </div>

              <div style={{ padding: '0.85rem', display: 'grid', gap: '0.75rem' }}>
                {groupByDate(dept.rows).slice(0, 3).map((d) => (
                  <div key={d.iso}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline' }}>
                      <div style={{ fontWeight: 800 }}>{d.iso === 'UNKNOWN' ? 'Date' : d.iso}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>
                        {d.items[0]?.examDay || ''}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.45rem', display: 'grid', gap: '0.5rem' }}>
                      {d.items.slice(0, 6).map((r, idx) => (
                        <div
                          key={`${r.paperCode || 'x'}-${r.subject}-${idx}`}
                          style={{
                            border: '1px solid var(--admin-border)',
                            borderRadius: 12,
                            padding: '0.6rem 0.7rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 800 }}>{r.subject}</div>
                            <div style={{ color: 'var(--admin-text-muted)', fontWeight: 700 }}>{r.examTime || '—'}</div>
                          </div>
                          <div style={{ marginTop: '0.2rem', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                            Paper code: <b>{r.paperCode || '—'}</b>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(dept.rows.length > 18 || groupByDate(dept.rows).length > 3) && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                    Preview truncated for this department.
                  </div>
                )}
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

const DropzoneCard = ({ title, mode, onParsed, onSaved }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(null);
  const [saved, setSaved] = useState(null); // { uploadId, count }
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
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
        onParsed?.(data);
      } catch (err) {
        setError(getUserFriendlyApiError(err, 'Failed to parse schedule PDF'));
      } finally {
        setUploading(false);
      }
    },
    [onParsed],
  );

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
    } catch (err) {
      setError(getUserFriendlyApiError(err, 'Failed to publish schedule'));
    } finally {
      setPublishing(false);
    }
  };

  const del = async () => {
    if (saved?.uploadId) {
      setDeleting(true);
      setError('');
      try {
        await api.delete(`/exam/batch/${encodeURIComponent(saved.uploadId)}`);
        setSaved(null);
        setParsed(null);
      } catch (err) {
        setError(getUserFriendlyApiError(err, 'Failed to delete batch'));
      } finally {
        setDeleting(false);
      }
      return;
    }
    setParsed(null);
    setError('');
  };

  return (
    <div
      style={{
        border: '1px solid var(--admin-border)',
        borderRadius: 14,
        padding: '1rem',
        background: 'white',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
            Mode: <b>{mode}</b>
          </div>
        </div>
        {parsed?.meta && <ScheduleTypeBadge meta={parsed.meta} />}
      </div>

      {error && <p className="admin-status-err" style={{ marginTop: '0.75rem' }}>{error}</p>}

      <div
        {...getRootProps()}
        style={{
          marginTop: '0.75rem',
          border: '2px dashed var(--admin-border)',
          borderRadius: 12,
          padding: '1.5rem 1.25rem',
          textAlign: 'center',
          background: isDragActive ? 'rgba(37,99,235,0.06)' : 'transparent',
          cursor: uploading ? 'not-allowed' : 'pointer',
          userSelect: 'none',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: '1rem', fontWeight: 650 }}>{helper}</div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
          Only PDF files. Max 15MB.
        </div>
      </div>

      {acceptedFiles?.[0] && !parsed && !error && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
          Selected: <b>{acceptedFiles[0].name}</b>
        </p>
      )}

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

          {/* PDF-structure preview: Semester block → Department → Date rows */}
          <ParsedPreview parsed={parsed} />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
            <button type="button" className="admin-btn" onClick={del} disabled={deleting}>
              {deleting ? 'Deleting…' : saved?.uploadId ? 'Delete batch' : 'Delete'}
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={save}
              disabled={saving || !!saved?.uploadId}
              style={{ background: 'var(--admin-primary, #2563eb)', color: 'white' }}
            >
              {saved?.uploadId ? 'Saved' : saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={publish}
              disabled={!saved?.uploadId || publishing}
            >
              {publishing ? 'Publishing…' : 'Publish schedule'}
            </button>
            {saved?.uploadId && (
              <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                uploadId: <b>{saved.uploadId}</b>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const UploadSchedule = () => {
  const navigate = useNavigate();
  const [lastUploadId, setLastUploadId] = useState('');

  return (
    <div className="admin-card">
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.35rem' }}>Upload Exam Schedule</h1>
      <p style={{ marginTop: 0, color: 'var(--admin-text-muted)' }}>
        Upload the exam schedule PDF(s). First it will be <b>analyzed</b>, then you can <b>Delete</b> or <b>Save</b>.
        After saving, click <b>Publish schedule</b> to make it visible to students.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <DropzoneCard
          title="Regular schedule PDF"
          mode="REGULAR"
          onParsed={() => setLastUploadId('')}
          onSaved={(id) => setLastUploadId(id)}
        />
        <DropzoneCard
          title="Backlog schedule PDF"
          mode="BACKLOG"
          onParsed={() => setLastUploadId('')}
          onSaved={(id) => setLastUploadId(id)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button type="button" className="admin-btn" onClick={() => navigate('/publish-exams')}>
          Go to Publish Exams
        </button>
        <button
          type="button"
          className="admin-btn"
          onClick={() => navigate(lastUploadId ? `/exam-schedule?uploadId=${encodeURIComponent(lastUploadId)}` : '/exam-schedule')}
          style={{ background: 'transparent', border: '1px solid var(--admin-border)' }}
        >
          View schedules
        </button>
      </div>
    </div>
  );
};

export default UploadSchedule;
