import { randomUUID } from 'crypto';
import prisma from '../../database/database.js';
import { parseExamSchedulePdf } from './pdfParser.js';

function toUtcMidnightFromIsoDate(isoDate) {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export async function uploadAndParsePdf({ buffer, originalname }) {
  // Backward compatible endpoint: parse then immediately save as a draft batch (REGULAR)
  const { meta, rows } = await parseExamSchedulePdf(buffer);
  const result = await saveDraftBatch({
    meta,
    rows,
    mode: 'REGULAR',
    sourceFile: originalname || null,
  });
  return {
    uploadId: result.uploadId,
    count: result.count,
    meta,
    preview: rows.slice(0, 25),
  };
}

export async function parsePdf({ buffer }) {
  const { meta, rows } = await parseExamSchedulePdf(buffer);
  if (!rows || rows.length === 0) {
    const err = new Error('No exam rows could be extracted from the PDF.');
    err.status = 400;
    throw err;
  }
  return { meta, count: rows.length, preview: rows.slice(0, 200) };
}

export async function saveDraftBatch({ meta, rows, mode, sourceFile } = {}) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    const err = new Error('rows are required.');
    err.status = 400;
    throw err;
  }
  if (rows.length > 500) {
    const err = new Error('Too many rows in a single batch (max 500). Please split your upload.');
    err.status = 400;
    throw err;
  }

  const uploadId = randomUUID();
  const safeMode = String(mode || 'REGULAR').toUpperCase() === 'BACKLOG' ? 'BACKLOG' : 'REGULAR';
  const scheduleType = String(meta?.scheduleType || 'UNKNOWN').toUpperCase();

  const data = rows.map((r) => ({
    uploadId,
    scheduleType,
    mode: safeMode,
    // Multi-semester PDFs: prefer per-row parsed context, fallback to meta.
    level: r.level || meta?.level || null,
    semester: r.semester || meta?.semester || null,
    batch: r.batch || meta?.batch || null,
    regulation: r.regulation || meta?.regulation || null,
    academicYear: r.academicYear || meta?.academicYear || null,
    department: r.department || null,
    departmentCode: r.departmentCode || null,
    branch: r.departmentCode || null, // legacy
    paperCode: r.paperCode || null,
    subject: r.subject,
    examDate: toUtcMidnightFromIsoDate(r.examDateIso),
    examDay: r.examDay || null,
    examTime: r.examTime || null,
    status: 'DRAFT',
    sourceFile: sourceFile || null,
  }));

  const validData = data.filter(r => r.subject && r.examDate instanceof Date && !isNaN(r.examDate));
  const skipped = data.length - validData.length;
  if (validData.length === 0) {
    const err = new Error('No valid exam rows to save — all rows have missing subject or invalid date.');
    err.status = 400;
    throw err;
  }

  await prisma.examSchedule.createMany({ data: validData });
  return { uploadId, count: validData.length, skipped };
}

export async function deleteBatch({ uploadId } = {}) {
  if (!uploadId) {
    const err = new Error('uploadId is required.');
    err.status = 400;
    throw err;
  }
  const result = await prisma.examSchedule.deleteMany({ where: { uploadId } });
  return { uploadId, deleted: result.count };
}

export async function list({ status, uploadId, semester, departmentCode, mode, scheduleType } = {}) {
  return prisma.examSchedule.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(semester ? { semester } : {}),
      ...(departmentCode ? { departmentCode } : {}),
      ...(mode ? { mode } : {}),
      ...(scheduleType ? { scheduleType } : {}),
      ...(uploadId ? { uploadId } : {}),
    },
    orderBy: [{ examDate: 'asc' }, { examTime: 'asc' }],
  });
}

export async function publish({ uploadId } = {}) {
  if (!uploadId) {
    const err = new Error('uploadId is required to publish a schedule batch.');
    err.status = 400;
    throw err;
  }

  const result = await prisma.examSchedule.updateMany({
    where: { uploadId, status: 'DRAFT' },
    data: { status: 'PUBLISHED' },
  });

  // Invalidating all student caches so they see the new schedule immediately
  try {
    const { cache } = await import('../../utils/redis.js');
    await cache.delPattern('student:*');
  } catch (err) {
    console.error('Failed to clear student cache on publish', err.message);
  }

  return { uploadId, published: result.count };
}

export async function listPublished({ departmentCode, semester, mode, scheduleType, level } = {}) {
  if (!departmentCode) {
    const err = new Error('departmentCode is required.');
    err.status = 400;
    throw err;
  }

  const safeLevel = level ? String(level).toUpperCase() : null;
  // Diploma schedule is not stored as a separate level in PDFs; reuse UG schedules.
  const levelFilter =
    safeLevel === 'UG' || safeLevel === 'PG' ? safeLevel : safeLevel === 'DIPLOMA' ? 'UG' : null;

  return prisma.examSchedule.findMany({
    where: {
      status: 'PUBLISHED',
      departmentCode,
      ...(semester ? { semester } : {}),
      ...(mode ? { mode } : {}),
      ...(scheduleType ? { scheduleType } : {}),
      ...(levelFilter ? { level: levelFilter } : {}),
    },
    orderBy: [{ examDate: 'asc' }, { examTime: 'asc' }],
  });
}

export async function listPublishedFilters({ mode, level } = {}) {
  const safeMode = String(mode || 'REGULAR').toUpperCase() === 'BACKLOG' ? 'BACKLOG' : 'REGULAR';
  const safeLevel = level ? String(level).toUpperCase() : null;
  const requestedDiploma = safeLevel === 'DIPLOMA';
  // Diploma schedules are represented inside UG schedules; for Diploma we query UG then filter to EE/ME.
  const levelFilter = safeLevel === 'UG' || safeLevel === 'PG' ? safeLevel : requestedDiploma ? 'UG' : null;

  const rows = await prisma.examSchedule.findMany({
    where: {
      status: 'PUBLISHED',
      mode: safeMode,
      ...(levelFilter ? { level: levelFilter } : {}),
    },
    select: {
      departmentCode: true,
      department: true,
      semester: true,
      scheduleType: true,
      level: true,
    },
  });

  const deptMap = new Map(); // code -> name
  const semesters = new Set();
  const types = new Set();
  const levels = new Set();

  for (const r of rows) {
    if (r.level) levels.add(r.level);
    if (r.departmentCode) {
      if (!deptMap.has(r.departmentCode)) deptMap.set(r.departmentCode, r.department || r.departmentCode);
    }
    if (r.semester) semesters.add(r.semester);
    if (r.scheduleType) types.add(r.scheduleType);
  }

  // Diploma: only show EE + ME departments (as requested)
  if (requestedDiploma) {
    for (const code of [...deptMap.keys()]) {
      if (code !== 'EE' && code !== 'ME') deptMap.delete(code);
    }
  }

  return {
    mode: safeMode,
    level: safeLevel,
    levels: [...levels].sort(),
    departments: [...deptMap.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code)),
    semesters: [...semesters].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })),
    scheduleTypes: [...types].sort(),
  };
}
