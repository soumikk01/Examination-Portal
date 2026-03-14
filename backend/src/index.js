import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import pino from 'pino';
import pinoHttp from 'pino-http';
import prisma from './database.js';
import { studentSchema, verificationSchema } from './schemas.js';
import { v4 as uuidv4 } from 'uuid';
import compression from 'compression';
import { cache } from './lib/redis.js';
import redis from './lib/redis.js';
import { config } from './lib/config.js';

const app = express();
const { PORT, JWT_SECRET, ADMIN_API_KEY } = config;

// Professional Logger
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
    'res.body.sessionId'
  ],
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
    referrerPolicy: { policy: 'same-origin' },
}));
app.use(compression());

// Request ID Middleware
app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-Id', req.id);
    next();
});

app.use(pinoHttp({ 
    logger,
    genReqId: (req) => req.id,
    customLogLevel: (res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

const allowedOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Auth Middleware: verifyToken & Data Isolation
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verify Session ID against DB/Cache
        const student = await prisma.student.findUnique({
            where: { id: decoded.id },
            select: { sessionId: true }
        });

        if (!student || student.sessionId !== decoded.sessionId) {
            return res.status(401).json({ 
                error: 'Session invalidated by another login.',
                code: 'SESSION_INVALIDATED'
            });
        }

        req.user = decoded; // Contains id, collegeId, sessionId
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Data Isolation Check Middleware
const authorizeStudent = (req, res, next) => {
    const requestedCollegeId = decodeURIComponent(req.params.collegeId || req.params[0] || '').toLowerCase();
    const userCollegeId = (req.user.collegeId || '').toLowerCase();
    
    // If the student is trying to access someone else's profile
    if (userCollegeId !== requestedCollegeId) {
        return res.status(403).json({ error: 'Access denied. You can only access your own records.' });
    }
    next();
};

// Admin Authorization Middleware
const authorizeAdmin = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== ADMIN_API_KEY) {
        return res.status(403).json({ error: "Unauthorized. Admin privileges required for registration." });
    }
    next();
};

// Validation Middleware
const validate = (schema) => (req, res, next) => {
    try {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.errors });
        }
        req.body = result.data;
        next();
    } catch (error) {
        return res.status(500).json({ error: "Validation error" });
    }
};

/**
 * ROUTES - V1
 */
const v1Router = express.Router();

// Health check
v1Router.get('/health', async (req, res) => {
    const health = {
        status: 'UP',
        version: 'v1',
        timestamp: new Date(),
        checks: {
            database: 'DOWN',
            redis: 'DOWN'
        }
    };

    try {
        // Database Ping
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = 'UP';
    } catch (err) {
        health.status = 'DEGRADED';
        logger.error('Health Check - Database Error:', err.message);
    }

    try {
        // Redis Ping
        if (redis.status === 'ready') {
            await redis.ping();
            health.checks.redis = 'UP';
        }
    } catch (err) {
        health.status = 'DEGRADED';
        logger.error('Health Check - Redis Error:', err.message);
    }

    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
});

// AUTH: Professional Login (ID or Roll Number)
v1Router.post('/auth/login', validate(verificationSchema), async (req, res) => {
    const { collegeId, verification } = req.body;

    try {
        // Support searching by collegeId OR rollNumber (the identifier)
        const student = await prisma.student.findFirst({
            where: {
                OR: [
                    { collegeId: collegeId },
                    { studentRoll: collegeId }
                ]
            }
        });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Professional Verification: check last 3 digits
        const last3Digits = student.studentRoll.slice(-3);
        if (last3Digits !== verification) {
            return res.status(403).json({ error: "Verification failed. Check your credentials." });
        }

        // Generate Session ID
        const sessionId = uuidv4();

        // Update DB with session and login time
        const updatedStudent = await prisma.student.update({
            where: { id: student.id },
            data: {
                sessionId,
                lastLogin: new Date()
            }
        });

        // Invalidate Cache for this student
        await cache.del(`student:${student.collegeId}`);

        // Generate Professional JWT with sessionId
        const token = jwt.sign(
            { 
                id: student.id, 
                collegeId: student.collegeId,
                sessionId 
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: "Login successful",
            requestId: req.id,
            token,
            student: {
                name: student.name,
                collegeId: student.collegeId,
                department: student.department,
                lastLogin: updatedStudent.lastLogin
            }
        });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// GET /api/v1/student/:collegeId (Secure Profile)
v1Router.get('/student/*', verifyToken, authorizeStudent, async (req, res, next) => {
    const collegeId = decodeURIComponent(req.params[0]);
    const cacheKey = `student:${collegeId}`;

    try {
        // Try Cache First
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.json({ ...cachedData, _cached: true });
        }

        const student = await prisma.student.findUnique({
            where: { collegeId },
            include: { exams: true }
        });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Security: Remove sensitive sessionId from response
        const { sessionId: _, ...safeStudent } = student;

        // Save to Cache (1 hour)
        await cache.set(cacheKey, safeStudent, 3600);

        res.json(safeStudent);
    } catch (error) {
        next(error); // Pass to global error handler
    }
});

// POST /api/v1/student (Registration) - Protected
v1Router.post('/student', authorizeAdmin, validate(studentSchema), async (req, res) => {
    try {
        await prisma.student.create({ data: req.body });
        res.status(201).json({ message: "Student registered successfully" });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Student with this ID or Roll Number already exists." });
        }
        res.status(500).json({ error: "Registration error: " + error.message });
    }
});

app.use('/api/v1', v1Router);

// Root route - Friendly welcome
app.get('/', (req, res) => {
    res.json({
        message: "Professional Examination Portal API",
        status: "UP",
        endpoints: {
            health: "/api/v1/health",
            auth: "/api/v1/auth/login"
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, _next) => {
    logger.error({
        requestId: req.id,
        msg: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });

    // Handle Prisma Errors
    if (err.code?.startsWith('P')) {
        return res.status(400).json({
            error: "Database operation failed",
            code: err.code,
            requestId: req.id
        });
    }

    // Handle Zod/Validation Errors (if thrown)
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: "Validation failed",
            details: err.errors,
            requestId: req.id
        });
    }

    const status = err.status || 500;
    const response = {
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        requestId: req.id
    };

    res.status(status).json(response);
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
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
