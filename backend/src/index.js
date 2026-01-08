import express from 'express';
import cors from 'cors';
import db, { initializeDatabase } from './database.js';

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase();

// Root endpoint
app.get('/', (req, res) => {
    res.send('Examination Portal API (Express + SQLite) is running!');
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

// GET /api/students
app.get('/api/students', (req, res) => {
    try {
        const results = db.prepare("SELECT * FROM Students").all();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/search
app.get('/api/search', (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
        const results = db.prepare(
            "SELECT * FROM Students WHERE name LIKE ? OR collegeId LIKE ?"
        ).all(`%${query}%`, `%${query}%`);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/student/verify
app.post('/api/student/verify', (req, res) => {
    const { collegeId, verification } = req.body;

    if (!collegeId || !verification) {
        return res.status(400).json({ error: "College ID and verification are required" });
    }

    try {
        const student = db.prepare("SELECT * FROM Students WHERE collegeId = ?").get(collegeId);

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Verification: Check if verification matches last 3 digits of studentRoll
        if (!student.studentRoll) {
            return res.status(403).json({ error: "Roll number not found for this student." });
        }

        const last3Digits = student.studentRoll.slice(-3);
        if (last3Digits !== verification) {
            return res.status(403).json({ error: "Verification failed. Please check the last 3 digits of your roll number." });
        }

        // If verification passed, return student data with exams
        const exams = db.prepare("SELECT * FROM Exams WHERE studentId = ?").all(student.id);
        res.json({ ...student, exams: exams || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/student/* (supports IDs with slashes like jis/2000/000)
// Kept for backward compatibility but should migrate to POST verify
app.get('/api/student/*', (req, res) => {
    // Handle both regular params and wildcard for IDs with slashes
    const collegeId = req.params[0] || req.params.collegeId;

    try {
        const student = db.prepare("SELECT * FROM Students WHERE collegeId = ?").get(collegeId);

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        const exams = db.prepare("SELECT * FROM Exams WHERE studentId = ?").all(student.id);
        res.json({ ...student, exams: exams || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/student
app.post('/api/student', (req, res) => {
    const body = req.body;
    if (!body.collegeId || !body.name) {
        return res.status(400).json({ error: "CollegeId and Name are required" });
    }

    try {
        const stmt = db.prepare(
            "INSERT INTO Students (collegeId, name, department, studentRoll, studentReg, examinationSem, batch) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        stmt.run(
            body.collegeId,
            body.name,
            body.department || null,
            body.studentRoll || null,
            body.studentReg || null,
            body.examinationSem || null,
            body.batch || null
        );
        res.status(201).json({ message: "Student created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error creating student: " + error.message });
    }
});

// POST /api/student/:collegeId/exam
app.post('/api/student/:collegeId/exam', (req, res) => {
    const collegeId = req.params.collegeId;
    const body = req.body;

    try {
        const student = db.prepare("SELECT id FROM Students WHERE collegeId = ?").get(collegeId);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        const stmt = db.prepare(
            "INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        stmt.run(
            student.id,
            body.examId,
            body.subject,
            body.score !== undefined ? body.score : null,
            body.date,
            body.time,
            body.room,
            body.examType || 'Regular',
            body.examCategory || 'ODD'
        );
        res.status(201).json({ message: "Exam added successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error adding exam: " + error.message });
    }
});

// DELETE /api/student/:collegeId/exam/:examId
app.delete('/api/student/:collegeId/exam/:examId', (req, res) => {
    const examId = req.params.examId;

    try {
        db.prepare("DELETE FROM Exams WHERE examId = ?").run(examId);
        res.json({ message: "Exam deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting exam: " + error.message });
    }
});

// DELETE /api/student/:collegeId
app.delete('/api/student/:collegeId', (req, res) => {
    const collegeId = req.params.collegeId;

    try {
        const student = db.prepare("SELECT id FROM Students WHERE collegeId = ?").get(collegeId);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        db.prepare("DELETE FROM Exams WHERE studentId = ?").run(student.id);
        db.prepare("DELETE FROM Students WHERE id = ?").run(student.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Error deleting student: " + error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
