import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const configSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
});

const parsedConfig = configSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedConfig.error.flatten().fieldErrors
  );
  throw new Error(
    'Invalid environment variables. Please check your .env file.'
  );
}

// Freeze the config object to prevent runtime mutations
export const config = Object.freeze(parsedConfig.data);
