import * as roomService from './room.service.js';

export async function list(req, res, next) {
  try {
    const rooms = await roomService.listRooms();
    res.json(rooms);
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const room = await roomService.getById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    next(error);
  }
}

export async function generateAllotment(req, res, next) {
  try {
    const { semester, program, branch, examMode } = req.body;
    if (!semester || !program) {
      return res.status(400).json({ error: 'semester and program are required' });
    }
    const result = await roomService.generateRoomAllotment({ semester, program, branch, examMode });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAllotment(req, res, next) {
  try {
    const { examGroup } = req.params;
    const result = await roomService.getRoomAllotment(examGroup);
    if (!result) return res.status(404).json({ error: 'No allotment found for this exam group' });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listExamGroups(req, res, next) {
  try {
    const groups = await roomService.listExamGroups();
    res.json(groups);
  } catch (error) {
    next(error);
  }
}
