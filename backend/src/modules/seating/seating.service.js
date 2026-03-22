import prisma from '../../database/database.js';
import { getRoomAllotment } from '../rooms/room.service.js';

const SEATS_PER_COLUMN = 8;

// ──────────────────────────────────────────────
// Core logic: generateSeatMatrix
// Takes room allotment for ONE room and builds the column-wise grid.
// Rules:
//   • Each column has 8 seats
//   • Alternate departments column-wise
//   • Fill students vertically inside each column
//   • Mark remaining slots as EXTRA
// ──────────────────────────────────────────────
export function generateSeatMatrix(roomNo, deptCounts) {
  // Build an ordered list of dept → count pairs
  const deptList = Object.entries(deptCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => a[0].localeCompare(b[0])); // alphabetical

  // Expand into a flat student-slot list in column-alternating order.
  // Strategy: round-robin columns by department, filling column-by-column.
  // Each department gets ceil(count / SEATS_PER_COLUMN) columns.
  // We interleave so that adjacent columns belong to different depts.

  const deptQueues = {};
  for (const [dept, count] of deptList) {
    deptQueues[dept] = Array(count).fill(dept); // just dept labels; actual student data injected later
  }

  const numDepts = deptList.length;

  // Build columns round-robin
  const columns = [];
  const deptPointers = Object.fromEntries(deptList.map(([d]) => [d, 0]));
  const deptTotals = Object.fromEntries(deptList);
  const deptOrder = deptList.map(([d]) => d);

  let deptRoundIdx = 0;
  let totalRemaining = deptList.reduce((s, [, c]) => s + c, 0);

  while (totalRemaining > 0) {
    // Pick next dept that still has students
    let found = false;
    for (let attempt = 0; attempt < numDepts; attempt++) {
      const dept = deptOrder[(deptRoundIdx + attempt) % numDepts];
      if (deptPointers[dept] < deptTotals[dept]) {
        const available = deptTotals[dept] - deptPointers[dept];
        const take = Math.min(SEATS_PER_COLUMN, available);
        const seats = [];
        for (let i = 0; i < SEATS_PER_COLUMN; i++) {
          if (i < take) {
            seats.push({ dept, isExtra: false, seatIndex: deptPointers[dept] + i });
          } else {
            seats.push({ dept, isExtra: true, seatIndex: null });
          }
        }
        deptPointers[dept] += take;
        totalRemaining -= take;
        columns.push({ dept, seats });
        deptRoundIdx = (deptRoundIdx + attempt + 1) % numDepts;
        found = true;
        break;
      }
    }
    if (!found) break; // safety guard
  }

  return { roomNo, columns, seatsPerColumn: SEATS_PER_COLUMN };
}

// ──────────────────────────────────────────────
// Full seating generation: load allotment, fetch
// students, generate matrix, save to DB
// ──────────────────────────────────────────────
export async function generateSeating({ examGroup }) {
  const allotment = await getRoomAllotment(examGroup);
  if (!allotment) {
    throw Object.assign(new Error('Room allotment not found. Generate room allotment first.'), { status: 404 });
  }

  // Parse examGroup → semester, program for student query
  // Format: SEM{sem}-{PROGRAM}-{EXAMMODE}
  const parts = examGroup.split('-');
  const semPart = parts[0]; // e.g. SEM3
  const semester = semPart.replace('SEM', '');
  const program = parts[1];
  const examMode = parts.slice(2).join('-');

  // Fetch ALL students for this group (same query as room allotment)
  const where = {
    ...(program ? { program } : {}),
    ...(semester ? { semester: String(semester) } : {}),
  };

  let students;
  if (examMode && examMode !== 'ALL') {
    students = await prisma.student.findMany({
      where: { ...where, exams: { some: { examMode } } },
      select: { id: true, name: true, studentRoll: true, branch: true, department: true },
      orderBy: [{ branch: 'asc' }, { name: 'asc' }],
    });
  } else {
    students = await prisma.student.findMany({
      where,
      select: { id: true, name: true, studentRoll: true, branch: true, department: true },
      orderBy: [{ branch: 'asc' }, { name: 'asc' }],
    });
  }

  // Group students by dept
  const studentsByDept = {};
  for (const s of students) {
    const dept = (s.branch || s.department || 'UNKNOWN').toUpperCase();
    if (!studentsByDept[dept]) studentsByDept[dept] = [];
    studentsByDept[dept].push(s);
  }

  // Per-dept cursor (to track which students go in which room)
  const deptCursors = Object.fromEntries(
    Object.keys(studentsByDept).map(d => [d, 0])
  );

  // Delete existing seat allocations for this examGroup
  await prisma.seatAllocation.deleteMany({ where: { examGroup } });

  const result = [];

  for (const roomAlloc of allotment.allocations) {
    const { roomNo, deptCounts } = roomAlloc;
    const matrix = generateSeatMatrix(roomNo, deptCounts);

    const seatRows = [];
    let globalSeatNo = 1;

    for (let colIdx = 0; colIdx < matrix.columns.length; colIdx++) {
      const col = matrix.columns[colIdx];
      const deptStudents = studentsByDept[col.dept] || [];

      for (let rowIdx = 0; rowIdx < SEATS_PER_COLUMN; rowIdx++) {
        const slot = col.seats[rowIdx];
        let studentId = null;
        let studentName = null;
        let rollNo = null;
        let isExtra = slot.isExtra;

        if (!isExtra) {
          const cursor = deptCursors[col.dept] || 0;
          const student = deptStudents[cursor];
          if (student) {
            studentId = student.id;
            studentName = student.name;
            rollNo = student.studentRoll;
            deptCursors[col.dept] = cursor + 1;
          } else {
            isExtra = true;
          }
        }

        seatRows.push({
          examGroup,
          roomNo,
          columnNo: colIdx + 1,
          seatNo: globalSeatNo++,
          studentId,
          dept: col.dept,
          studentName,
          rollNo,
          isExtra,
        });
      }
    }

    await prisma.seatAllocation.createMany({ data: seatRows });

    result.push({
      roomNo,
      columns: matrix.columns.map((col, colIdx) => ({
        dept: col.dept,
        columnNo: colIdx + 1,
        seats: seatRows
          .filter(s => s.columnNo === colIdx + 1)
          .map(s => ({
            seatNo: s.seatNo,
            dept: s.dept,
            studentName: s.studentName,
            rollNo: s.rollNo,
            isExtra: s.isExtra,
          })),
      })),
    });
  }

  return { examGroup, rooms: result };
}

