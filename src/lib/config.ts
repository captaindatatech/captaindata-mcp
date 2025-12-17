interface Config {
  cdApiBase: string;
  nodeEnv: string;
  port: number;
  logLevel: string;
  rateLimitMax: number;
  rateLimitTimeWindow: string;
  apiTimeout: number;
  maxRetries: number;
  retryDelay: number;
  // Redis configuration for session management
  redisUrl?: string;
  // CORS configuration
  corsOrigins: string[];
  // Sentry configuration
  sentryDsn?: string;
}

/**
 * Parse CORS origins from environment variable
 * Supports comma-separated list of origins
 */
function parseCorsOrigins(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function validateConfig(): Config {
  // Skip validation in test environment
  if (process.env.NODE_ENV === 'test') {
    return {
      cdApiBase: process.env.CD_API_BASE || 'https://api.captaindata.com',
      nodeEnv: 'test',
      port: 3000,
      logLevel: 'silent', // Suppress logs during tests
      rateLimitMax: 100,
      rateLimitTimeWindow: '1 minute',
      apiTimeout: 30000,
      maxRetries: 2,
      retryDelay: 1000,
      // Redis configuration for test environment
      redisUrl: process.env.REDIS_URL,
      // Allow all origins in test
      corsOrigins: [],
      sentryDsn: undefined,
    };
  }

  const requiredEnvVars = {
    CD_API_BASE: process.env.CD_API_BASE,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate CD_API_BASE format
  const cdApiBase = process.env.CD_API_BASE!;
  try {
    new URL(cdApiBase);
  } catch {
    throw new Error('CD_API_BASE must be a valid URL');
  }

  // Parse and validate CORS origins
  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  // Validate each origin is a valid URL (in production)
  if (process.env.NODE_ENV === 'production' && corsOrigins.length > 0) {
    for (const origin of corsOrigins) {
      try {
        new URL(origin);
      } catch {
        throw new Error(`Invalid CORS origin: ${origin}. Must be a valid URL.`);
      }
    }
  }

  return {
    cdApiBase,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    rateLimitTimeWindow: process.env.RATE_LIMIT_TIME_WINDOW || '1 minute',
    apiTimeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '2', 10),
    retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
    // Redis configuration (optional for development)
    redisUrl: process.env.REDIS_URL,
    // CORS configuration (empty = allow all)
    corsOrigins,
    // Sentry configuration
    sentryDsn: process.env.SENTRY_DSN,
  };
}

export const config = validateConfig();
export type { Config };
