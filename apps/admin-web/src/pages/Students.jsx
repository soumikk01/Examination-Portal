import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';
import { Upload, FileSpreadsheet, Download, Trash2, CheckCircle, AlertCircle, Users, UserPlus, Loader2 } from 'lucide-react';
import { useBulkImport } from '../contexts/BulkImportContext';

// ── Column mapping: Excel/CSV header → DB field ──────────────────────────────
const COLUMN_MAP = {
  'collegeid': 'collegeId',
  'college id': 'collegeId',
  'college_id': 'collegeId',
  'name': 'name',
  'studentroll': 'studentRoll',
  'student roll': 'studentRoll',
  'student_roll': 'studentRoll',
  'roll': 'studentRoll',
  'roll number': 'studentRoll',
  'roll_number': 'studentRoll',
  'roll no': 'studentRoll',
  'department': 'department',
  'depertment': 'department',
  'dept': 'department',
  'studentreg': 'studentReg',
  'student reg': 'studentReg',
  'student_reg': 'studentReg',
  'registration': 'studentReg',
  'registration number': 'studentReg',
  'registration numner': 'studentReg',
  'reg number': 'studentReg',
  'reg no': 'studentReg',
  'reg': 'studentReg',
  // Both examination sem and semester map to the same field: semester
  'examinationsem': 'semester',
  'examination sem': 'semester',
  'examination_sem': 'semester',
  'examsem': 'semester',
  'semester': 'semester',
  'sem': 'semester',
  'batch': 'batch',
  'program': 'program',
  'branch': 'branch',
  'degree': 'degree',
};

// Simplified template — a single 'semester' column, no separate examinationSem
const TEMPLATE_HEADERS = [
  'collegeId', 'name', 'studentRoll', 'department', 'semester', 'studentReg', 'batch',
];

// Preview columns shown in the table (includes auto-detected fields)
const PREVIEW_HEADERS = [
  'collegeId', 'name', 'studentRoll', 'department', 'semester', 'studentReg', 'batch', 'program', 'degree',
];

const initialForm = {
  collegeId: '', name: '', department: '', degree: '',
  studentRoll: '', studentReg: '', batch: '', 
  program: '', semester: '',
};

// ── Build program/branch lookup map from fetched options ─────────────────────
// branchLookup: { 'CSE' -> { code:'BTECH', name:'B.Tech' }, ... }
function buildBranchLookup(allPrograms) {
  const map = {};
  for (const prog of allPrograms) {
    for (const branch of prog.branches) {
      // branch is now { name, degree }
      map[branch.name.toUpperCase()] = { code: prog.code, name: branch.degree };
    }
  }
  return map;
}


// ── Parse a file into rows ────────────────────────────────────────────────────
function parseFile(file, branchLookup = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (raw.length < 2) { resolve([]); return; }

        const headers = raw[0].map(h => String(h).trim());
        const rows = raw.slice(1).filter(r => r.some(c => c !== ''));

        const mapped = rows.map(row => {
          const obj = {};
          headers.forEach((h, i) => {
            const key = COLUMN_MAP[h.toLowerCase()];
            if (key) obj[key] = String(row[i] ?? '').trim();
          });

          // Sync collegeId ↔ studentRoll
          if (!obj.collegeId && obj.studentRoll) obj.collegeId = obj.studentRoll;
          if (!obj.studentRoll && obj.collegeId) obj.studentRoll = obj.collegeId;

          // ── AUTO-DETECT program & degree from branch or department ──────────
          const lookupKey = (obj.branch || obj.department || '').toUpperCase();
          if (lookupKey && branchLookup[lookupKey]) {
            const found = branchLookup[lookupKey];
            if (!obj.program) obj.program = found.code;   // e.g. UG / PG
            if (!obj.degree)  obj.degree  = found.name;   // e.g. Undergraduate / Postgraduate
          }

          // ── Ensure branch and department are synchronized ──────────────────
          if (!obj.branch && obj.department) obj.branch = obj.department;
          if (!obj.department && obj.branch) obj.department = obj.branch;

          return obj;
        }).filter(r => r.collegeId && r.studentRoll);

        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Download template ─────────────────────────────────────────────────────────
function downloadTemplate() {
  const exampleRow = ['JIS001', 'John Doe', 'R001', 'CSE', '3', 'REG001', '2022-26'];
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, exampleRow]);
  // Style header row
  TEMPLATE_HEADERS.forEach((_, ci) => {
    const key = XLSX.utils.encode_cell({ r: 0, c: ci });
    ws[key] = ws[key] || { v: TEMPLATE_HEADERS[ci], t: 's' };
    ws[key].s = {
      fill: { fgColor: { rgb: 'FF4472C4' } },
      font: { color: { rgb: 'FFFFFFFF' }, bold: true },
      alignment: { horizontal: 'center' },
    };
  });
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, 'Student_Bulk_Upload_Template.xlsx');
}

