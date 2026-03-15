import prisma from '../../database/database.js';

export async function list() {
  return prisma.exam.findMany({
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    include: { student: { select: { collegeId: true, name: true } } },
  });
}

export async function getById(id) {
  return prisma.exam.findUnique({
    where: { id },
    include: { student: { select: { collegeId: true, name: true } } },
  });
}

export async function create(data) {
  const { studentId, ...rest } = data;
  return prisma.exam.create({
    data: {
      ...rest,
      ...(studentId != null ? { studentId } : {}),
    },
  });
}
