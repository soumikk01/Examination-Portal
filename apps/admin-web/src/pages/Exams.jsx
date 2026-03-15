import { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const EXAM_TYPES = ['Test I', 'Test II', 'End Sem'];
const EXAM_MODES = ['Regular', 'Backlog'];
const EXAM_CATEGORIES = ['ODD', 'EVEN'];
const PROGRAMS = ['B.Tech', 'M.Tech', 'Diploma', 'MCA', 'BCA', 'BBA'];
const PROGRAM_BRANCHES = {
  'B.Tech': [
    'CSE',
    'CSE (CST)',
    'CSE (AI ML)',
    'IT',
    'ECE',
    'EE',
    'ME',
    'CE',
    'BME',
    'AE',
  ],
  'M.Tech': [],
  Diploma: ['EE', 'ME'],
  MCA: ['MCA'],
  BCA: ['BCA'],
  BBA: ['BBA'],
};
const PROGRAM_SEMESTERS = {
  'B.Tech': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'M.Tech': ['1', '2', '3', '4'],
  Diploma: ['1', '2', '3', '4', '5', '6'],
  MCA: ['1', '2', '3', '4'],
  BCA: ['1', '2', '3', '4', '5', '6'],
  BBA: ['1', '2', '3', '4', '5', '6'],
};

const Exams = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    time: '',
    room: '',
    examType: 'Test I',
    examMode: 'Regular',
    examCategory: 'ODD',
    branch: '',
    program: '',
    semester: '',
  });
  const [subjects, setSubjects] = useState([
    { id: 1, examId: '', subject: '', date: '' },
  ]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [studentToAdd, setStudentToAdd] = useState('');
  const [includeScheduleOnly, setIncludeScheduleOnly] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/students')
      .then((studentsData) => {
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      })
      .catch((err) =>
        setError(getUserFriendlyApiError(err, 'Failed to load students')),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };
      // Reset branch/semester when program changes so options stay in sync
      if (name === 'program') {
        next.branch = '';
        next.semester = '';
      }
      return next;
    });
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleAddSubjectRow = () => {
    setSubjects((prev) => [
      ...prev,
      { id: Date.now(), examId: '', subject: '', date: '' },
    ]);
  };

  const handleRemoveSubjectRow = (id) => {
    setSubjects((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const handleStudentToAddChange = (e) => {
    // Keep as string for correct select rendering; convert to number on add
    setStudentToAdd(e.target.value);
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!studentToAdd) return;
    const numericId = Number(studentToAdd);
    if (!Number.isFinite(numericId)) return;
    if (assignedStudents.includes(numericId)) return;
    setAssignedStudents((prev) => [...prev, numericId]);
    setStudentToAdd('');
  };

  const handleRemoveStudent = (id) => {
    setAssignedStudents((prev) => prev.filter((sid) => sid !== id));
  };

  const mapExamType = (label) => {
    if (!label) return undefined;
    const normalized = label.toLowerCase();
    if (normalized.includes('test ii')) return 'TEST_II';
    if (normalized.includes('test i')) return 'TEST_I';
    return 'END_SEM';
  };

  const mapExamMode = (label) => (label ? label.toUpperCase().replace(' ', '_') : undefined);

  const mapProgram = (label) => {
    if (!label) return undefined;
    const clean = label.replace('.', '').replace(/\s+/g, '').toUpperCase();
    return clean;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);

    const cleanedSubjects = subjects
      .map((row) => ({
        examId: row.examId.trim(),
        subject: row.subject.trim(),
        date: row.date,
      }))
      .filter((row) => row.examId && row.subject && row.date);

    if (cleanedSubjects.length === 0) {
      setMessage('Please add at least one subject, code and date.');
      setSubmitting(false);
      return;
    }

    const payload = {
      program: mapProgram(form.program),
      branch: form.branch || undefined,
      semester: form.semester || undefined,
      examType: mapExamType(form.examType),
      examMode: mapExamMode(form.examMode),
      examCategory: form.examCategory,
      time: form.time.trim() || undefined,
      room: form.room.trim() || undefined,
      subjects: cleanedSubjects,
      assignedStudents,
      includeScheduleOnly,
    };

    api
      .post('/exams', payload)
      .then(() => {
        setMessage('Created exams successfully.');
        setForm({
          time: '',
          room: '',
          examType: 'Test I',
          examMode: 'Regular',
          examCategory: 'ODD',
          branch: '',
          program: '',
          semester: '',
        });
        setSubjects([{ id: 1, examId: '', subject: '', date: '' }]);
        setAssignedStudents([]);
        setStudentToAdd('');
        setIncludeScheduleOnly(true);
      })
      .catch((err) => setMessage(getUserFriendlyApiError(err, 'Failed to add exam')))
      .finally(() => setSubmitting(false));
  };

  const isPrimarySelected = !!(form.program && form.branch && form.semester);
  const branchOptions =
    form.program && PROGRAM_BRANCHES[form.program]?.length
      ? PROGRAM_BRANCHES[form.program]
      : [];
  const semesterOptions =
    form.program && PROGRAM_SEMESTERS[form.program]?.length
      ? PROGRAM_SEMESTERS[form.program]
      : PROGRAM_SEMESTERS['B.Tech'];

  if (loading) return <div className="admin-card"><p>Loading exams…</p></div>;
  if (error) return <div className="admin-card"><p className="admin-status-err">{error}</p></div>;

  return (
    <>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem' }}>Exam schedule</h1>

      {/* Add exam form */}
      <div className="admin-card">
          <h2>Add exam</h2>
          <p style={{ marginBottom: '1rem' }}>
            Configure one exam card (subject, date, time, type, room, ODD/EVEN) and then attach
            multiple students below. The same exam details will be created for each student.
          </p>
          {message && (
            <p className={message.includes('success') ? 'admin-status-ok' : 'admin-status-err'} style={{ marginBottom: '0.75rem' }}>
              {message}
            </p>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900 }}>
            {/* Primary filters: program / branch / semester */}
            <div>
              <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>Program / Branch / Semester</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <select
                  name="program"
                  value={form.program}
                  onChange={handleChange}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                >
                  <option value="">All programs</option>
                  {PROGRAMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                >
                  <option value="">All branches</option>
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                >
                  <option value="">All semesters</option>
                  {semesterOptions.map((s) => (
                    <option key={s} value={s}>{`Sem ${s}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shared exam details (time, room, type etc.) */}
            <div>
              <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>Exam details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <input
                  type="text"
                  name="time"
                  placeholder="Time (e.g. 09:00 AM)"
                  value={form.time}
                  onChange={handleChange}
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                />
                <input
                  type="text"
                  name="room"
                  placeholder="Room"
                  value={form.room}
                  onChange={handleChange}
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                />
                <select
                  name="examType"
                  value={form.examType}
                  onChange={handleChange}
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  name="examMode"
                  value={form.examMode}
                  onChange={handleChange}
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                >
                  {EXAM_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  name="examCategory"
                  value={form.examCategory}
                  onChange={handleChange}
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                >
                  {EXAM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multiple subjects / codes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Subjects and dates for this exam card</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                Add one or more subject codes, names and individual dates. The same time, room and other settings above will be used for each subject.
              </p>
              <div className="admin-table-wrapper" style={{ maxHeight: 260, overflow: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '26%' }}>Subject code</th>
                      <th>Subject name</th>
                      <th style={{ width: '20%' }}>Date</th>
                      <th style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. CSE101-ODD"
                            value={row.examId}
                            onChange={(e) =>
                              handleSubjectChange(row.id, 'examId', e.target.value)
                            }
                            disabled={!isPrimarySelected}
                            style={{
                              width: '100%',
                              padding: '0.35rem 0.6rem',
                              border: '1px solid var(--admin-border)',
                              borderRadius: 6,
                              fontSize: '0.9rem',
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Subject name"
                            value={row.subject}
                            onChange={(e) =>
                              handleSubjectChange(row.id, 'subject', e.target.value)
                            }
                            disabled={!isPrimarySelected}
                            style={{
                              width: '100%',
                              padding: '0.35rem 0.6rem',
                              border: '1px solid var(--admin-border)',
                              borderRadius: 6,
                              fontSize: '0.9rem',
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) =>
                              handleSubjectChange(row.id, 'date', e.target.value)
                            }
                            disabled={!isPrimarySelected}
                            style={{
                              width: '100%',
                              padding: '0.35rem 0.6rem',
                              border: '1px solid var(--admin-border)',
                              borderRadius: 6,
                              fontSize: '0.9rem',
                            }}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectRow(row.id)}
                            className="admin-btn"
                            disabled={!isPrimarySelected}
                            style={{
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.8rem',
                              background: 'transparent',
                              color: 'var(--admin-danger, #dc2626)',
                              border: '1px solid rgba(220,38,38,0.2)',
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={handleAddSubjectRow}
                className="admin-btn"
                disabled={!isPrimarySelected}
                style={{ alignSelf: 'flex-start', padding: '0.4rem 0.9rem', fontSize: '0.9rem' }}
              >
                + Add another subject
              </button>
            </div>

            {/* Attach students */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Attach students to this exam</h3>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={includeScheduleOnly}
                  onChange={(e) => setIncludeScheduleOnly(e.target.checked)}
                  disabled={!isPrimarySelected}
                />
                Create one schedule-only exam (no specific student)
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  name="studentToAdd"
                  value={studentToAdd}
                  onChange={handleStudentToAddChange}
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8, minWidth: 260 }}
                >
                  <option value="">Select student to attach</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.collegeId} – {s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddStudent}
                  className="admin-btn"
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.9rem' }}
                >
                  Add student
                </button>
              </div>

              {assignedStudents.length > 0 && (
                <div className="admin-table-wrapper" style={{ maxHeight: 220, overflow: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Student</th>
                        <th style={{ width: 80 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedStudents.map((id) => {
                        const s = students.find((st) => st.id === id);
                        return (
                          <tr key={id}>
                            <td>
                              {s ? `${s.collegeId} – ${s.name}` : `ID: ${id}`}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveStudent(id)}
                                className="admin-btn"
                                disabled={!isPrimarySelected}
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  fontSize: '0.8rem',
                                  background: 'transparent',
                                  color: 'var(--admin-danger, #dc2626)',
                                  border: '1px solid rgba(220,38,38,0.2)',
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !isPrimarySelected}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--admin-primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: submitting || !isPrimarySelected ? 'not-allowed' : 'pointer',
                opacity: submitting || !isPrimarySelected ? 0.7 : 1,
              }}
            >
              {submitting ? 'Adding…' : 'Add exam'}
            </button>
          </form>
      </div>
    </>
  );
};

export default Exams;
