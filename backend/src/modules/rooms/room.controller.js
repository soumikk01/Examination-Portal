import * as roomService from './room.service.js';

export async function list(req, res, next) {
  try {
    const rooms = await roomService.list();
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
