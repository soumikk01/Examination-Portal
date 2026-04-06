import prisma from '../../database/database.js';
import * as seatingService from './seating.service.js';

export async function getStudentSeating(req, res, next) {
  try {
    const studentId = req.user.id;

    // Step 1: Get all published allotments for this student's rooms (MongoDB-safe two-step query)
    const publishedAllotments = await prisma.roomAllotment.findMany({
      where: { isPublished: true },
      select: { examGroup: true, roomNo: true },
    });

    if (publishedAllotments.length === 0) {
      return res.status(404).json({ error: 'No published seating arrangement found for you.' });
    }

    // Step 2: Find seat allocation that matches one of the published rooms
    const publishedRooms = publishedAllotments.map(a => a.roomNo);
    const allocation = await prisma.seatAllocation.findFirst({
      where: {
        studentId,
        roomNo: { in: publishedRooms },
      },
      include: { allotment: true },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'No published seating arrangement found for you.' });
    }

    // Safely extract semester from examGroup (e.g. "SEM3-BTECH-ALL" → "3")
    const rawSem = allocation.allotment?.examGroup?.split('-')[0]?.replace('SEM', '') ?? null;
    const semester = rawSem && !isNaN(rawSem) ? rawSem : null;

    const result = await seatingService.getSeatingForRoom({
      roomNo: allocation.roomNo,
      semester,
    });

    res.json({ ...result, mySeat: { columnNo: allocation.columnNo, seatNo: allocation.seatNo } });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const seating = await seatingService.list();
    res.json(seating);
  } catch (error) {
    next(error);
  }
}

export async function assign(req, res, next) {
  try {
    const result = await seatingService.assign(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function generate(req, res, next) {
  try {
    const { examGroup } = req.body;
    if (!examGroup) {
      return res.status(400).json({ error: 'examGroup is required' });
    }
    const result = await seatingService.generateSeating({ examGroup });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSeating(req, res, next) {
  try {
    const { examGroup } = req.params;
    const result = await seatingService.getSeating(examGroup);
    if (!result) {
      return res.status(404).json({ error: 'No seating found. Generate seating first.' });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRoomSeating(req, res, next) {
  try {
    const { roomNo } = req.params;
    const { semester } = req.query;
    const result = await seatingService.getSeatingForRoom({ 
      roomNo: decodeURIComponent(roomNo),
      semester: semester ? String(semester) : null
    });
    if (!result) {
      return res.status(404).json({ error: 'No allotment found for this room. Complete room allotment first on the Rooms page.' });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function publish(req, res, next) {
  try {
    const { examGroup, roomNo, publish } = req.body;
    if (!examGroup || !roomNo) {
      return res.status(400).json({ error: 'examGroup and roomNo are required' });
    }
    const result = await seatingService.publishSeating({ 
      examGroup, 
      roomNo, 
      publish: publish !== false 
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
