/* eslint-disable no-console */
import { useState, useCallback, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = "/api/v1";
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("examination_portal_admin_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// UG and PG department columns
const UG_BRANCHES = ["AGE", "BME", "CE", "CSE", "AIML", "CST", "EE", "ECE", "IT", "ME"];
const PG_REGULAR_BRANCHES = ["BBA", "BBA-DM", "BBA-HM", "BCA", "MCSE", "EDPS", "MME", "MBA", "MCA"];
const PG_BACKLOG_BRANCHES = ["BBA", "BBA-DM", "BBA-HM", "BCA", "MCSE", "EDPS", "MME", "MBA", "MCA"];

const SECTIONS = [
  { key: "UG_REGULAR", label: "UG REGULAR", branches: UG_BRANCHES },
  { key: "UG_BACKLOG", label: "UG BACKLOG", branches: UG_BRANCHES },
  { key: "PG_REGULAR", label: "BBA+BCA + PG REGULAR", branches: PG_REGULAR_BRANCHES },
  { key: "PG_BACKLOG", label: "BBA+BCA + PG BACKLOG", branches: PG_BACKLOG_BRANCHES },
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
  .ra-btn-blue   { background: #3b82f6; color: white; }
  .ra-btn-blue:hover:not(:disabled)   { background: #2563eb; }
  .ra-btn-green  { background: #16a34a; color: white; }
  .ra-btn-green:hover:not(:disabled)  { background: #15803d; }
  .ra-btn-orange { background: #ea580c; color: white; }
  .ra-btn-orange:hover:not(:disabled) { background: #c2410c; }
  .ra-btn-gray   { background: #64748b; color: white; }
  .ra-btn-gray:hover:not(:disabled)   { background: #475569; }
  .ra-btn-violet { background: #7c3aed; color: white; }
  .ra-btn-violet:hover:not(:disabled) { background: #6d28d9; }
  .ra-btn-red    { background: #dc2626; color: white; }
  .ra-btn-red:hover:not(:disabled)    { background: #b91c1c; }
  .ra-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ra-save-banner {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    margin-bottom: 0.75rem;
    font-size: 0.83rem;
    color: #166534;
    font-weight: 500;
  }
  .ra-save-banner a {
    color: #15803d;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }

  .ra-status { font-size: 0.8rem; padding: 0.3rem 0.7rem; border-radius: 99px; font-weight: 500; }
  .ra-status-ok      { background: #dcfce7; color: #166534; }
  .ra-status-err     { background: #fee2e2; color: #991b1b; }
  .ra-status-loading { background: #dbeafe; color: #1e40af; }

  .ra-scroll { overflow-x: auto; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }

  .ra-table {
    border-collapse: collapse;
    font-family: 'Calibri', 'Arial Narrow', Arial, sans-serif;
    font-size: 10.5px;
    white-space: nowrap;
    width: 100%;
    table-layout: fixed;
  }
  .ra-table th, .ra-table td {
    border: 1px solid #9e9e9e;
    text-align: center;
    padding: 2px 3px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ra-th-room   { text-align: left; padding-left: 5px; font-weight: 700; background: #f2f2f2; font-size: 11px; vertical-align: middle; }
  .ra-th-section { background: #4472c4; color: #fff; font-weight: 700; font-size: 11.5px; letter-spacing: 0.2px; }
  .ra-th-venue  { background: #dce6f1; color: #1f3864; font-size: 10px; font-style: italic; font-weight: 600; }
  .ra-th-col    { background: #bdd7ee; color: #1f3864; font-weight: 700; font-size: 9.5px; }
  .ra-th-total  { background: #c6efce; color: #375623; font-weight: 800; font-size: 9.5px; }
  .ra-td-room   { text-align: left; padding-left: 5px; font-weight: 600; }
  .ra-td-val    { color: #1a1a1a; }
  .ra-td-total  { background: #e2efda !important; font-weight: 700; color: #375623; }

  .ra-row-student  { background: #f4b942; font-weight: 700; }
  .ra-row-avail    { background: #70ad47; color: #fff; font-weight: 700; }
  .ra-row-data td  { background: #ffffff; }
  .ra-row-data:hover td { background: #f0f7ff; }
  .ra-row-mb td    { background: #f7fbff; }
  .ra-row-mb:hover td { background: #ddeeff; }
  .ra-row-venue    { background: #d9e1f2; font-style: italic; font-size: 10px; color: #1f3864; font-weight: 600; }

  /* Auto-run selection styles */
  .ra-td-run-selected {
    background: #fdf4ff !important;
    outline: 2px solid #d946ef !important;
    outline-offset: -2px;
  }
  .ra-btn-purple { background: #d946ef; color: white; }
  .ra-btn-purple:hover:not(:disabled) { background: #c026d3; }

  /* Click-to-assign cell styles */
  .ra-td-clickable {
    cursor: pointer;
    transition: background 0.1s;
    position: relative;
    padding: 0 !important;
    min-height: 20px;
  }
  .ra-td-clickable:hover { background: #eff6ff !important; outline: 2px solid #3b82f6; outline-offset: -2px; }
  .ra-td-filled { background: #dbeafe !important; color: #1e3a5f !important; font-weight: 800; }
  .ra-td-editing { background: #fefce8 !important; }
  .ra-cell-inner { display: flex; align-items: center; justify-content: center; min-height: 20px; height: 100%; width: 100%; padding: 2px 3px; }
  .ra-cell-input {
    width: 40px; height: 20px; border: none; background: transparent;
    text-align: center; font-size: 10.5px; font-weight: 700; outline: none;
    color: #1e3a5f; padding: 0;
  }

  /* Student row cell highlights */
  .ra-student-cell-has  { background: #f59e0b !important; color: #1c1917 !important; font-weight: 800; }
  .ra-student-cell-has.ra-clickable:hover { box-shadow: inset 0 0 0 2px #b45309; cursor: pointer; }
  .ra-student-cell-done { background: #bbf7d0 !important; color: #14532d !important; font-weight: 700; }
  .ra-student-cell-over { background: #fca5a5 !important; color: #7f1d1d !important; font-weight: 800; }

  .ra-info { margin-bottom: 1rem; font-size: 0.82rem; color: #64748b; }
  .ra-divider { border-top: 2px solid #94a3b8; }

  .ra-hint {
    font-size: 0.78rem;
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function pad(v) {
  if (v === null || v === undefined || v === 0) return "";
  return typeof v === "number" && v < 10 ? `0${v}` : String(v);
}

function buildInitialRows() {
  return ALL_ROOMS_ORDERED.map(roomNo => {
    const isMB = roomNo.startsWith("MB");
    return { roomNo, isMB, capacity: null, UG_REGULAR: {}, UG_BACKLOG: {}, PG_REGULAR: {}, PG_BACKLOG: {} };
  });
}

// ─── PERSISTENCE KEY ─────────────────────────────────────────────────────────
const LS_KEY = "ra_allotment_state";

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function buildRowsFromPersisted(persisted, dbCapMap) {
  // Start with blank rows having DB capacities
  const base = buildInitialRows().map(r =>
    dbCapMap[r.roomNo] ? { ...r, capacity: dbCapMap[r.roomNo] } : r
  );
  if (!persisted?.rows) return base;
  // Merge persisted allocations into base (preserve capacity from DB)
  return base.map(r => {
    const p = persisted.rows.find(pr => pr.roomNo === r.roomNo);
    if (!p) return r;
    return { ...r, capacity: p.capacity ?? r.capacity, UG_REGULAR: p.UG_REGULAR || {}, UG_BACKLOG: p.UG_BACKLOG || {}, PG_REGULAR: p.PG_REGULAR || {}, PG_BACKLOG: p.PG_BACKLOG || {} };
  });
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function RoomAllotment() {
  const persisted = loadPersistedState();

  const [semester, setSemester] = useState(persisted?.semester || "");
  const [studentCounts, setStudentCounts] = useState(persisted?.studentCounts || null);
  const [fetchStatus, setFetchStatus] = useState(persisted?.studentCounts ? "ok" : "idle");
  const [rows, setRows] = useState(buildInitialRows()); // will be updated after DB cap fetch
  const [selVenue, setSelVenue] = useState("");
  const [selRoom, setSelRoom] = useState("");
  const [capInput, setCapInput] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [showSaveBanner, setShowSaveBanner] = useState(false);
  const [setBtnStatus, setSetBtnStatus] = useState("idle");
  const [showPgRegular, setShowPgRegular] = useState(false);
  const [showPgBacklog, setShowPgBacklog] = useState(false);
  const [dbCapacities, setDbCapacities] = useState({});

  // ── Auto-Run mode state ───────────────────────────────────────────────────
  const [autoRunMode, setAutoRunMode] = useState(false);
  const [selectedRunCells, setSelectedRunCells] = useState([]);

  // ── Click-to-edit state ────────────────────────────────────────────────────
  const [editingCell, setEditingCell] = useState(null); // { roomNo, secKey, branch }
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  // ── Persist state to localStorage on every change ────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ semester, studentCounts, rows }));
    } catch { /* quota exceeded – ignore */ }
  }, [semester, studentCounts, rows]);

  // Fetch initial room capacities & merge with persisted allocations
  useEffect(() => {
    fetch(`${API}/rooms`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map = {};
          data.forEach(r => { map[r.roomNo] = r.capacity; });
          setDbCapacities(map);
          // Merge DB capacities with persisted allocation data
          const saved = loadPersistedState();
          setRows(buildRowsFromPersisted(saved, map));
        }
      })
      .catch(e => console.error("Could not fetch room capacities", e));
  }, []);

  // ── Fetch student counts ────────────────────────────────────────────────────
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
      // NOTE: Do NOT reset allocations — preserve existing work
      setEditingCell(null);
    } catch (e) {
      console.error(e);
      setFetchStatus("error");
    }
  }, [semester]);

  // ── Venue/Room selection ───────────────────────────────────────────────────
  const handleVenueChange = (v) => { setSelVenue(v); setSelRoom(""); setCapInput(""); };
  const handleRoomChange = (r) => {
    setSelRoom(r);
    const existing = rows.find(row => row.roomNo === r);
    setCapInput(existing?.capacity ? String(existing.capacity) : "");
  };

  // ── Set capacity ───────────────────────────────────────────────────────────
  const handleSetCapacity = useCallback(async () => {
    const cap = parseInt(capInput, 10);
    if (!selRoom || !cap || cap <= 0) return;
    setSetBtnStatus("saving");
    try {
      await fetch(`${API}/rooms/${encodeURIComponent(selRoom)}/capacity`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ capacity: cap }),
      });
      setDbCapacities(prev => ({ ...prev, [selRoom]: cap }));
    } catch (e) { console.error(e); }
    setSetBtnStatus("idle");
    setRows(prev => prev.map(r => r.roomNo === selRoom ? { ...r, capacity: cap } : r));
  }, [selRoom, capInput]);

  // ── Save allotment ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const toSave = rows.filter(r => r.capacity);
    if (!toSave.length || !semester) { setSaveStatus("error"); return; }
    setSaveStatus("saving");
    try {
      await Promise.all(toSave.map(r =>
        fetch(`${API}/rooms/${encodeURIComponent(r.roomNo)}/capacity`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ capacity: r.capacity }),
        })
      ));
      const allotmentRooms = toSave.map(r => {
        const combined = {};
        SECTIONS.forEach(sec => {
          Object.entries(r[sec.key] || {}).forEach(([dept, count]) => {
            if (count > 0) combined[dept] = (combined[dept] || 0) + count;
          });
        });
        return { roomNo: r.roomNo, deptCounts: combined };
      });
      await fetch(`${API}/rooms/allotments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ semester, rooms: allotmentRooms }),
      });
      setSaveStatus("ok");
      setShowSaveBanner(true); // Show "go to seat allocation" banner
      setTimeout(() => setSaveStatus("idle"), 3000);
      // NOTE: Data is intentionally kept — do NOT reset rows/studentCounts
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }, [rows, semester]);

  // ── Reload Students (was Retry) – keeps allocations, re-fetches count ─────
  const handleReloadStudents = useCallback(async () => {
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
    } catch (e) {
      console.error(e);
      setFetchStatus("error");
    }
  }, [semester]);

  // ── Remove All Data – clears allocations + persisted state ────────────────
  const handleRemoveData = () => {
    if (!window.confirm("Remove all allocation data? This cannot be undone.")) return;
    const cleared = buildInitialRows().map(r => dbCapacities[r.roomNo] ? { ...r, capacity: dbCapacities[r.roomNo] } : r);
    setRows(cleared);
    setStudentCounts(null);
    setFetchStatus("idle");
    setSemester("");
    setSelVenue(""); setSelRoom(""); setCapInput("");
    setSaveStatus("idle");
    setShowSaveBanner(false);
    setEditingCell(null);
    setSelectedRunCells([]);
    setAutoRunMode(false);
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
  };

  // ── Auto-Run distribution logic ───────────────────────────────────────────
  const handleRunDistribution = useCallback(() => {
    if (selectedRunCells.length === 0 || !studentCounts) return;

    setRows(prevRows => {
      // Create deep copy to avoid mutating state directly
      const newRows = prevRows.map(r => ({
        ...r, UG_REGULAR: { ...r.UG_REGULAR }, UG_BACKLOG: { ...r.UG_BACKLOG },
        PG_REGULAR: { ...r.PG_REGULAR }, PG_BACKLOG: { ...r.PG_BACKLOG }
      }));

      const startRoomIndex = newRows.findIndex(r => r.roomNo === selectedRunCells[0].roomNo);
      if (startRoomIndex === -1) return prevRows;

      const targets = selectedRunCells.map(c => ({ secKey: c.secKey, branch: c.branch }));

      for (let i = startRoomIndex; i < newRows.length; i++) {
        const row = newRows[i];
        const capacity = row.capacity || 0;
        if (capacity <= 0) continue;

        // For each target, compute dynamically how many are STILL remaining
        const getRem = (secKey, branch) => {
          const total = studentCounts[secKey]?.[branch] || 0;
          const assigned = newRows.reduce((sum, r) => sum + (r[secKey]?.[branch] || 0), 0);
          return Math.max(0, total - assigned);
        };

        let needs = targets.map(t => ({ ...t, need: getRem(t.secKey, t.branch) })).filter(t => t.need > 0);
        if (needs.length === 0) break; // Reached end of requirement

        // Available room capacity
        let assignedInRoom = 0;
        SECTIONS.forEach(s => { Object.values(row[s.key] || {}).forEach(v => { assignedInRoom += (v || 0); }); });
        let availableInRoom = capacity - assignedInRoom;

        // Even round-robin distribution
        while (availableInRoom > 0 && needs.length > 0) {
          let assignedAny = false;
          for (let target of needs) {
            if (availableInRoom > 0 && target.need > 0) {
              row[target.secKey][target.branch] = (row[target.secKey][target.branch] || 0) + 1;
              target.need -= 1;
              availableInRoom -= 1;
              assignedAny = true;
            }
          }
          if (!assignedAny) break;
          // Purge satisfied needs
          needs = needs.filter(t => t.need > 0);
        }
      }
      return newRows;
    });

    // Clear selection after completion
    setSelectedRunCells([]);
  }, [selectedRunCells, studentCounts]);

  // ── Cell click: handling both Auto-run and Inline editor ──────────────────
  const handleCellClick = (roomNo, secKey, branch) => {
    if (!studentCounts) return; // can only assign after Generate

    if (autoRunMode) {
      // Toggle logic for Auto Run Mode
      setSelectedRunCells(prev => {
        // If they click a different room, clear selection and start fresh with this room
        if (prev.length > 0 && prev[0].roomNo !== roomNo) {
          return [{ roomNo, secKey, branch }];
        }
        // Otherwise toggle
        const exists = prev.find(c => c.secKey === secKey && c.branch === branch);
        if (exists) return prev.filter(c => !(c.secKey === secKey && c.branch === branch));
        return [...prev, { roomNo, secKey, branch }];
      });
      return;
    }

    // Normal inline edit logic
    const current = rows.find(r => r.roomNo === roomNo)?.[secKey]?.[branch] || 0;
    setEditingCell({ roomNo, secKey, branch });
    setEditValue(current > 0 ? String(current) : "");
    setTimeout(() => inputRef.current?.select(), 30);
  };

  // ── Commit inline edit ─────────────────────────────────────────────────────
  const commitEdit = useCallback((val) => {
    if (!editingCell) return;
    const { roomNo, secKey, branch } = editingCell;
    const num = Math.max(0, parseInt(val, 10) || 0);
    setRows(prev => prev.map(r =>
      r.roomNo !== roomNo ? r : { ...r, [secKey]: { ...r[secKey], [branch]: num } }
    ));
    setEditingCell(null);
    setEditValue("");
  }, [editingCell]);

  // ── Auto-fill a specific branch top-to-bottom ──────────────────────────────
  const handleAutoFill = (secKey, branch) => {
    const { remaining } = getRemaining(secKey, branch) || { remaining: 0 };
    if (remaining <= 0) return;

    let studentsToPlace = remaining;
    
    setRows(prevRows => {
      // Create deep copy to avoid mutating state directly
      const newRows = prevRows.map(r => ({
        ...r,
        UG_REGULAR: { ...r.UG_REGULAR },
        UG_BACKLOG: { ...r.UG_BACKLOG },
        PG_REGULAR: { ...r.PG_REGULAR },
        PG_BACKLOG: { ...r.PG_BACKLOG }
      }));

      for (let i = 0; i < newRows.length; i++) {
        if (studentsToPlace <= 0) break;
        
        const row = newRows[i];
        const capacity = row.capacity || 0;
        if (capacity === 0) continue;

        // Calculate currently assigned in this room across all sections/branches
        let assignedInRoom = 0;
        SECTIONS.forEach(s => {
          Object.values(row[s.key] || {}).forEach(v => { assignedInRoom += (v || 0); });
        });

        const availableInRoom = capacity - assignedInRoom;
        
        if (availableInRoom > 0) {
          const placeInt = Math.min(availableInRoom, studentsToPlace);
          const currentInBranch = row[secKey][branch] || 0;
          row[secKey][branch] = currentInBranch + placeInt;
          studentsToPlace -= placeInt;
        }
      }
      return newRows;
    });
  };

  // ── Download Excel: UG + PG all 4 sections in one sheet ───────────────────
  const handleDownloadExcel = () => {
    if (!studentCounts) return;
    const cBlockRows = rows.filter(r => !r.isMB);
    const mbRows = rows.filter(r => r.isMB);

    const aoa = [];

    // Row 1: Section headers
    const r1 = ["Room No"];
    SECTIONS.forEach(sec => {
      r1.push(sec.label);
      for (let i = 0; i < sec.branches.length; i++) r1.push("");
    });
    aoa.push(r1);

    // Row 2: Venue sub-header
    const r2 = [""];
    SECTIONS.forEach(sec => {
      r2.push("(Venue: C Block – Formerly known as CMS Building)");
      for (let i = 0; i < sec.branches.length; i++) r2.push("");
    });
    aoa.push(r2);

    // Row 3: Branch columns
    const r3 = [""];
    SECTIONS.forEach(sec => { sec.branches.forEach(b => r3.push(b)); r3.push("Total"); });
    aoa.push(r3);

    // Row 4: Student totals (original counts)
    const r4 = ["Student"];
    SECTIONS.forEach(sec => {
      sec.branches.forEach(b => r4.push(studentCounts[sec.key]?.[b] || ""));
      r4.push(sec.branches.reduce((s, b) => s + (studentCounts[sec.key]?.[b] || 0), 0) || "");
    });
    aoa.push(r4);

    // Row 5: Available
    const r5 = ["Available"];
    const totalCap = rows.reduce((s, r) => s + (r.capacity || 0), 0);
    SECTIONS.forEach(sec => {
      sec.branches.forEach(() => r5.push(""));
      r5.push(totalCap || "");
    });
    aoa.push(r5);

    // C Block data rows
    cBlockRows.forEach(r => {
      const row = [r.roomNo];
      SECTIONS.forEach(sec => {
        sec.branches.forEach(b => row.push(r[sec.key]?.[b] || ""));
        row.push(sec.branches.reduce((s, b) => s + (r[sec.key]?.[b] || 0), 0) || "");
      });
      aoa.push(row);
    });

    // MB separator
    const sep = [""];
    SECTIONS.forEach(sec => {
      sep.push("(Venue: Main Building)");
      for (let i = 0; i < sec.branches.length; i++) sep.push("");
    });
    aoa.push(sep);

    // MB data rows
    mbRows.forEach(r => {
      const row = [r.roomNo];
      SECTIONS.forEach(sec => {
        sec.branches.forEach(b => row.push(r[sec.key]?.[b] || ""));
        row.push(sec.branches.reduce((s, b) => s + (r[sec.key]?.[b] || 0), 0) || "");
      });
      aoa.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Merges: section header row + venue row + mbSep row
    const merges = [{ s: { r: 0, c: 0 }, e: { r: 2, c: 0 } }]; // "Room No" span 3 rows
    let colIdx = 1;
    SECTIONS.forEach(sec => {
      const len = sec.branches.length + 1;
      merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + len - 1 } }); // section header
      merges.push({ s: { r: 1, c: colIdx }, e: { r: 1, c: colIdx + len - 1 } }); // venue
      merges.push({ s: { r: 5 + cBlockRows.length, c: colIdx }, e: { r: 5 + cBlockRows.length, c: colIdx + len - 1 } }); // MB sep
      colIdx += len;
    });
    ws["!merges"] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Room Allotment");
    XLSX.writeFile(wb, `Room_Allotment_Sem_${semester}.xlsx`);
  };

  // ─── Computed values ──────────────────────────────────────────────────────
  const currentVenueRooms = selVenue ? (VENUES.find(v => v.label === selVenue)?.rooms || []) : [];
  const totalCapacityAssigned = rows.reduce((s, r) => s + (r.capacity || 0), 0);
  const totalStudentsAll = studentCounts
    ? SECTIONS.reduce((s, sec) => s + Object.values(studentCounts[sec.key] || {}).reduce((a, b) => a + b, 0), 0)
    : 0;

  const visibleSections = [
    showPgRegular ? SECTIONS[2] : SECTIONS[0],
    showPgBacklog ? SECTIONS[3] : SECTIONS[1],
  ];

  // ── Remaining students (total - assigned across all rooms) ─────────────────
  function getRemaining(secKey, branch) {
    if (!studentCounts) return null;
    const total = studentCounts[secKey]?.[branch] || 0;
    const assigned = rows.reduce((s, r) => s + (r[secKey]?.[branch] || 0), 0);
    return { total, assigned, remaining: total - assigned };
  }

  function getStudentRowVal(secKey, branch) {
    const { total, remaining } = getRemaining(secKey, branch) || { total: 0, remaining: 0 };
    if (total === 0) return null;
    return remaining; // show REMAINING
  }

  function getStudentRowTotal(secKey) {
    if (!studentCounts) return null;
    const sec = SECTIONS.find(x => x.key === secKey);
    const total = sec.branches.reduce((s, b) => s + (studentCounts[secKey]?.[b] || 0), 0);
    const remaining = sec.branches.reduce((s, b) => {
      const { remaining: r } = getRemaining(secKey, b) || { remaining: 0 };
      return s + Math.max(0, r);
    }, 0);
    return { total, remaining };
  }

  function getRoomVal(row, secKey, branch) {
    return row[secKey]?.[branch] || null;
  }

  function getRoomTotal(row, secKey) {
    const sec = SECTIONS.find(x => x.key === secKey);
    return sec.branches.reduce((s, b) => s + (row[secKey]?.[b] || 0), 0) || null;
  }

  // ── Render a data cell (clickable, inline-editable) ────────────────────────
  function renderDataCell(row, sec, b) {
    const v = getRoomVal(row, sec.key, b);
    const isEditing = editingCell?.roomNo === row.roomNo
      && editingCell?.secKey === sec.key
      && editingCell?.branch === b;
    const isRunSelected = selectedRunCells.some(
      c => c.roomNo === row.roomNo && c.secKey === sec.key && c.branch === b
    );

    return (
      <td
        key={sec.key + b}
        className={`ra-td-clickable${v ? " ra-td-filled" : ""}${isEditing ? " ra-td-editing" : ""}${isRunSelected ? " ra-td-run-selected" : ""}`}
        onClick={() => !isEditing && handleCellClick(row.roomNo, sec.key, b)}
        title={v ? `${b}: ${v} students → click to edit` : `Click to assign ${b} students here`}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            autoFocus
            type="number"
            min={0}
            className="ra-cell-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => commitEdit(editValue)}
            onKeyDown={e => {
              if (e.key === "Enter") commitEdit(editValue);
              if (e.key === "Escape") { setEditingCell(null); setEditValue(""); }
            }}
          />
        ) : (
          <span className="ra-cell-inner">{v ? pad(v) : ""}</span>
        )}
      </td>
    );
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="admin-card ra-page" style={{ padding: "1rem" }}>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Room Allotment</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {saveStatus === "ok"      && <span className="ra-status ra-status-ok">✓ Saved</span>}
            {saveStatus === "error"   && <span className="ra-status ra-status-err">Save failed</span>}
            {saveStatus === "saving"  && <span className="ra-status ra-status-loading">Saving…</span>}
          </div>
        </div>

        {/* Controls */}
        <div className="ra-controls">
          {/* Semester */}
          <div className="ra-group">
            <label>Semester</label>
            <select className="ra-input" value={semester} onChange={e => setSemester(e.target.value)}>
              <option value="">Select Semester</option>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          <button
            className="ra-btn ra-btn-blue"
            onClick={handleGenerate}
            disabled={!semester || fetchStatus === "loading"}
          >
            {fetchStatus === "loading" ? "Loading…" : "Generate"}
          </button>

          <div style={{ flex: 1 }} />

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

          <button
            className="ra-btn ra-btn-blue"
            onClick={handleSetCapacity}
            disabled={!selRoom || !capInput || setBtnStatus === "saving"}
            title="Set capacity for this room"
          >
            {setBtnStatus === "saving" ? "Saving..." : "Set"}
          </button>

          {/* Line Break to drop controls below Venue/Room/Capacity inputs */}
          <div style={{ flexBasis: "100%", height: 0, margin: "0.25rem 0" }} />

          {/* Auto Run Mode Toggle */}
          <button
            className={`ra-btn ${autoRunMode ? "ra-btn-purple" : "ra-btn-gray"}`}
            onClick={() => { setAutoRunMode(!autoRunMode); setSelectedRunCells([]); }}
            disabled={!studentCounts || fetchStatus !== "ok"}
            title="Toggle Auto Run Mode: click cells in a room, then evenly distribute students"
          >
            {autoRunMode ? "Exit Auto Run" : "Auto Run Mode"}
          </button>
          
          {autoRunMode && selectedRunCells.length > 0 && (
            <button
              className="ra-btn ra-btn-blue"
              onClick={handleRunDistribution}
            >
              Run Distribution
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Download Excel */}
          <button
            className="ra-btn ra-btn-gray"
            onClick={handleDownloadExcel}
            disabled={!studentCounts || fetchStatus !== "ok"}
            title="Download all 4 sections (UG Regular, UG Backlog, PG Regular, PG Backlog) in one Excel file"
          >
            Excel
          </button>

          {/* Save */}
          <button
            className="ra-btn ra-btn-green"
            onClick={handleSave}
            disabled={saveStatus === "saving" || !rows.some(r => r.capacity)}
          >
            {saveStatus === "saving" ? "Saving…" : "Save"}
          </button>

          {/* Reload Students */}
          <button
            className="ra-btn ra-btn-orange"
            onClick={handleReloadStudents}
            disabled={!semester || fetchStatus === "loading"}
            title="Re-fetch student counts for current semester without clearing allocations"
          >
            Reload Students
          </button>

          {/* Remove Data */}
          <button
            className="ra-btn ra-btn-red"
            onClick={handleRemoveData}
            title="Clear all allocation data and reset the table"
          >
            Remove Data
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
          </div>
        )}
        {fetchStatus === "idle" && (
          <div className="ra-info">
            Select a semester and click <strong>Generate</strong> to load student counts, then set room capacities.
          </div>
        )}

        {/* Post-save banner */}
        {showSaveBanner && (
          <div className="ra-save-banner">
            <span>✅ Room allotment saved successfully!</span>
            <span>Now go to <strong>Seat Allocation</strong> page and click <strong>Generate Seats</strong> to create seat labels.</span>
            <button
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#166534" }}
              onClick={() => setShowSaveBanner(false)}
              title="Dismiss"
            >✕</button>
          </div>
        )}

        {/* Hint after generate */}
        {fetchStatus === "ok" && (
          <div className="ra-hint">
            💡 <strong>Yellow cells</strong> in the <em>Student</em> row show <strong>remaining unassigned students</strong>.
            Click a yellow cell to <strong>auto-fill</strong> that branch top-to-bottom.
            You can also activate <strong>⚡ Auto Run Mode</strong>, multiselect departments in a room, and click <strong>▶ Run</strong> to evenly distribute them sequentially.
            Your progress is <strong>auto-saved</strong> — switching pages will not lose your data.
          </div>
        )}

        {/* Table */}
        <div className="ra-scroll">
          <table className="ra-table">
            <colgroup>
              <col style={{ width: 64 }} />
              {visibleSections.map(sec =>
                sec.branches.map((_, bi) => <col key={sec.key + bi} />).concat(
                  <col key={sec.key + "total"} style={{ width: 50 }} />
                )
              )}
            </colgroup>

            <thead>
              {/* Row 1: Section headers (clickable to toggle UG/PG) */}
              <tr>
                <th className="ra-th-room" rowSpan={3}>Room<br />No</th>
                {visibleSections.map(sec => (
                  <th
                    key={sec.key}
                    className="ra-th-section"
                    colSpan={sec.branches.length + 1}
                    onClick={() => {
                      if (sec.key.includes("REGULAR")) setShowPgRegular(!showPgRegular);
                      if (sec.key.includes("BACKLOG")) setShowPgBacklog(!showPgBacklog);
                    }}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Click to switch between UG and PG"
                  >
                    {sec.label} ↔
                  </th>
                ))}
              </tr>

              {/* Row 2: Venue */}
              <tr>
                {visibleSections.map(sec => (
                  <th key={sec.key} className="ra-th-venue" colSpan={sec.branches.length + 1}>
                    (Venue: C Block – Formerly known as CMS Building)
                  </th>
                ))}
              </tr>

              {/* Row 3: Branch columns */}
              <tr>
                {visibleSections.map(sec => (
                  <>
                    {sec.branches.map(b => <th key={sec.key + b} className="ra-th-col">{b}</th>)}
                    <th key={sec.key + "T"} className="ra-th-total">Total</th>
                  </>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Student row: shows REMAINING unassigned students per branch */}
              <tr className="ra-row-student">
                <td className="ra-td-room">Student</td>
                {visibleSections.map(sec => {
                  const totals = getStudentRowTotal(sec.key);
                  return (
                    <>
                      {sec.branches.map(b => {
                        const rem = getStudentRowVal(sec.key, b);
                        const { total } = getRemaining(sec.key, b) || { total: 0 };
                        let cellClass = "";
                        if (rem === null || total === 0) cellClass = "";
                        else if (rem < 0) cellClass = "ra-student-cell-over";
                        else if (rem === 0) cellClass = "ra-student-cell-done";
                        else cellClass = "ra-student-cell-has" + (rem > 0 ? " ra-clickable" : "");
                        
                        return (
                          <td 
                            key={sec.key + b} 
                            className={cellClass} 
                            title={rem > 0 ? `Click to auto-fill ${rem} ${b} students into available rooms` : (rem !== null && total > 0 ? `${b}: ${Math.max(0,rem)} remaining / ${total} total` : "")}
                            onClick={() => { if (rem > 0) handleAutoFill(sec.key, b); }}
                          >
                            {rem !== null && rem > 0 ? pad(rem) : (rem === 0 && total > 0 ? "✓" : "")}
                          </td>
                        );
                      })}
                      <td key={sec.key + "T"} className="ra-td-total">
                        {totals ? (totals.remaining > 0 ? pad(totals.remaining) : (totals.total > 0 ? "✓" : "")) : ""}
                      </td>
                    </>
                  );
                })}
              </tr>

              {/* Available (total room capacity) row */}
              <tr className="ra-row-avail">
                <td className="ra-td-room" style={{ color: "#fff" }}>Available</td>
                {visibleSections.map(sec => (
                  <>
                    {sec.branches.map(b => <td key={sec.key + b}></td>)}
                    <td key={sec.key + "T"} style={{ background: "#4ea72c", color: "#fff", fontWeight: 700 }}>
                      {totalCapacityAssigned > 0 ? totalCapacityAssigned : ""}
                    </td>
                  </>
                ))}
              </tr>

              {/* C Block rooms (clickable cells) */}
              {rows.filter(r => !r.isMB).map(row => (
                <tr key={row.roomNo} className="ra-row-data" style={row.roomNo === selRoom ? { outline: "2px solid #3b82f6" } : {}}>
                  <td className="ra-td-room">{row.roomNo}</td>
                  {visibleSections.map(sec => (
                    <>
                      {sec.branches.map(b => renderDataCell(row, sec, b))}
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
                {visibleSections.map((sec, si) => (
                  <td key={sec.key} colSpan={sec.branches.length + 1} style={{ textAlign: "center" }}>
                    {si === 0 ? "(Venue: Main Building)" : ""}
                  </td>
                ))}
              </tr>

              {/* Main Building rooms (clickable cells) */}
              {rows.filter(r => r.isMB).map(row => (
                <tr key={row.roomNo} className="ra-row-mb" style={row.roomNo === selRoom ? { outline: "2px solid #3b82f6" } : {}}>
                  <td className="ra-td-room">{row.roomNo}</td>
                  {visibleSections.map(sec => (
                    <>
                      {sec.branches.map(b => renderDataCell(row, sec, b))}
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
