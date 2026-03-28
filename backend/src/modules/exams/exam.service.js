import prisma from '../../database/database.js';

export async function list(filters = {}) {
  const { status, program, branch, semester, fromDate, toDate } = filters;

  return prisma.exam.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(program ? { program } : {}),
      ...(branch ? { branch } : {}),
      ...(semester ? { semester } : {}),
      ...(fromDate || toDate
        ? {
            date: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    include: { student: { select: { collegeId: true, name: true } } },
  });
}

// called from admin Exams.jsx – creates many rows from one form submit
export async function createManyFromForm(payload) {
  const {
    program,
    branch,
    semester,
    examType,
    examMode,
    examCategory,
    time,
    room,
    subjects, // [{ examId, subject, date }]
    assignedStudents, // [studentId, ...]
    includeScheduleOnly,
  } = payload;

  const toUtcMidnight = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(Date.UTC(year, month - 1, day));
  };

  const base = {
    program,
    branch,
    semester,
    examType,
    examMode,
    examCategory,
    time: time || null,
    room: room || null,
    status: 'DRAFT',
  };

  const rows = [];

  if (includeScheduleOnly) {
    for (const s of subjects || []) {
      rows.push({
        ...base,
        examId: s.examId,
        subject: s.subject,
        // Store as UTC midnight for the intended calendar date
        date: s.date ? toUtcMidnight(s.date) : null,
        studentId: null,
      });
    }
  }

  for (const studentId of assignedStudents || []) {
    for (const s of subjects || []) {
      rows.push({
        ...base,
        examId: s.examId,
        subject: s.subject,
        // Same UTC calendar-date interpretation for student-specific rows
        date: s.date ? toUtcMidnight(s.date) : null,
        studentId,
      });
    }
  }

  if (rows.length === 0) {
    throw new Error('No exams to create – add subjects and/or students.');
  }

  await prisma.exam.createMany({ data: rows });
}

export async function updateStatus(id, status, { visibleFrom, visibleTo } = {}) {
  return prisma.exam.update({
    where: { id },
    data: {
      status,
      visibleFrom: visibleFrom ?? undefined,
      visibleTo: visibleTo ?? undefined,
    },
  });
}

// student-facing list based on their program/branch/semester
// Dedupe when both schedule-only (studentId null) and student-specific rows exist for same exam
export async function listForStudent(student) {
  const now = new Date();

  const rows = await prisma.exam.findMany({
    where: {
      status: 'PUBLISHED',
      ...(student.program ? { program: student.program } : {}),
      ...(student.branch ? { branch: student.branch } : {}),
      ...(student.semester ? { semester: student.semester } : {}),
      OR: [{ studentId: null }, { studentId: student.id }],
      AND: [
        { OR: [{ visibleFrom: null }, { visibleFrom: { lte: now } }] },
        { OR: [{ visibleTo: null }, { visibleTo: { gte: now } }] },
      ],
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });

  const byKey = new Map();
  for (const row of rows) {
    const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : '';
    const key = `${row.examId}:${row.subject}:${dateStr}`;
    const existing = byKey.get(key);
    if (!existing || (row.studentId === student.id && existing.studentId !== student.id)) {
      byKey.set(key, row);
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const d = (a.date || 0) - (b.date || 0);
    return d !== 0 ? d : (a.time || '').localeCompare(b.time || '');
  });
}
