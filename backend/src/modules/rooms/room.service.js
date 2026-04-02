import prisma from '../../database/database.js';

const SEATS_PER_COLUMN = 8;

// ──────────────────────────────────────────────
// Helper: build a canonical exam group key
// ──────────────────────────────────────────────
export function buildExamGroup({ semester, program, examMode }) {
  return `SEM${semester}-${program}-${examMode}`;
}

// ──────────────────────────────────────────────
// List all rooms from DB (or seed defaults if empty)
// ──────────────────────────────────────────────
export async function listRooms() {
  let rooms = await prisma.examRoom.findMany({ orderBy: { roomNo: 'asc' } });
  if (rooms.length === 0) {
    rooms = await seedDefaultRooms();
  }
  return rooms;
}

// Seed default rooms if none exist
async function seedDefaultRooms() {
  const defaults = [
    // C Block rooms (capacity 40)
    ...['C-301','C-302','C-303','C-304','C-305','C-306','C-307','C-308',
        'C-309','C-310','C-311','C-405','C-407','C-408','C-409'].map(r => ({
      roomNo: r, capacity: 40, venue: 'C Block – CMS Building'
    })),
    // Main Building rooms (capacity 50)
    ...['MB-412','MB-413','MB-414','MB-415','MB-416','MB-417'].map(r => ({
      roomNo: r, capacity: 50, venue: 'Main Building'
    })),
  ];

  await prisma.examRoom.createMany({ data: defaults, skipDuplicates: true });
  return prisma.examRoom.findMany({ orderBy: { roomNo: 'asc' } });
}

export async function getById(id) {
  return prisma.examRoom.findUnique({ where: { id: Number(id) } });
}

// ──────────────────────────────────────────────
// Core logic: group students by department (branch)
// ──────────────────────────────────────────────
export function groupByDepartment(students) {
  const groups = {};
  for (const s of students) {
    const dept = (s.branch || s.department || 'UNKNOWN').toUpperCase();
    if (!groups[dept]) groups[dept] = [];
    groups[dept].push(s);
  }
  return groups;
}

// ──────────────────────────────────────────────
// Core logic: allocate students into rooms
// Rules:
//   • Fill rooms sequentially
//   • Prefer same department together
//   • Mix when department doesn't fill a room
//   • Maintain count per dept per room
// ──────────────────────────────────────────────
export function allocateRooms(deptGroups, rooms) {
  // Flatten into queue: each entry = { dept, student }
  const queue = [];
  for (const [dept, students] of Object.entries(deptGroups)) {
    for (const s of students) {
      queue.push({ dept, student: s });
    }
  }

  const allocations = [];
  let qIdx = 0;

  for (const room of rooms) {
    if (qIdx >= queue.length) break;

    const deptCounts = {};
    let filled = 0;

    while (filled < room.capacity && qIdx < queue.length) {
      const { dept, student } = queue[qIdx];
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      filled++;
      qIdx++;
      void student; // student object captured for future use
    }

    if (filled > 0) {
      allocations.push({
        roomNo: room.roomNo,
        venue: room.venue,
        capacity: room.capacity,
        deptCounts,
        total: filled,
      });
    }
  }

  return allocations;
}

// ──────────────────────────────────────────────
// Fetch students and run full room allotment
// ──────────────────────────────────────────────
export async function generateRoomAllotment({ semester, program, branch, examMode }) {
  // Build filter
  const where = {
    ...(program && program !== 'ALL' ? { program } : {}),
    ...(branch && branch !== 'ALL' ? { branch } : {}),
    ...(semester ? { semester: String(semester) } : {}),
  };

  // If examMode filter is needed, we check via exams relation
  let students;
  if (examMode && examMode !== 'ALL') {
    students = await prisma.student.findMany({
      where: {
        ...where,
        exams: { some: { examMode } },
      },
      select: {
        id: true,
        name: true,
        studentRoll: true,
        department: true,
        branch: true,
        semester: true,
        program: true,
      },
      orderBy: [{ branch: 'asc' }, { name: 'asc' }],
    });
  } else {
    students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        name: true,
        studentRoll: true,
        department: true,
        branch: true,
        semester: true,
        program: true,
      },
      orderBy: [{ branch: 'asc' }, { name: 'asc' }],
    });
  }

  if (students.length === 0) {
    return { allocations: [], totalStudents: 0, examGroup: buildExamGroup({ semester, program, examMode: examMode || 'ALL' }) };
  }

  const rooms = await listRooms();
  const deptGroups = groupByDepartment(students);
  const allocations = allocateRooms(deptGroups, rooms);

  const examGroup = buildExamGroup({ semester, program, examMode: examMode || 'ALL' });

  // Use transaction: clear previous + insert new atomically
  await prisma.$transaction(async (tx) => {
    await tx.roomAllotment.deleteMany({ where: { examGroup } });

    if (allocations.length > 0) {
      await tx.roomAllotment.createMany({
        data: allocations.map(alloc => ({
          examGroup,
          roomNo: alloc.roomNo,
          deptCounts: alloc.deptCounts,
          total: alloc.total,
        }))
      });
    }
  });

  // Get all unique depts across all rooms for column headers
  const allDepts = [...new Set(allocations.flatMap(a => Object.keys(a.deptCounts)))].sort();

  return {
    examGroup,
    totalStudents: students.length,
    allDepts,
    allocations: allocations.map(a => ({
      roomNo: a.roomNo,
      venue: a.venue,
      deptCounts: a.deptCounts,
      total: a.total,
    })),
  };
}

