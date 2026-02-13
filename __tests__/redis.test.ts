import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * Redis service tests - lazy connection, fallback, Sentry API, and auth integration.
 */
describe('Redis Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Lazy connection and fallback', () => {
    it('should use in-memory storage when REDIS_URL is not set', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { redisService } = await import('../src/lib/redis');

      expect(redisService.isAvailable()).toBe(false);
      await redisService.ensureConnected();
      expect(redisService.isAvailable()).toBe(false);
      expect(redisService.getStatus().connectionAttempts).toBe(0);
    });

    it('should report correct status when Redis is unavailable', async () => {
      delete process.env.REDIS_URL;
      jest.resetModules();
      const { redisService } = await import('../src/lib/redis');

      const status = redisService.getStatus();
      expect(status.connected).toBe(false);
      expect(status.healthy).toBe(false);
      expect(status.connectionAttempts).toBe(0);
    });
  });

  describe('Sentry API compatibility', () => {
    it('should use Sentry v10 captureMessage(message, level) signature', async () => {
      const Sentry = await import('@sentry/node');
      // Sentry v10: captureMessage(message: string, level?: SeverityLevel)
      // SeverityLevel: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'
      expect(typeof Sentry.captureMessage).toBe('function');
      expect(() => {
        Sentry.captureMessage('test message', 'warning');
      }).not.toThrow();
    });

    it('should use Sentry captureException for Error objects', async () => {
      const Sentry = await import('@sentry/node');
      expect(typeof Sentry.captureException).toBe('function');
      expect(() => {
        Sentry.captureException(new Error('test error'));
      }).not.toThrow();
    });
  });
});

describe('Redis + Auth integration', () => {
  it('should work with in-memory fallback when Redis unavailable', async () => {
    const { createTestServer } = await import('./helpers/testServer');
    const server = await createTestServer();
    await server.ready();

    // No REDIS_URL in test env - uses in-memory. Verify auth flow works.
    const authResponse = await server.inject({
      method: 'POST',
      url: '/auth',
      payload: { api_key: 'test-api-key-123' },
    });

    expect(authResponse.statusCode).toBe(200);
    const authData = JSON.parse(authResponse.payload);
    expect(authData.session_token).toBeDefined();

    // Use session token - should work via in-memory
    const toolResponse = await server.inject({
      method: 'POST',
      url: '/tools/get_quotas',
      headers: {
        Authorization: `Bearer ${authData.session_token}`,
      },
      payload: {},
    });

    expect(toolResponse.statusCode).not.toBe(401);

    await server.close();
  });
});
