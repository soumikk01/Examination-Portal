import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// All dropdown options stored in DB – no hardcoded lists in codebase
const PROGRAM_OPTIONS = [
  { code: 'BTECH', name: 'B.Tech', branches: ['CSE', 'CSE (CST)', 'CSE (AI ML)', 'IT', 'ECE', 'EE', 'ME', 'CE', 'BME', 'AE'], semesters: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { code: 'MTECH', name: 'M.Tech', branches: [], semesters: ['1', '2', '3', '4'] },
  { code: 'DIPLOMA', name: 'Diploma', branches: ['EE', 'ME'], semesters: ['1', '2', '3', '4', '5', '6'] },
  { code: 'MCA', name: 'MCA', branches: ['MCA'], semesters: ['1', '2', '3', '4'] },
  { code: 'BCA', name: 'BCA', branches: ['BCA'], semesters: ['1', '2', '3', '4', '5', '6'] },
  { code: 'BBA', name: 'BBA', branches: ['BBA'], semesters: ['1', '2', '3', '4', '5', '6'] },
];

const DEFAULT_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
// In production, require SEED_ADMIN_PASSWORD to be set; in dev, allow default for convenience
const DEFAULT_ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ||
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('SEED_ADMIN_PASSWORD must be set when seeding in production.');
      })()
    : 'Admin@123');

// All sample students: login with collegeId and last 3 digits of studentRoll
const SAMPLE_STUDENTS = [
  { collegeId: 'JIS/5555/6666', name: 'Sample Student', department: 'CSE', studentRoll: '5555666', batch: '2024' },
  { collegeId: 'JIS/2024/0001', name: 'Rahul Kumar', department: 'CSE', studentRoll: 'JIS20240001', batch: '2024' },
  { collegeId: 'JIS/2024/0002', name: 'Priya Sharma', department: 'CSE', studentRoll: 'JIS20240002', batch: '2024' },
  { collegeId: 'JIS/2024/0003', name: 'Amit Singh', department: 'ECE', studentRoll: 'JIS20240003', batch: '2024' },
  { collegeId: 'JIS/2024/0004', name: 'Sneha Patel', department: 'ECE', studentRoll: 'JIS20240004', batch: '2024' },
  { collegeId: 'JIS/2024/0005', name: 'Vikram Reddy', department: 'ME', studentRoll: 'JIS20240005', batch: '2024' },
  { collegeId: 'JIS/2024/0006', name: 'Ananya Das', department: 'CSE', studentRoll: 'JIS20240006', batch: '2024' },
  { collegeId: 'JIS/2024/0007', name: 'Rohan Gupta', department: 'IT', studentRoll: 'JIS20240007', batch: '2024' },
  { collegeId: 'JIS/2024/0008', name: 'Kavya Nair', department: 'IT', studentRoll: 'JIS20240008', batch: '2024' },
  { collegeId: 'JIS/2024/0009', name: 'Arjun Mehta', department: 'ME', studentRoll: 'JIS20240009', batch: '2024' },
  { collegeId: 'JIS/2024/0010', name: 'Ishita Banerjee', department: 'ECE', studentRoll: 'JIS20240010', batch: '2024' },
];

