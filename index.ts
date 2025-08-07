// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import Sentry instrumentation after environment variables are loaded
import "./instrument";

import fastify from 'fastify';
import * as Sentry from "@sentry/node";
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import middleware from './src/middleware';
import { requestLoggingMiddleware } from './src/middleware/logging';
import introspectHandler, { introspectSchema } from './src/api/introspect';
import toolHandler from './src/api/tools/[alias]';
import { swaggerOptions, swaggerUiOptions, generateToolPaths } from './src/lib/openapi';
import { config } from './src/lib/config';

// Validate configuration on startup
try {
  console.log('Validating configuration...');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Captain Data API Base: ${config.cdApiBase}`);
  console.log(`Log Level: ${config.logLevel}`);
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

// Create Fastify instance
const server = fastify({
  logger: {
    level: config.logLevel,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
        }
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        responseTime: res.elapsedTime || 0
      })
    }
  },
  requestIdHeader: 'x-request-id',
  genReqId: () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
});

// Set up Sentry error handler for Fastify (only in production if Sentry is initialized)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.setupFastifyErrorHandler(server);
}

// Register CORS
server.register(fastifyCors, {
  origin: true, // Allow all origins for ChatGPT
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
});

// Register rate limiting
server.register(fastifyRateLimit, {
  max: config.rateLimitMax,
  timeWindow: config.rateLimitTimeWindow
});

// Add security headers
server.addHook('onRequest', async (request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

// Add request logging middleware
server.addHook('preHandler', requestLoggingMiddleware);

// Add authentication middleware
server.addHook('preHandler', middleware);

// Add response logging
server.addHook('onResponse', (request, reply, done) => {
  const startTime = (request as any).startTime;
  if (startTime) {
    const responseTime = Date.now() - startTime;
    request.log.info({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime,
      message: 'Request completed'
    });
  }
  done();
});

// Test endpoint
server.get('/test', async (req, reply) => {
  return { message: 'Hello World', timestamp: new Date().toISOString() };
});

// Health check endpoint
server.get('/health', {
  schema: {
    tags: ['Health'],
    summary: 'Health check',
    description: 'Check if the API is running',
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          message: { type: 'string', example: 'Captain Data MCP API is running' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number', description: 'Server uptime in seconds' },
          version: { type: 'string' },
          environment: { type: 'string' }
        }
      }
    }
  }
}, async (req, reply) => {
  return { 
    status: 'ok', 
    message: 'Captain Data MCP API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv
  };
});

// Introspect endpoint
server.get('/introspect', {
  schema: introspectSchema
}, introspectHandler);

// Register tool routes
server.post('/tools/:alias', {
  schema: {
    tags: ['Tools'],
    summary: 'Execute tool',
    description: 'Execute a Captain Data tool by alias',
    params: {
      type: 'object',
      properties: {
        alias: { type: 'string', description: 'Tool alias' }
      },
      required: ['alias']
    },
    body: {
      type: 'object',
      description: 'Tool parameters'
    },
    response: {
      200: {
        type: 'object',
        description: 'Tool execution result'
      },
      401: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' }
        }
      },
      404: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  }
}, toolHandler);

// Register OpenAPI documentation (only in development) - AFTER all routes are defined
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  // Register Swagger
  server.register(fastifySwagger, swaggerOptions);

  // Register Swagger UI
  server.register(fastifySwaggerUi, swaggerUiOptions);
}

// For local development (only if not in test environment)
if (config.nodeEnv !== 'production' && config.nodeEnv !== 'test') {
  const start = async () => {
    try {
      await server.listen({ port: config.port, host: '0.0.0.0' });
      const address = server.server.address();
      if (address && typeof address !== 'string') {
        console.log(`🚀 Server is running on port ${address.port}`);
        console.log(`📚 API Documentation: http://localhost:${address.port}/docs`);
        console.log(`🏥 Health Check: http://localhost:${address.port}/health`);
      } else {
        console.log('🚀 Server is running');
      }
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };
  start();
}

// Export for Vercel serverless function
export default async function handler(req: any, res: any) {
  await server.ready();
  server.server.emit('request', req, res);
} 