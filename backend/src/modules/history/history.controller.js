import prisma from '../../database/database.js';

/**
 * GET /api/v1/history
 * Returns combined history: exam schedule batches + seating allocations
 */
export async function getHistory(_req, res, next) {
  try {
    // Fetch exam schedule batches grouped by uploadId
    const scheduleGroups = await prisma.examSchedule.groupBy({
      by: ['uploadId', 'sourceFile', 'scheduleType', 'mode', 'status', 'academicYear'],
      _count: { id: true },
      _min: { createdAt: true, examDate: true },
      _max: { examDate: true },
      orderBy: { _min: { createdAt: 'desc' } },
    });

    // Get distinct department codes per uploadId
    const uploadIds = scheduleGroups.map((g) => g.uploadId);
    const deptRows = await prisma.examSchedule.findMany({
      where: { uploadId: { in: uploadIds } },
      select: { uploadId: true, departmentCode: true },
      distinct: ['uploadId', 'departmentCode'],
    });
    const deptMap = {};
    for (const row of deptRows) {
      if (!deptMap[row.uploadId]) deptMap[row.uploadId] = [];
      if (row.departmentCode) deptMap[row.uploadId].push(row.departmentCode);
    }

    const schedules = scheduleGroups.map((g) => ({
      type: 'schedule',
      uploadId: g.uploadId,
      sourceFile: g.sourceFile || 'Unnamed File',
      scheduleType: g.scheduleType,
      mode: g.mode,
      status: g.status,
      academicYear: g.academicYear,
      subjectCount: g._count.id,
      departments: deptMap[g.uploadId] || [],
      createdAt: g._min.createdAt,
      examDateFrom: g._min.examDate,
      examDateTo: g._max.examDate,
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
