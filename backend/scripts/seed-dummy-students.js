import { PrismaClient } from '@prisma/client';

// ⛔ SAFETY GUARD: Never run this in production
if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: seed-dummy-students.js must not be run in production!');
  process.exit(1);
}

const prisma = new PrismaClient();

const TARGET_PROGRAM = 'UG';
const TARGET_BRANCHES = ['AGE', 'BME', 'CE', 'CSE', 'AIML', 'CST', 'EE', 'ECE', 'IT', 'ME'];
const SEMESTER = '2';

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Kabir', 'Saanvi', 'Aanya', 'Aadhya', 'Aaradhya', 'Ananya', 'Pari', 'Anushka', 'Avni', 'Riya', 'Ira', 'Soumik', 'Rahul', 'Neha', 'Pooja', 'Rohan', 'Vikas', 'Amit'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Das', 'Roy', 'Patel', 'Joshi', 'Chauhan', 'Nair', 'Reddy', 'Rao', 'Yadav', 'Mishra', 'Pandey', 'Bhatt', 'Sen', 'Ghosh', 'Bose'];

function generateRandomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

async function main() {
  console.log('Starting seed process for 200 dummy UG students...');
  const studentsToInsert = [];

  for (let i = 1; i <= 200; i++) {
    const program = TARGET_PROGRAM;
    const branch = TARGET_BRANCHES[Math.floor(Math.random() * TARGET_BRANCHES.length)];
    const semester = SEMESTER;
    
    // Use a unique prefix to distinguish this batch
    const timestamp = Date.now().toString().slice(-5);
    const collegeId = `UG${program}${timestamp}${i.toString().padStart(3, '0')}`;
    const studentRoll = `ROLL${timestamp}${i.toString().padStart(3, '0')}`;

    studentsToInsert.push({
      collegeId,
      name: generateRandomName(),
      program,
      branch,
      semester,
      studentRoll,
      degree: program,
      department: branch,
      batch: '2024-2028'
    });
  }

  console.log('Inserting students into the database...');
  // Using createMany for better performance and avoiding DB connection drops
  const createdStudents = await prisma.student.createMany({
    data: studentsToInsert,
    skipDuplicates: true
  });
  
  console.log(`Successfully created ${createdStudents.count} UG students!`);

  // To insert backlogs, we need the IDs of some inserted students. 
  // Let's fetch some the students we just created by their newly generated batches
  const fetchedStudents = await prisma.student.findMany({
    where: {
      collegeId: {
        in: studentsToInsert.map(s => s.collegeId)
      }
    }
  });

  const examsToInsert = [];
  
  for (const stu of fetchedStudents) {
    // Add a REGULAR exam for every student so they appear in regular exam views
    examsToInsert.push({
        examId: `REG-${stu.id}-${Date.now().toString().slice(-4)}`,
        subject: `Regular Subject 1 (${stu.branch})`,
        examType: 'END_SEM',
        examMode: 'REGULAR',
        examCategory: 'EVEN', // 2nd semester is typically EVEN
        program: stu.program,
        branch: stu.branch,
        semester: stu.semester,
        status: 'PUBLISHED',
        studentId: stu.id
    });

    if (Math.random() < 0.3) {
      const numBacklogs = Math.floor(Math.random() * 2) + 1;
      for (let b = 0; b < numBacklogs; b++) {
        examsToInsert.push({
            examId: `BL-${stu.id}-${Date.now().toString().slice(-4)}-${b+1}`,
            subject: `Backlog Subject ${b + 1} (${stu.branch})`,
            examType: 'END_SEM',
            examMode: 'BACKLOG',
            examCategory: 'ODD',
            program: stu.program,
            branch: stu.branch,
            semester: stu.semester,
            status: 'PUBLISHED',
            studentId: stu.id
        });
      }
    }
  }

  if (examsToInsert.length > 0) {
    console.log(`Inserting ${examsToInsert.length} backlog exam records...`);
    const createdExams = await prisma.exam.createMany({
      data: examsToInsert,
      skipDuplicates: true
    });
    console.log(`Assigned a total of ${createdExams.count} backlog records.`);
  } else {
    console.log("No backlogs generated.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
