import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { api } from '../services/api';
import { ArrowLeft, User } from "lucide-react";
import { PageLayout } from '../components';

const ROWS = 8;

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 60px" },
  scene: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0px" },
  teacherArea: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px", gap: "4px" },
  teacherLabel: { fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#64748b", marginBottom: "2px" },
  teacherText: { fontSize: "11px", fontWeight: 700, color: "#1e293b", zIndex: 1 },
  divider: { width: "100%", height: "1px", background: "#cbd5e1", margin: "0 0 30px 0" },
  
  headerRow: { display: "flex", gap: "24px", marginBottom: "15px" },
  labelBadge: {
    width: "110px", padding: "8px 0", textAlign: "center", fontSize: "11px", fontWeight: 700,
    textTransform: "uppercase", borderRadius: "6px", color: "#64748b", border: "1px solid transparent"
  },
  
  grid: { display: "flex", flexDirection: "column", gap: "10px" },
  deskRow: { display: "flex", gap: "24px" },
  desk: (isMySeat, isExtra) => ({
    width: "110px", height: "64px", background: isMySeat ? "#3b82f6" : "#ffffff",
    border: isMySeat ? "2px solid #1e40af" : (isExtra ? "1.5px dashed #cbd5e1" : "1.5px solid #cbd5e1"),
    borderRadius: "8px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "default",
    boxShadow: isMySeat ? "0 8px 20px rgba(59,130,246,0.4)" : "0 2px 4px rgba(0,0,0,0.05)"
  }),
  
  avatarContainer: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  seatInfo: (isMySeat) => ({ fontSize: "9px", textAlign: "center", color: isMySeat ? "#ffffff" : "#334155", padding: "0 4px" }),
  labelDoor: { width: "110px", height: "64px", background: "#334155", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 800, fontSize: "11px" }
};

