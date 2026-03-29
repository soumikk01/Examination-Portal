import prisma from '../../database/database.js';
import pino from 'pino';

const logger = pino();

export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Fetch Open Exam Schedules grouped by semester & type
    const activeSchedules = await prisma.examSchedule.groupBy({
      by: ['semester', 'scheduleType', 'mode'],
      where: { status: 'PUBLISHED' },
      _count: {
        _all: true
      }
    });

    // 2. Fetch Active Seat Allotments (published)
    const activeSeatingRaw = await prisma.roomAllotment.findMany({
      where: { isPublished: true },
      select: { examGroup: true, total: true }
    });

    // Aggregate seat counts by examGroup
    const activeSeating = Object.values(activeSeatingRaw.reduce((acc, curr) => {
      if (!acc[curr.examGroup]) {
        acc[curr.examGroup] = { examGroup: curr.examGroup, totalSeats: 0 };
      }
      acc[curr.examGroup].totalSeats += curr.total;
      return acc;
    }, {}));

    // 3. Fetch Admin Settings applied to the portal
    const settingsRaw = await prisma.systemSetting.findMany();
    const settings = settingsRaw.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});

    // Parse boolean strings nicely for the dashboard
    if (settings.maintenanceMode !== undefined) {
      settings.maintenanceMode = settings.maintenanceMode === 'true';
    }

    res.json({
      activeSchedules: activeSchedules.map(s => ({
        semester: s.semester,
        type: s.scheduleType,
        mode: s.mode,
        count: s._count._all
      })),
      activeSeating,
      settings
    });

  } catch (error) {
    logger.error('Error fetching dashboard summary:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard summary.' });
  }
};

export const deleteSchedules = async (req, res) => {
  try {
    const { semester, scheduleType, mode } = req.body;
    
    if (!semester || !scheduleType || !mode) {
      return res.status(400).json({ error: 'Missing required fields to identify schedule group.' });
    }

    const result = await prisma.examSchedule.deleteMany({
      where: {
        semester,
        scheduleType,
        mode,
        status: 'PUBLISHED' // only delete the ones shown on dashboard
      }
    });

    res.json({ message: `Successfully deleted ${result.count} published schedule records.`, count: result.count });
  } catch (error) {
    logger.error('Error deleting schedules from dashboard:', error.message);
    res.status(500).json({ error: 'Failed to delete schedules.' });
  }
};

export const deleteSeating = async (req, res) => {
  try {
    const { examGroup } = req.params;
    
    if (!examGroup) {
      return res.status(400).json({ error: 'Missing exam group.' });
    }

    // Deleting the RoomAllotment will cascade delete the SeatAllocations
    const result = await prisma.roomAllotment.deleteMany({
      where: {
        examGroup
      }
    });

    res.json({ message: `Successfully deleted seating allotment for ${examGroup}.`, count: result.count });
  } catch (error) {
    logger.error('Error deleting seating from dashboard:', error.message);
    res.status(500).json({ error: 'Failed to delete seating allotment.' });
  }
};
