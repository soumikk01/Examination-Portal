import { useState, useEffect, useCallback } from 'react';
import { Trash2, Archive, CalendarDays, Armchair, CalendarCheck, ServerCog, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal } from '@exam-portal/ui';
import api from '../services/api';

let cachedDashboardData = null;

const Dashboard = () => {
  const [exams, setExams] = useState(() => cachedDashboardData?.exams || []);
  const [summary, setSummary] = useState(() => cachedDashboardData?.summary || null);
  const [loading, setLoading] = useState(() => !cachedDashboardData);
  const [error, setError] = useState(null);
  const [unreachable, setUnreachable] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const [expandedSemesters, setExpandedSemesters] = useState({});

  const showAlert = (message) => setModalState({ isOpen: true, title: 'Alert', message, type: 'alert', onConfirm: null });

  const fetchData = useCallback(async () => {
    // Only show loading if we have absolutely no cache
    if (!cachedDashboardData) setLoading(true);
    try {
      setError(null);
      setUnreachable(false);
      const [examsData, summaryData] = await Promise.all([
        api.get('/exams').catch(() => []),
        api.get('/dashboard/summary').catch(() => null),
      ]);
      
      const newExams = Array.isArray(examsData) ? examsData : [];
      
      setExams(newExams);
      if (summaryData) setSummary(summaryData);
      
      // Update memory cache for instant-load on next visit
      cachedDashboardData = {
          exams: newExams,
          summary: summaryData || cachedDashboardData?.summary
      };
      
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteSchedule = (schedule) => {
    setModalState({
      isOpen: true,
      title: 'Confirm Deletion',
      type: 'confirm',
      message: `Are you sure you want to delete all published tests for Semester ${schedule.semester} (${schedule.mode} - ${schedule.type.replace(/_/g, ' ')})? This will unpublish them from student view.`,
      onConfirm: async () => {
        try {
          await api.delete('/dashboard/schedules', { data: { semester: schedule.semester, mode: schedule.mode, scheduleType: schedule.type } });
          fetchData();
        } catch (err) {
          showAlert(err.response?.data?.error || 'Failed to delete schedule.');
          return false;
        }
      }
    });
  };

  const handleDeleteSeating = (examGroup) => {
    setModalState({
      isOpen: true,
      title: 'Confirm Deletion',
      type: 'confirm',
      message: `Are you sure you want to delete the seating allotment for ${examGroup}? This will clear seat allocations.`,
      onConfirm: async () => {
        try {
          await api.delete(`/dashboard/seating/${encodeURIComponent(examGroup)}`);
          fetchData();
        } catch (err) {
          showAlert(err.response?.data?.error || 'Failed to delete seating assignment.');
          return false;
        }
      }
    });
  };

  if (loading) {
    return (
        <div style={{ paddingBottom: '2rem' }}>
            <style>{`
                .sk-box {
                    background: linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%);
                    border-radius: 6px;
                    background-size: 200% 100%;
                    animation: 1.5s adminWave linear infinite;
                }
                @keyframes adminWave {
                    to {
                        background-position-x: -200%;
                    }
                }
            `}</style>
            <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1f2937' }}>Dashboard Overview</h1>
            
            {/* Top Stats Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[0, 1, 2].map((i) => (
                    <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div className="sk-box" style={{ width: '48px', height: '2.5rem', marginBottom: '0.75rem' }} />
                        <div className="sk-box" style={{ width: '130px', height: '1.25rem' }} />
                    </div>
                ))}
            </div>

            {/* Bottom Panels Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {[0, 1, 2].map((i) => (
                    <div key={i} style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '300px' }}>
                        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="sk-box" style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0 }} />
                            <div className="sk-box" style={{ width: '60%', height: '1.75rem' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[0, 1, 2].map((j) => (
                                <div key={j} className="sk-box" style={{ width: '100%', height: '4rem', borderRadius: '6px' }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
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

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1f2937' }}>Dashboard Overview</h1>
      
      {/* Top Stats */}
      <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-stat" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="admin-stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{exams.length}</div>
          <div className="admin-stat-label" style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Archive size={16} /> Total Legacy Exams
          </div>
        </div>
        
        <div className="admin-stat" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
           <div className="admin-stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: summary?.activeSchedules?.reduce((a, b) => a + b.count, 0) > 0 ? '#10b981' : '#6b7280' }}>
             {summary ? summary.activeSchedules.reduce((acc, curr) => acc + curr.count, 0) : 0}
           </div>
           <div className="admin-stat-label" style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <CalendarDays size={16} /> Open Exam Schedules
           </div>
        </div>

        <div className="admin-stat" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
           <div className="admin-stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: summary?.activeSeating?.reduce((a, b) => a + b.totalSeats, 0) > 0 ? '#f59e0b' : '#6b7280' }}>
             {summary ? summary.activeSeating.reduce((acc, curr) => acc + curr.totalSeats, 0) : 0}
           </div>
           <div className="admin-stat-label" style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Armchair size={16} /> Total Seats Allotted
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Active Exam Schedules */}
        <div className="admin-card" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', color: '#1f2937' }}>
            <CalendarCheck size={18} color="#4f46e5" /> Published Schedules
          </h2>
          {summary?.activeSchedules?.length > 0 ? (() => {
            const groupedSchedules = summary.activeSchedules.reduce((acc, schedule) => {
              if (!acc[schedule.semester]) acc[schedule.semester] = [];
              acc[schedule.semester].push(schedule);
              return acc;
            }, {});
            const sortedSemesters = Object.keys(groupedSchedules).sort((a, b) => parseInt(a) - parseInt(b));
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sortedSemesters.map(semester => (
                  <div key={`semester-${semester}`} style={{ border: '1px solid #f3f4f6', borderRadius: '6px', overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedSemesters(prev => ({ ...prev, [semester]: !prev[semester] }))}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: expandedSemesters[semester] ? '#eff6ff' : '#f9fafb', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.2s' }}
                    >
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>Semester {semester}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                        <span style={{ fontSize: '0.8rem' }}>{groupedSchedules[semester].length} item(s)</span>
                        {expandedSemesters[semester] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </button>
                    {expandedSemesters[semester] && (
                      <div style={{ padding: '0.75rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {groupedSchedules[semester].map((schedule) => (
                          <div key={`${schedule.semester}-${schedule.mode}-${schedule.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #f3f4f6' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{schedule.mode} • {schedule.type.replace(/_/g, ' ')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                                {schedule.count} exams
                              </span>
                              <button 
                                onClick={() => handleDeleteSchedule(schedule)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '4px' }}
                                title="Delete Schedule"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })() : (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>No active schedules published.</p>
          )}
        </div>

        {/* Current Seat Allotments */}
        <div className="admin-card" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', color: '#1f2937' }}>
            <Armchair size={18} color="#f59e0b" /> Assigned Seating
          </h2>
          {summary?.activeSeating?.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {summary.activeSeating.map((seat) => (
                <div key={seat.examGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                  <span style={{ fontWeight: '600', color: '#92400e' }}>{seat.examGroup}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: '#d97706', fontSize: '0.875rem', fontWeight: '500' }}>{seat.totalSeats} seats allotted</span>
                    <button 
                      onClick={() => handleDeleteSeating(seat.examGroup)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '4px' }}
                      title="Delete Seating"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>No active seating allotments.</p>
          )}
        </div>

        {/* Portal Settings */}
        <div className="admin-card" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', color: '#1f2937' }}>
            <ServerCog size={18} color="#10b981" /> Portal Configuration
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Portal Settings */}
            {summary?.settings && (
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: '500' }}>Maintenance Mode</span>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                    backgroundColor: summary.settings.maintenanceMode ? '#fee2e2' : '#d1fae5',
                    color: summary.settings.maintenanceMode ? '#ef4444' : '#059669'
                   }}>
                    {summary.settings.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: '500' }}>Notice Board Message</span>
                  <div style={{ 
                    padding: '0.75rem', 
                    backgroundColor: 'white', 
                    borderRadius: '4px', 
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem',
                    color: summary.settings.noticeBoardMessage ? '#1f2937' : '#9ca3af',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '100px',
                    overflowY: 'auto'
                  }}>
                    {summary.settings.noticeBoardMessage || 'No active notice published.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default Dashboard;
