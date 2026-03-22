import { useState, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = "/api/v1";
const getAuthHeaders = () => {
  const token = localStorage.getItem("examination_portal_admin_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// UG and PG department columns
const UG_BRANCHES = ["AGE", "BME", "CE", "CSE", "AIML", "CST", "EE", "ECE", "IT", "ME"];
const PG_BRANCHES = ["CSE", "ECE", "ME", "CE", "EE"];

// All 4 exam type sections
const SECTIONS = [
  { key: "UG_REGULAR", label: "UG REGULAR", branches: UG_BRANCHES },
  { key: "UG_BACKLOG", label: "UG BACKLOG", branches: UG_BRANCHES },
  { key: "PG_REGULAR", label: "PG REGULAR", branches: PG_BRANCHES },
  { key: "PG_BACKLOG", label: "PG BACKLOG", branches: PG_BRANCHES },
];

const VENUES = [
  { label: "C Block – CMS Building", rooms: ["C-301","C-302","C-303","C-304","C-305","C-306","C-307","C-308","C-309","C-310","C-311","C-405","C-407","C-408","C-409"] },
  { label: "Main Building", rooms: ["MB-412","MB-413","MB-414","MB-415","MB-416","MB-417"] },
];
const ALL_ROOMS_ORDERED = [...VENUES[0].rooms, ...VENUES[1].rooms];

const SEMESTERS = Array.from({ length: 8 }, (_, i) => String(i + 1));

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .ra-page { font-family: 'Inter', sans-serif; padding: 0; }

  .ra-controls {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
    flex-wrap: wrap;
    background: #f8fafc;
    padding: 1rem 1.25rem;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    margin-bottom: 1.25rem;
  }

  .ra-group { display: flex; flex-direction: column; gap: 0.3rem; }
  .ra-group label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .ra-input {
    padding: 0.45rem 0.7rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #1e293b;
    background: white;
    min-width: 130px;
    outline: none;
    transition: border 0.15s;
  }
  .ra-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .ra-input:disabled { background: #f1f5f9; cursor: not-allowed; }
  .ra-input[type=number] { min-width: 90px; }

  .ra-btn {
    padding: 0.45rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
  }
  .ra-btn-blue { background: #3b82f6; color: white; }
  .ra-btn-blue:hover:not(:disabled) { background: #2563eb; }
  .ra-btn-green { background: #16a34a; color: white; }
  .ra-btn-green:hover:not(:disabled) { background: #15803d; }
  .ra-btn-orange { background: #ea580c; color: white; }
  .ra-btn-orange:hover:not(:disabled) { background: #c2410c; }
  .ra-btn-gray { background: #94a3b8; color: white; }
  .ra-btn-gray:hover:not(:disabled) { background: #64748b; }
  .ra-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ra-status {
    font-size: 0.8rem;
    padding: 0.3rem 0.7rem;
    border-radius: 99px;
    font-weight: 500;
  }
  .ra-status-ok { background: #dcfce7; color: #166534; }
  .ra-status-err { background: #fee2e2; color: #991b1b; }
  .ra-status-loading { background: #dbeafe; color: #1e40af; }

  .ra-scroll { overflow-x: auto; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }

  .ra-table {
    border-collapse: collapse;
    font-family: 'Calibri', 'Arial Narrow', Arial, sans-serif;
    font-size: 10.5px;
    white-space: nowrap;
  }
  .ra-table th, .ra-table td {
    border: 1px solid #9e9e9e;
    text-align: center;
    padding: 2px 3px;
    line-height: 1.3;
  }
  .ra-th-room {
    width: 56px; min-width: 56px;
    text-align: left;
    padding-left: 5px;
    font-weight: 700;
    background: #f2f2f2;
    font-size: 11px;
    vertical-align: middle;
  }
  .ra-th-section {
    background: #4472c4;
    color: #fff;
    font-weight: 700;
    font-size: 11.5px;
    letter-spacing: 0.2px;
  }
  .ra-th-venue {
    background: #dce6f1;
    color: #1f3864;
    font-size: 10px;
    font-style: italic;
    font-weight: 600;
  }
  .ra-th-col {
    background: #bdd7ee;
    color: #1f3864;
    font-weight: 700;
    font-size: 9.5px;
    width: 34px; min-width: 34px;
  }
  .ra-th-total {
    background: #c6efce;
    color: #375623;
    font-weight: 800;
    font-size: 9.5px;
    width: 38px; min-width: 38px;
  }
  .ra-td-room {
    text-align: left;
    padding-left: 5px;
    font-weight: 600;
  }
  .ra-td-val { color: #1a1a1a; }
  .ra-td-total { background: #e2efda !important; font-weight: 700; color: #375623; }

  .ra-row-student { background: #f4b942; font-weight: 700; }
  .ra-row-avail   { background: #70ad47; color: #fff; font-weight: 700; }
  .ra-row-data td { background: #ffffff; }
  .ra-row-data:hover td { background: #f0f7ff; }
  .ra-row-mb td { background: #f7fbff; }
  .ra-row-mb:hover td { background: #ddeeff; }
  .ra-row-venue {
    background: #d9e1f2;
    font-style: italic;
    font-size: 10px;
    color: #1f3864;
    font-weight: 600;
  }

  .ra-info { margin-bottom: 1rem; font-size: 0.82rem; color: #64748b; }
  .ra-divider { border-top: 2px solid #94a3b8; }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function pad(v) {
  if (v === null || v === undefined || v === 0) return "";
  return typeof v === "number" && v < 10 ? `0${v}` : String(v);
}

function buildInitialRows() {
  return ALL_ROOMS_ORDERED.map(roomNo => {
    const isMB = roomNo.startsWith("MB");
    return {
      roomNo,
      isMB,
      capacity: null,
      // For each section key, map of branch→count
      UG_REGULAR: {},
      UG_BACKLOG: {},
      PG_REGULAR: {},
      PG_BACKLOG: {},
    };
  });
}

// Auto-distribute students into rooms given a queue per section
function distributeStudents(studentCounts, rooms) {
  // Build queues: flatten branch→count into ordered list of { branch, count }
  const queues = {};
  for (const s of SECTIONS) {
    const counts = studentCounts[s.key] || {};
    // queue as ordered array of { branch, remaining }
    queues[s.key] = s.branches
      .filter(b => (counts[b] || 0) > 0)
      .map(b => ({ branch: b, remaining: counts[b] || 0 }));
  }

  // Reset per-section allocations in rooms
  const newRooms = rooms.map(r => ({
    ...r,
    UG_REGULAR: {},
    UG_BACKLOG: {},
    PG_REGULAR: {},
    PG_BACKLOG: {},
  }));

  for (const s of SECTIONS) {
    let queue = queues[s.key].map(q => ({ ...q })); // deep copy
    let queueIdx = 0;
    let branchInnerOffset = 0;

    for (let ri = 0; ri < newRooms.length; ri++) {
      const room = newRooms[ri];
      const cap = room.capacity || 0;
      if (cap === 0) continue;
      if (queueIdx >= queue.length) break;

      let filled = 0;
      while (filled < cap && queueIdx < queue.length) {
        const cur = queue[queueIdx];
        const canFill = Math.min(cur.remaining, cap - filled);
        if (canFill > 0) {
          newRooms[ri][s.key][cur.branch] = (newRooms[ri][s.key][cur.branch] || 0) + canFill;
          cur.remaining -= canFill;
          filled += canFill;
        }
        if (cur.remaining === 0) queueIdx++;
      }
    }
  }
  return newRooms;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function RoomAllotment() {
  const [semester, setSemester] = useState("");

  // Student counts fetched from backend
  const [studentCounts, setStudentCounts] = useState(null); // null = not fetched
  const [fetchStatus, setFetchStatus] = useState("idle"); // idle|loading|ok|error

  // Room rows state
  const [rows, setRows] = useState(buildInitialRows());

  // Controls for setting a room capacity
  const [selVenue, setSelVenue] = useState("");
  const [selRoom, setSelRoom] = useState("");
  const [capInput, setCapInput] = useState("");

  // Save status
  const [saveStatus, setSaveStatus] = useState("idle"); // idle|saving|ok|error

  // ── Fetch student counts from backend ──────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!semester) return;
    setFetchStatus("loading");
    setStudentCounts(null);
    try {
      const res = await fetch(`${API}/rooms/student-counts?semester=${encodeURIComponent(semester)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStudentCounts(data);
      setFetchStatus("ok");
      // Re-distribute students with existing room capacities
      setRows(prev => distributeStudents(data, prev));
    } catch (e) {
      console.error(e);
      setFetchStatus("error");
    }
  }, [semester]);

  // ── Venue change ────────────────────────────────────────────────────────────
  const handleVenueChange = (v) => { setSelVenue(v); setSelRoom(""); setCapInput(""); };

  // ── Room change → auto fill capacity if already set ─────────────────────────
  const handleRoomChange = (r) => {
    setSelRoom(r);
    const existing = rows.find(row => row.roomNo === r);
    setCapInput(existing?.capacity ? String(existing.capacity) : "");
  };

  // ── Set capacity for chosen room (and auto-distribute) ─────────────────────
  const handleSetCapacity = useCallback(() => {
    const cap = parseInt(capInput, 10);
    if (!selRoom || !cap || cap <= 0) return;

    setRows(prev => {
      const updated = prev.map(r => r.roomNo === selRoom ? { ...r, capacity: cap } : r);
      if (studentCounts) return distributeStudents(studentCounts, updated);
      return updated;
    });
  }, [selRoom, capInput, studentCounts]);

  // ── Save: PATCH capacity for each room that has one ───────────────────────
  const handleSave = useCallback(async () => {
    const toSave = rows.filter(r => r.capacity);
    if (!toSave.length) return;
    setSaveStatus("saving");
    try {
      await Promise.all(toSave.map(r =>
        fetch(`${API}/rooms/${encodeURIComponent(r.roomNo)}/capacity`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ capacity: r.capacity }),
        })
      ));
      setSaveStatus("ok");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }, [rows]);

  // ── Retry: clear all allocations ─────────────────────────────────────────
  const handleRetry = () => {
    setRows(buildInitialRows());
    setStudentCounts(null);
    setFetchStatus("idle");
    setSemester("");
    setSelVenue("");
    setSelRoom("");
    setCapInput("");
    setSaveStatus("idle");
  };

  // ─── Computed values ───────────────────────────────────────────────────────
  const currentVenueRooms = selVenue
    ? (VENUES.find(v => v.label === selVenue)?.rooms || [])
    : [];

  // Section totals for "Student" row (from studentCounts) and "Available" row (room capacity sum)
  const totalCapacityAssigned = rows.reduce((s, r) => s + (r.capacity || 0), 0);
  const totalStudentsAll = studentCounts
    ? SECTIONS.reduce((s, sec) =>
        s + Object.values(studentCounts[sec.key] || {}).reduce((a, b) => a + b, 0), 0)
    : 0;

  // Title
  const semLabel = semester
    ? `${semester === "1" ? "1ST" : semester === "2" ? "2ND" : semester === "3" ? "3RD" : `${semester}TH`} SEMESTER`
    : "—";
  const yearLabel = !semester ? "—" : parseInt(semester) <= 2 ? "1ST YEAR" : parseInt(semester) <= 4 ? "2ND YEAR" : parseInt(semester) <= 6 ? "3RD YEAR" : "4TH YEAR";

  // ─── Render helpers ──────────────────────────────────────────────────────
  function sectionColCount(secKey) {
    const s = SECTIONS.find(x => x.key === secKey);
    return s ? s.branches.length + 1 : 1; // +1 for Total
  }

  function getStudentRowVal(secKey, branch) {
    return studentCounts ? (studentCounts[secKey]?.[branch] || 0) : null;
  }

  function getStudentRowTotal(secKey) {
    if (!studentCounts) return null;
    const sec = SECTIONS.find(x => x.key === secKey);
    return sec.branches.reduce((s, b) => s + (studentCounts[secKey]?.[b] || 0), 0);
  }

  function getSectionTotal(secKey) {
    // Sum of capacity across all rooms (Available = total capacity that exists)
    return rows.reduce((s, r) => s + (r.capacity || 0), 0);
  }

  function getRoomVal(row, secKey, branch) {
    return row[secKey]?.[branch] || null;
  }

  function getRoomTotal(row, secKey) {
    const sec = SECTIONS.find(x => x.key === secKey);
    return sec.branches.reduce((s, b) => s + (row[secKey]?.[b] || 0), 0) || null;
  }

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="admin-card ra-page" style={{ padding: "1rem" }}>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Room Allotment</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {saveStatus === "ok" && <span className="ra-status ra-status-ok">✓ Saved</span>}
            {saveStatus === "error" && <span className="ra-status ra-status-err">Save failed</span>}
            {saveStatus === "saving" && <span className="ra-status ra-status-loading">Saving…</span>}
          </div>
        </div>

        {/* Controls */}
        <div className="ra-controls">
          {/* Semester */}
          <div className="ra-group">
            <label>Semester</label>
            <select className="ra-input" value={semester} onChange={e => setSemester(e.target.value)}>
              <option value="">Select Semester</option>
              {SEMESTERS.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Generate */}
          <button
            className="ra-btn ra-btn-blue"
            onClick={handleGenerate}
            disabled={!semester || fetchStatus === "loading"}
          >
            {fetchStatus === "loading" ? "Loading…" : "⚡ Generate"}
          </button>

          <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch", margin: "0 0.25rem" }} />

          {/* Venue */}
          <div className="ra-group">
            <label>Venue</label>
            <select className="ra-input" value={selVenue} onChange={e => handleVenueChange(e.target.value)}>
              <option value="">Select Venue</option>
              {VENUES.map(v => <option key={v.label} value={v.label}>{v.label}</option>)}
            </select>
          </div>

          {/* Room */}
          <div className="ra-group">
            <label>Room</label>
            <select className="ra-input" value={selRoom} onChange={e => handleRoomChange(e.target.value)} disabled={!selVenue}>
              <option value="">Select Room</option>
              {currentVenueRooms.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Capacity */}
          <div className="ra-group">
            <label>Capacity</label>
            <input
              type="number"
              className="ra-input"
              placeholder="e.g. 40"
              value={capInput}
              onChange={e => setCapInput(e.target.value)}
              min={1}
              style={{ width: 90 }}
            />
          </div>

          {/* Set */}
          <button
            className="ra-btn ra-btn-blue"
            onClick={handleSetCapacity}
            disabled={!selRoom || !capInput}
            title="Set capacity for this room and auto-distribute students"
          >
            Set
          </button>

          <div style={{ flex: 1 }} />

          {/* Save */}
          <button
            className="ra-btn ra-btn-green"
            onClick={handleSave}
            disabled={saveStatus === "saving" || !rows.some(r => r.capacity)}
          >
            💾 Save
          </button>

          {/* Retry */}
          <button className="ra-btn ra-btn-orange" onClick={handleRetry}>
            🔄 Retry
          </button>
        </div>

        {/* Status messages */}
        {fetchStatus === "error" && (
          <div className="ra-info" style={{ color: "#b91c1c" }}>
            ⚠ Failed to fetch student data. Check your connection and try Generate again.
          </div>
        )}
        {fetchStatus === "ok" && studentCounts && (
          <div className="ra-info" style={{ color: "#047857", fontWeight: 500 }}>
            ✓ Loaded student data for Semester {semester}. Total: {totalStudentsAll} students.
            {" "}Set room capacities above to allocate students automatically.
          </div>
        )}
        {fetchStatus === "idle" && (
          <div className="ra-info">
            Select a semester and click <strong>Generate</strong> to load student counts, then set room capacities.
          </div>
        )}

        {/* Table */}
        <div className="ra-scroll">
          <table className="ra-table">
            <colgroup>
              <col style={{ width: 56 }} />
              {SECTIONS.map(sec =>
                sec.branches.map((_, bi) => <col key={sec.key + bi} style={{ width: 34 }} />).concat(
                  <col key={sec.key + "total"} style={{ width: 40 }} />
                )
              )}
            </colgroup>

            <thead>
              {/* Row 1: Section headers */}
              <tr>
                <th className="ra-th-room" rowSpan={3}>Room<br />No</th>
                {SECTIONS.map(sec => (
                  <th key={sec.key} className="ra-th-section" colSpan={sec.branches.length + 1}>
                    {sec.label}
                  </th>
                ))}
              </tr>

              {/* Row 2: Venue */}
              <tr>
                {SECTIONS.map(sec => (
                  <th key={sec.key} className="ra-th-venue" colSpan={sec.branches.length + 1}>
                    (Venue: C Block – Formerly known as CMS Building)
                  </th>
                ))}
              </tr>

              {/* Row 3: Branch cols */}
              <tr>
                {SECTIONS.map(sec => (
                  <>
                    {sec.branches.map(b => (
                      <th key={sec.key + b} className="ra-th-col">{b}</th>
                    ))}
                    <th key={sec.key + "T"} className="ra-th-total">Total</th>
                  </>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Student row */}
              <tr className="ra-row-student">
                <td className="ra-td-room">Student</td>
                {SECTIONS.map(sec => (
                  <>
                    {sec.branches.map(b => {
                      const v = getStudentRowVal(sec.key, b);
                      return <td key={sec.key + b}>{v !== null && v > 0 ? pad(v) : ""}</td>;
                    })}
                    <td key={sec.key + "T"} className="ra-td-total">
                      {(() => { const t = getStudentRowTotal(sec.key); return t !== null && t > 0 ? pad(t) : ""; })()}
                    </td>
                  </>
                ))}
              </tr>

              {/* Available (capacity) row */}
              <tr className="ra-row-avail">
                <td className="ra-td-room" style={{ color: "#fff" }}>Available</td>
                {SECTIONS.map(sec => (
                  <>
                    {sec.branches.map(b => (
                      <td key={sec.key + b}></td>
                    ))}
                    <td key={sec.key + "T"} className="ra-td-total" style={{ background: "#4ea72c !important", color: "#fff" }}>
                      {totalCapacityAssigned > 0 ? totalCapacityAssigned : ""}
                    </td>
                  </>
                ))}
              </tr>

              {/* C Block rooms */}
              {rows.filter(r => !r.isMB).map(row => (
                <tr key={row.roomNo} className="ra-row-data" style={row.roomNo === selRoom ? { outline: "2px solid #3b82f6" } : {}}>
                  <td className="ra-td-room">{row.roomNo}</td>
                  {SECTIONS.map(sec => (
                    <>
                      {sec.branches.map(b => {
                        const v = getRoomVal(row, sec.key, b);
                        return <td key={sec.key + b} className={v ? "ra-td-val" : ""}>{v ? pad(v) : ""}</td>;
                      })}
                      <td key={sec.key + "T"} className="ra-td-total">
                        {(() => { const t = getRoomTotal(row, sec.key); return t ? pad(t) : ""; })()}
                      </td>
                    </>
                  ))}
                </tr>
              ))}

              {/* Main Building venue divider */}
              <tr className="ra-row-venue ra-divider">
                <td className="ra-td-room" />
                {SECTIONS.map((sec, si) => (
                  <td key={sec.key} colSpan={sec.branches.length + 1} style={{ textAlign: "center" }}>
                    {si === 0 ? "(Venue: Main Building)" : ""}
                  </td>
                ))}
              </tr>

              {/* Main Building rooms */}
              {rows.filter(r => r.isMB).map(row => (
                <tr key={row.roomNo} className="ra-row-mb" style={row.roomNo === selRoom ? { outline: "2px solid #3b82f6" } : {}}>
                  <td className="ra-td-room">{row.roomNo}</td>
                  {SECTIONS.map(sec => (
                    <>
                      {sec.branches.map(b => {
                        const v = getRoomVal(row, sec.key, b);
                        return <td key={sec.key + b} className={v ? "ra-td-val" : ""}>{v ? pad(v) : ""}</td>;
                      })}
                      <td key={sec.key + "T"} className="ra-td-total">
                        {(() => { const t = getRoomTotal(row, sec.key); return t ? pad(t) : ""; })()}
                      </td>
                    </>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
