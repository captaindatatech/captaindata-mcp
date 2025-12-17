import { FastifyRequest, FastifyReply } from 'fastify';
import { redisService } from '../../lib/redis';
import { logError } from '../../middleware';
import { HealthResponse, UnhealthyResponse } from '../../types';

export default async function handler(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const startTime = Date.now();
  const requestId = req.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Get Redis status
    const redisStatus = redisService.getStatus();
    const redisPing = await redisService.ping();

    const response: HealthResponse = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      redis: {
        available: redisService.isAvailable(),
        connected: redisStatus.connected,
        healthy: redisStatus.healthy,
        connectionAttempts: redisStatus.connectionAttempts,
        ping: redisPing,
      },
      _metadata: {
        requestId,
        executionTime: Date.now() - startTime,
      },
    };

    reply.header('Content-Type', 'application/json');
    return reply.status(200).send(response);
  } catch (error) {
    logError('Health check failed', error, req, {
      endpoint: 'health',
    });

    const executionTime = Date.now() - startTime;
    const unhealthyResponse: UnhealthyResponse = {
      status: 'unhealthy',
      error: 'Health check failed',
      requestId,
      timestamp: new Date().toISOString(),
      executionTime,
    };

    return reply.status(500).send(unhealthyResponse);
  }
}
