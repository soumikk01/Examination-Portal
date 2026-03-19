import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/room.scss";
import { ArrowLeft } from "lucide-react";

const ROWS = 8;
const COLS = 5;
const HEADER_LABELS = ["EXTRA", "", "", "", "Door"];

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
    fontFamily: "'Courier New', monospace",
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
    fontFamily: "Georgia, serif",
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: ".14em",
    color: "#2c2c2c",
    textTransform: "uppercase",
    borderBottom: "1.5px solid #2c2c2c",
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
    color: "#666",
    fontFamily: "Georgia, serif",
    marginBottom: "2px",
  },
  teacherTable: (hovered) => ({
    width: "220px",
    height: "44px",
    background: hovered ? "#d4c9b4" : "#e0d6c0",
    border: "2px solid #8a7a5a",
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
    border: "1px solid rgba(138,122,90,0.35)",
    borderRadius: "3px",
    pointerEvents: "none",
  },
  teacherText: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: "#5a4a2a",
    fontFamily: "Georgia, serif",
    zIndex: 1,
  },
  divider: {
    width: "560px",
    height: "1px",
    background: "rgba(44,44,44,0.15)",
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
    fontFamily: "Georgia, serif",
    background: type === "dark" ? "#1a1a1a" : "transparent",
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
    background: hovered ? "#ede6d4" : "#f5f0e8",
    border: "1.5px solid #b8a98a",
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
    border: "1px solid rgba(184,169,138,0.4)",
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

function Desk() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={styles.desk(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.deskInner} />
    </div>
  );
}

function TeacherTable() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={styles.teacherTable(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.teacherTableInner} />
      <span style={styles.teacherText}>Teacher</span>
    </div>
  );
}

export default function SeatingChart3D() {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Total width of the static room layout is exactly 662px.
      // Scaling it down smoothly on screens smaller than 700px.
      if (width < 700) {
        // Leaving 20px padding on the sides
        setScale((width - 40) / 662);
      } else {
        setScale(1);
      }
    };
    
    // Initial size check
    handleResize();
    
    // Add event listener for live resizing
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={styles.page} className="seating-wrapper">
      
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          transition: "transform 0.15s ease-out",
          width: "662px", // Fix standard width container for uniform scaling
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={styles.scene}>
          <div style={styles.teacherArea}>
            <span style={styles.teacherLabel}>Front of Room</span>
            <TeacherTable />
          </div>

          <div style={styles.divider} />

          <div style={styles.headerRow}>
            {HEADER_LABELS.map((label, i) => (
              <div key={i} style={styles.labelBadge(label === "EXTRA" || label === "Door" ? "dark" : "empty")}>
                {label}
              </div>
            ))}
          </div>

          <div style={styles.grid}>
            {Array.from({ length: ROWS }).map((_, r) => (
              <div key={r} style={styles.deskRow}>
                {Array.from({ length: COLS }).map((_, c) => (
                  <Desk key={c} />
                ))}
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
              Please report to your assigned room{' '}
              <span className="text-red-600 font-bold">at least 15 minutes</span> before the
              scheduled examination time. Students must wear the{' '}
              <span className="font-bold">college uniform</span> and bring their{' '}
              <span className="text-[#2d368e] font-bold">college ID card</span> along with all
              required documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
