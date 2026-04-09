import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import prisma from './database/database.js';
import { config } from './config/config.js';
import { verifyToken, authorizeStudent, authorizeAdmin, validate } from './middleware/auth.middleware.js';
import { verificationSchema, adminLoginSchema } from './utils/schemas.js';
import { studentSchema, examFormSchema } from './utils/schemas.js';
import * as authController from './modules/auth/auth.controller.js';
import * as studentController from './modules/students/student.controller.js';
import * as examController from './modules/exams/exam.controller.js';
import * as examScheduleController from './modules/examSchedule/examSchedule.controller.js';
import * as roomController from './modules/rooms/room.controller.js';
import * as seatingController from './modules/seating/seating.controller.js';
import * as optionsController from './modules/options/options.controller.js';
import * as dashboardController from './modules/dashboard/dashboard.controller.js';
import * as historyController from './modules/history/history.controller.js';
import * as settingsController from './modules/settings/settings.controller.js';
import multer from 'multer';

const app = express();
const { PORT, CORS_ORIGIN } = config;

const logger = pino({
  redact: [
    'res.headers.set-cookie',
    'req.headers.cookie',
    'req.headers.authorization',
    'req.body.verification',
    'req.body.token',
    'req.body.adminKey',
    'req.body.studentRoll',
    'req.body.studentReg',
    'req.body.password',
    'req.body.email',
    'res.body.sessionId',
  ],
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    referrerPolicy: { policy: 'same-origin' },
  })
);
app.use(compression());

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel: (res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

const allowedOrigins = CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const isDev = process.env.NODE_ENV === 'development';

/**
 * Smart key generator: rate-limit per USER (if authenticated) or per IP (if not).
 * Uses jwt.verify() — validates the token signature with JWT_SECRET so attackers
 * cannot craft fake tokens to exhaust another user's rate limit (DoS protection).
 * Falls back to per-IP for unauthenticated or tampered requests.
 */
const { JWT_SECRET } = config;
const smartKey = (req) => {
  try {
    const token = req.cookies?.student_token || req.cookies?.admin_token || req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id) return `user:${decoded.id}`;
    }
  } catch (_) { /* expired/tampered token — fall through to IP */ }
  // Sanitize IP for rate limiting key (no raw IPv6 colons)
  const ip = (req.ip || '127.0.0.1').replace(/:/g, '_');
  return `ip:${ip}`;
};

// Tier 1: Auth limiter — ALWAYS per IP (user not authenticated yet at login)
// 5 attempts per 15 minutes per IP — blocks brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  // keyGenerator defaults to req.ip — correct for login routes
});

// Tier 2: Upload limiter — per USER (admin only, heavy CPU/mem operation)
// 10 uploads per hour per user
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: smartKey,
  message: { error: 'Upload limit reached. Please try again in an hour.' },
});

// Tier 3: General API limiter — per USER if logged in, per IP if not
// 300 requests per 15 minutes — comfortable for your college load
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: smartKey,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});
app.use(generalLimiter);

const v1Router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      String(file.originalname || '').toLowerCase().endsWith('.pdf');
    cb(isPdf ? null : new Error('Only PDF files are allowed'), isPdf);
  },
});

/* Health endpoint removed per requirement */

v1Router.post('/auth/login', authLimiter, validate(verificationSchema), authController.login);
v1Router.post('/auth/admin/login', authLimiter, validate(adminLoginSchema), authController.adminLogin);
v1Router.put('/auth/admin/password', authorizeAdmin, authController.updateAdminPassword);
v1Router.post('/auth/logout', authController.logout);
v1Router.post('/auth/admin/logout', authController.logout);

// Dashboard
v1Router.get('/dashboard/summary', authorizeAdmin, dashboardController.getDashboardSummary);
v1Router.delete('/dashboard/schedules', authorizeAdmin, dashboardController.deleteSchedules);
v1Router.delete('/dashboard/seating/:examGroup', authorizeAdmin, dashboardController.deleteSeating);

// History
v1Router.get('/history', authorizeAdmin, historyController.getHistory);
v1Router.delete('/history/schedule/:uploadId', authorizeAdmin, historyController.deleteSchedule);
v1Router.delete('/history/seating/:examGroup', authorizeAdmin, historyController.deleteSeatingGroup);

// Options (programs, branches, semesters) – from DB, no hardcoded data
v1Router.get('/options/programs', authorizeAdmin, optionsController.getPrograms);
v1Router.get('/options/branches', authorizeAdmin, optionsController.getBranches);
v1Router.get('/options/semesters', authorizeAdmin, optionsController.getSemesters);
v1Router.get('/options/exam-options', authorizeAdmin, optionsController.getExamOptions);
v1Router.get('/options/all-programs', authorizeAdmin, optionsController.getAllProgramsWithBranches);

