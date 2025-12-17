import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import dotenv from 'dotenv';
import { createTestServer } from './helpers/testServer';
import { createTestRequest, mockFetchResponse, restoreFetch } from './helpers/testUtils';

// Load environment variables
dotenv.config();

describe('Authentication System', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /auth', () => {
    it('should return 400 when api_key is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      // Schema validation may catch this before handler (FST_ERR_VALIDATION) or handler catches it (missing_input)
      expect(['missing_input', 'FST_ERR_VALIDATION']).toContain(data.code);
    });

    it('should return 400 when api_key is empty', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth',
        payload: { api_key: '' },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      // Schema validation may catch this before handler (FST_ERR_VALIDATION) or handler catches it (missing_input)
      expect(['missing_input', 'FST_ERR_VALIDATION']).toContain(data.code);
    });

    it('should return 200 and session token when valid api_key is provided', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth',
        payload: { api_key: 'test-api-key-123' },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.session_token).toBeDefined();
      expect(typeof data.session_token).toBe('string');
      expect(data.expires_in).toBe(86400);
      expect(data._metadata).toBeDefined();
      expect(data._metadata.requestId).toBeDefined();
      expect(data._metadata.executionTime).toBeDefined();
    });
  });

  describe('Tool endpoints with session tokens', () => {
    let sessionToken: string;

    beforeEach(async () => {
      // Get a session token for testing
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth',
        payload: { api_key: 'test-api-key-123' },
      });
      const authData = JSON.parse(authResponse.payload);
      sessionToken = authData.session_token;
    });

    it('should accept requests with session token in Authorization header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tools/enrich_person',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        payload: {
          li_profile_url: 'https://www.linkedin.com/in/test',
        },
      });

      // Should not return 401 (authentication error)
      expect(response.statusCode).not.toBe(401);
    });

    it('should return 401 with invalid session token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tools/enrich_person',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        payload: {
          li_profile_url: 'https://www.linkedin.com/in/test',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('session_token_expired');
      expect(data.message).toContain('Invalid or expired session token');
    });

    it('should return 401 with malformed Authorization header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tools/enrich_person',
        headers: {
          Authorization: 'InvalidFormat token',
        },
        payload: {
          li_profile_url: 'https://www.linkedin.com/in/test',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('mcp_auth_error');
      expect(data.message).toContain('Invalid Authorization header format');
    });
  });

  describe('Backward compatibility', () => {
    it('should still accept direct API key in X-API-Key header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tools/enrich_person',
        headers: {
          'x-api-key': 'test-api-key-123',
        },
        payload: {
          li_profile_url: 'https://www.linkedin.com/in/test',
        },
      });

      // Should not return 401 (authentication error)
      expect(response.statusCode).not.toBe(401);
    });

    it('should prioritize X-API-Key over Authorization header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tools/enrich_person',
        headers: {
          'x-api-key': 'test-api-key-123',
          Authorization: 'Bearer invalid-token',
        },
        payload: {
          li_profile_url: 'https://www.linkedin.com/in/test',
        },
      });

      // Should not return 401 (authentication error) because X-API-Key is present
      expect(response.statusCode).not.toBe(401);
    });
  });

  describe('Public routes', () => {
    it('should allow access to /auth without authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth',
        payload: { api_key: 'test-api-key-123' },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow access to /health without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow access to /introspect without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/introspect',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
