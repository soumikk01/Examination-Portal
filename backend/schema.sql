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
    examCategory TEXT DEFAULT 'ODD',
    FOREIGN KEY(studentId) REFERENCES Students(id)
);

-- Seed Initial Data (Mock Data)
INSERT INTO Students (collegeId, name, department, studentRoll, studentReg, examinationSem, batch) VALUES 

('jis/2000/000', 'Soumik Biswas', 'Computer Science', NULL, NULL, '3rd Semester', '2023-2027');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 

-- Soumik Biswas Exams
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX101', 'Mathematics Examination', NULL, '2026-01-01', '09:00 AM', 'Hall A - Room 101', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX102', 'Programming in C Examination', NULL, '2026-01-12', '11:00 AM', 'Lab Block - Room 201', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX103', 'Data Structures Examination', NULL, '2026-01-15', '02:00 PM', 'Hall B - Room 105', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX104', 'Database Management Systems Examination', NULL, '2026-01-18', '10:00 AM', 'Hall C - Room 302', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX105', 'Operating Systems Examination', NULL, '2026-01-20', '09:30 AM', 'Hall A - Room 202', 'Regular', 'TEST-I'),
((SELECT id FROM Students WHERE collegeId = 'jis/2000/000'), 'EX106', 'Artificial Intelligence Examination', NULL, '2026-01-22', '01:00 PM', 'Lab Block - Room 401', 'Regular', 'TEST-II');


-- Civil Engineering Student (JIS/000/111)
INSERT INTO Students (collegeId, name, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('JIS/000/111', 'Rahul Roy', 'Civil Engineering', '2023CE111', 'REG2023111', '5th Semester', '2023-2027');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 
-- Past Exams (Gone)
((SELECT id FROM Students WHERE collegeId = 'JIS/000/111'), 'CE501', 'Civil Engineering Materials', NULL, '2025-12-20', '10:00 AM', 'Civil Block - 101', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/000/111'), 'CE502', 'Solid Mechanics', NULL, '2025-12-24', '02:00 PM', 'Civil Block - 102', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/000/111'), 'CE503', 'Fluid Mechanics', NULL, '2026-01-02', '10:00 AM', 'Civil Block - 103', 'Regular', 'EVEN'),
-- Upcoming Exams
((SELECT id FROM Students WHERE collegeId = 'JIS/000/111'), 'CE504', 'Surveying', NULL, '2026-01-08', '02:00 PM', 'Civil Block - 201', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/000/111'), 'CE505', 'Structural Analysis', NULL, '2026-01-12', '10:00 AM', 'Civil Block - 202', 'Regular', 'TEST-I'),
((SELECT id FROM Students WHERE collegeId = 'JIS/000/111'), 'CE506', 'Geotechnical Engineering', NULL, '2026-01-15', '02:00 PM', 'Civil Block - 203', 'Regular', 'TEST-II');

-- Electrical Engineering Student (JIS/222/333) - All Exams Completed
INSERT INTO Students (collegeId, name, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('JIS/222/333', 'Priya Sharma', 'Electrical Engineering', '2023EE333', 'REG2023333', '5th Semester', '2023-2027');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 
((SELECT id FROM Students WHERE collegeId = 'JIS/222/333'), 'EE501', 'Circuit Theory', 85, '2025-11-15', '10:00 AM', 'EE Block - 101', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/222/333'), 'EE502', 'Power Systems', 78, '2025-11-20', '02:00 PM', 'EE Block - 102', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/222/333'), 'EE503', 'Control Systems', 82, '2025-11-25', '10:00 AM', 'EE Block - 103', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/222/333'), 'EE504', 'Digital Electronics', 90, '2025-12-01', '02:00 PM', 'EE Block - 201', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/222/333'), 'EE505', 'Microprocessors', 88, '2025-12-10', '10:00 AM', 'EE Block - 202', 'Regular', 'TEST-I'),
((SELECT id FROM Students WHERE collegeId = 'JIS/222/333'), 'EE506', 'Electrical Machines', 75, '2025-12-15', '02:00 PM', 'EE Block - 203', 'Regular', 'TEST-II');
