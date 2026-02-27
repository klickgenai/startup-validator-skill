// =============================================================================
// Environment Configuration — validated with Zod, crash on missing (guardrail 3)
// =============================================================================

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535)),
  DATABASE_PATH: z.string().min(1, 'DATABASE_PATH is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  RATE_LIMIT_GENERAL_MAX: z.string().default('100').transform(Number).pipe(z.number().int().min(1)),
  RATE_LIMIT_AUTH_MAX: z.string().default('10').transform(Number).pipe(z.number().int().min(1)),
  RATE_LIMIT_WINDOW_MINUTES: z.string().default('15').transform(Number).pipe(z.number().int().min(1)),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    // eslint-disable-next-line no-console
    console.error('FATAL: Invalid environment configuration', JSON.stringify(formatted, null, 2));
    process.exit(1);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/** Reset cached env (for testing) */
export function resetEnvCache(): void {
  cachedEnv = null;
}
