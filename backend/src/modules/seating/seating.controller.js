import prisma from '../../database/database.js';
import * as seatingService from './seating.service.js';

export async function getStudentSeating(req, res, next) {
  try {
    const studentId = req.user.id;
    const { semester } = req.user; // from verifyToken middleware

    // 1. Find if student has any seat allocation in a published allotment
    const allocation = await prisma.seatAllocation.findFirst({
      where: {
        studentId,
        allotment: { isPublished: true }
      },
      include: { allotment: true }
    });

    if (!allocation) {
      return res.status(404).json({ error: 'No published seating arrangement found for you.' });
    }

    // 2. Fetch the full room seating for context (optional, but good for the grid view)
    const result = await seatingService.getSeatingForRoom({
      roomNo: allocation.roomNo,
      semester: allocation.allotment.examGroup.split('-')[0].replace('SEM','')
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