v1Router.get('/students', authorizeAdmin, studentController.list);
v1Router.post('/student', authorizeAdmin, validate(studentSchema), studentController.register);
v1Router.post('/students/bulk', authorizeAdmin, studentController.registerBulk);

// Exams - admin + student
v1Router.get('/exams', authorizeAdmin, examController.list);
v1Router.post('/exams', authorizeAdmin, validate(examFormSchema), examController.createManyFromForm);
v1Router.patch('/exams/:id/status', authorizeAdmin, examController.updateStatus);
// Legacy student exams (manual exam rows): keep for backward compatibility
v1Router.get('/student/my-exams', verifyToken, examController.listForStudent);

// Exam schedule (PDF upload -> draft -> publish -> student-facing)
v1Router.post('/exam/upload-pdf', authorizeAdmin, uploadLimiter, upload.single('file'), examScheduleController.uploadPdf);
v1Router.post('/exam/parse-pdf', authorizeAdmin, uploadLimiter, upload.single('file'), examScheduleController.parsePdf);
v1Router.post('/exam/save-draft', authorizeAdmin, examScheduleController.saveDraft);
v1Router.delete('/exam/batch/:uploadId', authorizeAdmin, examScheduleController.deleteBatch);
v1Router.get('/exam/list', authorizeAdmin, examScheduleController.list);
v1Router.post('/exam/publish', authorizeAdmin, examScheduleController.publish);
// Student schedule: required by frontend spec
v1Router.get('/student/exams', verifyToken, examScheduleController.listForStudent);
// Public/student-safe filters for dropdowns (protected by token for system privacy)
v1Router.get('/student/exams/filters', verifyToken, examScheduleController.listPublishedFilters);

// Student Seating
v1Router.get('/student/seating', verifyToken, seatingController.getStudentSeating);

// Student profile routes (keep wildcard last so it doesn't shadow other /student/* routes)
v1Router.get('/student/*', verifyToken, authorizeStudent, studentController.getProfile);

v1Router.get('/rooms', authorizeAdmin, roomController.list);
v1Router.post('/rooms/generate-allotment', authorizeAdmin, roomController.generateAllotment);
v1Router.get('/rooms/exam-groups', authorizeAdmin, roomController.listExamGroups);
v1Router.get('/rooms/allotment/:examGroup', authorizeAdmin, roomController.getAllotment);
v1Router.get('/rooms/student-counts', authorizeAdmin, roomController.getStudentCounts);
v1Router.post('/rooms/allotments', authorizeAdmin, roomController.saveAllotment);
v1Router.patch('/rooms/:roomNo/capacity', authorizeAdmin, roomController.updateCapacity);
v1Router.get('/rooms/:id', authorizeAdmin, roomController.getById);

v1Router.get('/seating', authorizeAdmin, seatingController.list);
v1Router.post('/seating/generate', authorizeAdmin, seatingController.generate);
v1Router.post('/seating', authorizeAdmin, seatingController.assign);
v1Router.get('/seating/room/:roomNo', authorizeAdmin, seatingController.getRoomSeating);
v1Router.post('/seating/publish', authorizeAdmin, seatingController.publish);
v1Router.get('/seating/:examGroup', authorizeAdmin, seatingController.getSeating);


// Settings (Accessible to all users to see notices/maintenance)
v1Router.get('/settings', settingsController.getSettings);
v1Router.put('/settings', authorizeAdmin, settingsController.updateSettings);

app.use('/api/v1', v1Router);

app.get('/', (req, res) => {
  res.json({
    message: 'Professional Examination Portal API',
    status: 'UP',
    endpoints: {
      auth: '/api/v1/auth/login',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((err, req, res, _next) => {
  logger.error({
    requestId: req.id,
    msg: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });

  if (err.code?.startsWith('P')) {
    return res.status(503).json({
      error: 'Service temporarily unavailable. We are experiencing high traffic, please try again momentarily.',
      requestId: req.id,
      // NOTE: err.code is intentionally NOT sent to client to prevent schema leakage
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
      requestId: req.id,
    });
  }

  // Never send raw DB/Prisma messages to the client (security & UX)
  const isDbConnectionError =
    err.name === 'PrismaClientInitializationError' ||
    err.message?.includes('Authentication failed against database') ||
    err.message?.includes('database server') ||
    err.message?.includes('credentials for `postgres`');
  if (isDbConnectionError) {
    return res.status(503).json({
      error: 'Service temporarily unavailable. Please try again later.',
      requestId: req.id,
    });
  }

  const status = err.status || 500;
  const safeMessage =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(status).json({
    error: safeMessage,
    requestId: req.id,
  });
});

const server = app.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  
  // Test database connection on startup
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    logger.info('[SUCCESS] Database connected successfully');
  } catch (error) {
    logger.error('[ERROR] Database connection failed: ' + error.message);
  }
});

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Disconnected from database. Exit.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
