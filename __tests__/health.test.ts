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

  describe('GET /', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.status).toBe('ok');
      expect(data.message).toBe('Captain Data MCP API is running');
    });
  });
}); 