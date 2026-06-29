import { z } from 'zod';

export const env = z.object({
  AUTH_ENCRYPTION_PRIVATE_KEY: z.string().min(16),
  BUCKET_NAME: z.string(),
  DATABASE_CONNECTION_STRING: z.url(),
  DATABASE_READ_CONNECTION_STRING_1: z.url().optional().or(z.literal('')),
  DATABASE_READ_CONNECTION_STRING_2: z.url().optional().or(z.literal('')),
  HTTP_PORT: z.string().refine(value => Number.parseInt(value, 10) > 0, {
    message: 'HTTP_PORT must be a positive integer.',
  }),
  MAILGUN_API_TOKEN: z.string(),
  NODE_ENV: z.enum([
    'local',
    'development',
    'production',
  ]),
  PLATFORM_URL: z.url(),
  REDIS_DATABASE: z.string().refine(value => Number.parseInt(value, 10) >= 0, {
    message: 'REDIS_DATABASE must be zero or a positive integer.',
  }).transform(value => Number.parseInt(value, 10)),
  REDIS_PASSWORD: z.string().optional().or(z.literal('')),
  REDIS_PORT: z.string().refine(value => Number.parseInt(value, 10) > 0, {
    message: 'REDIS_PORT must be a positive integer.',
  }).transform(value => Number.parseInt(value, 10)),
  REDIS_URL: z.string(),
  SERVICE_NAME: z.string().default('coolab-core-service'),
}).parse({
  ...process.env,
  SERVICE_NAME: process.env.SERVICE_NAME || 'coolab-core-service',
});
