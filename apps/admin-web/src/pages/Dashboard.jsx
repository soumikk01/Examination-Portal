import { useState, useEffect, useCallback } from 'react';
import { Settings, Calendar, Users, Trash2 } from 'lucide-react';
import { Modal } from '@exam-portal/ui';
import api from '../services/api';

const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [exams, setExams] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreachable, setUnreachable] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const showAlert = (message) => setModalState({ isOpen: true, title: 'Alert', message, type: 'alert', onConfirm: null });

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      setError(null);
      setUnreachable(false);
      const [healthData, examsData, summaryData] = await Promise.all([
        api.get('/health').catch((err) => err.response?.data || null),
        api.get('/exams').catch(() => []),
        api.get('/dashboard/summary').catch(() => null),
      ]);
      
      if (healthData) setHealth(healthData);
      setExams(Array.isArray(examsData) ? examsData : []);
      if (summaryData) setSummary(summaryData);
      
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
      if (showLoading) setLoading(false);
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
          fetchData(false);
        } catch (err) {
          showAlert(err.response?.data?.error || 'Failed to delete schedule.');
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
          fetchData(false);
        } catch (err) {
          showAlert(err.response?.data?.error || 'Failed to delete seating assignment.');
        }
      }
    });
  };

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

  const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  const dbStatus = health?.checks?.database?.status ?? 'unknown';
  const dbLatency = health?.checks?.database?.latency;
  const dbError = health?.checks?.database?.error;

  const redisStatus = health?.checks?.redis?.status ?? 'unknown';
  const redisLatency = health?.checks?.redis?.latency;
  const redisError = health?.checks?.redis?.error;

  const serverStatus = health?.status === 'UP' ? 'Running' : (health?.status || 'Unknown');
  const uptimeText = health?.uptime ? formatUptime(health.uptime) : '-';

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1f2937' }}>Dashboard Overview</h1>
      
      {/* Top Stats */}
      <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-stat" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="admin-stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{exams.length}</div>
          <div className="admin-stat-label" style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Legacy Exams</div>
        </div>
        
        <div className="admin-stat" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
           <div className="admin-stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: summary?.activeSchedules?.reduce((a, b) => a + b.count, 0) > 0 ? '#10b981' : '#6b7280' }}>
             {summary ? summary.activeSchedules.reduce((acc, curr) => acc + curr.count, 0) : 0}
           </div>
           <div className="admin-stat-label" style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Exam Schedules</div>
        </div>

        <div className="admin-stat" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
           <div className="admin-stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: summary?.activeSeating?.reduce((a, b) => a + b.totalSeats, 0) > 0 ? '#f59e0b' : '#6b7280' }}>
             {summary ? summary.activeSeating.reduce((acc, curr) => acc + curr.totalSeats, 0) : 0}
           </div>
           <div className="admin-stat-label" style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Seats Allotted</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Active Exam Schedules */}
        <div className="admin-card" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', color: '#1f2937' }}>
            <Calendar size={18} color="#4f46e5" /> Published Schedules
          </h2>
          {summary?.activeSchedules?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {summary.activeSchedules.map((schedule) => (
                <div key={`${schedule.semester}-${schedule.mode}-${schedule.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Semester {schedule.semester}</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{schedule.mode} • {schedule.type.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '600' }}>
                      {schedule.count} exams
                    </span>
                    <button 
                      onClick={() => handleDeleteSchedule(schedule)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '4px' }}
                      title="Delete Schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>No active schedules published.</p>
          )}
        </div>

        {/* Current Seat Allotments */}
        <div className="admin-card" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', color: '#1f2937' }}>
            <Users size={18} color="#f59e0b" /> Assigned Seating
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

        {/* System & Settings */}
        <div className="admin-card" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', color: '#1f2937' }}>
            <Settings size={18} color="#10b981" /> System Health & Portal Configuration
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* System Health Detailed View */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
              
              <div style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>[ Database ]</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <span style={{ color: '#6b7280', width: '60px' }}>Status:</span>
                     <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem', color: dbStatus === 'UP' ? '#059669' : '#dc2626' }}>
                       {dbStatus === 'UP' ? '🟢 Connected' : `🔴 ${dbStatus}`}
                     </span>
                  </div>
                  {dbStatus === 'UP' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#6b7280', width: '60px' }}>Latency:</span>
                      <span style={{ fontWeight: '500', color: '#374151' }}>{dbLatency}ms</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#6b7280', width: '60px' }}>Error:</span>
                      <span style={{ fontWeight: '500', color: '#dc2626' }}>{dbError || 'Unknown'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>[ Redis Cache ]</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <span style={{ color: '#6b7280', width: '60px' }}>Status:</span>
                     <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem', color: redisStatus === 'UP' ? '#059669' : '#dc2626' }}>
                       {redisStatus === 'UP' ? '🟢 Connected' : '🔴 Disconnected'}
                     </span>
                  </div>
                  {redisStatus === 'UP' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#6b7280', width: '60px' }}>Latency:</span>
                      <span style={{ fontWeight: '500', color: '#374151' }}>{redisLatency}ms</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#6b7280', width: '60px' }}>Error:</span>
                      <span style={{ fontWeight: '500', color: '#dc2626' }}>{redisError || 'ECONNREFUSED'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>[ Server ]</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <span style={{ color: '#6b7280', width: '60px' }}>Status:</span>
                     <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem', color: serverStatus === 'Running' ? '#059669' : '#d97706' }}>
                       {serverStatus === 'Running' ? '🟢 Running' : `🟡 ${serverStatus}`}
                     </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#6b7280', width: '60px' }}>Uptime:</span>
                    <span style={{ fontWeight: '500', color: '#374151' }}>{uptimeText}</span>
                  </div>
                </div>
              </div>

            </div>

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
