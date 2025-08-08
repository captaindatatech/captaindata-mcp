import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import introspectHandler from './handlers/introspect';
import toolHandler from './handlers/tools';
import { introspectSchema, toolSchema } from './schemas';
import { healthSchema } from './schemas/health';

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

  // Introspect endpoint
  app.get('/introspect', {
    schema: introspectSchema
  }, introspectHandler);

  // Tool execution endpoint
  app.post('/tools/:alias', {
    schema: toolSchema
  }, toolHandler);
}

export const registerRoutes = fp(routes); 