import { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const SubjectRow = ({ row, isPrimarySelected, onChange, onRemove }) => (
  <tr>
    <td>
      <input
        type="text"
        placeholder="e.g. CSE101-ODD"
        value={row.examId}
        onChange={(e) => onChange('examId', e.target.value)}
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
        onChange={(e) => onChange('subject', e.target.value)}
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
        onChange={(e) => onChange('date', e.target.value)}
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
        onClick={onRemove}
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

const StudentRow = ({ student, studentId, isPrimarySelected, onRemove }) => (
  <tr>
    <td>
      {student ? `${student.collegeId} \u2013 ${student.name}` : `ID: ${studentId}`}
    </td>
    <td>
      <button
        type="button"
        onClick={onRemove}
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

const Exams = () => {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [examModes, setExamModes] = useState([]);
  const [examCategories, setExamCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    time: '',
    room: '',
    examType: '',
    examMode: '',
    examCategory: '',
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
    api.get('/options/programs').then((data) => setPrograms(Array.isArray(data) ? data : [])).catch(() => setPrograms([]));
    api.get('/options/exam-options').then((data) => {
      if (data && typeof data === 'object') {
        setExamTypes(Array.isArray(data.examTypes) ? data.examTypes : []);
        setExamModes(Array.isArray(data.examModes) ? data.examModes : []);
        setExamCategories(Array.isArray(data.examCategories) ? data.examCategories : []);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (examTypes.length && examModes.length && examCategories.length && !form.examType) {
      setForm((f) => ({
        ...f,
        examType: examTypes[0].value,
        examMode: examModes[0].value,
        examCategory: examCategories[0].value,
      }));
    }
  }, [examTypes, examModes, examCategories, form.examType]);

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

  // Fetch students; when program/branch/semester are selected, only matching students are returned.
  // Use studentsLoading so the form stays visible; only the initial load uses page-level loading.
  // AbortController ensures only the latest request updates state when filters change rapidly.
  // Preserve assignedStudents: keep only IDs that still exist in the new list (avoid data loss on filter change).
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setStudentsLoading(true);
    const params = {};
    if (form.program) params.program = form.program;
    if (form.branch) params.branch = form.branch;
    if (form.semester) params.semester = form.semester;
    api
      .get('/students', { params, signal })
      .then((studentsData) => {
        const list = Array.isArray(studentsData) ? studentsData : [];
        setStudents(list);
        setAssignedStudents((prev) => prev.filter((sid) => list.some((s) => s.id === sid)));
      })
      .catch((err) => {
        if (err?.code !== 'ERR_CANCELED') {
          setError(getUserFriendlyApiError(err, 'Failed to load students'));
        }
      })
      .finally(() => {
        setStudentsLoading(false);
        setLoading(false);
      });
    return () => controller.abort();
  }, [form.program, form.branch, form.semester]);

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
      program: form.program,
      branch: form.branch || undefined,
      semester: form.semester || undefined,
      examType: form.examType,
      examMode: form.examMode,
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
          examType: examTypes[0]?.value ?? '',
          examMode: examModes[0]?.value ?? '',
          examCategory: examCategories[0]?.value ?? '',
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
  const isSubmitDisabled =
    submitting ||
    !isPrimarySelected ||
    !form.examType ||
    !form.examMode ||
    !form.examCategory;
  const branchOptions = branches;
  const semesterOptions = semesters;

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
                  {programs.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
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
                  {examTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <select
                  name="examMode"
                  value={form.examMode}
                  onChange={handleChange}
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                >
                  {examModes.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  name="examCategory"
                  value={form.examCategory}
                  onChange={handleChange}
                  disabled={!isPrimarySelected}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--admin-border)', borderRadius: 8 }}
                >
                  {examCategories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
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
                      <SubjectRow
                        key={row.id}
                        row={row}
                        isPrimarySelected={isPrimarySelected}
                        onChange={(field, value) => handleSubjectChange(row.id, field, value)}
                        onRemove={() => handleRemoveSubjectRow(row.id)}
                      />
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
              {studentsLoading && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>Loading students…</p>
              )}
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
                  disabled={!isPrimarySelected || studentsLoading}
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
                          <StudentRow
                            key={id}
                            student={s}
                            studentId={id}
                            isPrimarySelected={isPrimarySelected}
                            onRemove={() => handleRemoveStudent(id)}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--admin-primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                opacity: isSubmitDisabled ? 0.7 : 1,
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
