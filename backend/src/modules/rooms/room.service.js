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
    ...(program ? { program } : {}),
    ...(branch ? { branch } : {}),
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

  // Upsert into DB
  for (const alloc of allocations) {
    await prisma.roomAllotment.upsert({
      where: { examGroup_roomNo: { examGroup, roomNo: alloc.roomNo } },
      create: {
        examGroup,
        roomNo: alloc.roomNo,
        deptCounts: alloc.deptCounts,
        total: alloc.total,
      },
      update: {
        deptCounts: alloc.deptCounts,
        total: alloc.total,
      },
    });
  }

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
// Expose SEATS_PER_COLUMN for seating service
// ──────────────────────────────────────────────
export { SEATS_PER_COLUMN };
