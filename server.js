const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

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

// Endpoints

// GET /api/health
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

// GET /api/students
app.get('/api/students', (req, res) => {
    res.json(students);
});

// GET /api/search
app.get('/api/search', (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Query parameter is required" });
    
    const results = students.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) || 
        s.collegeId.toLowerCase().includes(query.toLowerCase())
    );
    res.json(results);
});

// GET /api/student/:collegeId
app.get('/api/student/:collegeId', (req, res) => {
    const student = students.find(s => s.collegeId === req.params.collegeId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
});

// GET /api/student/:collegeId/exams
app.get('/api/student/:collegeId/exams', (req, res) => {
    const student = students.find(s => s.collegeId === req.params.collegeId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student.exams);
});

// GET /api/exam/:examId
app.get('/api/exam/:examId', (req, res) => {
    const examDetails = [];
    students.forEach(s => {
        const exam = s.exams.find(e => e.examId === req.params.examId);
        if (exam) {
            examDetails.push({ studentName: s.name, collegeId: s.collegeId, ...exam });
        }
    });
    if (examDetails.length === 0) return res.status(404).json({ error: "Exam not found" });
    res.json(examDetails);
});

// POST /api/student
app.post('/api/student', (req, res) => {
    const newStudent = req.body;
    if (!newStudent.collegeId || !newStudent.name) {
        return res.status(400).json({ error: "CollegeId and Name are required" });
    }
    students.push({ ...newStudent, exams: newStudent.exams || [] });
    res.status(201).json(newStudent);
});

// POST /api/student/:collegeId/exam
app.post('/api/student/:collegeId/exam', (req, res) => {
    const student = students.find(s => s.collegeId === req.params.collegeId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    
    const newExam = req.body;
    student.exams.push(newExam);
    res.status(201).json(newExam);
});

// PUT /api/student/:collegeId
app.put('/api/student/:collegeId', (req, res) => {
    const index = students.findIndex(s => s.collegeId === req.params.collegeId);
    if (index === -1) return res.status(404).json({ error: "Student not found" });
    
    students[index] = { ...students[index], ...req.body };
    res.json(students[index]);
});

// DELETE /api/student/:collegeId
app.delete('/api/student/:collegeId', (req, res) => {
    const initialLength = students.length;
    students = students.filter(s => s.collegeId !== req.params.collegeId);
    if (students.length === initialLength) return res.status(404).json({ error: "Student not found" });
    res.status(204).send();
});

// DELETE /api/student/:collegeId/exam/:examId
app.delete('/api/student/:collegeId/exam/:examId', (req, res) => {
    const student = students.find(s => s.collegeId === req.params.collegeId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    
    student.exams = student.exams.filter(e => e.examId !== req.params.examId);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 Total Students: ${students.length}`);
});
