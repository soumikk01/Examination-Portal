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
import { studentSchema } from './utils/schemas.js';
import * as authController from './modules/auth/auth.controller.js';
import * as studentController from './modules/students/student.controller.js';
import * as examController from './modules/exams/exam.controller.js';
import * as roomController from './modules/rooms/room.controller.js';
import * as seatingController from './modules/seating/seating.controller.js';

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

v1Router.get('/student/*', verifyToken, authorizeStudent, studentController.getProfile);

v1Router.post('/student', authorizeAdmin, validate(studentSchema), studentController.register);

v1Router.get('/exams', examController.list);
v1Router.get('/exams/:id', examController.getById);

v1Router.get('/rooms', roomController.list);
v1Router.get('/rooms/:id', roomController.getById);

v1Router.get('/seating', seatingController.list);
v1Router.post('/seating', seatingController.assign);

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

  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
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
