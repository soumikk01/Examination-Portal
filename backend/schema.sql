-- Drop existing tables (for clean recreation)
DROP TABLE IF EXISTS Exams;
DROP TABLE IF EXISTS Students;

-- Create Students Table
CREATE TABLE IF NOT EXISTS Students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collegeId TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    degree TEXT,
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
INSERT INTO Students (collegeId, name, degree, department, studentRoll, studentReg, examinationSem, batch) VALUES 

('JIS/2000/0000', 'Soumik Biswas', 'B.TECH', 'Computer Science', '2023CS0000', 'REG20230000', '3rd Semester', '2027');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 

-- Soumik Biswas Exams
((SELECT id FROM Students WHERE collegeId = 'JIS/2000/0000'), 'EX101', 'Mathematics Examination', NULL, '2026-01-01', '09:00 AM', 'Hall A - Room 101', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2000/0000'), 'EX102', 'Programming in C Examination', NULL, '2026-01-12', '11:00 AM', 'Lab Block - Room 201', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2000/0000'), 'EX103', 'Data Structures Examination', NULL, '2026-01-15', '02:00 PM', 'Hall B - Room 105', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2000/0000'), 'EX104', 'Database Management Systems Examination', NULL, '2026-01-18', '10:00 AM', 'Hall C - Room 302', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2000/0000'), 'EX105', 'Operating Systems Examination', NULL, '2026-01-20', '09:30 AM', 'Hall A - Room 202', 'Regular', 'TEST-I'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2000/0000'), 'EX106', 'Artificial Intelligence Examination', NULL, '2026-01-22', '01:00 PM', 'Lab Block - Room 401', 'Regular', 'TEST-II');


-- Civil Engineering Student (JIS/0000/1111)
INSERT INTO Students (collegeId, name, degree, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('JIS/0000/1111', 'Rahul Roy', 'B.TECH', 'Civil Engineering', '2023CE1111', 'REG20231111', '5th Semester', '2027');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 
-- Past Exams (Gone)
((SELECT id FROM Students WHERE collegeId = 'JIS/0000/1111'), 'CE501', 'Civil Engineering Materials', NULL, '2025-12-20', '10:00 AM', 'Civil Block - 101', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/0000/1111'), 'CE502', 'Solid Mechanics', NULL, '2025-12-24', '02:00 PM', 'Civil Block - 102', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/0000/1111'), 'CE503', 'Fluid Mechanics', NULL, '2026-01-02', '10:00 AM', 'Civil Block - 103', 'Regular', 'EVEN'),
-- Upcoming Exams
((SELECT id FROM Students WHERE collegeId = 'JIS/0000/1111'), 'CE504', 'Surveying', NULL, '2026-01-08', '02:00 PM', 'Civil Block - 201', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/0000/1111'), 'CE505', 'Structural Analysis', NULL, '2026-01-12', '10:00 AM', 'Civil Block - 202', 'Regular', 'TEST-I'),
((SELECT id FROM Students WHERE collegeId = 'JIS/0000/1111'), 'CE506', 'Geotechnical Engineering', NULL, '2026-01-15', '02:00 PM', 'Civil Block - 203', 'Regular', 'TEST-II');

-- Electrical Engineering Student (JIS/2222/3333) - All Exams Completed
INSERT INTO Students (collegeId, name, degree, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('JIS/2222/3333', 'Priya Sharma', 'B.TECH', 'Electrical Engineering', '2023EE3333', 'REG20233333', '5th Semester', '2027');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 
((SELECT id FROM Students WHERE collegeId = 'JIS/2222/3333'), 'EE501', 'Circuit Theory', 85, '2025-11-15', '10:00 AM', 'EE Block - 101', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2222/3333'), 'EE502', 'Power Systems', 78, '2025-11-20', '02:00 PM', 'EE Block - 102', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2222/3333'), 'EE503', 'Control Systems', 82, '2025-11-25', '10:00 AM', 'EE Block - 103', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2222/3333'), 'EE504', 'Digital Electronics', 90, '2025-12-01', '02:00 PM', 'EE Block - 201', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2222/3333'), 'EE505', 'Microprocessors', 88, '2025-12-10', '10:00 AM', 'EE Block - 202', 'Regular', 'TEST-I'),
((SELECT id FROM Students WHERE collegeId = 'JIS/2222/3333'), 'EE506', 'Electrical Machines', 75, '2025-12-15', '02:00 PM', 'EE Block - 203', 'Regular', 'TEST-II');


