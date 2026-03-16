#!/usr/bin/env node
/**
 * Reset the database: push schema and seed.
 * - SQLite: removes the DB file first (stop backend before running).
 * - PostgreSQL (e.g. Supabase): push + seed only.
 * Usage: node scripts/reset-db.js   OR  npm run db:reset
 */
import { unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const defaultDbPath = join(root, 'data', 'examination.db');
const isSqlite = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:');

function main() {
  if (isSqlite && existsSync(defaultDbPath)) {
    try {
      unlinkSync(defaultDbPath);
      console.log('Removed existing database:', defaultDbPath);
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EPERM') {
        console.error(
          'Database file is in use. Stop the backend (and any process using examination.db), then run:\n  npm run db:reset'
        );
        process.exit(1);
      }
      throw err;
    }
  } else if (isSqlite) {
    console.log('No existing database file at', defaultDbPath);
  }

  console.log('Pushing schema...');
  execSync('npx prisma db push', { cwd: root, stdio: 'inherit' });
  console.log('Seeding...');
  execSync('npx prisma db seed', { cwd: root, stdio: 'inherit' });
  console.log('Done. You can start the backend again.');
}

main();
