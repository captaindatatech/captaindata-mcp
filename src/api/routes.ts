import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import introspectHandler from './handlers/introspect';
import toolHandler from './handlers/tools';
import { introspectSchema, toolSchema } from './schemas';
import { healthSchema } from './schemas/health';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TOOL_SCHEMAS } from '../lib/schemas';
import { ToolAlias } from '../lib/alias';

// Cache the OpenAPI spec at module load time for better serverless performance
let cachedOpenApiSpec: any = null;
let openApiSpecError: string | null = null;

try {
  const openapiPath = join(process.cwd(), 'openapi.json');
  const openapiContent = readFileSync(openapiPath, 'utf8');
  cachedOpenApiSpec = JSON.parse(openapiContent);
} catch (error) {
  openApiSpecError = error instanceof Error ? error.message : 'Unknown error';
  console.error('Failed to load OpenAPI specification at startup:', error);
}

async function routes(app: FastifyInstance) {
  // Health check endpoint
  app.get('/health', {
    schema: healthSchema
  }, async () => ({ 
    status: 'ok', 
    message: 'Captain Data MCP API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }));

  // OpenAPI specification endpoint
  app.get('/openapi.json', async (request, reply) => {
    if (openApiSpecError) {
      request.log.error({
        error: openApiSpecError,
        message: 'OpenAPI specification not available'
      });
      return reply.status(500).send({ 
        error: 'OpenAPI specification not available',
        message: 'Internal server error'
      });
    }
    
    reply.header('Content-Type', 'application/json');
    return cachedOpenApiSpec;
  });

  // Introspect endpoint
  app.get('/introspect', {
    schema: introspectSchema
  }, introspectHandler);

  // Dynamic tool endpoints for ChatGPT Actions
  Object.keys(TOOL_SCHEMAS).forEach((toolAlias) => {
    const alias = toolAlias as ToolAlias;
    const schema = TOOL_SCHEMAS[alias];
    
    // Register specific endpoint for each tool with dynamic schema
    app.post(`/tools/${alias}`, {
      schema: {
        summary: `Execute ${alias} tool`,
        tags: ['Tools'],
        description: schema.description,
        body: schema.parameters,
        response: {
          200: {
            type: 'object',
            description: 'Tool execution result',
            additionalProperties: true
          },
          400: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              details: { type: 'object', additionalProperties: true }
            },
            required: ['code', 'message']
          },
          401: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              details: { type: 'object', additionalProperties: true }
            },
            required: ['code', 'message']
          },
          404: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              details: { type: 'object', additionalProperties: true }
            },
            required: ['code', 'message']
          },
          500: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              details: { type: 'object', additionalProperties: true }
            },
            required: ['code', 'message']
          }
        }
      }
    }, async (request, reply) => {
      // Create a properly typed request object for the tool handler
      const typedRequest = {
        ...request,
        params: { alias },
        headers: request.headers
      } as any;
      return toolHandler(typedRequest, reply);
    });
  });

  // Generic tool execution endpoint (for backward compatibility)
  app.post('/tools/:alias', {
    schema: toolSchema
  }, toolHandler);
}

export const registerRoutes = fp(routes); 