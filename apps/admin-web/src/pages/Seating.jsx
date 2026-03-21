import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';
import logo from '../assets/logo.png';

const VENUE_ROOMS = {
  'CMS Building': [
    'C-301', 'C-302', 'C-303', 'C-304', 'C-305', 'C-306',
    'C-307', 'C-308', 'C-309', 'C-310', 'C-311',
    'C-405', 'C-407', 'C-408', 'C-409',
  ],
  'Main Building': [
    'MB-412', 'MB-413', 'MB-414', 'MB-415', 'MB-416', 'MB-417',
  ],
};

// E = EXTRA label, D = Door label, null = normal seat
const DUMMY_ROWS = [
  ["E",   null, null, null, "D"],
  [null,  null, null, null, null],
  [null,  null, null, null, null],
  [null,  null, null, null, null],
  [null,  null, null, null, null],
  [null,  null, null, null, null],
  [null,  null, null, null, null],
  [null,  null, null, null, null],
  [null,  null, null, null, null],
];

const COLLEGE_NAME = 'JIS College of Engineering';
const CONTROLLER_NAME = 'PARTHA RAY';
const CONTROLLER_TITLE = 'Controller of Examinations, JISCE';

const Seating = () => {
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [seatingData, setSeatingData] = useState(null);
  const [allotmentData, setAllotmentData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [examType, setExamType] = useState('Class Test - I');
  const [semesterType, setSemesterType] = useState('ODD');
  const [examYear, setExamYear] = useState(new Date().getFullYear().toString());
  const printRef = useRef(null);

  // Pick up examGroup from URL query param (set by Rooms page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eg = params.get('examGroup');
    if (eg) setSelectedGroup(eg);
  }, []);



  // Load allotment info when group changes (for room info/dept counts shown in header)
  useEffect(() => {
    if (!selectedGroup) { setAllotmentData(null); setSeatingData(null); return; }
    api.get(`/rooms/allotment/${encodeURIComponent(selectedGroup)}`)
      .then(d => setAllotmentData(d))
      .catch(() => setAllotmentData(null));
  }, [selectedGroup]);

  const handleGenerate = async () => {
    if (!selectedGroup) { setError('Select an exam group first.'); return; }
    setError('');
    setGenerating(true);
    try {
      await api.post('/seating/generate', { examGroup: selectedGroup });
      await loadSeating();
    } catch (err) {
      setError(getUserFriendlyApiError(err, 'Failed to generate seating'));
    } finally {
      setGenerating(false);
    }
  };

  const loadSeating = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/seating/${encodeURIComponent(selectedGroup)}`);
      setSeatingData(data);
      if (data?.rooms?.length > 0) setSelectedRoom(data.rooms[0].roomNo);
    } catch (err) {
      if (err?.response?.status !== 404) {
        setError(getUserFriendlyApiError(err, 'Failed to load seating'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) return;

    try {
      el.classList.add('hide-shadow-for-print'); // remove shadow
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      el.classList.remove('hide-shadow-for-print');

      const imgData = canvas.toDataURL('image/png');
      
      // Use Portrait A4 to stack two A4 Landscapes perfectly!
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgH = (canvas.height * pdfWidth) / canvas.width;

      // Print exactly 2 copies on the same page top and bottom, so invigilators get 2 copies
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgH);
      pdf.addImage(imgData, 'PNG', 0, imgH, pdfWidth, imgH);

      pdf.save(`seating-${selectedRoom || selectedGroup || 'preview'}.pdf`);
    } catch (err) {
      if (el) el.classList.remove('hide-shadow-for-print');
      setError('PDF export failed: ' + err.message);
    }
  };

  const handleExportAllRooms = async () => {
    if (!seatingData?.rooms) return;

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Use Portrait A4 to stack two A4 Landscapes perfectly!
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      let roomIndex = 0;

      for (const room of seatingData.rooms) {
        setSelectedRoom(room.roomNo);
        // Wait longer if we are doing thousands of rooms, but 400ms is fine for small batches.
        await new Promise(r => setTimeout(r, 400)); // slight increase for clean re-render

        const el = document.getElementById('seating-print-area');
        if (!el) continue;

        el.classList.add('hide-shadow-for-print');
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        el.classList.remove('hide-shadow-for-print');

        const imgData = canvas.toDataURL('image/png');
        const imgH = (canvas.height * pdfWidth) / canvas.width;

        // Add a new page every 2 rooms (since we put 2 rooms per page in portrait)
        if (roomIndex > 0 && roomIndex % 2 === 0) pdf.addPage();
        
        // Even indices go on top (yOffset = 0), odd indices go on bottom (yOffset = imgH)
        const yOffset = (roomIndex % 2 === 0) ? 0 : imgH;
        pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, imgH);
        
        roomIndex++;
      }

      pdf.save(`seating-all-rooms-${selectedGroup}.pdf`);
    } catch (err) {
      const el = document.getElementById('seating-print-area');
      if (el) el.classList.remove('hide-shadow-for-print');
      setError('PDF export failed: ' + err.message);
    }
  };

  // Parse examGroup for display info
  const parseExamGroup = (eg) => {
    if (!eg) return {};
    const parts = eg.split('-');
    return {
      semester: parts[0]?.replace('SEM', ''),
      program: parts[1],
      examMode: parts.slice(2).join('-'),
    };
  };

  const groupInfo = parseExamGroup(selectedGroup);

  // Get the room data currently selected
  const currentRoom = seatingData?.rooms?.find(r => r.roomNo === selectedRoom);
  const currentAllotment = allotmentData?.allocations?.find(a => a.roomNo === selectedRoom);

  // Build column header dept counts for the current room
  const buildHeaderCounts = (room) => {
    if (!room) return [];
    return room.columns.map(col => {
      const nonExtra = col.seats.filter(s => !s.isExtra).length;
      return { dept: col.dept, count: nonExtra };
    });
  };

  // Collapse adjacent same-dept header labels for display
  const collapseHeaders = (cols) => {
    const headers = [];
    for (const col of cols) {
      const prev = headers[headers.length - 1];
      if (prev && prev.dept === col.dept) {
        prev.span++;
      } else {
        headers.push({ dept: col.dept, span: 1, count: col.count });
      }
    }
    return headers;
  };

  const headerCols = currentRoom ? buildHeaderCounts(currentRoom) : [];
  const collapsedHeaders = collapseHeaders(headerCols);

  // Build table rows from columns
  const numRows = currentRoom ? Math.max(...currentRoom.columns.map(c => c.seats.length)) : 0;
  const tableRows = [];
  for (let ri = 0; ri < numRows; ri++) {
    const row = [];
    row.push({ type: 'extra' });
    if (currentRoom) {
      currentRoom.columns.forEach(col => {
        row.push({ type: 'seat', data: col.seats[ri] });
      });
    }
    row.push({ type: 'door' });
    tableRows.push(row);
  }

  return (
    <>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem' }}>📋 Seating Arrangement</h1>

      {/* Controls */}
      <div className="admin-card">
        <h2>Generate &amp; View Seating</h2>
        <div className="seating-controls" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          
          <div className="room-filter-group">
            <label className="room-filter-label">Venue</label>
            <select
              value={selectedVenue}
              onChange={e => { setSelectedVenue(e.target.value); setSelectedRoom(''); }}
              className="room-filter-select"
            >
              <option value="">-- Select Venue --</option>
              <option value="Main Building">Main Building</option>
              <option value="CMS Building">CMS Building</option>
            </select>
          </div>

          <div className="room-filter-group">
            <label className="room-filter-label">Room</label>
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="room-filter-select"
              disabled={!selectedVenue}
            >
              <option value="">-- Select Room --</option>
              {(selectedVenue ? VENUE_ROOMS[selectedVenue] : [])?.map(roomNo => (
                <option key={roomNo} value={roomNo}>{roomNo}</option>
              ))}
            </select>
          </div>


          <div className="room-filter-group">
            <label className="room-filter-label">Exam Type</label>
            <select
              value={examType}
              onChange={e => setExamType(e.target.value)}
              className="room-filter-select"
            >
              <option value="Class Test - I">Class Test - I</option>
              <option value="Class Test - II">Class Test - II</option>
              <option value="Mid Semester">Mid Semester</option>
              <option value="End Semester">End Semester</option>
            </select>
          </div>

          <div className="room-filter-group">
            <label className="room-filter-label">Semester (Odd/Even)</label>
            <select
              value={semesterType}
              onChange={e => setSemesterType(e.target.value)}
              className="room-filter-select"
            >
              <option value="ODD">ODD</option>
              <option value="EVEN">EVEN</option>
            </select>
          </div>

          <div className="room-filter-group">
            <label className="room-filter-label">Year</label>
            <input
              type="text"
              value={examYear}
              onChange={e => setExamYear(e.target.value)}
              className="room-filter-select"
              style={{ width: '80px' }}
            />
          </div>

          <button
            className="admin-btn admin-btn-primary"
            onClick={handleGenerate}
            disabled={generating || !selectedGroup}
            style={{ marginBottom: '4px' }}
          >
            {generating ? '⏳ Generating…' : '⚡ Generate'}
          </button>

          {!seatingData && selectedGroup && (
            <button className="admin-btn admin-btn-primary" onClick={loadSeating} disabled={loading} style={{ marginBottom: '4px' }}>
              {loading ? '⏳ Loading…' : '📂 Load Existing'}
            </button>
          )}

        </div>

        {error && <p className="admin-status-err" style={{ marginTop: '0.75rem' }}>{error}</p>}
      </div>

      {/* Seating Sheet */}
      {currentRoom && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="admin-btn admin-btn-primary" onClick={handleExportPDF}>
              📄 Download Room PDF
            </button>
            {seatingData?.rooms?.length > 1 && (
              <button className="admin-btn admin-btn-primary" onClick={handleExportAllRooms}>
                📦 Download All Rooms PDF
              </button>
            )}
          </div>
          <div className="sa-a4-container" style={{ marginTop: '0.5rem' }}>
            <div className="sa-a4-page" id="seating-print-area" ref={printRef}>
              <div className="sa-wrap">
            
            {/* Letterhead */}
            <div className="sa-lh">
              <img src={logo} alt="JIS Logo" className="sa-logo-img" />
              <div className="sa-lh-text">
                <h1>Seating Arrangement for {examType} – {groupInfo.program ? groupInfo.program + ' – ' : ''}{semesterType} {examYear}</h1>
                <p><strong>{COLLEGE_NAME}</strong></p>
                <p>(Venue: {selectedVenue || '--'})</p>
              </div>
            </div>
      
            {/* Info bar */}
            <div className="sa-info">
              <div className="sa-ic">Room No – {currentRoom.roomNo}</div>
              {collapsedHeaders.map((h, i) => (
                <div key={i} className="sa-ic">{h.dept} = {h.count}</div>
              ))}
              <div className="sa-ic sa-ic--semester">SEMESTER – {groupInfo.semester || 'N/A'}</div>
            </div>
      
            {/* Seating table */}
            <table className="sa-table">
              <thead>
                <tr>
                  <th>EXTRA</th>
                  {currentRoom.columns.map((col, idx) => (
                    <th key={idx}>{col.dept}</th>
                  ))}
                  <th>Door</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>
                        {cell.type === 'extra' && (
                          ri === 0 ? <div className="sa-label sa-label--extra">EXTRA</div> : <div className="sa-seat" />
                        )}
                        {cell.type === 'door' && (
                          ri === 0 ? <div className="sa-label sa-label--door">Door</div> : <div className="sa-seat" />
                        )}
                        {cell.type === 'seat' && (
                          cell.data ? (
                            cell.data.isExtra ? (
                              <div className="sa-seat">
                                <span className="sa-label sa-label--extra" style={{ minHeight: 'auto', fontSize: '11px' }}>EXTRA</span>
                              </div>
                            ) : (
                              <div className="sa-seat sa-seat--filled">
                                <span className="seat-dept" style={{ fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>
                                  {cell.data.dept}
                                </span>
                                <span className="seat-name" style={{ fontSize: '12px', textAlign: 'center', margin: '2px 0' }}>
                                  {cell.data.studentName || '—'}
                                </span>
                                <span className="seat-roll" style={{ fontSize: '11px', textAlign: 'center', color: '#555' }}>
                                  {cell.data.rollNo || '—'}
                                </span>
                              </div>
                            )
                          ) : (
                            <div className="sa-seat">
                              <div className="sa-line" />
                              <div className="sa-line sa-line--short" />
                              <div className="sa-line" />
                            </div>
                          )
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
      
            {/* Footer */}
            <div className="sa-footer">
              <div className="sa-sig">
                <div className="sa-sig-line" />
                <strong>{CONTROLLER_NAME}</strong>
                <span>{CONTROLLER_TITLE}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Empty state */}
      {selectedGroup && !seatingData && !generating && !loading && (
        <div className="admin-card">
          <p style={{ color: 'var(--admin-text-muted)' }}>
            No seating data yet for <strong>{selectedGroup}</strong>. Click{' '}
            <strong>Generate Seating</strong> to create the seating arrangement.
          </p>
        </div>
      )}

      {/* Static Dummy Preview when no data is loaded */}
      {!currentRoom && (
        <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="admin-btn admin-btn-primary" onClick={handleExportPDF}>
            📄 Download Preview PDF
          </button>
        </div>
        <div className="sa-a4-container" style={{ opacity: 0.8, filter: 'grayscale(0.1)', marginTop: '0.5rem' }}>
          <div className="sa-a4-page" id="seating-print-area" ref={printRef}>
            <div className="sa-wrap" style={{ pointerEvents: 'none' }}>
            
            {/* Letterhead */}
            <div className="sa-lh">
              <img src={logo} alt="JIS Logo" className="sa-logo-img" />
              <div className="sa-lh-text">
                <h1>Seating Arrangement for {examType} – {groupInfo?.program ? groupInfo.program + ' – ' : ''}{semesterType} {examYear}</h1>
                <p><strong>{COLLEGE_NAME}</strong></p>
                <p>(Venue: {selectedVenue || '--'})</p>
              </div>
            </div>
      
            {/* Info bar */}
            <div className="sa-info">
              <div className="sa-ic">Room No – {selectedRoom || 'C-206'}</div>
              <div className="sa-ic">CE = 05</div>
              <div className="sa-ic">CSE (AIML) = 24</div>
              <div className="sa-ic">BME = 08</div>
              <div className="sa-ic sa-ic--semester">SEMESTER – {groupInfo?.semester || '3'}</div>
            </div>
      
            {/* Seating table */}
            <table className="sa-table">
              <thead>
                <tr><th /><th /><th /><th /><th /></tr>
              </thead>
              <tbody>
                {DUMMY_ROWS.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>
                        {cell === "E" && (
                          <div className="sa-label sa-label--extra">EXTRA</div>
                        )}
                        {cell === "D" && (
                          <div className="sa-label sa-label--door">Door</div>
                        )}
                        {cell === null && (
                          <div className="sa-seat">
                            <div className="sa-line" />
                            <div className="sa-line sa-line--short" />
                            <div className="sa-line" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
      
            {/* Footer */}
            <div className="sa-footer">
              <div className="sa-sig">
                <div className="sa-sig-line" />
                <strong>{CONTROLLER_NAME}</strong>
                <span>{CONTROLLER_TITLE}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </>
  );
};

export default Seating;
