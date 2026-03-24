import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const students = await prisma.student.findMany({
      where: { semester: "2" },
      select: {
        id: true,
        branch: true,
        program: true,
        exams: { select: { examMode: true } },
      },
      take: 5
    });
    console.log('SUCCESS:', JSON.stringify(students, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
