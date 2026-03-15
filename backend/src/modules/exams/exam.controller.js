import * as examService from './exam.service.js';

export async function list(req, res, next) {
  try {
    const { status, program, branch, semester, fromDate, toDate } = req.query;
    const exams = await examService.list({
      status,
      program,
      branch,
      semester,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
    res.json(exams);
  } catch (error) {
    next(error);
  }
}

export async function createManyFromForm(req, res, next) {
  try {
    await examService.createManyFromForm(req.body);
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid exam ID' });

    const { status, visibleFrom, visibleTo } = req.body;
    const exam = await examService.updateStatus(id, status, {
      visibleFrom: visibleFrom ? new Date(visibleFrom) : undefined,
      visibleTo: visibleTo ? new Date(visibleTo) : undefined,
    });
    res.json(exam);
  } catch (error) {
    next(error);
  }
}

export async function listForStudent(req, res, next) {
  try {
    const exams = await examService.listForStudent(req.user);
    res.json(exams);
  } catch (error) {
    next(error);
  }
}