function TeacherTable({ roomName }) {
  return (
    <div style={{
      width: "220px", height: "44px", background: "#ffffff", border: "2.5px solid #c7d2fe", borderRadius: "6px",
      display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe' }}>
           <User size={16} color="#4f46e5" strokeWidth={2.5} />
        </div>
        <span style={styles.teacherText}>{roomName ? `ROOM - ${roomName}` : "ROOM -"}</span>
      </div>
    </div>
  );
}

export default function SeatingChart3D() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomName, collegeId } = location.state || {};
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seating, setSeating] = useState(null);
  const [error, setError] = useState(null);

  const columns = seating?.columns || [];

  useEffect(() => {
    // Instant Load from Cache
    const cached = api.getCachedSeating();
    if (cached) {
      setSeating(cached);
      setLoading(false);
    }

    const fetchSeating = async () => {
      try {
        if (!cached) setLoading(true);
        const data = await api.getSeating();
        setSeating(data);
      } catch (e) {
        if (!cached) setError(e.message || 'Failed to load seating information.');
      } finally {
        setLoading(false);
      }
    };
    fetchSeating();

    // Fallback: If still loading after 8 seconds, show an error.
    const timer = setTimeout(() => {
      setLoading(current => {
        if (current && !cached) setError("Taking longer than expected. Please refresh the page or check your connection.");
        return false;
      });
    }, 8000);

    const handleResize = () => {
      const width = window.innerWidth;
      // On mobile, we aim for a scrollable experience if width is too small
      const targetWidth = columns.length * 134; // Each column + gap
      if (width < 768) {
         // Minor scaling allowed for mobile to fit a bit more, but not too much
         setScale(Math.max(0.75, (width - 40) / targetWidth));
      } else {
         setScale(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [columns.length]);

  const renderTopNav = () => (
      <div style={{ width: '100%', maxWidth: '1152px', marginTop: '16px', marginBottom: '32px' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">
              {/* Left Side: Filters and Room Search/Notice */}
              <div className="flex gap-2 flex-wrap items-center">
                  {['ALL', 'Regular', 'Backlog'].map((opt) => {
                      let baseColor = '#e0e7ff';
                      let textColor = '#4f46e5';
                      let activeShadow = 'rgba(79, 70, 229, 0.35)';

                      if (opt === 'Regular') {
                          baseColor = '#d1fae5';
                          textColor = '#059669';
                          activeShadow = 'rgba(16, 185, 129, 0.35)';
                      } else if (opt === 'Backlog') {
                          baseColor = '#ffedd5';
                          textColor = '#ea580c';
                          activeShadow = 'rgba(249, 115, 22, 0.35)';
                      }

                      return (
                          <button
                              key={opt}
                              onClick={() => navigate(collegeId ? `/student/${collegeId}` : -1, { state: { filter: opt } })}
                              onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                  e.currentTarget.style.boxShadow = `0 6px 16px ${activeShadow}`;
                              }}
                              onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                  e.currentTarget.style.boxShadow = 'none';
                              }}
                              onMouseDown={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0) scale(0.95)';
                                  e.currentTarget.style.boxShadow = 'none';
                              }}
                              onMouseUp={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                  e.currentTarget.style.boxShadow = `0 6px 16px ${activeShadow}`;
                              }}
                              style={{
                                  padding: '6px 14px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  backgroundColor: baseColor,
                                  color: textColor,
                                  boxShadow: 'none',
                              }}
                          >
                              {opt}
                          </button>
                      );
                  })}

                  <div className="w-px h-6 bg-indigo-200 mx-1"></div>

                  <button
                      onClick={() => navigate(collegeId ? `/student/${collegeId}/room` : '/room', { state: { roomName: seating?.roomNo, collegeId } })}
                      onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                      }}
                      onMouseDown={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(0.95)';
                          e.currentTarget.style.boxShadow = 'none';
                      }}
                      onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.35)';
                      }}
                      style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backgroundColor: '#4f46e5',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
                      }}
                  >
                      Room Search
                  </button>

                  <div className="w-px h-6 bg-indigo-200 mx-1"></div>

                  <button
                      onClick={() => {}}
                      onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                      }}
                      onMouseDown={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(0.95)';
                          e.currentTarget.style.boxShadow = 'none';
                      }}
                      onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.35)';
                      }}
                      style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          boxShadow: 'none',
                      }}
                  >
                      Notice
                  </button>
              </div>

              {/* Right Side: Back Button */}
              <div className="flex gap-3">
                  <button
                      onClick={() => navigate(-1)}
                      style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          backgroundColor: '#2d368e',
                          color: '#ffffff',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(45, 54, 142, 0.25)',
                          transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#1e2563';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#2d368e';
                          e.currentTarget.style.transform = 'translateY(0)';
                      }}
                  >
                      <ArrowLeft size={18} strokeWidth={3} />
                      Back
                  </button>
              </div>
          </div>
      </div>
  );

  if (loading) return (
    <PageLayout style={{ justifyContent: 'center' }}>
      <div style={{
        padding: '2rem 3rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        textAlign: 'center', zIndex: 100, position: 'relative'
      }}>
         <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
         </div>
         <p style={{color: '#334155', fontWeight: 600}}>Initializing Seat Arrangement...</p>
         <p style={{color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem'}}>Fetching your room allocation context</p>
      </div>
    </PageLayout>
  );

  if (error) {
    return (
      <PageLayout>
        {renderTopNav()}
        <div style={{marginTop:'100px', textAlign:'center', maxWidth:'400px'}}>
           <h2 style={{fontSize:'1.5rem', fontWeight:700, color:'#1e293b', marginBottom:'1rem'}}>📅 Seating Not Available</h2>
           <p style={{color:'#64748b', lineHeight:1.6}}>{error}</p>
           <p style={{marginTop:'2rem', fontSize:'0.85rem', color:'#94a3b8'}}>Please check back later or contact the exam department.</p>
        </div>
      </PageLayout>
    );
  }

  const mySeat = seating?.mySeat; // { columnNo, seatNo }
  
  return (
    <PageLayout>
      {renderTopNav()}

      <div style={{
        marginTop: "10px", width: "100%", display: "flex", justifyContent: "center",
      }}>
        <div style={{
           width: "100%", padding: "10px"
        }}>
          <div style={styles.scene}>
            <div style={styles.teacherArea}>
              <span style={styles.teacherLabel}>Front of Room (Teacher's Desk)</span>
              <TeacherTable roomName={roomName || seating?.roomNo} />
            </div>

          {/* Seating Layout Wrap */}
          <div 
            style={{ 
              width: '100%', 
              overflowX: 'auto', 
              paddingBottom: '20px',
              WebkitOverflowScrolling: 'touch', // Smooth scroll for iOS
              display: 'flex',
              justifyContent: scale === 1 ? 'center' : 'flex-start'
            }}
            className="no-scrollbar"
          >
            <div style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: "top left", 
              transition: "transform 0.2s ease",
              minWidth: 'max-content',
              padding: '10px'
            }}>
              <div style={styles.grid}>
                {/* Top Row: EXTRA | DEPARTMENTS | DOOR */}
                <div style={{...styles.deskRow, marginBottom: '15px', alignItems: 'center'}}>
                  <div style={styles.desk(false, true)}>
                     <strong style={{color: '#94a3b8', fontSize: '11px', letterSpacing: '0.05em'}}>EXTRA</strong>
                  </div>
                  
                  {columns.slice(1, -1).map((col, i) => (
                    <div key={i} style={{ width: "110px", textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      {col.dept || "---"}
                    </div>
                  ))}

                  <div style={{...styles.desk(false, false), background: '#1e293b', border: 'none'}}>
                     <strong style={{color: '#ffffff', fontSize: '11px', letterSpacing: '0.05em'}}>DOOR</strong>
                  </div>
                </div>

                {Array.from({ length: ROWS }).map((_, r) => (
                  <div key={r} style={styles.deskRow}>
                    {columns.map((col, cIdx) => {
                      const seat = col.seats[r];
                      const isMySeat = mySeat && mySeat.columnNo === (cIdx + 1) && (seat?.seatNo === mySeat.seatNo);
                      
                      return (
                        <div key={cIdx} style={styles.desk(isMySeat, seat?.isExtra)}>
                          {isMySeat && (
                            <div style={styles.avatarContainer}>
                              <User size={14} color="#3b82f6" strokeWidth={3} />
                            </div>
                          )}
                          {isMySeat && <strong style={{fontSize: '9px', color: '#fff', textTransform: 'uppercase', marginBottom: '2px'}}>YOU</strong>}
                          
                          <div style={styles.seatInfo(isMySeat)}>
                            {isMySeat ? (
                              <>
                                <div style={{fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px'}}>{seat?.studentName}</div>
                                <div style={{opacity: 0.8, fontSize: '8px'}}>{seat?.rollNo}</div>
                              </>
                            ) : seat?.isExtra ? (
                              <span style={{color: '#94a3b8', fontStyle: 'italic', fontSize: '8px'}}>EXTRA</span>
                            ) : (
                              <span style={{color: '#cbd5e1'}}>---</span>
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
      </div>

      {/* Pinned Note Section */}
      <div
        className="mt-12 relative mx-auto max-w-2xl transform hover:rotate-0 transition-transform duration-300 w-full px-4"
        style={{ transform: 'rotate(-1deg)' }}
      >
        <div className="bg-[#fffdf0] border border-[#e6e2c8] p-6 rounded-sm shadow-[2px_4px_8px_rgba(0,0,0,0.1)] relative">
          <div className="text-center">
            <h4 className="flex items-center justify-center gap-2 font-bold text-gray-800 text-lg mb-2 underline decoration-wavy decoration-[#e6e2c8]">
              <span>📌</span> Important Notice
            </h4>
            <p className="text-gray-700 font-medium leading-relaxed">
              Your assigned room is <strong>{seating?.roomNo || 'N/A'}</strong>. 
              Please report to your assigned room 
              <span className="text-red-600 font-bold"> at least 15 minutes</span> before the 
              scheduled examination time. Students must wear the 
              <span className="font-bold"> college uniform</span> and bring their 
              <span className="text-[#2d368e] font-bold"> college ID card</span> along with 
              all required documents.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
