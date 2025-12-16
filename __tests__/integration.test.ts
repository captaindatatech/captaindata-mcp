import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { createTestServer } from './helpers/testServer';
import { mockFetchResponse, restoreFetch } from './helpers/testUtils';

// Load environment variables
dotenv.config();

describe('Integration Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Complete API Flow', () => {
    it('should handle complete enrich_person workflow', async () => {
      // Step 1: Check health
      const healthResponse = await server.inject({
        method: 'GET',
        url: '/health'
      });
      expect(healthResponse.statusCode).toBe(200);

      // Step 2: Get available tools
      const introspectResponse = await server.inject({
        method: 'GET',
        url: '/introspect'
      });
      expect(introspectResponse.statusCode).toBe(200);
      const tools = JSON.parse(introspectResponse.payload).tools;
      expect(tools).toHaveLength(5); // Basic mode returns first 5 tools
      
      // Verify enrich_person tool is available
      const enrichPersonTool = tools.find((t: any) => t.function.name === 'enrich_person');
      expect(enrichPersonTool).toBeDefined();

      // Step 3: Execute the tool
      const mockData = { 
        uid: '123',
        full_name: 'John Doe',
        headline: 'Software Engineer',
        location: 'San Francisco, CA'
      };
      const originalFetch = mockFetchResponse(mockData);

      const toolResponse = await server.inject({
        method: 'POST',
        url: '/tools/enrich_person',
        headers: {
          'x-api-key': 'test-api-key'
        },
        payload: {
          li_profile_url: 'https://www.linkedin.com/in/johndoe'
        }
      });

      expect(toolResponse.statusCode).toBe(200);
      const result = JSON.parse(toolResponse.payload);
      expect(result.full_name).toBe('John Doe');

      restoreFetch(originalFetch);
    });

    it('should handle find then enrich workflow', async () => {
      // Step 1: Find person
      const findMockData = { 
        li_profile_url: 'https://www.linkedin.com/in/johndoe',
        uid: '123',
        li_profile_id: 12345
      };
      let originalFetch = mockFetchResponse(findMockData);

      const findResponse = await server.inject({
        method: 'POST',
        url: '/tools/find_person',
        headers: {
          'x-api-key': 'test-api-key'
        },
        payload: {
          full_name: 'John Doe',
          company_name: 'Tech Corp'
        }
      });

      expect(findResponse.statusCode).toBe(200);
      const findResult = JSON.parse(findResponse.payload);
      expect(findResult.li_profile_url).toBeDefined();

      restoreFetch(originalFetch);

      // Step 2: Enrich person with found URL
      const enrichMockData = { 
        uid: '123',
        full_name: 'John Doe',
        headline: 'Software Engineer',
        company_name: 'Tech Corp'
      };
      originalFetch = mockFetchResponse(enrichMockData);

      const enrichResponse = await server.inject({
        method: 'POST',
        url: '/tools/enrich_person',
        headers: {
          'x-api-key': 'test-api-key'
        },
        payload: {
          li_profile_url: findResult.li_profile_url
        }
      });

      expect(enrichResponse.statusCode).toBe(200);
      const enrichResult = JSON.parse(enrichResponse.payload);
      expect(enrichResult.full_name).toBe('John Doe');
      expect(enrichResult.company_name).toBe('Tech Corp');

      restoreFetch(originalFetch);
    });

    it('should handle company employees workflow', async () => {
      // Step 1: Find company
      const findMockData = { 
        li_company_url: 'https://www.linkedin.com/company/techcorp',
        uid: '456',
        li_company_id: '67890'
      };
      let originalFetch = mockFetchResponse(findMockData);

      const findResponse = await server.inject({
        method: 'POST',
        url: '/tools/find_company',
        headers: {
          'x-api-key': 'test-api-key'
        },
        payload: {
          company_name: 'Tech Corp'
        }
      });

      expect(findResponse.statusCode).toBe(200);
      const findResult = JSON.parse(findResponse.payload);
      expect(findResult.uid).toBeDefined();

      restoreFetch(originalFetch);

      // Step 2: Get employees using company_uid
      const employeesMockData = [
        { uid: '1', full_name: 'Employee One', job_title: 'Engineer' },
        { uid: '2', full_name: 'Employee Two', job_title: 'Manager' }
      ];
      originalFetch = mockFetchResponse(employeesMockData);

      const employeesResponse = await server.inject({
        method: 'POST',
        url: '/tools/search_company_employees',
        headers: {
          'x-api-key': 'test-api-key'
        },
        payload: {
          company_uid: findResult.uid
        }
      });

      expect(employeesResponse.statusCode).toBe(200);
      const employeesResult = JSON.parse(employeesResponse.payload);
      expect(employeesResult.data).toHaveLength(2);

      restoreFetch(originalFetch);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test with missing API key
      const noKeyResponse = await server.inject({
        method: 'POST',
        url: '/tools/enrich_person',
        payload: {
          li_profile_url: 'https://www.linkedin.com/in/test'
        }
      });
      expect(noKeyResponse.statusCode).toBe(401);

      // Test with unknown tool
      const unknownToolResponse = await server.inject({
        method: 'POST',
        url: '/tools/nonexistent_tool',
        headers: {
          'x-api-key': 'test-api-key'
        },
        payload: {}
      });
      expect(unknownToolResponse.statusCode).toBe(404);
    });
  });
});
