#!/usr/bin/env node
/**
 * Reset the database: push schema and seed (PostgreSQL / Supabase).
 * Usage: node scripts/reset-db.js   OR  npm run db:reset
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  console.log('Pushing schema...');
  execSync('npx prisma db push', { cwd: root, stdio: 'inherit' });
  console.log('Seeding...');
  execSync('npx prisma db seed', { cwd: root, stdio: 'inherit' });
  console.log('Done. You can start the backend again.');
}

main();
