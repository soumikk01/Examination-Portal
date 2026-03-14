import * as examService from './exam.service.js';

export async function list(req, res, next) {
  try {
    const exams = await examService.list();
    res.json(exams);
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid exam ID' });
    const exam = await examService.getById(id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    next(error);
  }
}
