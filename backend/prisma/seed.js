import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// All dropdown options stored in DB – no hardcoded lists in codebase
const PROGRAM_OPTIONS = [
  { code: 'BTECH', name: 'B.Tech', branches: ['AE', 'BME', 'CE', 'CSE', 'CSE (AI ML)', 'CSE (CST)', 'EE', 'ECE', 'IT', 'ME'], semesters: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { code: 'MTECH', name: 'M.Tech', branches: ['MCSE', 'EDPS', 'MME'], semesters: ['1', '2', '3', '4'] },
  { code: 'DIPLOMA', name: 'Diploma', branches: ['EE', 'ME'], semesters: ['1', '2', '3', '4', '5', '6'] },
  { code: 'MCA', name: 'MCA', branches: ['MCA'], semesters: ['1', '2', '3', '4'] },
  { code: 'BCA', name: 'BCA', branches: ['BCA'], semesters: ['1', '2', '3', '4', '5', '6'] },
  { code: 'BBA', name: 'BBA', branches: ['BBA', 'BBA (DM)', 'BBA (HM)'], semesters: ['1', '2', '3', '4', '5', '6'] },
  { code: 'MBA', name: 'MBA', branches: ['MBA'], semesters: ['1', '2', '3', '4'] },
];

// Keep seed credentials out of source code (set via .env for predictable logins)
const DEFAULT_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@local.test';
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
if (!DEFAULT_ADMIN_PASSWORD) {
  console.error('❌ SEED_ADMIN_PASSWORD is required.');
  console.error('   Add it to your .env file: SEED_ADMIN_PASSWORD=YourPassword123');
  process.exit(1);
}

const SEED_STUDENT_COLLEGE_ID = process.env.SEED_STUDENT_COLLEGE_ID;
const SEED_STUDENT_ROLL = process.env.SEED_STUDENT_ROLL; // must be 12 digits (numbers only)

function pad(num, size) {
  return String(num).padStart(size, '0');
}

function generateCollegeId(year, n) {
  return `JIS/${year}/${pad(n, 4)}`;
}

function generateStudentRoll(year, n) {
  // 12 digits: YYYY + 8-digit sequence (e.g. 202400000001)
  return `${year}${pad(n, 8)}`;
}

async function main() {
  // Seed program / branch / semester options (from DB only – no data in codebase)
  for (const prog of PROGRAM_OPTIONS) {
    await prisma.programOption.upsert({
      where: { code: prog.code },
      create: { code: prog.code, name: prog.name },
      update: { name: prog.name },
    });
    await prisma.branchOption.deleteMany({ where: { programCode: prog.code } });
    for (const name of prog.branches) {
      try {
        await prisma.branchOption.create({ data: { programCode: prog.code, name } });
      } catch (_) { /* skip if duplicate */ }
    }
    await prisma.semesterOption.deleteMany({ where: { programCode: prog.code } });
    for (const number of prog.semesters) {
      try {
        await prisma.semesterOption.create({ data: { programCode: prog.code, number } });
      } catch (_) { /* skip if duplicate */ }
    }
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

  const BATCHES = [2018, 2021, 2023, 2024, 2025];
  const STUDENTS_PER_BRANCH_PER_BATCH = 2;
  
  function calculateSemester(batchYear) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    const yearsDiff = currentYear - batchYear;
    let semester = yearsDiff * 2;
    if (currentMonth >= 7) semester += 1; // Fall
    else semester += 0; // Spring
    return Math.max(1, semester);
  }

  const studentsToCreate = [];
  let studentCounter = 1;

  for (const batch of BATCHES) {
    const semesterCalc = calculateSemester(batch);
    for (const prog of PROGRAM_OPTIONS) {
      const maxSem = prog.semesters.length;
      let finalSem = semesterCalc;
      if (finalSem > maxSem) finalSem = maxSem; // Cap to max
      
      const branchesToSeed = prog.branches.length ? prog.branches : [prog.code];
      for (const branch of branchesToSeed) {
        for (let i = 1; i <= STUDENTS_PER_BRANCH_PER_BATCH; i++) {
          const collegeId = generateCollegeId(batch, studentCounter);
          studentsToCreate.push({
            collegeId,
            name: `Student ${batch} ${prog.code} ${pad(i, 3)}`,
            department: branch,
            program: prog.code,
            branch: branch,
            semester: String(finalSem),
            studentRoll: generateStudentRoll(batch, studentCounter),
            batch: String(batch),
          });
          studentCounter++;
        }
      }
    }
  }

  if (SEED_STUDENT_COLLEGE_ID && SEED_STUDENT_ROLL) {
    studentsToCreate.push({
      collegeId: SEED_STUDENT_COLLEGE_ID,
      name: 'Seed Student',
      department: process.env.SEED_STUDENT_DEPARTMENT || 'CSE',
      studentRoll: SEED_STUDENT_ROLL,
      batch: String(new Date().getFullYear()),
    });
  }

  try {
    let created = 0;
    for (const data of studentsToCreate) {
      try {
        await prisma.student.create({ data });
        created++;
      } catch (_) { /* skip duplicates */ }
    }
    console.log(`Successfully created ${created} new students.`);
  } catch (err) {
    console.error('Error inserting students:', err);
  }
  console.log(`Students seed complete. Seeded ${studentsToCreate.length} students across 5 batches.`);

  const sampleStudent = await prisma.student.findFirst({
    orderBy: { collegeId: 'asc' },
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
      const exists = await prisma.exam.findFirst({ where: { examId: exam.examId } });
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
