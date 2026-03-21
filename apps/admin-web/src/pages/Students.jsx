import { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const initialForm = {
  collegeId: '',
  name: '',
  department: '',
  degree: '',
  studentRoll: '',
  studentReg: '',
  examinationSem: '',
  batch: '',
  program: '',
  branch: '',
  semester: '',
};

const Students = () => {
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(initialForm);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  
  // Viewer states
  const [filterProgram, setFilterProgram] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterBranches, setFilterBranches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    api.get('/options/programs').then((data) => setPrograms(Array.isArray(data) ? data : [])).catch(() => setPrograms([]));
  }, []);

  useEffect(() => {
    if (!form.program) {
      setBranches([]);
      setSemesters([]);
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      api.get('/options/branches', { params: { program: form.program }, signal }).then((data) => setBranches(Array.isArray(data) ? data : [])),
      api.get('/options/semesters', { params: { program: form.program }, signal }).then((data) => setSemesters(Array.isArray(data) ? data : [])),
    ]).catch((err) => {
      if (err?.code !== 'ERR_CANCELED') {
        setBranches([]);
        setSemesters([]);
      }
    });
    return () => controller.abort();
  }, [form.program]);

  useEffect(() => {
    if (!filterProgram) {
      setFilterBranches([]);
      return;
    }
    const controller = new AbortController();
    api.get('/options/branches', { params: { program: filterProgram }, signal: controller.signal })
      .then((data) => setFilterBranches(Array.isArray(data) ? data : []))
      .catch(() => setFilterBranches([]));
    return () => controller.abort();
  }, [filterProgram]);

  const fetchStudents = () => {
    setLoadingStudents(true);
    api.get('/student', { params: { program: filterProgram, branch: filterBranch } })
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch((err) => setMessage(getUserFriendlyApiError(err, 'Failed to fetch students')))
      .finally(() => setLoadingStudents(false));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'program') {
        next.branch = '';
        next.semester = '';
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    const payload = {
      ...form,
      program: form.program || undefined,
      branch: form.branch || undefined,
      semester: form.semester || undefined,
    };
    api.post('/student', payload)
      .then(() => {
        setMessage('Student registered successfully.');
        setForm(initialForm);
      })
      .catch((err) =>
        setMessage(getUserFriendlyApiError(err, 'Registration failed'))
      );
  };

  return (
    <>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem' }}>Students</h1>
      <div className="admin-card">
        <h2>Register student</h2>
        <p style={{ marginBottom: '1rem' }}>Add a new student. You must be signed in as admin (email + password) to register students.</p>
        {message && (
          <p className={message.includes('success') ? 'admin-status-ok' : 'admin-status-err'} style={{ marginBottom: '0.75rem' }}>
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}>
          <input
            type="text"
            name="collegeId"
            placeholder="College ID"
            value={form.collegeId}
            onChange={handleChange}
            required
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
          />
          <input
            type="text"
            name="studentRoll"
            placeholder="Student Roll"
            value={form.studentRoll}
            onChange={handleChange}
            required
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
          />
          <input
            type="text"
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
          />
          <input
            type="text"
            name="studentReg"
            placeholder="Student Reg"
            value={form.studentReg}
            onChange={handleChange}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
          />
          <input
            type="text"
            name="examinationSem"
            placeholder="Examination Sem"
            value={form.examinationSem}
            onChange={handleChange}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
          />
          <input
            type="text"
            name="batch"
            placeholder="Batch"
            value={form.batch}
            onChange={handleChange}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <select
              name="program"
              value={form.program}
              onChange={handleChange}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            >
              <option value="">Program</option>
              {programs.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
            <select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              disabled={!form.program}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            >
              <option value="">Branch</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              name="semester"
              value={form.semester}
              onChange={handleChange}
              disabled={!form.program}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
            >
              <option value="">Semester</option>
              {semesters.map((s) => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Register</button>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <h2>Student Directory</h2>
        <p style={{ marginBottom: '1rem' }}>View and filter existing students by department to see their details and roll numbers.</p>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <select
            value={filterProgram}
            onChange={(e) => {
              setFilterProgram(e.target.value);
              setFilterBranch('');
            }}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8, minWidth: 150 }}
          >
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            disabled={!filterProgram}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8, minWidth: 150 }}
          >
            <option value="">All Branches / Departments</option>
            {filterBranches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button 
            type="button" 
            onClick={fetchStudents} 
            className="admin-btn admin-btn-primary"
            disabled={loadingStudents}
          >
            {loadingStudents ? 'Loading...' : 'Fetch Students'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>College ID</th>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Program</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.collegeId}</td>
                    <td style={{ fontWeight: '500' }}>{s.studentRoll || '-'}</td>
                    <td>{s.name}</td>
                    <td>{s.program || '-'}</td>
                    <td>{s.department || s.branch || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>
                    No students currently matched. Adjust filters and click "Fetch Students".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Students;
