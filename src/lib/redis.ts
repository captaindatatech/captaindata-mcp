import Redis from 'ioredis';
import { config } from './config';
import { logger } from './logger';

// Create a Redis-specific logger
const redisLogger = logger.child({ component: 'redis' });

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
  private maxConnectionAttempts = 3;
  private reconnectDelay = 1000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly config: RedisConfig;

  constructor() {
    this.config = {
      url: config.redisUrl || '',
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      commandTimeout: 3000,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4, // IPv4
    };
    
    this.initialize();
  }

  private initialize(): void {
    if (!this.config.url) {
      redisLogger.info('Redis URL not provided, using in-memory storage');
      return;
    }

    this.validateConnectionString();
    this.createClient();
    this.setupEventHandlers();
    this.connect();
    this.startHealthCheck();
  }

  private validateConnectionString(): void {
    try {
      new URL(this.config.url);
    } catch (error) {
      throw new Error(`Invalid Redis URL: ${this.config.url}`);
    }
  }

  private createClient(): void {
    try {
      this.client = new Redis(this.config.url, {
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        connectTimeout: this.config.connectTimeout,
        commandTimeout: this.config.commandTimeout,
        lazyConnect: this.config.lazyConnect,
        keepAlive: this.config.keepAlive,
        family: this.config.family,
        retryStrategy: (times) => {
          if (times > this.maxConnectionAttempts) {
            redisLogger.warn('Max Redis reconnection attempts reached', { attempts: times });
            return null; // Stop retrying
          }
          return Math.min(times * this.reconnectDelay, 30000);
        },
      });
    } catch (error) {
      redisLogger.warn('Failed to create Redis client', { error });
      this.client = null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('error', (error) => {
      redisLogger.warn('Redis connection error', {
        errorMessage: error.message,
      });
      this.isConnected = false;
      this.isHealthy = false;
    });

    this.client.on('connect', () => {
      redisLogger.info('Redis connected successfully');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    this.client.on('close', () => {
      redisLogger.warn('Redis connection closed');
      this.isConnected = false;
      this.isHealthy = false;
    });

    this.client.on('ready', () => {
      redisLogger.info('Redis is ready');
      this.isConnected = true;
      this.isHealthy = true;
    });

    this.client.on('reconnecting', (delay: number) => {
      redisLogger.info('Redis reconnecting', { delayMs: delay });
    });

    this.client.on('end', () => {
      redisLogger.warn('Redis connection ended');
      this.isConnected = false;
      this.isHealthy = false;
    });
  }

  private async connect(): Promise<void> {
    if (!this.client) return;

    try {
      this.connectionAttempts++;
      await this.client.connect();
    } catch (error) {
      redisLogger.warn('Failed to connect to Redis', {
        attempt: this.connectionAttempts,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        redisLogger.error('Max connection attempts reached, falling back to in-memory storage', error);
        this.client = null;
      }
    }
  }

  private startHealthCheck(): void {
    if (!this.client) return;

    this.healthCheckInterval = setInterval(async () => {
      if (this.client && this.isConnected) {
        try {
          await this.client.ping();
          this.isHealthy = true;
        } catch (error) {
          redisLogger.warn('Redis health check failed', { error });
          this.isHealthy = false;
        }
      }
    }, 30000); // Check every 30 seconds
    
    // Allow process to exit even if health check is active
    this.healthCheckInterval.unref();
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
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
      redisLogger.warn('Redis SET operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected || !this.isHealthy) {
      throw new Error('Redis not available');
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      redisLogger.warn('Redis GET operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected || !this.isHealthy) {
      throw new Error('Redis not available');
    }

    try {
      await this.client.del(key);
    } catch (error) {
      redisLogger.warn('Redis DEL operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async ping(): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.ping();
    } catch (error) {
      redisLogger.warn('Redis PING failed', { error });
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
