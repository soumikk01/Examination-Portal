import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from '../services/api';
import { ArrowLeft, User, CalendarDays, Pin } from "lucide-react";
import { PageLayout, Button, NoticeModal, Skeleton } from '../components';

/* ─── Skeleton Grid (shown during loading) ─── */
const RoomSkeletonGrid = () => {
  const skeletonCols = [0, 1, 2, 3, 4, 5, 6, 7]; // 8 cols matching real layout

  return (
    <div style={{ position: 'relative', zIndex: 10, width: '100%', marginTop: '10px' }}>

      {/* Teacher Area — explicit z-index so it appears above decorative circles */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginBottom: '28px', gap: '8px',
        position: 'relative', zIndex: 10,
      }}>
        <span style={styles.teacherLabel}>Front of Room (Teacher&apos;s Desk)</span>
        <div style={{
          width: '160px', height: '40px', borderRadius: '8px',
          border: '2px solid #c7d2fe', background: '#ffffff',
          boxShadow: '0 2px 8px rgba(99,102,241,0.1)',
        }}></div>
      </div>

      {/* Scrollable Grid — centered on desktop, scrollable on mobile */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '20px' }} className="no-scrollbar">
        <div style={{ minWidth: 'max-content', padding: '0 20px 10px', pointerEvents: 'none' }}>
          <div style={styles.grid}>

            {/* Header Row */}
            <div style={{ ...styles.deskRow, marginBottom: '8px', alignItems: 'center' }}>
              <div style={{ ...styles.desk(false, true), border: '1.5px dashed #e2e8f0' }}></div>
              {skeletonCols.slice(1, -1).map((_, i) => (
                <div key={i} style={{ width: DESK_W, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '2.2rem', height: '0.8rem', borderRadius: '4px', background: '#cbd5e1' }}></div>
                </div>
              ))}
              <div style={{ ...styles.desk(false, false), background: '#94a3b8', border: 'none' }}></div>
            </div>

            {/* Desk Rows */}
            {Array.from({ length: 6 }).map((_, r) => (
              <div key={r} style={styles.deskRow}>
                {skeletonCols.map((_, cIdx) => (
                  <div key={cIdx} style={{
                    ...styles.desk(false, false),
                    display: 'flex', flexDirection: 'column', gap: '6px',
                    background: '#ffffff', border: '1.5px solid #f1f5f9',
                  }}>
                    <Skeleton width="72%" height="0.5rem" />
                    <Skeleton width="45%" height="0.45rem" />
                  </div>
                ))}
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
};

const ROWS = 8;
const DESK_W = '90px';
const DESK_H = '58px';
const DESK_GAP = '10px';

const styles = {
  scene: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  teacherArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', gap: '6px' },
  teacherLabel: { fontSize: '9px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#64748b' },
  teacherText: { fontSize: '11px', fontWeight: 700, color: '#1e293b', zIndex: 1 },

  grid: { display: 'flex', flexDirection: 'column', gap: DESK_GAP },
  deskRow: { display: 'flex', gap: DESK_GAP },
  desk: (isMySeat, isExtra) => ({
    width: DESK_W, height: DESK_H,
    background: isMySeat ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#ffffff',
    border: isMySeat ? '2px solid #1e40af' : (isExtra ? '1.5px dashed #cbd5e1' : '1.5px solid #e2e8f0'),
    borderRadius: '8px', position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default',
    boxShadow: isMySeat ? '0 6px 16px rgba(59,130,246,0.4)' : '0 1px 3px rgba(0,0,0,0.06)',
    flexShrink: 0,
  }),
  avatarContainer: {
    width: '20px', height: '20px', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '2px',
  },
  seatInfo: (isMySeat) => ({
    fontSize: '8px', textAlign: 'center',
    color: isMySeat ? '#ffffff' : '#334155',
    padding: '0 3px', lineHeight: 1.3,
  }),
};

function TeacherTable({ roomName }) {
  return (
    <div style={{
      minWidth: '160px', height: '40px',
      background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(79,70,229,0.12)',
      padding: '0 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #c7d2fe', flexShrink: 0,
        }}>
          <User size={13} color="#4f46e5" strokeWidth={2.5} />
        </div>
        <span style={styles.teacherText}>{roomName ? `ROOM - ${roomName}` : 'ROOM'}</span>
      </div>
    </div>
  );
}

export default function SeatingChart3D() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomName, collegeId } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [seating, setSeating] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const cached = api.getCachedSeating();
    if (cached) {
      setSeating(cached);
      setLoading(false);
    }

    const fetchSeating = async () => {
      try {
        if (!cached) setLoading(true);
        api.getSettings()
          .then((s) => { if (isMounted) setSettings(s); })
          .catch(() => null);
        const data = await api.getSeating();
        if (isMounted) setSeating(data);
      } catch (e) {
        if (isMounted && !cached) setError(e.message || 'Failed to load seating information.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSeating();

    const timer = setTimeout(() => {
      if (!isMounted) return;
      setLoading(current => {
        if (current && !cached) setError('Taking longer than expected. Please refresh or check your connection.');
        return false;
      });
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const btnBase = {
    padding: '6px 14px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 600, border: 'none',
    cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: 'none', whiteSpace: 'nowrap',
  };

  const hasActiveNotice = settings?.noticeBoardMessage && settings.noticeBoardMessage.trim() !== '';

  const renderTopNav = () => (
    <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1152px', marginTop: '8px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
        {/* Left: Scrollable buttons */}
        <div
          style={{ display: 'flex', gap: '6px', alignItems: 'center', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', flexShrink: 1 }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', alignItems: 'center', minWidth: 'max-content' }}>
            {[
              { label: 'Regular', bg: '#d1fae5', color: '#059669' },
              { label: 'Backlog', bg: '#ffedd5', color: '#ea580c' },
            ].map(({ label, bg, color }) => (
              <button
                key={label}
                onClick={() => navigate(collegeId ? `/student/${collegeId}` : '/', { state: { filter: label } })}
                className="active:scale-95"
                style={{ ...btnBase, backgroundColor: bg, color }}
              >
                {label}
              </button>
            ))}

            <div style={{ width: '1px', height: '20px', background: '#c7d2fe', margin: '0 2px', flexShrink: 0 }} />

            <button
              onClick={() => {}}
              className="active:scale-95"
              style={{ ...btnBase, backgroundColor: '#4f46e5', color: 'white' }}
            >
              Room
            </button>

            <div style={{ width: '1px', height: '20px', background: '#c7d2fe', margin: '0 2px', flexShrink: 0 }} />

            <button
              onClick={() => setShowNoticeModal(true)}
              className="active:scale-95"
              style={{ ...btnBase, backgroundColor: '#fef3c7', color: '#d97706', position: 'relative' }}
            >
              Notice
              {hasActiveNotice && (
                <span style={{
                  position: 'absolute', top: '-3px', right: '-3px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#ef4444', border: '1.5px solid white',
                }} />
              )}
            </button>
          </div>
        </div>

        {/* Right: Back button — always visible, never shrinks */}
        <div style={{ flexShrink: 0 }}>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <PageLayout>
        {showNoticeModal && (
          <NoticeModal notice={settings?.noticeBoardMessage} onClose={() => setShowNoticeModal(false)} />
        )}
        {renderTopNav()}
        <RoomSkeletonGrid />
      </PageLayout>
    );
  }

  /* ─── Error State ─── */
  if (error) {
    return (
      <PageLayout>
        {showNoticeModal && (
          <NoticeModal notice={settings?.noticeBoardMessage} onClose={() => setShowNoticeModal(false)} />
        )}
        {renderTopNav()}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%',
          minHeight: 'clamp(0px, calc(100vh - 160px), 60vh)',
        }}>
        <div style={{
          textAlign: 'center', maxWidth: '420px',
          padding: '0 24px',
          marginTop: 'clamp(0px, 4vw, 60px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '1.2rem' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <CalendarDays size={40} color="#4f46e5" strokeWidth={1.5} />
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '16px', height: '16px',
                backgroundColor: '#fff', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
              }}>
                <div style={{ width: '9px', height: '1.5px', backgroundColor: '#94a3b8', borderRadius: '1px', transform: 'rotate(45deg)', position: 'absolute' }} />
                <div style={{ width: '9px', height: '1.5px', backgroundColor: '#94a3b8', borderRadius: '1px', transform: 'rotate(-45deg)', position: 'absolute' }} />
              </div>
            </div>
            <h2 style={{
              fontSize: 'clamp(1rem, 3.5vw, 1.5rem)',
              fontWeight: 900, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#1e293b', margin: 0,
              whiteSpace: 'nowrap',
            }}>
              Seating Not Available
            </h2>
          </div>
          <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9rem' }}>{error}</p>
          <p style={{ marginTop: '2rem', fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
            Please check back later or contact the exam department.
          </p>
        </div>
        </div>
      </PageLayout>
    );
  }

  /* ─── Main Seating Chart ─── */
  const mySeat = seating?.mySeat;
  const columns = seating?.columns || [];

  return (
    <PageLayout>
      {showNoticeModal && (
        <NoticeModal notice={settings?.noticeBoardMessage} onClose={() => setShowNoticeModal(false)} />
      )}
      {renderTopNav()}

      {/* Seating Scene */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', marginTop: '4px' }}>
        <div style={styles.scene}>

          {/* Teacher's Desk */}
          <div style={styles.teacherArea}>
            <span style={styles.teacherLabel}>Front of Room (Teacher&apos;s Desk)</span>
            <TeacherTable roomName={roomName || seating?.roomNo} />
          </div>

          {/* Scrollable Grid */}
          <div
            style={{
              width: '100%', overflowX: 'auto', paddingBottom: '20px',
              WebkitOverflowScrolling: 'touch',
            }}
            className="no-scrollbar"
          >
            <div style={{ minWidth: 'max-content', padding: '4px 10px 10px' }}>
              <div style={styles.grid}>

                {/* Header Row: EXTRA | dept columns | DOOR */}
                <div style={{ ...styles.deskRow, marginBottom: '8px', alignItems: 'center' }}>
                  <div style={styles.desk(false, true)}>
                    <strong style={{ color: '#94a3b8', fontSize: '9px', letterSpacing: '0.05em' }}>EXTRA</strong>
                  </div>

                  {columns.slice(1, -1).map((col, i) => (
                    <div key={i} style={{
                      width: DESK_W, textAlign: 'center',
                      fontSize: '9px', fontWeight: 800,
                      color: '#64748b', textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>
                      {col.dept || '---'}
                    </div>
                  ))}

                  <div style={{ ...styles.desk(false, false), background: '#1e293b', border: 'none' }}>
                    <strong style={{ color: '#ffffff', fontSize: '9px', letterSpacing: '0.05em' }}>DOOR</strong>
                  </div>
                </div>

                {/* Seat Rows */}
                {Array.from({ length: ROWS }).map((_, r) => (
                  <div key={r} style={styles.deskRow}>
                    {columns.map((col, cIdx) => {
                      const seat = col.seats[r];
                      const isMySeat = mySeat && mySeat.columnNo === (cIdx + 1) && (seat?.seatNo === mySeat.seatNo);

                      return (
                        <div
                          key={cIdx}
                          style={{
                            ...styles.desk(isMySeat, seat?.isExtra),
                            animation: isMySeat ? 'mySeatPulse 2s ease-in-out infinite' : 'none',
                          }}
                        >
                          {isMySeat && (
                            <div style={styles.avatarContainer}>
                              <User size={11} color="white" strokeWidth={3} />
                            </div>
                          )}
                          {isMySeat && (
                            <strong style={{ fontSize: '7px', color: '#fff', textTransform: 'uppercase', marginBottom: '1px', letterSpacing: '0.05em' }}>YOU</strong>
                          )}

                          <div style={styles.seatInfo(isMySeat)}>
                            {isMySeat ? (
                              <>
                                <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
                                  {seat?.studentName}
                                </div>
                                <div style={{ opacity: 0.8, fontSize: '7px' }}>{seat?.rollNo}</div>
                              </>
                            ) : seat?.isExtra ? (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '8px' }}>EXTRA</span>
                            ) : (
                              <span style={{ color: '#cbd5e1', fontSize: '10px' }}>—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Notice */}
      <div
        className="mt-10 relative mx-auto max-w-xl w-full px-4 hover:rotate-0 transition-transform duration-300"
        style={{ transform: 'rotate(-1deg)', position: 'relative', zIndex: 10 }}
      >
        <div className="bg-[#fffdf0] border border-[#e6e2c8] p-6 rounded-lg shadow-[4px_6px_0px_rgba(230,226,200,1)] hover:shadow-[2px_4px_8px_rgba(0,0,0,0.1)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-400 rounded-full shadow-inner flex items-center justify-center opacity-80 mix-blend-multiply">
              <div className="w-3 h-3 bg-red-900 rounded-full opacity-40"></div>
          </div>
          <div className="text-center">
            <h4 className="flex items-center justify-center gap-2 font-black text-xl mb-3 tracking-wider" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Pin className="w-5 h-5 text-red-500 drop-shadow-sm -rotate-45" strokeWidth={2.5} />
                <span className="bg-gradient-to-r from-red-600 via-orange-600 to-red-500 bg-clip-text text-transparent">
                    Remember Notice
                </span>
            </h4>
            <p className="text-gray-700 font-medium leading-relaxed text-sm">
              Your assigned room is <strong>{seating?.roomNo || 'N/A'}</strong>.
              Please report <span className="text-red-600 font-bold">at least 15 minutes</span> before the exam.
              Bring your <span className="font-bold">college uniform</span> and{' '}
              <span className="text-[#2d368e] font-bold">college ID card</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Keyframe for my-seat pulse */}
      <style>{`
        @keyframes mySeatPulse {
          0%, 100% { box-shadow: 0 6px 16px rgba(59,130,246,0.4); }
          50% { box-shadow: 0 8px 24px rgba(59,130,246,0.65), 0 0 0 4px rgba(59,130,246,0.12); }
        }
      `}</style>
    </PageLayout>
  );
}
