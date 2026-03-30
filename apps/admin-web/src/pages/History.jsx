import { useState, useEffect, useCallback } from 'react';
import {
  History as HistoryIcon,
  FileText,
  Grid3X3,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Building2,
} from 'lucide-react';
import api from '../services/api';
import { Modal } from '@exam-portal/ui';
import { getUserFriendlyApiError } from '../utils/apiError';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function scheduleTypeLabel(t) {
  const map = { TEST_I: 'Test I', TEST_II: 'Test II', END_SEM_THEORY: 'End Semester', UNKNOWN: 'Schedule' };
  return map[t] || t;
}

function badgeStyle(color) {
  const colors = {
    green: { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' },
    yellow: { background: '#fef9c3', color: '#713f12', border: '1px solid #fde047' },
    blue:   { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
    purple: { background: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd' },
    red:    { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  };
  return {
    ...(colors[color] || colors.blue),
    padding: '2px 10px', borderRadius: '999px',
    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.03em',
    display: 'inline-flex', alignItems: 'center', gap: '4px',
  };
}

// ─────────────────────────────────────────────
// Schedule Card
// ─────────────────────────────────────────────
function ScheduleCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isPublished = item.status === 'PUBLISHED';

  return (
    <div style={{
      background: 'var(--admin-card-bg, #ffffff)',
      border: '1px solid var(--admin-border, #e5e7eb)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Top accent strip */}
      <div style={{ height: '3px', background: isPublished ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#f59e0b,#d97706)' }} />

      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
              background: isPublished ? '#d1fae5' : '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={20} color={isPublished ? '#065f46' : '#92400e'} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-text, #111827)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>
                {item.sourceFile}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted, #6b7280)', marginTop: '2px' }}>
                <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Saved {fmtDateTime(item.createdAt)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={badgeStyle('blue')}><BookOpen size={10} />{scheduleTypeLabel(item.scheduleType)}</span>
            <span style={badgeStyle(item.mode === 'REGULAR' ? 'purple' : 'yellow')}>{item.mode}</span>
            <span style={badgeStyle(isPublished ? 'green' : 'yellow')}>
              {isPublished ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subjects</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text, #111827)' }}>{item.subjectCount}</div>
          </div>
          {item.examDateFrom && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exam Dates</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text, #111827)' }}>
                {fmtDate(item.examDateFrom)} – {fmtDate(item.examDateTo)}
              </div>
            </div>
          )}
          {item.academicYear && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Academic Year</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text, #111827)' }}>{item.academicYear}</div>
            </div>
          )}
          {item.departments.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Departments</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--admin-text, #111827)' }}>
                {expanded ? item.departments.join(', ') : item.departments.slice(0, 4).join(', ') + (item.departments.length > 4 ? ` +${item.departments.length - 4}` : '')}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--admin-border, #f3f4f6)' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted, #6b7280)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Less' : 'Details'}
          </button>
          <button
            onClick={() => onDelete('schedule', item.uploadId, item.sourceFile)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--admin-bg, #f9fafb)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--admin-text-muted, #374151)', lineHeight: 1.7 }}>
            <div><strong>Upload ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{item.uploadId}</span></div>
            <div><strong>Departments:</strong> {item.departments.join(', ') || '—'}</div>
            <div><strong>Status:</strong> {item.status}</div>
            <div><strong>Type:</strong> {scheduleTypeLabel(item.scheduleType)} · {item.mode}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Seating Card
// ─────────────────────────────────────────────
function SeatingCard({ item, onDelete }) {
  return (
    <div style={{
      background: 'var(--admin-card-bg, #ffffff)',
      border: '1px solid var(--admin-border, #e5e7eb)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ height: '3px', background: item.isPublished ? 'linear-gradient(90deg,#6366f1,#4f46e5)' : 'linear-gradient(90deg,#94a3b8,#64748b)' }} />

      <div style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
              background: item.isPublished ? '#ede9fe' : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Grid3X3 size={20} color={item.isPublished ? '#5b21b6' : '#475569'} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-text, #111827)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.examGroup}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted, #6b7280)', marginTop: '2px' }}>
                <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Saved {fmtDateTime(item.createdAt)}
              </div>
            </div>
          </div>

          <span style={badgeStyle(item.isPublished ? 'green' : 'yellow')}>
            {item.isPublished ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
            {item.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rooms</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text, #111827)' }}>{item.rooms.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Students</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text, #111827)' }}>{item.totalStudents}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Room Numbers</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--admin-text, #111827)' }}>
              {item.rooms.slice(0, 6).join(', ')}{item.rooms.length > 6 ? ` +${item.rooms.length - 6}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--admin-border, #f3f4f6)' }}>
          <button
            onClick={() => onDelete('seating', item.examGroup, item.examGroup)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main History Page
// ─────────────────────────────────────────────
const History = () => {
  const [schedules, setSchedules] = useState([]);
  const [seating, setSeating] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [modal, setModal] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/history');
      setSchedules(data.schedules || []);
      setSeating(data.seating || []);
    } catch (err) {
      setError(getUserFriendlyApiError(err, 'Failed to load history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => setModal((m) => ({ ...m, isOpen: false }));

  const handleDelete = (kind, id, label) => {
    const isSchedule = kind === 'schedule';
    setModal({
      isOpen: true,
      type: 'confirm',
      title: `Delete ${isSchedule ? 'Schedule' : 'Seating'} Record`,
      message: `Are you sure you want to permanently delete "${label}"? This action cannot be undone.`,
      onConfirm: async () => {
        const url = isSchedule ? `/history/schedule/${encodeURIComponent(id)}` : `/history/seating/${encodeURIComponent(id)}`;
        await api.delete(url);
        await load();
        closeModal();
      },
    });
  };

  const tabs = [
    { key: 'all', label: `All (${schedules.length + seating.length})` },
    { key: 'schedule', label: `Exam Schedules (${schedules.length})` },
    { key: 'seating', label: `Seating Allocations (${seating.length})` },
  ];

  const tabStyle = (key) => ({
    padding: '0.5rem 1.1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'all 0.15s',
    background: activeTab === key ? 'var(--admin-primary, #3b82f6)' : 'var(--admin-card-bg, #f3f4f6)',
    color: activeTab === key ? '#ffffff' : 'var(--admin-text-muted, #374151)',
    boxShadow: activeTab === key ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
  });

  const showSchedules = activeTab === 'all' || activeTab === 'schedule';
  const showSeating   = activeTab === 'all' || activeTab === 'seating';
  const isEmpty = schedules.length === 0 && seating.length === 0;

  return (
    <div>
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            <HistoryIcon size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--admin-text, #111827)' }}>History</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted, #6b7280)' }}>All saved & published exam schedules and seating allocations</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--admin-border, #e5e7eb)', background: 'var(--admin-card-bg, #fff)', color: 'var(--admin-text, #374151)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.key} style={tabStyle(t.key)} onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem', background: '#fff' }}>
              <div style={{ height: '12px', borderRadius: '4px', background: '#e5e7eb', marginBottom: '10px', animationName: 'pulse', animationDuration: '1.5s', animationIterationCount: 'infinite', width: '60%' }} />
              <div style={{ height: '10px', borderRadius: '4px', background: '#f3f4f6', width: '40%' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--admin-text-muted, #6b7280)' }}>
          <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 600, color: 'var(--admin-text, #374151)', marginBottom: '0.5rem' }}>No History Yet</h3>
          <p style={{ fontSize: '0.9rem' }}>Once you save or publish exam schedules or seating allocations,<br />they will appear here.</p>
        </div>
      )}

      {/* Exam Schedules */}
      {!loading && showSchedules && schedules.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          {activeTab === 'all' && (
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text, #374151)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#3b82f6" /> Exam Schedules
            </h2>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
            {schedules.map((item) => (
              <ScheduleCard key={item.uploadId} item={item} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Seating Allocations */}
      {!loading && showSeating && seating.length > 0 && (
        <div>
          {activeTab === 'all' && (
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text, #374151)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Grid3X3 size={16} color="#6366f1" /> Seating Allocations
            </h2>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
            {seating.map((item) => (
              <SeatingCard key={item.examGroup} item={item} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default History;
