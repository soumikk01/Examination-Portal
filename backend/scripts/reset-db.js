#!/usr/bin/env node
/**
 * Reset the SQLite database: remove the DB file (if corrupted or to start fresh),
 * run prisma db push, then seed. Stop the backend before running.
 * Usage: node scripts/reset-db.js   OR  npm run db:reset
 */
import { unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const defaultDbPath = join(root, 'data', 'examination.db');

function main() {
  if (existsSync(defaultDbPath)) {
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
  } else {
    console.log('No existing database file at', defaultDbPath);
  }

  console.log('Pushing schema...');
  execSync('npx prisma db push', { cwd: root, stdio: 'inherit' });
  console.log('Seeding...');
  execSync('npx prisma db seed', { cwd: root, stdio: 'inherit' });
  console.log('Done. You can start the backend again.');
}

main();
