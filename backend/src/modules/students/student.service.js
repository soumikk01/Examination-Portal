import prisma from '../../database/database.js';
import { cache } from '../../utils/redis.js';

// Profile-safe fields only (no sessionId, no studentRoll – used for login verification)
const profileSelect = {
  id: true,
  collegeId: true,
  name: true,
  degree: true,
  department: true,
  studentReg: true,
  examinationSem: true,
  batch: true,
  branch: true,
  lastLogin: true,
  program: true,
  semester: true,
  exams: { select: { id: true, examId: true, subject: true, date: true, time: true, room: true, examType: true, examMode: true, examCategory: true, status: true } },
};

export async function getByCollegeId(collegeId) {
  const cacheKey = `student:${collegeId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return { ...cached, _cached: true };

  const student = await prisma.student.findUnique({
    where: { collegeId },
    select: profileSelect,
  });

  if (!student) return null;

  const deptCode = student.branch || student.department;
  const sem = student.semester || student.examinationSem;

  if (deptCode && sem) {
    const schedules = await prisma.examSchedule.findMany({
      where: {
        status: 'PUBLISHED',
        departmentCode: deptCode.toUpperCase(),
        semester: String(sem),
      },
      select: {
        id: true,
        uploadId: true,
        subject: true,
        examDate: true,
        examTime: true,
        mode: true,
        scheduleType: true,
        paperCode: true,
      }
    });

    const mappedSchedules = schedules.map(s => ({
      id: `schedule_${s.id}`,
      examId: s.paperCode || `SCH_${s.id}`,
      subject: s.subject,
      date: s.examDate,
      time: s.examTime,
      room: 'TBA',
      examType: s.mode === 'BACKLOG' ? 'Backlog' : 'Regular',
      examMode: s.mode,
      examCategory: s.scheduleType.replace('_THEORY', '').replace('_', ' '),
      status: 'PUBLISHED'
    }));

    student.exams = [...(student.exams || []), ...mappedSchedules];
  }

  await cache.set(cacheKey, student, 3600);
  return student;
}

export async function create(data) {
  return prisma.student.create({ data });
}

export async function list(filters = {}) {
  const { program, branch, semester } = filters;
  return prisma.student.findMany({
    where: {
      ...(program ? { program } : {}),
      ...(branch ? { branch } : {}),
      ...(semester ? { semester } : {}),
    },
    select: {
      id: true,
      collegeId: true,
      name: true,
      department: true,
      program: true,
      branch: true,
      semester: true,
    },
    orderBy: { collegeId: 'asc' },
  });
}
