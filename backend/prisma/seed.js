import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
      { examId: 'CSE101-ODD-R', subject: 'Data Structures', date: `${baseYear - 1}-12-01`, time: '10:00 AM', room: 'R-201', examType: 'Regular', examCategory: 'ODD', studentId: sampleStudent.id },
      { examId: 'CSE102-ODD-R', subject: 'Discrete Mathematics', date: `${baseYear - 1}-12-05`, time: '10:00 AM', room: 'R-202', examType: 'Regular', examCategory: 'ODD', studentId: sampleStudent.id },
      { examId: 'MATH101-BACKLOG', subject: 'Engineering Mathematics (Backlog)', date: `${baseYear - 1}-11-20`, time: '02:00 PM', room: 'R-105', examType: 'Backlog', examCategory: 'EVEN', studentId: sampleStudent.id },
      { examId: 'CSE201-TEST', subject: 'Algorithms (Test)', date: `${baseYear}-04-10`, time: '09:00 AM', room: 'R-301', examType: 'Test', examCategory: 'ODD', studentId: sampleStudent.id },
      { examId: 'CSE202-EVEN-R', subject: 'Database Systems', date: `${baseYear}-04-15`, time: '10:00 AM', room: 'R-302', examType: 'Regular', examCategory: 'EVEN', studentId: sampleStudent.id },
      { examId: 'CSE203-EVEN-R', subject: 'Operating Systems', date: `${baseYear}-04-20`, time: '10:00 AM', room: 'R-303', examType: 'Regular', examCategory: 'EVEN', studentId: sampleStudent.id },
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
