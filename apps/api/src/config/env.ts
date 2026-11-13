import { z } from 'zod';

const base64Key32 = z
  .string()
  .refine((v) => Buffer.from(v, 'base64').length === 32, 'must be 32 bytes, base64-encoded');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:8081')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  FIELD_ENCRYPTION_KEY: base64Key32,
  AI_PROVIDER: z.enum(['rule-based', 'anthropic', 'openai-compatible']).default('rule-based'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_BASE_URL: z.url().default('https://api.openai.com/v1'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  AI_INTERACTION_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  SAFETY_EVENT_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('MindBridge AI <no-reply@example.com>'),
  PASSWORD_RESET_URL: z.string().default('mindbridge://reset-password'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(
    Object.fromEntries(Object.entries(process.env).map(([k, v]) => [k, v === '' ? undefined : v])),
  );
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}\nSee apps/api/.env.example`);
  }
  const env = parsed.data;
  if (env.AI_PROVIDER !== 'rule-based' && (!env.AI_API_KEY || !env.AI_MODEL)) {
    throw new Error(`AI_PROVIDER=${env.AI_PROVIDER} requires AI_API_KEY and AI_MODEL`);
  }
  if (env.NODE_ENV === 'production' && !env.SMTP_HOST) {
    throw new Error('SMTP_HOST is required in production so password reset emails can be delivered');
  }
  return env;
}

export const env = loadEnv();
