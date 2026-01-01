import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('/*', cors());

// Mock Data
let students = [
    {
        collegeId: "CS2024001",
        name: "John Doe",
        department: "Computer Science",
        exams: [
            { examId: "EX001", subject: "Data Structures", score: 85 },
            { examId: "EX002", subject: "Algorithms", score: 90 }
        ]
    },
    {
        collegeId: "CS2024002",
        name: "Jane Smith",
        department: "Computer Science",
        exams: [
            { examId: "EX001", subject: "Data Structures", score: 78 }
        ]
    },
    {
        collegeId: "EE2024001",
        name: "Alice Brown",
        department: "Electrical Engineering",
        exams: []
    }
];

// Root endpoint
app.get('/', (c) => c.text('Examination Portal API is running!'));

// GET /api/health
app.get('/api/health', (c) => {
    return c.json({ status: 'UP', timestamp: new Date() });
});

// GET /api/students
app.get('/api/students', (c) => {
    return c.json(students);
});

// GET /api/search
app.get('/api/search', (c) => {
    const query = c.req.query('query');
    if (!query) return c.json({ error: "Query parameter is required" }, 400);

    const results = students.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.collegeId.toLowerCase().includes(query.toLowerCase())
    );
    return c.json(results);
});

// GET /api/student/:collegeId
app.get('/api/student/:collegeId', (c) => {
    const collegeId = c.req.param('collegeId');
    const student = students.find(s => s.collegeId === collegeId);
    if (!student) return c.json({ error: "Student not found" }, 404);
    return c.json(student);
});

// GET /api/student/:collegeId/exams
app.get('/api/student/:collegeId/exams', (c) => {
    const collegeId = c.req.param('collegeId');
    const student = students.find(s => s.collegeId === collegeId);
    if (!student) return c.json({ error: "Student not found" }, 404);
    return c.json(student.exams);
});

// GET /api/exam/:examId
app.get('/api/exam/:examId', (c) => {
    const examId = c.req.param('examId');
    const examDetails = [];
    students.forEach(s => {
        const exam = s.exams.find(e => e.examId === examId);
        if (exam) {
            examDetails.push({ studentName: s.name, collegeId: s.collegeId, ...exam });
        }
    });
    if (examDetails.length === 0) return c.json({ error: "Exam not found" }, 404);
    return c.json(examDetails);
});

// POST /api/student
app.post('/api/student', async (c) => {
    const newStudent = await c.req.json();
    if (!newStudent.collegeId || !newStudent.name) {
        return c.json({ error: "CollegeId and Name are required" }, 400);
    }
    students.push({ ...newStudent, exams: newStudent.exams || [] });
    return c.json(newStudent, 201);
});

// POST /api/student/:collegeId/exam
app.post('/api/student/:collegeId/exam', async (c) => {
    const collegeId = c.req.param('collegeId');
    const student = students.find(s => s.collegeId === collegeId);
    if (!student) return c.json({ error: "Student not found" }, 404);

    const newExam = await c.req.json();
    student.exams.push(newExam);
    return c.json(newExam, 201);
});

// PUT /api/student/:collegeId
app.put('/api/student/:collegeId', async (c) => {
    const collegeId = c.req.param('collegeId');
    const index = students.findIndex(s => s.collegeId === collegeId);
    if (index === -1) return c.json({ error: "Student not found" }, 404);

    const body = await c.req.json();
    students[index] = { ...students[index], ...body };
    return c.json(students[index]);
});

// DELETE /api/student/:collegeId
app.delete('/api/student/:collegeId', (c) => {
    const collegeId = c.req.param('collegeId');
    const initialLength = students.length;
    students = students.filter(s => s.collegeId !== collegeId);
    if (students.length === initialLength) return c.json({ error: "Student not found" }, 404);
    return c.body(null, 204);
});

// DELETE /api/student/:collegeId/exam/:examId
app.delete('/api/student/:collegeId/exam/:examId', (c) => {
    const collegeId = c.req.param('collegeId');
    const examId = c.req.param('examId');
    const student = students.find(s => s.collegeId === collegeId);
    if (!student) return c.json({ error: "Student not found" }, 404);

    student.exams = student.exams.filter(e => e.examId !== examId);
    return c.body(null, 204);
});

export default app;
