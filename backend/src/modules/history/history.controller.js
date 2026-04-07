import prisma from '../../database/database.js';

/**
 * GET /api/v1/history
 * Returns combined history: exam schedule batches + seating allocations
 */
export async function getHistory(_req, res, next) {
  try {
    // Fetch all schedule records and group in JS (MongoDB doesn't support groupBy reliably)
    const allSchedules = await prisma.examSchedule.findMany({
      select: {
        id: true,
        uploadId: true,
        sourceFile: true,
        scheduleType: true,
        mode: true,
        status: true,
        academicYear: true,
        departmentCode: true,
        createdAt: true,
        examDate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by uploadId in memory
    const uploadMap = {};
    for (const row of allSchedules) {
      if (!uploadMap[row.uploadId]) {
        uploadMap[row.uploadId] = {
          uploadId: row.uploadId,
          sourceFile: row.sourceFile || 'Unnamed File',
          scheduleType: row.scheduleType,
          mode: row.mode,
          status: row.status,
          academicYear: row.academicYear,
          count: 0,
          departments: new Set(),
          createdAt: row.createdAt,
          examDateFrom: row.examDate,
          examDateTo: row.examDate,
        };
      }
      const g = uploadMap[row.uploadId];
      g.count++;
      if (row.departmentCode) g.departments.add(row.departmentCode);
      if (row.examDate < g.examDateFrom) g.examDateFrom = row.examDate;
      if (row.examDate > g.examDateTo) g.examDateTo = row.examDate;
    }

    const schedules = Object.values(uploadMap)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(g => ({
        type: 'schedule',
        uploadId: g.uploadId,
        sourceFile: g.sourceFile,
        scheduleType: g.scheduleType,
        mode: g.mode,
        status: g.status,
        academicYear: g.academicYear,
        subjectCount: g.count,
        departments: [...g.departments],
        createdAt: g.createdAt,
        examDateFrom: g.examDateFrom,
        examDateTo: g.examDateTo,
      }));


    // Fetch seating allotments
    const allotments = await prisma.roomAllotment.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        examGroup: true,
        roomNo: true,
        total: true,
        isPublished: true,
        createdAt: true,
      },
    });

    // Group by examGroup
    const seatingMap = {};
    for (const row of allotments) {
      if (!seatingMap[row.examGroup]) {
        seatingMap[row.examGroup] = {
          type: 'seating',
          examGroup: row.examGroup,
          rooms: [],
          totalStudents: 0,
          isPublished: row.isPublished,
          createdAt: row.createdAt,
        };
      }
      seatingMap[row.examGroup].rooms.push(row.roomNo);
      seatingMap[row.examGroup].totalStudents += row.total;
      if (row.isPublished) seatingMap[row.examGroup].isPublished = true;
    }

    const seating = Object.values(seatingMap).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ schedules, seating });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/history/schedule/:uploadId
 */
export async function deleteSchedule(req, res, next) {
  try {
    const { uploadId } = req.params;
    const { count } = await prisma.examSchedule.deleteMany({
      where: { uploadId },
    });
    res.json({ message: `Deleted ${count} exam schedule row(s).`, uploadId });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/history/seating/:examGroup
 */
export async function deleteSeatingGroup(req, res, next) {
  try {
    const { examGroup } = req.params;
    const decoded = decodeURIComponent(examGroup);

    // SeatAllocations cascade from RoomAllotment
    const { count } = await prisma.roomAllotment.deleteMany({
      where: { examGroup: decoded },
    });
    res.json({ message: `Deleted seating for exam group "${decoded}" (${count} room(s)).`, examGroup: decoded });
  } catch (error) {
    next(error);
  }
}
