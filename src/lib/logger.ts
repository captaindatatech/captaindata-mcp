import pino, { Logger as PinoLogger } from 'pino';
import { config } from './config';

/**
 * Centralized logging service for the Captain Data MCP API
 *
 * Features:
 * - Structured JSON logging with Pino
 * - Respects LOG_LEVEL configuration
 * - Automatic sensitive data filtering
 * - Request correlation ID support
 * - Environment-aware output formatting
 */

// Sensitive keys to redact from logs
const SENSITIVE_KEYS = [
  'authorization',
  'x-api-key',
  'api_key',
  'apiKey',
  'password',
  'token',
  'secret',
];

/**
 * Redact sensitive values from an object
 */
function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Create the base Pino logger instance
 */
function createBaseLogger(): PinoLogger {
  const isProduction = config.nodeEnv === 'production';
  const isTest = config.nodeEnv === 'test';

  return pino({
    level: isTest ? 'silent' : config.logLevel,

    // Use pretty printing in development
    transport:
      !isProduction && !isTest
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,

    // Base context for all logs
    base: {
      env: config.nodeEnv,
      service: 'captaindata-mcp',
    },

    // Timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,

    // Custom serializers
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  });
}

// Singleton base logger instance
const baseLogger = createBaseLogger();

/**
 * Logger class providing structured logging methods
 */
class Logger {
  private logger: PinoLogger;
  private context: Record<string, unknown>;

  constructor(context: Record<string, unknown> = {}) {
    this.context = context;
    this.logger = baseLogger.child(redactSensitive(context));
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    return new Logger({ ...this.context, ...context });
  }

  /**
   * Log at debug level
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(data ? redactSensitive(data) : {}, message);
  }

  /**
   * Log at info level
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(data ? redactSensitive(data) : {}, message);
  }

  /**
   * Log at warn level
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(data ? redactSensitive(data) : {}, message);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData =
      error instanceof Error
        ? {
            err: error,
            errorMessage: error.message,
            stack: error.stack,
          }
        : error
          ? { error: String(error) }
          : {};

    this.logger.error({ ...redactSensitive(data || {}), ...errorData }, message);
  }

  /**
   * Log at fatal level
   */
  fatal(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData =
      error instanceof Error
        ? {
            err: error,
            errorMessage: error.message,
            stack: error.stack,
          }
        : error
          ? { error: String(error) }
          : {};

    this.logger.fatal({ ...redactSensitive(data || {}), ...errorData }, message);
  }

  /**
   * Get the underlying Pino logger (for Fastify integration)
   */
  getPinoLogger(): PinoLogger {
    return this.logger;
  }
}

// Export singleton instance for general use
export const logger = new Logger();

// Export class for creating scoped loggers
export { Logger };

// Export types
export type { PinoLogger };

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(
  requestId: string,
  additionalContext?: Record<string, unknown>
): Logger {
  return new Logger({
    requestId,
    ...additionalContext,
  });
}

/**
 * Log levels for external configuration
 */
export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
