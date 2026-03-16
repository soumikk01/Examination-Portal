import prisma from '../../database/database.js';
import { cache } from '../../utils/redis.js';

export async function getByCollegeId(collegeId) {
  const cacheKey = `student:${collegeId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return { ...cached, _cached: true };

  const student = await prisma.student.findUnique({
    where: { collegeId },
    include: { exams: true },
  });

  if (!student) return null;

  const safeStudent = { ...student };
  delete safeStudent.sessionId;
  await cache.set(cacheKey, safeStudent, 3600);

  return safeStudent;
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
