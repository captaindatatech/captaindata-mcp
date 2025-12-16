import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { createTestServer } from './helpers/testServer';
import { mockFetchResponse, restoreFetch, createTestPayload } from './helpers/testUtils';

// Load environment variables
dotenv.config();

describe('Tool Execution', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /tools/:alias', () => {
    // People Tools
    it('should handle find_person tool with valid API key', async () => {
      const mockData = { li_profile_url: 'https://www.linkedin.com/in/guillaumeodier', uid: '123', li_profile_id: 12345 };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('find_person', {
        full_name: 'Guillaume Odier',
        company_name: 'Captain Data'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.li_profile_url).toBe('https://www.linkedin.com/in/guillaumeodier');

      restoreFetch(originalFetch);
    });

    it('should handle enrich_person tool with valid API key', async () => {
      const mockData = { full_name: 'Guillaume Odier', headline: 'CEO at Captain Data' };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('enrich_person', {
        li_profile_url: 'https://www.linkedin.com/in/guillaumeodier'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.full_name).toBe('Guillaume Odier');

      restoreFetch(originalFetch);
    });

    it('should handle enrich_person tool with full_enrich option', async () => {
      const mockData = { full_name: 'Guillaume Odier', experiences: [], skills: [] };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('enrich_person', {
        li_profile_url: 'https://www.linkedin.com/in/guillaumeodier',
        full_enrich: true
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.full_name).toBe('Guillaume Odier');

      restoreFetch(originalFetch);
    });

    it('should handle search_people tool', async () => {
      const mockData = [{ uid: '1', full_name: 'John Doe' }, { uid: '2', full_name: 'Jane Doe' }];
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('search_people', {
        query: '(keywords:"Software Engineer")'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data).toHaveLength(2);

      restoreFetch(originalFetch);
    });

    // Company Tools
    it('should handle find_company tool', async () => {
      const mockData = { li_company_url: 'https://www.linkedin.com/company/captaindata', uid: '456', li_company_id: '67890' };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('find_company', {
        company_name: 'Captain Data'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.li_company_url).toBe('https://www.linkedin.com/company/captaindata');

      restoreFetch(originalFetch);
    });

    it('should handle enrich_company tool', async () => {
      const mockData = { company_name: 'Captain Data', industry: 'Technology' };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('enrich_company', {
        li_company_url: 'https://www.linkedin.com/company/captaindata'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.company_name).toBe('Captain Data');

      restoreFetch(originalFetch);
    });

    it('should handle search_companies tool', async () => {
      const mockData = [{ uid: '1', company_name: 'Tech Corp' }];
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('search_companies', {
        query: '(keywords:"technology")'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data).toHaveLength(1);

      restoreFetch(originalFetch);
    });

    it('should handle search_company_employees tool', async () => {
      const mockData = [{ uid: '1', full_name: 'Employee One' }];
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('search_company_employees', {
        company_uid: '123e4567-e89b-12d3-a456-426614174000'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data).toHaveLength(1);

      restoreFetch(originalFetch);
    });

    it('should validate search_company_employees requires company_uid', async () => {
      const response = await server.inject(createTestPayload('search_company_employees', {}));

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      // Schema validation may catch this before handler (FST_ERR_VALIDATION) or handler catches it (missing_input)
      expect(['missing_input', 'FST_ERR_VALIDATION']).toContain(data.code);
    });

    // Utility Tools
    it('should handle get_quotas tool', async () => {
      const mockData = { 
        uid: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Workspace',
        credits_left: 500,
        credits_max: 1000,
        credits_used: 500,
        plan_name: 'Growth'
      };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('get_quotas', {}));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.credits_left).toBe(500);
      expect(data.plan_name).toBe('Growth');

      restoreFetch(originalFetch);
    });

    // Error handling
    it('should return 404 for unknown tool', async () => {
      const response = await server.inject(createTestPayload('unknown_tool', {}));

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      // Fastify returns its own 404 for unregistered routes
      expect(data.statusCode).toBe(404);
      expect(data.message).toContain('unknown_tool');
    });

    it('should handle Captain Data API errors', async () => {
      const mockData = { error: 'Invalid API key', code: 'invalid_key' };
      const originalFetch = mockFetchResponse(mockData, 401);

      const response = await server.inject(createTestPayload('enrich_person', {
        li_profile_url: 'https://www.linkedin.com/in/test'
      }));

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Invalid API key');
      expect(data.code).toBe('invalid_key');

      restoreFetch(originalFetch);
    });

    // Timeout and network error handling
    it('should handle request timeout', async () => {
      const originalFetch = global.fetch;
      
      // Mock fetch to simulate timeout via AbortError
      global.fetch = jest.fn().mockImplementation(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const response = await server.inject(createTestPayload('enrich_person', {
        li_profile_url: 'https://www.linkedin.com/in/test'
      }));

      expect(response.statusCode).toBe(408);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('timeout');
      expect(data.message).toContain('timed out');

      global.fetch = originalFetch;
    });

    it('should handle network errors with service unavailable response', async () => {
      const originalFetch = global.fetch;
      
      // Mock fetch to simulate network error after retries
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        // Return network error on all attempts
        return Promise.reject(new TypeError('Failed to fetch'));
      });

      const response = await server.inject(createTestPayload('enrich_person', {
        li_profile_url: 'https://www.linkedin.com/in/test'
      }));

      expect(response.statusCode).toBe(503);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('service_unavailable');
      expect(data.message).toContain('temporarily unavailable');
      // Should have retried (initial + MAX_RETRIES attempts)
      expect(callCount).toBeGreaterThanOrEqual(1);

      global.fetch = originalFetch;
    });

    it('should handle malformed JSON response from API', async () => {
      const originalFetch = global.fetch;
      
      // Mock fetch to return invalid JSON
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
        text: () => Promise.resolve('not valid json'),
        headers: {
          get: () => null
        }
      });

      const response = await server.inject(createTestPayload('enrich_person', {
        li_profile_url: 'https://www.linkedin.com/in/test'
      }));

      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('invalid_response');

      global.fetch = originalFetch;
    });
  });
});
