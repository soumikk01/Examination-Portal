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
      studentRoll: true,
      program: true,
      branch: true,
      semester: true,
    },
    orderBy: { collegeId: 'asc' },
  });
}
