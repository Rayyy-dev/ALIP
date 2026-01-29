import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/**
 * Application configuration loaded from environment variables
 * All values are validated at startup
 */
export const config = {
  // Server configuration
  port: parseInt(process.env.API_PORT || '3001', 10),
  host: process.env.API_HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

  // Pagination defaults
  defaultPageSize: 20,
  maxPageSize: 100,

  // Alert defaults
  defaultAlertWindow: 60, // minutes

  // Trend aggregation
  trendRetentionDays: 90,
} as const;

/**
 * Validate required configuration at startup
 */
export function validateConfig(): void {
  const required: (keyof typeof config)[] = ['databaseUrl'];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error('Invalid port number');
  }
}

export type Config = typeof config;
