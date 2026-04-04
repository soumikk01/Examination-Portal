import jwt from 'jsonwebtoken';
import prisma from '../database/database.js';
import { config } from '../config/config.js';

const { JWT_SECRET, ADMIN_API_KEY } = config;

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = req.cookies?.token || (authHeader && authHeader.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const student = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: {
        sessionId: true,
        collegeId: true,
        program: true,
        branch: true,
        semester: true,
      },
    });

    if (!student || student.sessionId !== decoded.sessionId) {
      return res.status(401).json({
        error: 'Session invalidated by another login.',
        code: 'SESSION_INVALIDATED',
      });
    }

    // Merge decoded token payload with latest student fields from DB
    req.user = { ...decoded, ...student };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const authorizeStudent = (req, res, next) => {
  const requestedCollegeId = decodeURIComponent(req.params.collegeId || req.params[0] || '').toLowerCase();
  const userCollegeId = (req.user.collegeId || '').toLowerCase();

  if (userCollegeId !== requestedCollegeId) {
    return res.status(403).json({ error: 'Access denied. You can only access your own records.' });
  }
  next();
};

/** Verifies JWT and sets req.user when token has role 'admin'. Does not accept X-Admin-Key. */
export const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = req.cookies?.token || (authHeader && authHeader.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid token. Admin access required.' });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true },
    });
    if (!staff) {
      return res.status(401).json({ error: 'Staff account not found.' });
    }

    req.user = { ...decoded, ...staff };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/** Accepts cookie JWT, Bearer admin JWT (from dashboard), or X-Admin-Key (for API/scripts). */
export const authorizeAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = req.cookies?.token || (authHeader && authHeader.split(' ')[1]);
  const adminKey = req.headers['x-admin-key'];

  if (token) {
    await verifyAdminToken(req, res, next);
    return;
  }
  if (adminKey && adminKey === ADMIN_API_KEY) {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized. Admin privileges required.' });
};

export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
        requestId: req.id,
      });
    }
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};
