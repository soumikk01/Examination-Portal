import { useState, useRef } from 'react';
import logo from '../assets/logo.png';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API = '/api/v1';
const getAuthHeaders = () => {
  const token = localStorage.getItem('examination_portal_admin_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const VENUE_ROOMS = {
  'C Block – CMS Building': [
    'C-301','C-302','C-303','C-304','C-305','C-306',
    'C-307','C-308','C-309','C-310','C-311',
    'C-405','C-407','C-408','C-409',
  ],
  'Main Building': [
    'MB-412','MB-413','MB-414','MB-415','MB-416','MB-417',
  ],
};

const COLLEGE_NAME   = 'JIS College of Engineering';
const CONTROLLER_NAME  = 'PARTHA RAY';
const CONTROLLER_TITLE = 'Controller of Examinations, JISCE';

// ─── STYLES ────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .sa2-wrap { font-family: 'Inter', sans-serif; }

  /* Controls */
  .sa2-controls {
    display: flex; gap: .75rem; align-items: flex-end;
    flex-wrap: wrap; background: #f8fafc;
    padding: 1rem 1.25rem; border-radius: 10px;
    border: 1px solid #e2e8f0; margin-bottom: 1.25rem;
  }
  .sa2-group { display: flex; flex-direction: column; gap: .3rem; }
  .sa2-group label { font-size: .7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
  .sa2-input {
    padding: .45rem .7rem; border: 1px solid #cbd5e1; border-radius: 6px;
    font-size: .875rem; color: #1e293b; background: white; min-width: 100px;
    outline: none; transition: border .15s;
  }
  .sa2-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
  .sa2-input:disabled { background: #f1f5f9; cursor: not-allowed; }

  .sa2-btn {
    padding: .45rem 1.1rem; border: none; border-radius: 6px;
    font-size: .85rem; font-weight: 600; cursor: pointer;
    transition: all .15s; display: inline-flex; align-items: center; gap: .4rem;
  }
  .sa2-btn-blue { background: #3b82f6; color: white; }
  .sa2-btn-blue:hover:not(:disabled) { background: #2563eb; }
  .sa2-btn-green { background: #16a34a; color: white; }
  .sa2-btn-green:hover:not(:disabled) { background: #15803d; }
  .sa2-btn:disabled { opacity: .5; cursor: not-allowed; }

  .sa2-status { font-size: .8rem; padding: .3rem .7rem; border-radius: 99px; font-weight: 500; }
  .sa2-ok  { background: #dcfce7; color: #166534; }
  .sa2-err { background: #fee2e2; color: #991b1b; }
  .sa2-loading { background: #dbeafe; color: #1e40af; }

  /* A4 Landscape container */
  .sa2-a4-outer {
    overflow-x: auto; margin-top: 1rem;
    background: #e5e7eb; padding: 1.5rem;
    border-radius: 8px;
  }
  .sa2-a4 {
    width: 297mm; min-height: 210mm;
    background: white; padding: 10mm 12mm;
    box-shadow: 0 4px 24px rgba(0,0,0,.18);
    position: relative; box-sizing: border-box;
    margin: 0 auto;
  }
  .sa2-a4.hide-shadow { box-shadow: none !important; }

  .sa2-lh { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 6px; }
  .sa2-lh img { height: 52px; width: 52px; object-fit: contain; }
  .sa2-lh-text { text-align: center; }
  .sa2-lh-text h1 { font-size: 13px; font-weight: 700; margin: 0 0 2px; }
  .sa2-lh-text p  { font-size: 10px; margin: 0; color: #444; }

  /* Info bar */
  .sa2-info {
    display: flex; border: 1.5px solid #222; font-size: 10px;
    font-weight: 700; margin-bottom: 0;
  }
  .sa2-ic {
    flex: 1; padding: 3px 6px; border-right: 1.5px solid #222;
    white-space: nowrap; font-size: 10px;
  }
  .sa2-ic:last-child { border-right: none; }
  .sa2-ic-sem { background: #1f2937; color: #fff; text-align: center; }

  /* Seating table */
  .sa2-table {
    width: 100%; border-collapse: collapse;
    table-layout: fixed; font-size: 9px;
    font-family: 'Calibri', Arial, sans-serif;
  }
  .sa2-table th, .sa2-table td {
    border: 1px solid #555; padding: 0;
    vertical-align: top; height: 22mm;
  }
  .sa2-table th { vertical-align: middle; padding: 3px 4px; font-size: 11px; font-weight: 700; text-align: center; }

  /* Column header types */
  .sa2-th-extra { background: #f5f5f5; }
  .sa2-th-door  { background: #f5f5f5; }
  .sa2-th-dept  { background: #fff; }

  /* Cell contents */
  .sa2-cell-extra { background: #f9f9f9; }
  .sa2-cell-door  { background: #f9f9f9; }
  .sa2-cell-seat {
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    height: 100%; padding: 2px 3px;
    font-size: 8.5px; line-height: 1.25;
    word-break: break-word; text-align: center;
  }
  .sa2-cell-seat strong { font-size: 9px; font-weight: 700; display: block; }
  .sa2-cell-seat span { display: block; }
  .sa2-cell-seat.is-extra {
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: #555; font-style: italic;
    background: #fafafa;
  }
  .sa2-cell-empty { height: 100%; }

  /* EXTRA / Door label cells */
  .sa2-label-cell {
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
    height: 100%;
  }
  .sa2-label-extra { color: #1a1a1a; }
  .sa2-label-door  { color: #1a1a1a; }
  .sa2-label-aisle { color: #1a1a1a; font-style: italic; opacity: 0.7; }

  /* Footer */
  .sa2-footer { margin-top: 8px; text-align: right; }
  .sa2-sig { display: inline-block; text-align: center; }
  .sa2-sig-line { width: 120px; border-top: 1px solid #333; margin: 0 auto 2px; }
  .sa2-sig strong { font-size: 9px; display: block; }
  .sa2-sig span   { font-size: 8px; color: #555; }

  .sa2-info-msg { font-size: .82rem; color: #64748b; margin-bottom: .75rem; }

  @media print {
    .sa2-a4-outer, .sa2-controls, .sa2-no-print { display: none !important; }
    .sa2-a4 { box-shadow: none !important; }
  }
`;

// ─── COMPONENT ────────────────────────────────────────────────────────────
export default function Seating() {
  const [venue, setVenue]       = useState('');
  const [room, setRoom]         = useState('');
  const [semester, setSemester] = useState('2');
  const [examType, setExamType] = useState('Class Test - I');
  const [year, setYear]         = useState(String(new Date().getFullYear()));

  const [seating, setSeating]   = useState(null); // fetched data
  const [status, setStatus]     = useState('idle'); // idle|loading|ok|err
  const [errMsg, setErrMsg]     = useState('');

  const printRef = useRef(null);

  // ── Fetch seating for selected room ───────────────────────────────────
  const handleGenerate = async () => {
    if (!room) { setErrMsg('Please select a room.'); return; }
    setStatus('loading'); setErrMsg(''); setSeating(null);
    try {
      const res = await fetch(`${API}/seating/room/${encodeURIComponent(room)}?semester=${semester}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSeating(data);
      setStatus('ok');
    } catch (e) {
      setErrMsg(e.message);
      setStatus('err');
    }
  };

  const handlePublish = async () => {
    if (!seating) return;
    try {
      const isCurrentlyPublished = seating.isPublished;
      const res = await fetch(`${API}/seating/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          examGroup: seating.examGroup,
          roomNo: seating.roomNo,
          publish: !isCurrentlyPublished
        })
      });
      if (!res.ok) throw new Error('Failed to update publication status');
      setSeating({ ...seating, isPublished: !isCurrentlyPublished });
    } catch (e) {
      setErrMsg(e.message);
    }
  };

  // ── PDF export ─────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    try {
      el.classList.add('hide-shadow');
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      el.classList.remove('hide-shadow');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();
      const H = (canvas.height * W) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, W, H);
      pdf.save(`seating-${room || 'preview'}.pdf`);
    } catch (e) {
      if (printRef.current) printRef.current.classList.remove('hide-shadow');
      setErrMsg('PDF export failed: ' + e.message);
    }
  };

  // ── Build table data ──────────────────────────────────────────────────
  const ROWS = seating ? seating.seatsPerColumn : 8;
  const columns = seating ? seating.columns : [];

  const deptTotals = {};
  if (seating) {
    for (const [dept, cnt] of Object.entries(seating.deptCounts || {})) {
      deptTotals[dept] = Number(cnt);
    }
  }

  const collapsedHeaders = [];
  if (columns.length) {
    for (const col of columns) {
      const prev = collapsedHeaders[collapsedHeaders.length - 1];
      if (prev && prev.dept === col.dept) { prev.span++; }
      else collapsedHeaders.push({ dept: col.dept, span: 1 });
    }
  }

  const venueLabel = venue || '--';

  return (
    <>
      <style>{styles}</style>
      <div className="sa2-wrap">
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 1rem' }}>📋 Seating Arrangement</h1>

        {/* Controls */}
        <div className="sa2-controls">
          <div className="sa2-group">
            <label>Venue</label>
            <select className="sa2-input" value={venue} onChange={e => { setVenue(e.target.value); setRoom(''); setSeating(null); setStatus('idle'); }}>
              <option value="">-- Select Venue --</option>
              {Object.keys(VENUE_ROOMS).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="sa2-group">
            <label>Room</label>
            <select className="sa2-input" value={room} onChange={e => { setRoom(e.target.value); setSeating(null); setStatus('idle'); }} disabled={!venue}>
              <option value="">-- Select Room --</option>
              {(VENUE_ROOMS[venue] || []).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="sa2-group">
            <label>Semester (1-8)</label>
            <select className="sa2-input" value={semester} onChange={e => { setSemester(e.target.value); setSeating(null); setStatus('idle'); }}>
              {Array.from({ length: 8 }, (_, i) => String(i + 1)).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="sa2-group">
            <label>Exam Type</label>
            <select className="sa2-input" value={examType} onChange={e => setExamType(e.target.value)}>
              <option>Class Test - I</option>
              <option>Class Test - II</option>
              <option>Mid Semester</option>
              <option>End Semester</option>
            </select>
          </div>

          <div className="sa2-group">
            <label>Year</label>
            <input type="text" className="sa2-input" value={year} onChange={e => setYear(e.target.value)} style={{ width: 80 }} />
          </div>

          <button className="sa2-btn sa2-btn-blue" onClick={handleGenerate} disabled={!room || status === 'loading'}>
            {status === 'loading' ? 'Loading…' : 'Generate'}
          </button>

          <button 
            className={`sa2-btn ${seating?.isPublished ? 'sa2-btn-blue' : 'sa2-btn-green'}`} 
            onClick={handlePublish} 
            disabled={!seating}
          >
            {seating?.isPublished ? 'Unpublish' : 'Publish'}
          </button>

          <button className="sa2-btn sa2-btn-green" onClick={handleDownloadPDF} disabled={!seating}>
            Download PDF
          </button>

          {status === 'ok'  && <span className="sa2-status sa2-ok">✓ Loaded</span>}
          {status === 'err' && <span className="sa2-status sa2-err">Error</span>}
        </div>

        {errMsg && <p style={{ color: '#b91c1c', fontSize: '.85rem', marginBottom: '.75rem' }}>⚠ {errMsg}</p>}

        {/* A4 PDF Preview */}
        <div className="sa2-a4-outer">
          <div className="sa2-a4" ref={printRef}>

            {/* Letterhead */}
            <div className="sa2-lh">
              <img src={logo} alt="JIS Logo" />
              <div className="sa2-lh-text">
                <h1>Seating Arrangement for {examType} &nbsp;–&nbsp; {parseInt(semester)%2===0?'EVEN':'ODD'} {year}</h1>
                <p><strong>{COLLEGE_NAME}</strong></p>
                <p>(Venue: {venueLabel})</p>
              </div>
            </div>

            {/* Info bar */}
            <div className="sa2-info">
              <div className="sa2-ic">Room No – {room || (seating?.roomNo) || '--'}</div>
              {seating
                ? collapsedHeaders.map((h, i) => (
                    <div key={i} className="sa2-ic">
                      {h.dept} – {deptTotals[h.dept] ?? ''}
                    </div>
                  ))
                : <div className="sa2-ic">DEPT – COUNT</div>
              }
              <div className="sa2-ic sa2-ic-sem">SEMESTER – {semester}</div>
            </div>

            {/* Seating table */}
            <table className="sa2-table">
              <thead>
                <tr>
                  {seating ? (
                    <>
                      <th className="sa2-th-dept" style={{ background: '#d1d5db' }}>EXTRA</th>
                      {seating.columns.length > 2 && (
                        <th className="sa2-th-dept" colSpan={seating.columns.length - 2}></th>
                      )}
                      {seating.columns.length > 1 && (
                        <th className="sa2-th-dept" style={{ background: '#d1d5db' }}>Door</th>
                      )}
                      {seating.columns.length === 1 && (
                        <th className="sa2-th-dept" style={{ background: '#d1d5db' }}>Door</th>
                      )}
                    </>
                  ) : (
                    <>
                      <th className="sa2-th-dept" style={{ background: '#d1d5db' }}>EXTRA</th>
                      <th className="sa2-th-dept" colSpan={3}></th>
                      <th className="sa2-th-dept" style={{ background: '#d1d5db' }}>Door</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS }, (_, ri) => (
                  <tr key={ri}>
                    {seating ? (
                      seating.columns.map((col, ci) => {
                        const seat = col.seats[ri];
                        if (!seat || !seat.label) {
                           return <td key={`empty-${ci}`}><div className="sa2-cell-empty" /></td>;
                        } else if (seat.isExtra) {
                           return <td key={`extra-seat-${ci}`}><div className="sa2-cell-seat is-extra">{seat.label === 'EXTRA' ? 'EXTRA' : seat.label}</div></td>;
                        } else {
                          return (
                            <td key={ci}>
                              <div className="sa2-cell-seat">
                                {seat.label}
                              </div>
                            </td>
                          );
                        }
                      })
                    ) : (
                      <>
                        <td key="0"><div className="sa2-cell-empty" /></td>
                        {Array.from({length:3}).map((_,ci) => (
                          <td key={ci + 1}><div className="sa2-cell-empty" /></td>
                        ))}
                        <td key="4"><div className="sa2-cell-empty" /></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="sa2-footer">
              <div className="sa2-sig">
                <div className="sa2-sig-line" />
                <strong>{CONTROLLER_NAME}</strong>
                <span>{CONTROLLER_TITLE}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
