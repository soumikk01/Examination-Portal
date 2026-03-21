import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import compression from 'compression';

import prisma from './database/database.js';
import redis from './utils/redis.js';
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

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

v1Router.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    version: 'v1',
    timestamp: new Date(),
    checks: { database: 'DOWN', redis: 'DOWN' },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'UP';
  } catch (err) {
    health.status = 'DEGRADED';
    logger.error('Health Check - Database Error:', err.message);
  }

  try {
    if (redis.status === 'ready') {
      await redis.ping();
      health.checks.redis = 'UP';
    }
  } catch (err) {
    health.status = 'DEGRADED';
    logger.error('Health Check - Redis Error:', err.message);
  }

  res.status(health.status === 'UP' ? 200 : 503).json(health);
});

v1Router.post('/auth/login', validate(verificationSchema), authController.login);
v1Router.post('/auth/admin/login', validate(adminLoginSchema), authController.adminLogin);

// Options (programs, branches, semesters) – from DB, no hardcoded data
v1Router.get('/options/programs', authorizeAdmin, optionsController.getPrograms);
v1Router.get('/options/branches', authorizeAdmin, optionsController.getBranches);
v1Router.get('/options/semesters', authorizeAdmin, optionsController.getSemesters);
v1Router.get('/options/exam-options', authorizeAdmin, optionsController.getExamOptions);

v1Router.get('/students', authorizeAdmin, studentController.list);
v1Router.post('/student', authorizeAdmin, validate(studentSchema), studentController.register);

// Exams - admin + student
v1Router.get('/exams', authorizeAdmin, examController.list);
v1Router.post('/exams', authorizeAdmin, validate(examFormSchema), examController.createManyFromForm);
v1Router.patch('/exams/:id/status', authorizeAdmin, examController.updateStatus);
// Legacy student exams (manual exam rows): keep for backward compatibility
v1Router.get('/student/my-exams', verifyToken, examController.listForStudent);

// Exam schedule (PDF upload -> draft -> publish -> student-facing)
v1Router.post('/exam/upload-pdf', authorizeAdmin, upload.single('file'), examScheduleController.uploadPdf);
v1Router.post('/exam/parse-pdf', authorizeAdmin, upload.single('file'), examScheduleController.parsePdf);
v1Router.post('/exam/save-draft', authorizeAdmin, examScheduleController.saveDraft);
v1Router.delete('/exam/batch/:uploadId', authorizeAdmin, examScheduleController.deleteBatch);
v1Router.get('/exam/list', authorizeAdmin, examScheduleController.list);
v1Router.post('/exam/publish', authorizeAdmin, examScheduleController.publish);
// Student schedule: required by frontend spec
v1Router.get('/student/exams', examScheduleController.listForStudent);
// Public/student-safe filters for dropdowns
v1Router.get('/student/exams/filters', examScheduleController.listPublishedFilters);

// Student profile routes (keep wildcard last so it doesn't shadow other /student/* routes)
v1Router.get('/student/*', verifyToken, authorizeStudent, studentController.getProfile);

v1Router.get('/rooms', roomController.list);
v1Router.post('/rooms/generate-allotment', authorizeAdmin, roomController.generateAllotment);
v1Router.get('/rooms/exam-groups', authorizeAdmin, roomController.listExamGroups);
v1Router.get('/rooms/allotment/:examGroup', authorizeAdmin, roomController.getAllotment);
v1Router.get('/rooms/:id', roomController.getById);

v1Router.get('/seating', seatingController.list);
v1Router.post('/seating/generate', authorizeAdmin, seatingController.generate);
v1Router.post('/seating', seatingController.assign);
v1Router.get('/seating/:examGroup', authorizeAdmin, seatingController.getSeating);

app.use('/api/v1', v1Router);

app.get('/', (req, res) => {
  res.json({
    message: 'Professional Examination Portal API',
    status: 'UP',
    endpoints: {
      health: '/api/v1/health',
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
    return res.status(400).json({
      error: 'Database operation failed',
      code: err.code,
      requestId: req.id,
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

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
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
