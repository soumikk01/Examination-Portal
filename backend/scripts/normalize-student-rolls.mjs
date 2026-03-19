import prisma from '../src/database/database.js';

function compute12DigitRollFromCollegeId(collegeId) {
  const m = /^JIS\/(\d{4})\/(\d{4})$/.exec(String(collegeId || ''));
  if (!m) return null;
  const year = m[1];
  const seq4 = m[2];
  const roll = year + seq4.padStart(8, '0'); // YYYY + 8 digits
  return /^\d{12}$/.test(roll) ? roll : null;
}

async function main() {
  const students = await prisma.student.findMany({
    select: { id: true, collegeId: true, studentRoll: true },
  });

  const updates = [];
  for (const s of students) {
    const current = String(s.studentRoll || '');
    if (/^\d{12}$/.test(current)) continue;

    const next = compute12DigitRollFromCollegeId(s.collegeId);
    if (!next) continue;

    updates.push({
      id: s.id,
      collegeId: s.collegeId,
      from: current,
      to: next,
    });
  }

  for (const u of updates) {
    await prisma.student.update({
      where: { id: u.id },
      data: { studentRoll: u.to },
    });
  }

  console.log(JSON.stringify({ updated: updates.length, updates }, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

