import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import * as Sentry from '@sentry/node';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';

import { swaggerOptions, swaggerUiOptions } from '../lib/openapi';
import { requestLoggingMiddleware, securityMiddleware } from '../middleware';
import { registerRoutes } from '../api/routes';
import { config } from '../lib/config';
import { logger } from '../lib/logger';

// Extend FastifyRequest to include our custom properties
interface RequestWithTiming extends FastifyRequest {
  startTime?: number;
}

// Create a server-specific logger
const serverLogger = logger.child({ component: 'server' });

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  serverLogger.error('Unhandled Rejection', reason as Error, {
    promise: String(promise),
  });
  
  // Report to Sentry in production
  if (config.nodeEnv === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  serverLogger.fatal('Uncaught Exception', error);
  
  // Report to Sentry in production
  if (config.nodeEnv === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  
  // Give Sentry time to send the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 2000);
});

export async function buildServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: config.logLevel,
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers['user-agent'],
            'x-forwarded-for': req.headers['x-forwarded-for'],
          },
        }),
        res: (res) => ({
          statusCode: res.statusCode,
          responseTime: res.elapsedTime || 0,
        }),
      },
    },
    requestIdHeader: 'x-request-id',
    genReqId: () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  });

  // Sentry error handler (prod only)
  if (config.nodeEnv === 'production' && process.env.SENTRY_DSN) {
    Sentry.setupFastifyErrorHandler(app);
    
    // Add Sentry error capture without interfering with status codes
    app.setErrorHandler((error, request, reply) => {
      // Capture error in Sentry with additional context
      Sentry.withScope((scope) => {
        scope.setTag('requestId', request.id);
        scope.setTag('method', request.method);
        scope.setTag('url', request.url);
        scope.setUser({
          ip: request.ip,
          userAgent: request.headers['user-agent'] as string,
        });
        scope.setExtra('headers', {
          ...request.headers,
          authorization: '[REDACTED]',
          'x-api-key': '[REDACTED]',
        });
        Sentry.captureException(error);
      });
      
      // Let Fastify handle the error response naturally
      reply.send(error);
    });
  } else {
    // Development/test error handler with logging
    app.setErrorHandler((error, request, reply) => {
      serverLogger.error('Request error', error, {
        requestId: request.id,
        method: request.method,
        url: request.url,
      });
      reply.send(error);
    });
  }

  // Response compression (gzip/brotli)
  await app.register(fastifyCompress, {
    global: true,
    encodings: ['gzip', 'deflate'],
  });

  // Security headers via Helmet
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false, // Required for Swagger UI
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for API
  });

  // CORS configuration
  const corsOrigins = config.corsOrigins;
  await app.register(fastifyCors, {
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
  });

  // Rate limiting
  await app.register(fastifyRateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTimeWindow,
    // Exempt docs/spec from rate-limit, helpful in dev
    allowList: ['/docs', '/docs/json', '/docs/yaml', '/openapi.json'],
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  // Request logging + auth, but bypass docs/spec
  const isDoc = (p: string) =>
    p === '/openapi.json' || p === '/docs/json' || p === '/docs/yaml' || p.startsWith('/docs');

  app.addHook('preHandler', async (req, reply) => {
    if (!isDoc(req.url)) {
      await requestLoggingMiddleware(req, reply);
    }
  });

  app.addHook('preHandler', async (req, reply) => {
    if (isDoc(req.url)) return;
    await securityMiddleware(req, reply);
  });

  // Add response logging with structured logger
  app.addHook('onResponse', (request, reply, done) => {
    const startTime = (request as RequestWithTiming).startTime;
    if (startTime) {
      const responseTime = Date.now() - startTime;
      
      // Use structured logging for all environments
      serverLogger.info('Request completed', {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime,
      });
      
      // Add Sentry breadcrumb in production
      if (config.nodeEnv === 'production' && process.env.SENTRY_DSN) {
        Sentry.addBreadcrumb({
          message: 'Request completed',
          category: 'http',
          data: {
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTime,
            requestId: request.id,
          },
          level: 'info',
        });
      }
    }
    done();
  });

  // Add caching headers for static endpoints
  app.addHook('onSend', async (request, reply, payload) => {
    const url = request.url;
    
    // Cache introspection and OpenAPI specs for 1 hour
    if (url === '/introspect' || url === '/openapi.json' || url === '/openapi.gpt.json') {
      reply.header('Cache-Control', 'public, max-age=3600');
    }
    
    return payload;
  });

  // Swagger documentation (available in all environments)
  await app.register(fastifySwagger, { ...swaggerOptions, mode: 'dynamic', hideUntagged: false });
  await app.register(fastifySwaggerUi, swaggerUiOptions);

  // Routes (works for dev & prod)
  await app.register(registerRoutes);

  serverLogger.info('Server built successfully', {
    environment: config.nodeEnv,
    logLevel: config.logLevel,
  });

  return app;
}
