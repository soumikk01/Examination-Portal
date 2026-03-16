import * as optionsService from './options.service.js';

export async function getPrograms(req, res, next) {
  try {
    const programs = await optionsService.listPrograms();
    res.json(programs);
  } catch (error) {
    next(error);
  }
}

export async function getBranches(req, res, next) {
  try {
    const { program } = req.query;
    const branches = await optionsService.listBranches(program || undefined);
    res.json(branches.map((b) => b.name));
  } catch (error) {
    next(error);
  }
}

export async function getSemesters(req, res, next) {
  try {
    const { program } = req.query;
    const semesters = await optionsService.listSemesters(program || undefined);
    res.json(semesters);
  } catch (error) {
    next(error);
  }
}

/** GET /options/exam-options – exam types, modes, categories from Supabase only. */
export async function getExamOptions(req, res, next) {
  try {
    const data = await optionsService.getExamOptions();
    res.json(data);
  } catch (error) {
    next(error);
  }
}
