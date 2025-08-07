import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { createTestServer } from './helpers/testServer';

// Load environment variables
dotenv.config();

describe('Introspect Endpoint', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /introspect', () => {
    it('should return 5 tools in basic mode', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/introspect'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.tools).toHaveLength(5);
      expect(data.tools[0]).toHaveProperty('type', 'function');
      expect(data.tools[0]).toHaveProperty('function.name');
      expect(data.tools[0]).toHaveProperty('function.description');
      expect(data.tools[0]).toHaveProperty('function.parameters');
    });

    it('should return 5 tools in full mode (until we add more)', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/introspect?v=full'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.tools).toHaveLength(5);
    });

    it('should return valid tool structure', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/introspect'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      // Check that all tools have the expected structure
      data.tools.forEach((tool: any) => {
        expect(tool).toHaveProperty('type', 'function');
        expect(tool.function).toHaveProperty('name');
        expect(tool.function).toHaveProperty('description');
        expect(tool.function).toHaveProperty('parameters');
        expect(typeof tool.function.name).toBe('string');
        expect(typeof tool.function.description).toBe('string');
        expect(typeof tool.function.parameters).toBe('object');
      });
    });
  });
}); 