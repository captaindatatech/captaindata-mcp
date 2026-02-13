import Redis from 'ioredis';
import * as Sentry from '@sentry/node';
import { config } from './config';
import { logger } from './logger';

// Create a Redis-specific logger
const redisLogger = logger.child({ component: 'redis' });

function reportToSentry(
  level: 'warning' | 'error',
  message: string,
  context?: Record<string, unknown>
): void {
  if (config.nodeEnv === 'production' && process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag('component', 'redis');
      if (context) {
        const safeContext: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(context)) {
          // Redact session keys - they contain tokens
          if (k === 'key' && typeof v === 'string' && v.startsWith('session:')) {
            safeContext[k] = 'session:[REDACTED]';
          } else {
            safeContext[k] = v;
          }
        }
        Object.entries(safeContext).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      if (level === 'error') {
        Sentry.captureException(new Error(message));
      } else {
        Sentry.captureMessage(message, level);
      }
    });
  }
}

// Backoff period after connection failure before retrying (reduces log spam on serverless cold start)
const FAILURE_BACKOFF_MS = 60000;

interface RedisConfig {
  url: string;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  commandTimeout: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
}

class RedisService {
  private client: Redis | null = null;
  private isConnected = false;
  private isHealthy = false;
  private connectionAttempts = 0;
  private lastFailureAt = 0;
  private connectPromise: Promise<void> | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly config: RedisConfig;

  constructor() {
    this.config = {
      url: config.redisUrl || '',
      maxRetriesPerRequest: 0, // No automatic retries - we handle it explicitly for serverless
      connectTimeout: 10000, // 10s for cold start / slow network
      commandTimeout: 5000,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4, // IPv4
    };

    // Lazy init: only log if no URL, do NOT connect at startup
    if (!this.config.url) {
      redisLogger.info('Redis URL not provided, using in-memory storage');
    }
  }

  private validateConnectionString(): void {
    try {
      new URL(this.config.url);
    } catch {
      // Never expose URL in errors - may contain credentials
      throw new Error('Invalid Redis URL format');
    }
  }

  private createClient(): Redis {
    const client = new Redis(this.config.url, {
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      connectTimeout: this.config.connectTimeout,
      commandTimeout: this.config.commandTimeout,
      lazyConnect: this.config.lazyConnect,
      keepAlive: this.config.keepAlive,
      family: this.config.family,
      // Stop reconnection attempts quickly - avoid zombie client in serverless
      retryStrategy: (times) => {
        if (times > 2) {
          redisLogger.warn('Redis reconnection abandoned after repeated failures', {
            attempts: times,
          });
          reportToSentry('warning', 'Redis reconnection abandoned after repeated failures', {
            attempts: times,
          });
          return null;
        }
        return Math.min(times * 1000, 5000);
      },
    });

    client.on('error', (error) => {
      redisLogger.warn('Redis connection error', { errorMessage: error.message });
      reportToSentry('warning', 'Redis connection error', {
        errorMessage: error.message,
      });
      this.isConnected = false;
      this.isHealthy = false;
    });

    client.on('connect', () => {
      redisLogger.info('Redis connected successfully');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    client.on('close', () => {
      redisLogger.debug('Redis connection closed');
      this.isConnected = false;
      this.isHealthy = false;
    });

    client.on('ready', () => {
      redisLogger.info('Redis is ready');
      this.isConnected = true;
      this.isHealthy = true;
    });

    client.on('reconnecting', (delay: number) => {
      redisLogger.debug('Redis reconnecting', { delayMs: delay });
    });

    client.on('end', () => {
      redisLogger.debug('Redis connection ended');
      this.isConnected = false;
      this.isHealthy = false;
    });

    return client;
  }

  private setupHealthCheck(): void {
    if (!this.client || this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      if (this.client && this.isConnected) {
        try {
          await this.client!.ping();
          this.isHealthy = true;
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          redisLogger.warn('Redis health check failed', { error: errMsg });
          reportToSentry('warning', 'Redis health check failed', { error: errMsg });
          this.isHealthy = false;
        }
      }
    }, 30000);
    this.healthCheckInterval.unref();
  }

  /**
   * Lazily connect to Redis on first use. Prevents cold start issues in serverless.
   * Idempotent - safe to call repeatedly. Uses backoff after failure to avoid retry spam.
   */
  public async ensureConnected(): Promise<void> {
    if (!this.config.url) return;

    // Already connected and healthy
    if (this.client && this.isConnected && this.isHealthy) return;

    // Backoff: don't retry too soon after failure (reduces log spam)
    if (
      this.lastFailureAt > 0 &&
      Date.now() - this.lastFailureAt < FAILURE_BACKOFF_MS
    ) {
      return;
    }

    // Dedupe concurrent connection attempts
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = this._doConnect();
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private async _doConnect(): Promise<void> {
    if (!this.config.url) return;

    this.validateConnectionString();

    this.client = this.createClient();
    this.connectionAttempts++;

    try {
      await this.client.connect();
      this.setupHealthCheck();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      redisLogger.warn('Redis connection failed, falling back to in-memory storage', {
        attempt: this.connectionAttempts,
        error: errorMsg,
      });
      reportToSentry('error', 'Redis connection failed, falling back to in-memory storage', {
        attempt: this.connectionAttempts,
        error: errorMsg,
      });
      this.lastFailureAt = Date.now();

      // Clean up failed client - prevents zombie reconnection loops
      this.client.disconnect();
      this.client = null;
      this.isConnected = false;
      this.isHealthy = false;
    }
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.ensureConnected();

    if (!this.client || !this.isConnected || !this.isHealthy) {
      throw new Error('Redis not available');
    }

    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      redisLogger.warn('Redis SET operation failed', { key, error: errMsg });
      reportToSentry('warning', 'Redis SET operation failed', { key, error: errMsg });
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    await this.ensureConnected();

    if (!this.client || !this.isConnected || !this.isHealthy) {
      throw new Error('Redis not available');
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      redisLogger.warn('Redis GET operation failed', { key, error: errMsg });
      reportToSentry('warning', 'Redis GET operation failed', { key, error: errMsg });
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    await this.ensureConnected();

    if (!this.client || !this.isConnected || !this.isHealthy) {
      throw new Error('Redis not available');
    }

    try {
      await this.client.del(key);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      redisLogger.warn('Redis DEL operation failed', { key, error: errMsg });
      reportToSentry('warning', 'Redis DEL operation failed', { key, error: errMsg });
      throw error;
    }
  }

  public async ping(): Promise<string | null> {
    await this.ensureConnected();

    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.ping();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      redisLogger.warn('Redis PING failed', { error: errMsg });
      reportToSentry('warning', 'Redis PING failed', { error: errMsg });
      return null;
    }
  }

  public isAvailable(): boolean {
    return this.client !== null && this.isConnected && this.isHealthy;
  }

  public getStatus(): {
    connected: boolean;
    healthy: boolean;
    connectionAttempts: number;
  } {
    return {
      connected: this.isConnected,
      healthy: this.isHealthy,
      connectionAttempts: this.connectionAttempts,
    };
  }

  public disconnect(): void {
    this.stopHealthCheck();

    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.isConnected = false;
      this.isHealthy = false;
    }
  }
}

// Create singleton instance
export const redisService = new RedisService();

// Graceful shutdown handlers
process.on('SIGINT', () => {
  redisLogger.info('Received SIGINT, shutting down Redis...');
  redisService.disconnect();
});

process.on('SIGTERM', () => {
  redisLogger.info('Received SIGTERM, shutting down Redis...');
  redisService.disconnect();
});
