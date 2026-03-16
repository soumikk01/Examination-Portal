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
    </>
  );
};

export default Students;
