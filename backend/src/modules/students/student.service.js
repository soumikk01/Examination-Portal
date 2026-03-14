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
