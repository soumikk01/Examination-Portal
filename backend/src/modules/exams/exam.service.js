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
    if (!dateStr) return null;
    const [yearRaw, monthRaw, dayRaw] = dateStr.split('-').map(Number);
    const year = Number.isInteger(yearRaw) ? yearRaw : new Date().getUTCFullYear();
    const month = Number.isInteger(monthRaw) ? monthRaw - 1 : 0;
    const day = Number.isInteger(dayRaw) ? dayRaw : 1;
    return new Date(Date.UTC(year, month, day));
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
export async function listForStudent(student) {
  const now = new Date();

  return prisma.exam.findMany({
    where: {
      status: 'PUBLISHED',
      // Only filter by program/branch/semester when they are present on the student
      ...(student.program ? { program: student.program } : {}),
      ...(student.branch ? { branch: student.branch } : {}),
      ...(student.semester ? { semester: student.semester } : {}),
      OR: [{ studentId: null }, { studentId: student.id }],
      AND: [
        {
          OR: [{ visibleFrom: null }, { visibleFrom: { lte: now } }],
        },
        {
          OR: [{ visibleTo: null }, { visibleTo: { gte: now } }],
        },
      ],
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
}
