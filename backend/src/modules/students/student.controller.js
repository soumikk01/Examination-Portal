import * as studentService from './student.service.js';

export async function list(req, res, next) {
  try {
    const { program, branch, semester } = req.query;
    const students = await studentService.list({
      program: program || undefined,
      branch: branch || undefined,
      semester: semester || undefined,
    });
    res.json(students);
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  const collegeId = decodeURIComponent(req.params[0]);

  try {
    const student = await studentService.getByCollegeId(collegeId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  try {
    await studentService.create(req.body);
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Student with this ID or Roll Number already exists.',
        requestId: req.id,
      });
    }
    next(error);
  }
}
