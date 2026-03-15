import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('8787'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional().default(''),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  ADMIN_API_KEY: z.string().min(1, 'ADMIN_API_KEY is required'),
  // Comma-separated: student-web (5173), admin-web (5174)
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
});

const envFound = envSchema.safeParse(process.env);

if (!envFound.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(envFound.error.format(), null, 2));
  process.exit(1);
}

export const config = envFound.data;
