import { useState } from 'react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const initialForm = {
  collegeId: '',
  name: '',
  department: '',
  studentRoll: '',
  studentReg: '',
  examinationSem: '',
  batch: '',
};

const Students = () => {
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(initialForm);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    api.post('/student', form)
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
          <button type="submit" className="admin-btn admin-btn-primary">Register</button>
        </form>
      </div>
    </>
  );
};

export default Students;
