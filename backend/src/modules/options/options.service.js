import prisma from '../../database/database.js';

/** List all programs (code + name) for dropdowns. */
export async function listPrograms() {
  return prisma.programOption.findMany({
    orderBy: { name: 'asc' },
    select: { code: true, name: true },
  });
}

/** List branches for a program (optional filter). */
export async function listBranches(programCode) {
  const where = programCode ? { programCode } : {};
  return prisma.branchOption.findMany({
    where,
    orderBy: { name: 'asc' },
    select: { name: true },
  });
}

/** List semesters for a program (optional filter). */
export async function listSemesters(programCode) {
  const where = programCode ? { programCode } : {};
  const rows = await prisma.semesterOption.findMany({
    where,
    orderBy: { number: 'asc' },
    select: { number: true },
  });
  return rows.map((r) => r.number);
}

/** List options by category (examType, examMode, examCategory) – all from Supabase. */
export async function listAppOptions(category) {
  const rows = await prisma.appOption.findMany({
    where: { category },
    orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
    select: { value: true, label: true },
  });
  return rows;
}

/** All exam-related options in one call (fewer round-trips). */
export async function getExamOptions() {
  const [examTypes, examModes, examCategories] = await Promise.all([
    listAppOptions('examType'),
    listAppOptions('examMode'),
    listAppOptions('examCategory'),
  ]);
  return { examTypes, examModes, examCategories };
}
