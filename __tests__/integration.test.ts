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
    it('should handle complete enrich_people workflow', async () => {
      // Step 1: Check health
      const healthResponse = await server.inject({
        method: 'GET',
        url: '/'
      });
      expect(healthResponse.statusCode).toBe(200);

      // Step 2: Get available tools
      const introspectResponse = await server.inject({
        method: 'GET',
        url: '/introspect'
      });
      expect(introspectResponse.statusCode).toBe(200);
      const tools = JSON.parse(introspectResponse.payload).tools;
      expect(tools).toHaveLength(5);
      
      // Verify enrich_people tool is available
      const enrichPeopleTool = tools.find((t: any) => t.function.name === 'enrich_people');
      expect(enrichPeopleTool).toBeDefined();

      // Step 3: Execute the tool
      const mockData = { 
        success: true, 
        data: { 
          full_name: 'John Doe',
          headline: 'Software Engineer',
          location: 'San Francisco, CA'
        } 
      };
      const originalFetch = mockFetchResponse(mockData);

      const toolResponse = await server.inject({
        method: 'POST',
        url: '/tools/enrich_people',
        headers: {
          'x-api-key': 'test-api-key'
        },
        payload: {
          linkedin_profile_url: 'https://www.linkedin.com/in/johndoe'
        }
      });

      expect(toolResponse.statusCode).toBe(200);
      const result = JSON.parse(toolResponse.payload);
      expect(result.success).toBe(true);
      expect(result.data.full_name).toBe('John Doe');

      restoreFetch(originalFetch);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test with missing API key
      const noKeyResponse = await server.inject({
        method: 'POST',
        url: '/tools/enrich_people',
        payload: {
          linkedin_profile_url: 'https://www.linkedin.com/in/test'
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