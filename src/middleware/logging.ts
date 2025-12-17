import { FastifyRequest, FastifyReply } from 'fastify';
import * as Sentry from '@sentry/node';

// Extend FastifyRequest to include our custom properties
interface RequestWithTiming extends FastifyRequest {
  startTime?: number;
}

export async function requestLoggingMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  const startTime = Date.now();
  const requestId = request.id;
  
  // Log incoming request
  request.log.info({
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    message: 'Incoming request'
  });

  // Add Sentry breadcrumb for request tracking
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message: 'Incoming request',
      category: 'http',
      data: {
        method: request.method,
        url: request.url,
        requestId,
      },
      level: 'info',
    });
  }

  // Store start time for response logging
  (request as RequestWithTiming).startTime = startTime;
}

/**
 * Log error with Sentry integration
 */
export function logError(
  message: string,
  error: Error | unknown,
  request: FastifyRequest,
  context: Record<string, unknown> = {}
): void {
  const requestId = request.id;
  const reqWithTiming = request as RequestWithTiming;
  const executionTime = reqWithTiming.startTime 
    ? Date.now() - reqWithTiming.startTime 
    : undefined;

  // Log to application logs
  request.log.error({
    requestId,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    executionTime,
    ...context,
    message
  });

  // Report to Sentry in production
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      // Set tags
      scope.setTag('requestId', requestId);
      if (executionTime) {
        scope.setTag('executionTime', executionTime.toString());
      }
      if (context.endpoint) {
        scope.setTag('endpoint', String(context.endpoint));
      }
      if (context.tool) {
        scope.setTag('tool', String(context.tool));
      }

      // Set user context
      scope.setUser({
        ip: request.ip,
        userAgent: request.headers['user-agent'] as string,
      });

      // Set extra data (filtering sensitive information)
      const safeHeaders = {
        ...request.headers,
        authorization: '[REDACTED]',
        'x-api-key': '[REDACTED]',
      };
      
      scope.setExtra('headers', safeHeaders);
      scope.setExtra('method', request.method);
      scope.setExtra('url', request.url);
      
      // Add custom context
      Object.entries(context).forEach(([key, value]) => {
        if (key !== 'endpoint' && key !== 'tool') {
          scope.setExtra(key, value);
        }
      });

      Sentry.captureException(error);
    });
  }
}

/**
 * Add info breadcrumb to Sentry
 */
export function logInfo(
  message: string,
  request: FastifyRequest,
  context: Record<string, unknown> = {}
): void {
  // Log to application logs
  request.log.info({
    requestId: request.id,
    ...context,
    message
  });

  // Add Sentry breadcrumb
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category: context.endpoint ? String(context.endpoint) : 'default',
      data: context as Record<string, string>,
      level: 'info',
    });
  }
} 