import prisma from '../../database/database.js';

export async function list() {
  return prisma.exam.findMany({ orderBy: { date: 'asc' } });
}

export async function getById(id) {
  return prisma.exam.findUnique({ where: { id } });
}
