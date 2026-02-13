/**
 * Redis Sentry reporting tests.
 * Mocks ioredis (fail) and Sentry to verify reportToSentry is called on connection failure.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockCaptureMessage = jest.fn();
const mockCaptureException = jest.fn();
const mockWithScope = jest.fn((cb: (scope: { setTag: jest.Mock; setExtra: jest.Mock }) => void) => {
  const scope = {
    setTag: jest.fn(),
    setExtra: jest.fn(),
  };
  cb(scope);
});

jest.mock('@sentry/node', () => ({
  ...jest.requireActual('@sentry/node'),
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  withScope: (cb: (scope: unknown) => void) => mockWithScope(cb),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockRejectedValue(new Error('Connection refused')),
    disconnect: jest.fn(),
    on: jest.fn(),
  }));
});

// Must mock config before redis is loaded - reportToSentry checks config.nodeEnv
jest.mock('../src/lib/config', () => {
  const actual = jest.requireActual('../src/lib/config');
  return {
    config: {
      ...actual.config,
      nodeEnv: 'production',
      redisUrl: 'redis://localhost:6399',
    },
  };
});

describe('Redis Sentry reporting', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, SENTRY_DSN: 'https://test@test.ingest.sentry.io/1' };
    mockCaptureMessage.mockClear();
    mockCaptureException.mockClear();
    mockWithScope.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should report to Sentry when Redis connection fails', async () => {
    const { redisService } = await import('../src/lib/redis');

    await redisService.ensureConnected();

    expect(redisService.isAvailable()).toBe(false);
    expect(mockWithScope).toHaveBeenCalled();
    expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockCaptureException.mock.calls[0][0].message).toContain(
      'Redis connection failed'
    );
  });
});
