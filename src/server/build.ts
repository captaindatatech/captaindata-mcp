import fastify, { FastifyInstance } from 'fastify';
import * as Sentry from '@sentry/node';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import { swaggerOptions, swaggerUiOptions } from '../lib/openapi';
import { requestLoggingMiddleware, securityMiddleware } from '../middleware';
import { registerRoutes } from '../api/routes';
import { config } from '../lib/config';

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
  }

  // Core plugins
  await app.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  });

  await app.register(fastifyRateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTimeWindow,
    // Exempt docs/spec from rate-limit, helpful in dev
    allowList: ['/docs', '/docs/json', '/docs/yaml', '/openapi.json'],
  });

  // Security headers
  app.addHook('onRequest', async (_, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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

  // Add response logging
  app.addHook('onResponse', (request, reply, done) => {
    const startTime = (request as any).startTime;
    if (startTime) {
      const responseTime = Date.now() - startTime;
      // Use the existing logging middleware for consistency
      if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        const Sentry = require('@sentry/node');
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
      // Keep console logging for development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Request completed', {
          requestId: request.id,
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          responseTime,
        });
      }
    }
    done();
  });

  // Swagger documentation (available in all environments)
  await app.register(fastifySwagger, { ...swaggerOptions, mode: 'dynamic', hideUntagged: false });
  await app.register(fastifySwaggerUi, swaggerUiOptions);

  // Routes (works for dev & prod)
  // If registerRoutes is async, await it
  await app.register(registerRoutes);

  return app;
} 