// ──────────────────────────────────────────────
// Fetch saved room allotment from DB
// ──────────────────────────────────────────────
export async function getRoomAllotment(examGroup) {
  const rows = await prisma.roomAllotment.findMany({
    where: { examGroup },
    orderBy: { roomNo: 'asc' },
  });

  if (rows.length === 0) return null;

  const allDepts = [...new Set(rows.flatMap(r => Object.keys(r.deptCounts)))].sort();

  return {
    examGroup,
    allDepts,
    allocations: rows.map(r => ({
      roomNo: r.roomNo,
      deptCounts: r.deptCounts,
      total: r.total,
    })),
  };
}

// ──────────────────────────────────────────────
// List all saved exam groups (for dropdowns)
// ──────────────────────────────────────────────
export async function listExamGroups() {
  const rows = await prisma.roomAllotment.findMany({
    distinct: ['examGroup'],
    select: { examGroup: true },
    orderBy: { examGroup: 'asc' },
  });
  return rows.map(r => r.examGroup);
}

// ──────────────────────────────────────────────
// Student counts split by exam type for the allotment sheet
// Returns: { UG_REGULAR: {BRANCH: count}, UG_BACKLOG: {...}, PG_REGULAR: {...}, PG_BACKLOG: {...} }
// ──────────────────────────────────────────────
// UG: B.Tech only (Diploma removed)
const UG_PROGRAMS = new Set(['BTECH']);

// PG / BBA+BCA: all non-UG programs grouped in the PG section
const PG_PROGRAMS = new Set(['BBA', 'BBA-DM', 'BBA-HM', 'BCA', 'MTECH', 'MCA', 'MBA', 'MCSE', 'EDPS', 'MME']);

// Branches shown in PG_REGULAR (BBA-DM and BBA-HM included – no backlog variant)
const PG_REGULAR_BRANCHES = new Set(['BBA', 'BBA-DM', 'BBA-HM', 'BCA', 'MCSE', 'EDPS', 'MME', 'MBA', 'MCA']);

// Branches shown in PG_BACKLOG (now includes BBA-DM and BBA-HM)
const PG_BACKLOG_BRANCHES = new Set(['BBA', 'BBA-DM', 'BBA-HM', 'BCA', 'MCSE', 'EDPS', 'MME', 'MBA', 'MCA']);

export async function getStudentCountsForSemester({ semester }) {
  let students = [];
  try {
    students = await prisma.student.findMany({
      where: { ...(semester ? { semester: String(semester) } : {}) },
      select: {
        id: true,
        branch: true,
        program: true,
        exams: { select: { examMode: true } },
      },
    });
  } catch (err) {
    console.error('Warning: Could not fetch exams relation – falling back to REGULAR-only mode', err);
    students = await prisma.student.findMany({
      where: { ...(semester ? { semester: String(semester) } : {}) },
      select: { id: true, branch: true, program: true },
    });
  }

  const result = { UG_REGULAR: {}, UG_BACKLOG: {}, PG_REGULAR: {}, PG_BACKLOG: {} };

  for (const student of students) {
    const prog   = (student.program || '').toUpperCase().trim();
    const branch = (student.branch  || 'UNKNOWN').toUpperCase().trim();

    const isUG = UG_PROGRAMS.has(prog);
    const isPG = PG_PROGRAMS.has(prog);

    // Skip DIPLOMA, unknown, or unmapped programs entirely
    if (!isUG && !isPG) continue;

    const hasBacklog = Array.isArray(student.exams) && student.exams.some(e => e.examMode === 'BACKLOG');
    const mode = hasBacklog ? 'BACKLOG' : 'REGULAR';

    if (isUG) {
      // B.Tech: all branches accepted in both modes
      result[`UG_${mode}`][branch] = (result[`UG_${mode}`][branch] || 0) + 1;
    } else {
      // PG / BBA+BCA: enforce separate branch allow-lists per mode
      const allowed = mode === 'BACKLOG' ? PG_BACKLOG_BRANCHES : PG_REGULAR_BRANCHES;
      if (allowed.has(branch)) {
        result[`PG_${mode}`][branch] = (result[`PG_${mode}`][branch] || 0) + 1;
      }
    }
  }

  return result;
}

// ──────────────────────────────────────────────
// Update (upsert) a room's capacity
// ──────────────────────────────────────────────
export async function updateRoomCapacity(roomNo, capacity) {
  // Determine correct venue from room number prefix
  const venue = roomNo.startsWith('MB') ? 'Main Building' : 'C Block – CMS Building';
  return prisma.examRoom.upsert({
    where: { roomNo },
    create: { roomNo, capacity: Number(capacity), venue },
    update: { capacity: Number(capacity) },
  });
}

// ──────────────────────────────────────────────
// Save room-wise dept allotment from the new
// automated sheet (Rooms.jsx spreadsheet).
// Called when admin clicks "Save" on the allotment page.
// ──────────────────────────────────────────────
export async function saveRoomAllotments({ semester, rooms }) {
  // Build a generic examGroup key from the semester
  const examGroup = `SEM${semester}-ALL-ALL`;

  await prisma.$transaction(async (tx) => {
    // Delete old allocations so we start fresh
    await tx.roomAllotment.deleteMany({ where: { examGroup } });

    // Re-insert
    for (const room of rooms) {
      if (!room.roomNo || !room.deptCounts || !Object.keys(room.deptCounts).length) continue;
      const total = Object.values(room.deptCounts).reduce((s, v) => s + Number(v), 0);
      if (total === 0) continue;
      await tx.roomAllotment.create({
        data: {
          examGroup,
          roomNo: room.roomNo,
          deptCounts: room.deptCounts,
          total,
        },
      });
    }
  });

  return { examGroup, roomCount: rooms.length };
}

// ──────────────────────────────────────────────
// Expose SEATS_PER_COLUMN for seating service
// ──────────────────────────────────────────────
export { SEATS_PER_COLUMN };

