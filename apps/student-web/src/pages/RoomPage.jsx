import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/room.scss";
import { ArrowLeft, User } from "lucide-react";
import { PageLayout } from '../components';

const ROWS = 8;

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#cbd5e1",
    backgroundImage: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "24px 20px 60px",
  },
  titleWrapper: {
    position: "fixed",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%) rotate(-90deg)",
    transformOrigin: "center center",
    whiteSpace: "nowrap",
  },
  title: {
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: ".14em",
    color: "#475569",
    textTransform: "uppercase",
    borderBottom: "1.5px solid #e2e8f0",
    paddingBottom: "4px",
  },
  scene: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0px",
  },
  teacherArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "32px",
    gap: "4px",
    marginTop: "40px",
  },
  teacherLabel: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: "2px",
  },
  teacherTable: (hovered) => ({
    width: "220px",
    height: "44px",
    background: hovered ? "#e0e7ff" : "#ffffff",
    border: "2px solid #c7d2fe",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.15s ease, box-shadow 0.15s ease",
    boxShadow: hovered
      ? "0 4px 14px rgba(0,0,0,0.18)"
      : "0 2px 6px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  }),
  teacherTableInner: {
    position: "absolute",
    inset: "4px",
    border: "1px solid transparent",
    borderRadius: "3px",
    pointerEvents: "none",
  },
  teacherText: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: "#2d368e",
    zIndex: 1,
  },
  divider: {
    width: "560px",
    height: "1px",
    background: "#e2e8f0",
    margin: "0 0 20px 0",
    borderRadius: "1px",
  },
  headerRow: {
    display: "flex",
    gap: "28px",
    marginBottom: "10px",
  },
  labelBadge: (type) => ({
    width: "110px",
    padding: "6px 0",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    borderRadius: "4px",
    background: type === "dark" ? "#2d368e" : "transparent",
    color: type === "dark" ? "#ffffff" : "transparent",
  }),
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  deskRow: {
    display: "flex",
    gap: "28px",
  },
  desk: (hovered) => ({
    width: "110px",
    height: "54px",
    background: hovered ? "#f1f5f9" : "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background 0.15s ease, box-shadow 0.15s ease",
    boxShadow: hovered
      ? "0 4px 12px rgba(0,0,0,0.15)"
      : "0 2px 4px rgba(0,0,0,0.08)",
    position: "relative",
    overflow: "hidden",
  }),
  deskInner: {
    position: "absolute",
    inset: "4px",
    border: "1px solid transparent",
    borderRadius: "3px",
    pointerEvents: "none",
  },
  backButton: {
    position: "fixed",
    top: "16px",
    right: "16px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#374151"
  }
};

function TeacherTable({ roomName }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={styles.teacherTable(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.teacherTableInner} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#e0e7ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #c7d2fe'
        }}>
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

  useEffect(() => {
    const fetchSeating = async () => {
      try {
        const token = localStorage.getItem('examination_portal_token');
        const res = await fetch('/api/v1/student/seating', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Seating not published yet.');
        }
        const data = await res.json();
        setSeating(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSeating();

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 700) setScale((width - 40) / 662);
      else setScale(1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-gray-700 font-semibold text-sm"
                  >
                      <ArrowLeft size={16} /> Back
                  </button>
              </div>
          </div>
      </div>
  );

  if (loading) return <PageLayout>{renderTopNav()}<div style={{color:'#1e293b', fontWeight:600, marginTop: '100px'}}>Loading your seating arrangement...</div></PageLayout>;

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
  const columns = seating?.columns || [];

  return (
    <PageLayout>
      {renderTopNav()}

      <div style={styles.titleWrapper}>
        <h2 style={styles.title}>Room: {seating?.roomNo || '--'} | Your Seat: {mySeat ? `Col ${mySeat.columnNo}, Seat ${mySeat.seatNo}` : '--'}</h2>
      </div>

      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          transition: "transform 0.15s ease-out",
          width: "662px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={styles.scene}>
          <div style={styles.teacherArea}>
            <span style={styles.teacherLabel}>Front of Room</span>
            <TeacherTable roomName={roomName} />
          </div>

          <div style={styles.divider} />

          <div style={styles.headerRow}>
            {/* EXTRA, then dynamic columns, then Door */}
            <div style={styles.labelBadge("dark")}>EXTRA</div>
            {columns.map((col, i) => (
               <div key={i} style={styles.labelBadge("empty")} title={col.dept}>
                  {col.dept.length > 5 ? col.dept.substring(0,4)+'..' : col.dept}
               </div>
            ))}
            <div style={styles.labelBadge("dark")}>Door</div>
          </div>

          <div style={styles.grid}>
            {Array.from({ length: ROWS }).map((_, r) => (
              <div key={r} style={styles.deskRow}>
                 {/* EXTRA cell */}
                 <div style={{...styles.desk(false), background:'#e2e8f0', border:'1px dashed #cbd5e1'}} />

                 {columns.map((col, cIdx) => {
                    const seat = col.seats[r];
                    const isMySeat = mySeat && mySeat.columnNo === (cIdx + 1) && (seat?.seatNo === mySeat.seatNo);
                    
                    return (
                      <div 
                        key={cIdx} 
                        style={{
                          ...styles.desk(isMySeat), 
                          background: isMySeat ? '#3b82f6' : (seat?.isExtra ? '#f1f5f9' : '#ffffff'),
                          border: isMySeat ? '2px solid #1e40af' : '1.5px solid #b8a98a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}
                      >
                         <div style={styles.deskInner} />
                         {isMySeat && <span style={{fontSize:'9px', fontWeight:900, color:'#fff'}}>YOU</span>}
                         {!seat?.isExtra && seat?.seatNo && <span style={{fontSize:'8px', color: isMySeat ? '#fff' : '#64748b'}}>Seat {seat.seatNo}</span>}
                         {seat?.isExtra && <span style={{fontSize:'8px', color:'#94a3b8'}}>---</span>}
                      </div>
                    );
                 })}

                 {/* DOOR cell */}
                 <div style={{...styles.desk(false), opacity: 0.3, background:'#94a3b8'}} />
              </div>
            ))}
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
              Your assigned room is <strong>{seating?.roomNo}</strong>. Please report 
              <span className="text-red-600 font-bold"> at least 15 minutes</span> before the exam.
              Bring your <span className="text-[#2d368e] font-bold">College ID card</span>.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
