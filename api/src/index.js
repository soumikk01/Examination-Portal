import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('/*', cors());

// Root endpoint
app.get('/', (c) => c.text('Examination Portal API (D1 Database) is running!'));

// GET /api/health
app.get('/api/health', (c) => {
    return c.json({ status: 'UP', timestamp: new Date() });
});

// GET /api/students
app.get('/api/students', async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM Students").all();
    return c.json(results);
});

// GET /api/search
app.get('/api/search', async (c) => {
    const query = c.req.query('query');
    if (!query) return c.json({ error: "Query parameter is required" }, 400);

    const { results } = await c.env.DB.prepare(
        "SELECT * FROM Students WHERE name LIKE ? OR collegeId LIKE ?"
    )
        .bind(`%${query}%`, `%${query}%`)
        .all();

    return c.json(results);
});

// GET /api/student/* (supports IDs with slashes like jis/2000/000)
app.get('/api/student/*', async (c) => {
    // Extract collegeId from the wildcard path
    const collegeId = c.req.path.replace('/api/student/', '');

    // Fetch Student
    const student = await c.env.DB.prepare("SELECT * FROM Students WHERE collegeId = ?")
        .bind(collegeId)
        .first();

    if (!student) return c.json({ error: "Student not found" }, 404);

    // Fetch Exams for this Student
    const { results: exams } = await c.env.DB.prepare("SELECT * FROM Exams WHERE studentId = ?")
        .bind(student.id)
        .all();

    return c.json({ ...student, exams: exams || [] });
});

// GET /api/student/:collegeId/exams
app.get('/api/student/:collegeId/exams', async (c) => {
    const collegeId = c.req.param('collegeId');
    const student = await c.env.DB.prepare("SELECT id FROM Students WHERE collegeId = ?").bind(collegeId).first();

    if (!student) return c.json({ error: "Student not found" }, 404);

    const { results } = await c.env.DB.prepare("SELECT * FROM Exams WHERE studentId = ?").bind(student.id).all();
    return c.json(results);
});

// POST /api/student
app.post('/api/student', async (c) => {
    const body = await c.req.json();
    if (!body.collegeId || !body.name) {
        return c.json({ error: "CollegeId and Name are required" }, 400);
    }

    try {
        const { success } = await c.env.DB.prepare(
            "INSERT INTO Students (collegeId, name, department, studentRoll, studentReg, examinationSem, batch) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
            .bind(
                body.collegeId,
                body.name,
                body.department || null,
                body.studentRoll || null,
                body.studentReg || null,
                body.examinationSem || null,
                body.batch || null
            )
            .run();

        if (success) {
            return c.json({ message: "Student created successfully" }, 201);
        } else {
            return c.json({ error: "Failed to create student" }, 500);
        }
    } catch (e) {
        return c.json({ error: "Error creating student: " + e.message }, 500);
    }
});

// POST /api/student/:collegeId/exam
app.post('/api/student/:collegeId/exam', async (c) => {
    const collegeId = c.req.param('collegeId');
    let body;
    try {
        body = await c.req.json();
    } catch (e) {
        return c.json({ error: "Invalid JSON body" }, 400);
    }

    const student = await c.env.DB.prepare("SELECT id FROM Students WHERE collegeId = ?").bind(collegeId).first();
    if (!student) return c.json({ error: "Student not found" }, 404);

    try {
        const { success } = await c.env.DB.prepare(
            "INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
            .bind(
                student.id,
                body.examId,
                body.subject,
                body.score !== undefined ? body.score : null,
                body.date,
                body.time,
                body.room,
                body.examType || 'Regular',
                body.examCategory || 'ODD'
            )
            .run();

        if (success) {
            return c.json({ message: "Exam added successfully" }, 201);
        } else {
            return c.json({ error: "Failed to add exam" }, 500);
        }
    } catch (e) {
        return c.json({ error: "Error adding exam: " + e.message }, 500);
    }
});

// DELETE /api/student/:collegeId/exam/:examId
app.delete('/api/student/:collegeId/exam/:examId', async (c) => {
    const examId = c.req.param('examId');

    try {
        const { success } = await c.env.DB.prepare("DELETE FROM Exams WHERE examId = ?").bind(examId).run();

        if (success) {
            return c.json({ message: "Exam deleted successfully" });
        } else {
            return c.json({ error: "Failed to delete exam" }, 500);
        }
    } catch (e) {
        return c.json({ error: "Error deleting exam: " + e.message }, 500);
    }
});

// DELETE /api/student/:collegeId
app.delete('/api/student/:collegeId', async (c) => {
    const collegeId = c.req.param('collegeId');

    try {
        const student = await c.env.DB.prepare("SELECT id FROM Students WHERE collegeId = ?").bind(collegeId).first();

        if (!student) return c.json({ error: "Student not found" }, 404);

        // Delete Exams first (Foreign Key)
        await c.env.DB.prepare("DELETE FROM Exams WHERE studentId = ?").bind(student.id).run();
        // Delete Student
        await c.env.DB.prepare("DELETE FROM Students WHERE id = ?").bind(student.id).run();

        return c.body(null, 204);
    } catch (e) {
        return c.json({ error: "Error deleting student: " + e.message }, 500);
    }
});

export default app;
