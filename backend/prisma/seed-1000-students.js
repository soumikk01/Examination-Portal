import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = ['Arjun', 'Sneha', 'Amit', 'Suman', 'Anjali', 'Rahul', 'Vikram', 'Neha', 'Priya', 'Rohit'];
const lastNames = ['Sharma', 'Verma', 'Ghosh', 'Kumar', 'Mehta', 'Roy', 'Singh', 'Das', 'Sen', 'Patel'];
const degrees = ['BTech', 'MTech'];
const departments = ['BME', 'CST', 'EE', 'IT', 'ECE', 'CE', 'CSE', 'CSE(AIML)', 'AGE', 'ME'];
const years = [2022, 2023, 2024, 2025];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Generating 1000 student records...");
  const students = [];

  for (let i = 1; i <= 1000; i++) {
    const year = years[(i - 1) % 4];
    const paddedNum = String(321 + i).padStart(4, '0');
    const collegeId = `JIS/${year}/${paddedNum}`;
    
    const firstName = getRandom(firstNames);
    const lastName = getRandom(lastNames);
    const degree = getRandom(degrees);
    const department = getRandom(departments);
    
    const studentRoll = String(123241310000 + i - 1);
    
    const program = degree.toUpperCase(); // BTECH or MTECH

    students.push({
      collegeId,
      name: `${firstName} ${lastName}`,
      degree,
      department,
      branch: department,
      studentRoll,
      program
    });
  }

  console.log("Starting bulk insertion using createMany...");

  const result = await prisma.student.createMany({
    data: students,
    skipDuplicates: true, // Only available strictly if it resolves unique constraint
  });

  console.log(`Successfully completed inserting ${result.count} students into the database.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
