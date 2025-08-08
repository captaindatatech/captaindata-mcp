import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { createTestServer } from './helpers/testServer';

// Load environment variables
dotenv.config();

describe('Health Check Endpoint', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.status).toBe('healthy');
      expect(data.uptime).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.redis).toBeDefined();
      expect(data.redis.available).toBeDefined();
      expect(data.redis.connected).toBeDefined();
      expect(data.redis.healthy).toBeDefined();
      expect(data.redis.connectionAttempts).toBeDefined();
      expect(data.redis.ping).toBeDefined();
    });
  });
}); 