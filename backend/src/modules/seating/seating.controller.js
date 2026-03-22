import * as seatingService from './seating.service.js';

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
    const result = await seatingService.getSeatingForRoom({ roomNo: decodeURIComponent(roomNo) });
    if (!result) {
      return res.status(404).json({ error: 'No allotment found for this room. Complete room allotment first.' });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}