// ── Main Component ────────────────────────────────────────────────────────────
const Students = () => {
  // Individual form
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [branchLookup, setBranchLookup] = useState({});  // for auto-detection

  // Bulk upload
  const {
    bulkRows, setBulkRows,
    bulkFileName, setBulkFileName,
    bulkStatus, setBulkStatus,
    bulkResult, setBulkResult,
    bulkError, setBulkError,
    handleBulkSubmit, handleClearBulk: contextClearBulk
  } = useBulkImport();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/options/programs').then(d => setPrograms(Array.isArray(d) ? d : [])).catch(() => setPrograms([]));
    // Fetch all programs+branches for auto-detection during file upload
    api.get('/options/all-programs')
      .then(d => { if (Array.isArray(d)) setBranchLookup(buildBranchLookup(d)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.program) { setBranches([]); setSemesters([]); return; }
    const ctrl = new AbortController();
    Promise.all([
      api.get('/options/branches', { params: { program: form.program }, signal: ctrl.signal }).then(d => setBranches(Array.isArray(d) ? d : [])),
      api.get('/options/semesters', { params: { program: form.program }, signal: ctrl.signal }).then(d => setSemesters(Array.isArray(d) ? d : [])),
    ]).catch(err => { if (err?.code !== 'ERR_CANCELED') { setBranches([]); setSemesters([]); } });
    return () => ctrl.abort();
  }, [form.program]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'program') { next.branch = ''; next.semester = ''; }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    
    // 'department' is required because it maps to 'branch' — must not be empty
    const requiredFields = ['collegeId', 'name', 'studentRoll', 'department', 'studentReg', 'batch', 'program', 'semester'];
    const newErrors = requiredFields.filter(f => !form[f]?.trim());
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors([]), 800);
      return;
    }

    const payload = { 
      ...form, 
      branch: form.department.trim(), // Department (Branch) is required — already validated above
      program: form.program || undefined, 
      semester: form.semester || undefined 
    };

    api.post('/student', payload)
      .then(() => { setMessage('Student registered successfully.'); setForm(initialForm); })
      .catch(err => setMessage(getUserFriendlyApiError(err, 'Registration failed')));
  };

  // ── Bulk file handling ──
  const handleFileSelect = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) {
      setBulkError('Only .csv, .xls, .xlsx files are supported.');
      return;
    }
    setBulkError('');
    setBulkResult(null);
    setBulkStatus('loading');
    try {
      // Pass branchLookup so auto-detection works immediately
      const rows = await parseFile(file, branchLookup);
      setBulkRows(rows);
      setBulkFileName(file.name);
      setBulkStatus('idle');
    } catch {
      setBulkError('Could not parse the file. Please check the format.');
      setBulkStatus('idle');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleClearBulk = () => {
    contextClearBulk();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputStyle = { padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <>
      <style>{`
        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .shake-animation {
          animation: error-shake 0.4s ease-in-out;
        }
      `}</style>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem', fontWeight: 700 }}>Students</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Left: Individual Registration ── */}
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <UserPlus size={20} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Register Student</h2>
          </div>
          <p style={{ marginBottom: '1rem', fontSize: '0.83rem', color: 'var(--admin-text-muted)' }}>Add a new student individually. You must be signed in as admin to register students.</p>

          {message && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: 8, background: message.includes('success') ? '#f0fdf4' : '#fff5f5', border: `1px solid ${message.includes('success') ? '#86efac' : '#fca5a5'}`, color: message.includes('success') ? '#166534' : '#dc2626', fontSize: '0.83rem' }}>
              {message.includes('success') ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { name: 'collegeId', placeholder: 'College ID', required: true },
              { name: 'name', placeholder: 'Full Name', required: true },
              { name: 'studentRoll', placeholder: 'Student Roll', required: true },
              { name: 'department', placeholder: 'Department (Branch)' },
              { name: 'studentReg', placeholder: 'Student Registration No.' },
              { name: 'batch', placeholder: 'Batch (e.g., 2022-26)' },
            ].map(f => {
              const isError = errors.includes(f.name);
              return (
                <input 
                  key={f.name} 
                  type="text" 
                  name={f.name} 
                  placeholder={f.placeholder} 
                  value={form[f.name]} 
                  onChange={handleChange} 
                  className={isError ? 'shake-animation' : ''}
                  style={{
                    ...inputStyle,
                    borderColor: isError ? '#ef4444' : 'var(--admin-border)',
                    backgroundColor: isError ? '#fef2f2' : 'white',
                    transition: 'all 0.2s ease'
                  }} 
                />
              );
            })}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <select name="program" value={form.program} onChange={handleChange} className={errors.includes('program') ? 'shake-animation' : ''} style={{ ...inputStyle, borderColor: errors.includes('program') ? '#ef4444' : 'var(--admin-border)', backgroundColor: errors.includes('program') ? '#fef2f2' : 'white', transition: 'all 0.2s ease' }}>
                <option value="">Program</option>
                {programs.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
              <select name="semester" value={form.semester} onChange={handleChange} disabled={!form.program} className={errors.includes('semester') ? 'shake-animation' : ''} style={{ ...inputStyle, borderColor: errors.includes('semester') ? '#ef4444' : 'var(--admin-border)', backgroundColor: errors.includes('semester') ? '#fef2f2' : 'white', transition: 'all 0.2s ease' }}>
                <option value="">Semester</option>
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '0.25rem' }}>Register</button>
          </form>
        </div>

        {/* ── Right: Bulk Upload ── */}
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Users size={20} color="#10b981" />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Bulk Registration</h2>
            </div>
            <button
              onClick={downloadTemplate}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', borderRadius: 7, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
              title="Download blank Excel template"
            >
              <Download size={13} /> Template
            </button>
          </div>
          <p style={{ marginBottom: '1rem', fontSize: '0.83rem', color: 'var(--admin-text-muted)' }}>
            Upload a <strong>.csv</strong>, <strong>.xls</strong>, or <strong>.xlsx</strong> file with student records. 
            Download the template above to see the expected format. Max 1000 rows per upload.
          </p>

          {/* Drop Zone */}
          {!bulkRows.length && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#3b82f6' : '#d1d5db'}`,
                borderRadius: 10,
                padding: '2.5rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? '#eff6ff' : '#f9fafb',
                transition: 'all 0.2s',
                marginBottom: '1rem',
              }}
            >
              <FileSpreadsheet size={36} color={isDragging ? '#3b82f6' : '#9ca3af'} style={{ marginBottom: '0.6rem' }} />
              <p style={{ margin: 0, fontWeight: 600, color: isDragging ? '#1d4ed8' : '#374151', fontSize: '0.9rem' }}>
                {bulkStatus === 'loading' ? 'Parsing file…' : 'Drag & drop your file here'}
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {/* Error */}
          {bulkError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', borderRadius: 8, background: '#fff5f5', border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.83rem', marginBottom: '1rem' }}>
              <AlertCircle size={14} /> {bulkError}
            </div>
          )}

          {/* Success Result */}
          {bulkResult && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle size={16} /> Bulk Import Complete
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                {[
                  { label: 'Submitted', value: bulkResult.submitted, color: '#374151' },
                  { label: 'Created', value: bulkResult.created, color: '#16a34a' },
                  { label: 'Skipped (Dup)', value: bulkResult.skipped, color: '#d97706' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '0.5rem', background: 'white', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {bulkRows.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet size={15} color="#6b7280" />
                  <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>
                    {bulkFileName} — <span style={{ color: '#3b82f6' }}>{bulkRows.length} row{bulkRows.length !== 1 ? 's' : ''}</span> ready
                  </span>
                </div>
                <button onClick={handleClearBulk} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Clear">
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Scrollable preview */}
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 280, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: 700 }}>#</th>
                      {PREVIEW_HEADERS.map(h => (
                        <th key={h} style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'left', color: ['program','degree'].includes(h) ? '#7c3aed' : '#475569', fontWeight: 700 }}>
                          {h}{['program','degree'].includes(h) ? ' ✦' : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.slice(0, 50).map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', color: '#9ca3af', textAlign: 'center' }}>{i + 1}</td>
                        {PREVIEW_HEADERS.map(h => (
                          <td key={h} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', color: ['program','degree'].includes(h) && row[h] ? '#7c3aed' : '#374151', fontWeight: ['program','degree'].includes(h) && row[h] ? 600 : 400 }}>{row[h] || ''}</td>
                        ))}
                      </tr>
                    ))}
                    {bulkRows.length > 50 && (
                      <tr>
                        <td colSpan={TEMPLATE_HEADERS.length + 1} style={{ padding: '6px', textAlign: 'center', color: '#9ca3af', fontSize: '0.72rem', border: '1px solid #e2e8f0' }}>
                          …and {bulkRows.length - 50} more rows (preview limited to 50)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  onClick={handleBulkSubmit}
                  disabled={bulkStatus === 'loading' || bulkStatus === 'success'}
                  className="admin-btn admin-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    opacity: bulkStatus === 'loading' ? 0.7 : 1,
                    background: bulkStatus === 'success' ? '#10b981' : '',
                    borderColor: bulkStatus === 'success' ? '#059669' : '',
                  }}
                >
                  <style>
                    {`
                      @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                      }
                    `}
                  </style>
                  {bulkStatus === 'loading' ? (
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : bulkStatus === 'success' ? (
                    <CheckCircle size={15} />
                  ) : (
                    <Upload size={15} />
                  )}
                  {bulkStatus === 'loading'
                    ? 'Importing…'
                    : bulkStatus === 'success'
                    ? 'Import Complete'
                    : `Import ${bulkRows.length} Students`}
                </button>
                <button onClick={handleClearBulk} className="admin-btn" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>
                  Clear
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
};

export default Students;