async function main() {
  // Seed program / branch / semester options (from DB only – no data in codebase)
  for (const prog of PROGRAM_OPTIONS) {
    await prisma.programOption.upsert({
      where: { code: prog.code },
      create: { code: prog.code, name: prog.name },
      update: { name: prog.name },
    });
    await prisma.branchOption.deleteMany({ where: { programCode: prog.code } });
    if (prog.branches.length) {
      await prisma.branchOption.createMany({
        data: prog.branches.map((name) => ({ programCode: prog.code, name })),
        skipDuplicates: true,
      });
    }
    await prisma.semesterOption.deleteMany({ where: { programCode: prog.code } });
    await prisma.semesterOption.createMany({
      data: prog.semesters.map((number) => ({ programCode: prog.code, number })),
      skipDuplicates: true,
    });
  }
  console.log('Program / branch / semester options seeded.');

  // Exam dropdown options – stored in Supabase only (values match Prisma enums)
  const APP_OPTIONS = [
    { category: 'examType', value: 'TEST_I', label: 'Test I', sortOrder: 1 },
    { category: 'examType', value: 'TEST_II', label: 'Test II', sortOrder: 2 },
    { category: 'examType', value: 'END_SEM', label: 'End Sem', sortOrder: 3 },
    { category: 'examMode', value: 'REGULAR', label: 'Regular', sortOrder: 1 },
    { category: 'examMode', value: 'BACKLOG', label: 'Backlog', sortOrder: 2 },
    { category: 'examCategory', value: 'ODD', label: 'ODD', sortOrder: 1 },
    { category: 'examCategory', value: 'EVEN', label: 'EVEN', sortOrder: 2 },
  ];
  for (const opt of APP_OPTIONS) {
    await prisma.appOption.upsert({
      where: { category_value: { category: opt.category, value: opt.value } },
      create: opt,
      update: { label: opt.label, sortOrder: opt.sortOrder },
    });
  }
  console.log('Exam options (examType, examMode, examCategory) seeded.');

  const existingStaff = await prisma.staff.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
  });
  if (!existingStaff) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await prisma.staff.create({
      data: {
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
        name: 'Admin',
      },
    });
    console.log('Created default admin:', DEFAULT_ADMIN_EMAIL, '(change password after first login in production)');
  } else {
    console.log('Default admin already exists:', DEFAULT_ADMIN_EMAIL);
  }

  for (const student of SAMPLE_STUDENTS) {
    const existing = await prisma.student.findUnique({
      where: { collegeId: student.collegeId },
    });
    if (!existing) {
      await prisma.student.create({ data: student });
      const last3 = student.studentRoll.slice(-3);
      console.log('Created student:', student.collegeId, student.name, '– login with last 3 digits:', last3);
    }
  }
  console.log('Sample students seed complete.');

  // Sample exams for first student (JIS/5555/6666): gone (past) and upcoming (future), ODD/EVEN, Regular/Backlog/Test
  const sampleStudent = await prisma.student.findUnique({
    where: { collegeId: 'JIS/5555/6666' },
  });
  if (sampleStudent) {
    const baseYear = new Date().getFullYear();
    const exams = [
      { examId: 'CSE101-ODD-R', subject: 'Data Structures', date: new Date(`${baseYear - 1}-12-01`), time: '10:00 AM', room: 'R-201', examType: 'END_SEM', examMode: 'REGULAR', examCategory: 'ODD', program: 'BTECH', branch: 'CSE', semester: '3', studentId: sampleStudent.id },
      { examId: 'CSE102-ODD-R', subject: 'Discrete Mathematics', date: new Date(`${baseYear - 1}-12-05`), time: '10:00 AM', room: 'R-202', examType: 'END_SEM', examMode: 'REGULAR', examCategory: 'ODD', program: 'BTECH', branch: 'CSE', semester: '3', studentId: sampleStudent.id },
      { examId: 'MATH101-BACKLOG', subject: 'Engineering Mathematics (Backlog)', date: new Date(`${baseYear - 1}-11-20`), time: '02:00 PM', room: 'R-105', examType: 'END_SEM', examMode: 'BACKLOG', examCategory: 'EVEN', program: 'BTECH', branch: 'CSE', semester: '2', studentId: sampleStudent.id },
      { examId: 'CSE201-TEST', subject: 'Algorithms (Test)', date: new Date(`${baseYear}-04-10`), time: '09:00 AM', room: 'R-301', examType: 'TEST_I', examMode: 'REGULAR', examCategory: 'ODD', program: 'BTECH', branch: 'CSE', semester: '4', studentId: sampleStudent.id },
      { examId: 'CSE202-EVEN-R', subject: 'Database Systems', date: new Date(`${baseYear}-04-15`), time: '10:00 AM', room: 'R-302', examType: 'END_SEM', examMode: 'REGULAR', examCategory: 'EVEN', program: 'BTECH', branch: 'CSE', semester: '4', studentId: sampleStudent.id },
      { examId: 'CSE203-EVEN-R', subject: 'Operating Systems', date: new Date(`${baseYear}-04-20`), time: '10:00 AM', room: 'R-303', examType: 'END_SEM', examMode: 'REGULAR', examCategory: 'EVEN', program: 'BTECH', branch: 'CSE', semester: '4', studentId: sampleStudent.id },
    ];
    for (const exam of exams) {
      const exists = await prisma.exam.findUnique({ where: { examId: exam.examId } });
      if (!exists) {
        await prisma.exam.create({ data: exam });
        console.log('Created exam:', exam.examId, exam.subject, exam.examType, exam.examCategory);
      }
    }
    console.log('Sample exams seed complete.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