// ──────────────────────────────────────────────
// Fetch previously generated seating from DB
// ──────────────────────────────────────────────
export async function getSeating(examGroup) {
  const rows = await prisma.seatAllocation.findMany({
    where: { examGroup },
    orderBy: [{ roomNo: 'asc' }, { columnNo: 'asc' }, { seatNo: 'asc' }],
  });

  if (rows.length === 0) return null;

  // Reshape into room → columns → seats
  const roomMap = {};
  for (const row of rows) {
    if (!roomMap[row.roomNo]) roomMap[row.roomNo] = {};
    if (!roomMap[row.roomNo][row.columnNo]) {
      roomMap[row.roomNo][row.columnNo] = { dept: row.dept, seats: [] };
    }
    roomMap[row.roomNo][row.columnNo].seats.push({
      seatNo: row.seatNo,
      dept: row.dept,
      studentName: row.studentName,
      rollNo: row.rollNo,
      isExtra: row.isExtra,
    });
  }

  const rooms = Object.entries(roomMap).map(([roomNo, cols]) => ({
    roomNo,
    columns: Object.entries(cols)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([colNo, col]) => ({
        columnNo: Number(colNo),
        dept: col.dept,
        seats: col.seats,
      })),
  }));

  return { examGroup, rooms };
}

// Keep legacy stubs so existing route references don't break
export async function list() {
  return [];
}

export async function assign(_data) {
  return { message: 'Use POST /seating/generate instead' };
}

// ──────────────────────────────────────────────
// Fetch seating for a SPECIFIC ROOM directly
// Looks at saved RoomAllotment, resolves students,
// returns column-wise seat grid ready for the PDF view.
// ──────────────────────────────────────────────
export async function getSeatingForRoom({ roomNo }) {
  // Find the room allotment row for this roomNo (any examGroup)
  const allotmentRows = await prisma.roomAllotment.findMany({
    where: { roomNo },
    orderBy: { createdAt: 'desc' },
  });

  if (!allotmentRows.length) return null;

  // Use the most recent allotment for this room
  const allotment = allotmentRows[0];
  const { deptCounts, examGroup } = allotment;

  // Parse examGroup → semester, program, examMode
  const parts = examGroup.split('-');
  const semPart = parts[0];
  const semester = semPart.replace('SEM', '');
  const program  = parts[1];
  const examMode = parts.slice(2).join('-');

  // Fetch students for each dept in this room
  const deptList = Object.entries(deptCounts)
    .filter(([, c]) => Number(c) > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const where = {
    ...(program && program !== 'ALL' ? { program } : {}),
    ...(semester ? { semester: String(semester) } : {}),
  };

  let allStudents;
  if (examMode && examMode !== 'ALL') {
    allStudents = await prisma.student.findMany({
      where: { ...where, exams: { some: { examMode } } },
      select: { id: true, name: true, studentRoll: true, branch: true, department: true },
      orderBy: [{ branch: 'asc' }, { name: 'asc' }],
    });
  } else {
    allStudents = await prisma.student.findMany({
      where,
      select: { id: true, name: true, studentRoll: true, branch: true, department: true },
      orderBy: [{ branch: 'asc' }, { name: 'asc' }],
    });
  }

  // Group students by branch
  const studentsByDept = {};
  for (const s of allStudents) {
    const dept = (s.branch || s.department || 'UNKNOWN').toUpperCase();
    if (!studentsByDept[dept]) studentsByDept[dept] = [];
    studentsByDept[dept].push(s);
  }

  // Build columns: for each dept take only the count assigned to this room
  const ROWS = 8; // seats per column
  const columns = [];

  for (const [dept, count] of deptList) {
    const roomCount = Number(count);
    const students  = (studentsByDept[dept] || []).slice(0, roomCount);
    const numCols   = Math.ceil(roomCount / ROWS);

    let studentIdx = 0;
    for (let c = 0; c < numCols; c++) {
      const seats = [];
      for (let r = 0; r < ROWS; r++) {
        if (studentIdx < students.length) {
          const s = students[studentIdx++];
          seats.push({
            isExtra: false,
            label: `${dept}_${(s.name || '').toUpperCase()}_${s.studentRoll || ''}`,
            studentName: s.name,
            rollNo: s.studentRoll,
            dept,
          });
        } else {
          seats.push({ isExtra: true, label: 'EXTRA', dept });
        }
      }
      columns.push({ dept, seats });
    }
  }

  return {
    roomNo,
    examGroup,
    semester,
    program,
    examMode,
    deptCounts,
    columns,
    seatsPerColumn: ROWS,
  };
}

