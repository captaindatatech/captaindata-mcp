import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { createTestServer } from './helpers/testServer';
import { createTestRequest } from './helpers/testUtils';

// Load environment variables
dotenv.config();

describe('Authentication', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('API Key Validation', () => {
    it('should return 401 when x-api-key header is missing for POST requests', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tools/enrich_people',
        payload: {
          linkedin_profile_url: 'https://www.linkedin.com/in/test'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('missing_api_key');
      expect(data.message).toBe('Provide Captain Data key in x-api-key header or session token in Authorization header');
    });

    it('should allow GET requests without API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/introspect'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow health check without API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should accept requests with valid API key header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tools/enrich_people',
        headers: {
          'x-api-key': 'test-api-key'
        },
        payload: {
          linkedin_profile_url: 'https://www.linkedin.com/in/test'
        }
      });

      // Should not return 401 (authentication error)
      expect(response.statusCode).not.toBe(401);
    });
  });
}); 