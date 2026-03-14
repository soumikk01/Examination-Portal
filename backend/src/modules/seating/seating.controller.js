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
