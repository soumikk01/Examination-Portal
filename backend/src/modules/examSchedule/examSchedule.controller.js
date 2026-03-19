import * as examScheduleService from './examSchedule.service.js';

export async function uploadPdf(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'PDF file is required.' });
    }

    const result = await examScheduleService.uploadAndParsePdf({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function parsePdf(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'PDF file is required.' });
    }
    const result = await examScheduleService.parsePdf({ buffer: req.file.buffer });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function saveDraft(req, res, next) {
  try {
    const { meta, rows, mode, sourceFile } = req.body || {};
    const result = await examScheduleService.saveDraftBatch({ meta, rows, mode, sourceFile });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteBatch(req, res, next) {
  try {
    const { uploadId } = req.params;
    const result = await examScheduleService.deleteBatch({ uploadId });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const { status, uploadId, semester, departmentCode, mode, scheduleType } = req.query;
    const rows = await examScheduleService.list({
      status: status ? String(status).toUpperCase() : undefined,
      uploadId,
      semester,
      departmentCode: departmentCode ? String(departmentCode).toUpperCase() : undefined,
      mode: mode ? String(mode).toUpperCase() : undefined,
      scheduleType: scheduleType ? String(scheduleType).toUpperCase() : undefined,
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function publish(req, res, next) {
  try {
    const { uploadId } = req.body || {};
    const result = await examScheduleService.publish({ uploadId });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listForStudent(req, res, next) {
  try {
    const { departmentCode, branch, semester, mode, scheduleType, level } = req.query;
    const dep = (departmentCode || branch || '').toString().toUpperCase();
    const rows = await examScheduleService.listPublished({
      departmentCode: dep,
      semester,
      mode: mode ? String(mode).toUpperCase() : undefined,
      scheduleType: scheduleType ? String(scheduleType).toUpperCase() : undefined,
      level: level ? String(level).toUpperCase() : undefined,
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function listPublishedFilters(req, res, next) {
  try {
    const { mode, level } = req.query;
    const result = await examScheduleService.listPublishedFilters({
      mode: mode ? String(mode).toUpperCase() : undefined,
      level: level ? String(level).toUpperCase() : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

