-- Drop existing tables (for clean recreation)
DROP TABLE IF EXISTS Exams;
DROP TABLE IF EXISTS Students;

-- Create Students Table
CREATE TABLE IF NOT EXISTS Students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collegeId TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT,
    studentRoll TEXT,
    studentReg TEXT,
    examinationSem TEXT,
    batch TEXT
);

CREATE TABLE IF NOT EXISTS Exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER,
    examId TEXT,
    subject TEXT,
    score INTEGER,
    date TEXT,
    time TEXT,
    room TEXT,
    examType TEXT DEFAULT 'Regular',
    FOREIGN KEY(studentId) REFERENCES Students(id)
);

-- Seed Initial Data (Mock Data)
INSERT INTO Students (collegeId, name, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('CS2024001', 'John Doe', 'Computer Science', '2024CS001', 'REG2024001', '4th Semester', '2022-2026'),
('CS2024002', 'Jane Smith', 'Computer Science', '2024CS002', 'REG2024002', '4th Semester', '2022-2026'),
('ME2024003', 'Alice Brown', 'Mechanical Engineering', '2024ME003', 'REG2024003', '2nd Semester', '2023-2027'),
('jis/2000/000', 'Soumik Biswas', 'Computer Science', NULL, NULL, '3rd Semester', '2023-2027');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType) VALUES 
((SELECT id FROM Students WHERE collegeId = 'CS2024001'), 'EX001', 'Data Structures', 85, '2024-05-15', '10:00 AM', 'Block A - 101', 'Regular'),
((SELECT id FROM Students WHERE collegeId = 'CS2024001'), 'EX002', 'Algorithms', 90, '2024-05-17', '02:00 PM', 'Block B - 205', 'Backlog'),
((SELECT id FROM Students WHERE collegeId = 'CS2024002'), 'EX001', 'Data Structures', 78, '2024-05-15', '10:00 AM', 'Block A - 102', 'Regular'),
((SELECT id FROM Students WHERE collegeId = 'ME2024003'), 'EX003', 'Thermodynamics', 88, '2024-05-20', '09:00 AM', 'Block C - 301', 'Regular'),
-- Soumik Biswas Exams
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX101', 'Mathematics Examination', NULL, '2026-01-10', '09:00 AM', 'Hall A - Room 101', 'Regular'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX102', 'Programming in C Examination', NULL, '2026-01-12', '11:00 AM', 'Lab Block - Room 201', 'Regular'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX103', 'Data Structures Examination', NULL, '2026-01-15', '02:00 PM', 'Hall B - Room 105', 'Regular'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX104', 'Database Management Systems Examination', NULL, '2026-01-18', '10:00 AM', 'Hall C - Room 302', 'Regular'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX105', 'Operating Systems Examination', NULL, '2026-01-20', '09:30 AM', 'Hall A - Room 202', 'Regular'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX106', 'Artificial Intelligence Examination', NULL, '2026-01-22', '01:00 PM', 'Lab Block - Room 401', 'Regular');

