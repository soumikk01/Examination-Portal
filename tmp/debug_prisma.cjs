const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Prisma connection...');
    const students = await prisma.student.findMany({
      where: { semester: "2" },
      select: {
        id: true,
        branch: true,
        program: true,
        exams: { select: { examMode: true } },
      },
      take: 2
    });
    console.log('SUCCESS:', JSON.stringify(students, null, 2));
    
    console.log('Testing RoomAllotment count...');
    const count = await prisma.roomAllotment.count();
    console.log('RoomAllotment Count:', count);
    
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

test();
