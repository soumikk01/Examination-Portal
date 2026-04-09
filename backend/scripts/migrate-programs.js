import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration to UG/PG classification...');

  // ── Step 1: Migrate Students ──────────────────────────────────────────────
  // Map old specific-degree programs → UG or PG
  const studentMigrate = await prisma.$runCommandRaw({
    update: 'Student',
    updates: [
      { q: { program: { $in: ['BTECH', 'BCA', 'BBA'] } }, u: { $set: { program: 'UG' } }, multi: true },
      { q: { program: { $in: ['MTECH', 'MCA', 'MBA'] } }, u: { $set: { program: 'PG' } }, multi: true },
    ]
  });
  console.log('Students migrated (UG/PG):', JSON.stringify(studentMigrate));

  // Delete DIPLOMA students entirely (they are no longer tracked)
  const studentDiplomaDelete = await prisma.$runCommandRaw({
    delete: 'Student',
    deletes: [{ q: { program: 'DIPLOMA' }, limit: 0 }]
  });
  console.log('DIPLOMA students deleted:', JSON.stringify(studentDiplomaDelete));

  // ── Step 2: Migrate Exams ─────────────────────────────────────────────────
  const examMigrate = await prisma.$runCommandRaw({
    update: 'Exam',
    updates: [
      { q: { program: { $in: ['BTECH', 'BCA', 'BBA'] } }, u: { $set: { program: 'UG' } }, multi: true },
      { q: { program: { $in: ['MTECH', 'MCA', 'MBA'] } }, u: { $set: { program: 'PG' } }, multi: true },
    ]
  });
  console.log('Exams migrated (UG/PG):', JSON.stringify(examMigrate));

  // Delete DIPLOMA exam records
  const examDiplomaDelete = await prisma.$runCommandRaw({
    delete: 'Exam',
    deletes: [{ q: { program: 'DIPLOMA' }, limit: 0 }]
  });
  console.log('DIPLOMA exams deleted:', JSON.stringify(examDiplomaDelete));

  console.log('\n✅ Migration complete! All records are now classified as UG or PG.');
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
