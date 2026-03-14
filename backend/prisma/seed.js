import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';

async function main() {
  const existing = await prisma.staff.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
  });
  if (existing) {
    console.log('Default admin already exists:', DEFAULT_ADMIN_EMAIL);
    return;
  }
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await prisma.staff.create({
    data: {
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
      name: 'Admin',
    },
  });
  console.log('Created default admin:', DEFAULT_ADMIN_EMAIL, '(password: ' + DEFAULT_ADMIN_PASSWORD + ')');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
