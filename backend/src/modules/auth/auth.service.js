import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../database/database.js';
import { cache } from '../../utils/redis.js';
import { config } from '../../config/config.js';
import { computeCurrentSemester } from '../../utils/semester.js';

const { JWT_SECRET } = config;

// Read sessionTimeout from system settings (default: 480 minutes = 8h)
async function getSessionTimeoutSeconds() {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: 'sessionTimeout' } });
    const minutes = row ? parseInt(row.value, 10) : 480;
    return (Number.isFinite(minutes) && minutes > 0 ? minutes : 480) * 60;
  } catch {
    return 480 * 60; // 8h fallback
  }
}

export async function login(collegeId, verification) {
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ collegeId }, { studentRoll: collegeId }],
    },
    select: {
      id: true,
      collegeId: true,
      name: true,
      department: true,
      branch: true,
      program: true,
      semester: true,
      batch: true,
      studentRoll: true,
    },
  });

  if (!student) return { error: 'NOT_FOUND', status: 404 };

  const roll = student.studentRoll;
  if (!roll || typeof roll !== 'string') {
    return { error: 'VERIFICATION_FAILED', status: 403 };
  }

  const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');
  const rollDigits = normalizeDigits(roll);
  const verificationDigits = normalizeDigits(verification);

  if (verificationDigits.length !== 12 || rollDigits.length < 12) {
    return { error: 'VERIFICATION_FAILED', status: 403 };
  }

  const last12Digits = rollDigits.slice(-12);
  if (last12Digits !== verificationDigits) {
    return { error: 'VERIFICATION_FAILED', status: 403 };
  }

  const sessionId = uuidv4();
  const timeoutSeconds = await getSessionTimeoutSeconds();

  const updatedStudent = await prisma.student.update({
    where: { id: student.id },
    data: { sessionId, lastLogin: new Date() },
    select: { lastLogin: true },
  });

  await cache.del(`student:${student.collegeId}`);

  const token = jwt.sign(
    { id: student.id, collegeId: student.collegeId, sessionId },
    JWT_SECRET,
    { expiresIn: timeoutSeconds }
  );

  return {
    token,
    tokenMaxAge: timeoutSeconds * 1000,
    student: {
      name: student.name,
      collegeId: student.collegeId,
      department: student.department,
      branch: student.branch || student.department || null,
      level: null,
      admissionYear: student.batch ? Number(student.batch) : null,
      currentSemester:
        computeCurrentSemester({ admissionYear: student.batch ? Number(student.batch) : null }) ||
        (student.semester ? String(student.semester) : null),
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

  const sessionId = uuidv4();
  const timeoutSeconds = await getSessionTimeoutSeconds();

  // Store sessionId so old admin sessions are invalidated on new login
  await prisma.staff.update({
    where: { id: staff.id },
    data: { sessionId, lastLogin: new Date() },
  });

  const token = jwt.sign(
    { id: staff.id, email: staff.email, role: 'admin', sessionId },
    JWT_SECRET,
    { expiresIn: timeoutSeconds }
  );

  return {
    token,
    tokenMaxAge: timeoutSeconds * 1000,
    staff: {
      id: staff.id,
      email: staff.email,
      name: staff.name,
    },
  };
}

export async function updateAdminPassword(adminId, currentPassword, newPassword) {
  const staff = await prisma.staff.findUnique({ where: { id: adminId } });
  if (!staff) return { error: 'NOT_FOUND', status: 404 };

  const valid = await bcrypt.compare(currentPassword, staff.passwordHash);
  if (!valid) return { error: 'INVALID_CREDENTIALS', status: 401 };

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  // Changing password also invalidates all existing sessions
  await prisma.staff.update({
    where: { id: adminId },
    data: { passwordHash: hashedPassword, sessionId: null },
  });

  return { success: true };
}
