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
    it('should handle enrich_people tool with valid API key', async () => {
      const mockData = { success: true, data: { full_name: 'Guillaume Odier' } };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('enrich_people', {
        linkedin_profile_url: 'https://www.linkedin.com/in/guillaumeodier'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.full_name).toBe('Guillaume Odier');

      restoreFetch(originalFetch);
    });

    it('should return 404 for unknown tool', async () => {
      const response = await server.inject(createTestPayload('unknown_tool', {}));

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('unknown_tool');
      expect(data.message).toBe("Tool 'unknown_tool' not supported");
      expect(data.requestId).toBeDefined();
    });

    it('should handle enrich_company tool', async () => {
      const mockData = { success: true, data: { company_name: 'Captain Data' } };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('enrich_company', {
        linkedin_company_url: 'https://www.linkedin.com/company/captaindata'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.company_name).toBe('Captain Data');

      restoreFetch(originalFetch);
    });

    it('should handle search_people tool', async () => {
      const mockData = { success: true, data: { results: [] } };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('search_people', {
        search_url: 'https://www.linkedin.com/sales/search/people'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);

      restoreFetch(originalFetch);
    });

    it('should handle search_companies tool', async () => {
      const mockData = { success: true, data: { results: [] } };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('search_companies', {
        search_url: 'https://www.linkedin.com/sales/search/company'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);

      restoreFetch(originalFetch);
    });

    it('should handle search_company_employees tool', async () => {
      const mockData = { success: true, data: { results: [] } };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('search_company_employees', {
        sales_navigator_company_url: 'https://www.linkedin.com/sales/company/test'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);

      restoreFetch(originalFetch);
    });

    it('should validate search_company_employees requires at least one input field', async () => {
      const response = await server.inject(createTestPayload('search_company_employees', {}));

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('missing_input');
      expect(data.message).toBe('Must provide either a company URL or ID');
    });

    it('should handle search_company_employees with linkedin_company_id', async () => {
      const mockData = { success: true, data: { results: [] } };
      const originalFetch = mockFetchResponse(mockData);

      const response = await server.inject(createTestPayload('search_company_employees', {
        linkedin_company_id: '12345'
      }));

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);

      restoreFetch(originalFetch);
    });

    it('should handle Captain Data API errors', async () => {
      const mockData = { error: 'Invalid API key', code: 'invalid_key' };
      const originalFetch = mockFetchResponse(mockData, 401);

      const response = await server.inject(createTestPayload('enrich_people', {
        linkedin_profile_url: 'https://www.linkedin.com/in/test'
      }));

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Invalid API key');
      expect(data.code).toBe('invalid_key');

      restoreFetch(originalFetch);
    });
  });
}); 