-- Student with Backlog (JIS/9999/9999)
INSERT INTO Students (collegeId, name, degree, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('JIS/9999/9999', 'Amit Verma', 'B.TECH', 'Mechanical Engineering', '2023ME9999', 'REG20239999', '4th Semester', '2027');


INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 
-- Backlog Exams
((SELECT id FROM Students WHERE collegeId = 'JIS/9999/9999'), 'ME401', 'Thermodynamics (Backlog)', NULL, '2026-01-10', '10:00 AM', 'ME Block - 101', 'Backlog', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/9999/9999'), 'ME402', 'Fluid Mechanics (Backlog)', NULL, '2026-01-14', '02:00 PM', 'ME Block - 102', 'Backlog', 'ODD'),

-- Regular Exams
((SELECT id FROM Students WHERE collegeId = 'JIS/9999/9999'), 'ME405', 'Machine Design', NULL, '2026-01-18', '10:00 AM', 'ME Block - 201', 'Regular', 'EVEN');


-- BBA Student (JIS/1111/2222)
INSERT INTO Students (collegeId, name, degree, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('JIS/1111/2222', 'Ananya Gupta', 'BBA', 'Business Administration', '2024BBA2222', 'REG20242222', '2nd Semester', '2027');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 
((SELECT id FROM Students WHERE collegeId = 'JIS/1111/2222'), 'BBA201', 'Business Communication', NULL, '2026-01-09', '10:00 AM', 'Management Block - 101', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/1111/2222'), 'BBA202', 'Financial Accounting', NULL, '2026-01-13', '02:00 PM', 'Management Block - 102', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/1111/2222'), 'BBA203', 'Marketing Management', NULL, '2026-01-17', '10:00 AM', 'Management Block - 201', 'Regular', 'EVEN');


-- M.TECH Student (JIS/3333/4444)
INSERT INTO Students (collegeId, name, degree, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('JIS/3333/4444', 'Rajesh Kumar', 'M.TECH', 'Computer Science & Engineering', '2024MT4444', 'REG20244444', '1st Semester', '2026');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 
((SELECT id FROM Students WHERE collegeId = 'JIS/3333/4444'), 'MT101', 'Advanced Algorithms', NULL, '2026-01-11', '10:00 AM', 'PG Block - 301', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/3333/4444'), 'MT102', 'Machine Learning', NULL, '2026-01-16', '02:00 PM', 'PG Block - 302', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/3333/4444'), 'MT103', 'Research Methodology', NULL, '2026-01-21', '10:00 AM', 'PG Block - 401', 'Regular', 'EVEN');


-- DIPLOMA Student (JIS/5555/6666)
INSERT INTO Students (collegeId, name, degree, department, studentRoll, studentReg, examinationSem, batch) VALUES 
('JIS/5555/6666', 'Neha Singh', 'DIPLOMA', 'Electronics & Communication', '2023DIP6666', 'REG20236666', '4th Semester', '2026');

INSERT INTO Exams (studentId, examId, subject, score, date, time, room, examType, examCategory) VALUES 
((SELECT id FROM Students WHERE collegeId = 'JIS/5555/6666'), 'DIP401', 'Digital Electronics', NULL, '2026-01-08', '10:00 AM', 'Diploma Block - 101', 'Regular', 'ODD'),
((SELECT id FROM Students WHERE collegeId = 'JIS/5555/6666'), 'DIP402', 'Microcontrollers', NULL, '2026-01-12', '02:00 PM', 'Diploma Block - 102', 'Regular', 'EVEN'),
((SELECT id FROM Students WHERE collegeId = 'JIS/5555/6666'), 'DIP403', 'Communication Systems', NULL, '2026-01-19', '10:00 AM', 'Diploma Block - 201', 'Regular', 'TEST-I');
