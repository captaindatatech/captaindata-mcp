import { FastifyRequest, FastifyReply } from 'fastify';

export async function requestLoggingMiddleware(request: FastifyRequest, reply: FastifyReply) {
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

  // Store start time for response logging
  (request as any).startTime = startTime;
} 