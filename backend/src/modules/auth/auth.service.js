import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../database/database.js';
import { cache } from '../../utils/redis.js';
import { config } from '../../config/config.js';

const { JWT_SECRET } = config;

export async function login(collegeId, verification) {
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ collegeId }, { studentRoll: collegeId }],
    },
  });

  if (!student) return { error: 'NOT_FOUND', status: 404 };

  const roll = student.studentRoll;
  if (!roll || typeof roll !== 'string') {
    return { error: 'VERIFICATION_FAILED', status: 403 };
  }
  const last3Digits = roll.slice(-3);
  if (last3Digits !== verification) {
    return { error: 'VERIFICATION_FAILED', status: 403 };
  }

  const sessionId = uuidv4();

  const updatedStudent = await prisma.student.update({
    where: { id: student.id },
    data: { sessionId, lastLogin: new Date() },
  });

  await cache.del(`student:${student.collegeId}`);

  const token = jwt.sign(
    { id: student.id, collegeId: student.collegeId, sessionId },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    student: {
      name: student.name,
      collegeId: student.collegeId,
      department: student.department,
      lastLogin: updatedStudent.lastLogin,
    },
  };
}

export async function adminLogin(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const staff = await prisma.staff.findUnique({
    where: { email: normalizedEmail },
  });

  if (!staff) {
    return { error: 'INVALID_CREDENTIALS', status: 401 };
  }

  const valid = await bcrypt.compare(password, staff.passwordHash);
  if (!valid) {
    return { error: 'INVALID_CREDENTIALS', status: 401 };
  }

  const token = jwt.sign(
    { id: staff.id, email: staff.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    staff: {
      id: staff.id,
      email: staff.email,
      name: staff.name,
    },
  };
}
