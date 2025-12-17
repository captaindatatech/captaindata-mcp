import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { createTestServer } from './helpers/testServer';

// Load environment variables
dotenv.config();

describe('OpenAPI Documentation', () => {
  let server: any;

  beforeAll(async () => {
    // Set NODE_ENV to development to enable docs
    process.env.NODE_ENV = 'development';
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
    // Reset NODE_ENV
    process.env.NODE_ENV = 'test';
  });

  describe('GET /docs', () => {
    it('should serve OpenAPI documentation', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/docs',
      });

      // Swagger UI serves the HTML page directly
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should serve OpenAPI JSON spec', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/docs/json',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const spec = JSON.parse(response.payload);
      expect(spec.openapi).toBeDefined();
      expect(spec.info.title).toBe('Captain Data MCP API');
      expect(spec.paths).toBeDefined();
    });

    it('should include health endpoint in docs', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/docs/json',
      });

      const spec = JSON.parse(response.payload);
      expect(spec.paths['/health']).toBeDefined();
      expect(spec.paths['/health'].get.tags).toContain('Health');
    });

    it('should include introspect endpoint in docs', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/docs/json',
      });

      const spec = JSON.parse(response.payload);
      expect(spec.paths['/introspect']).toBeDefined();
      expect(spec.paths['/introspect'].get.tags).toContain('Introspection');
    });
  });
});
