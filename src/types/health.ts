import { Type, Static } from '@sinclair/typebox';
import { MetadataSchema } from './common';

// ============================================================================
// REDIS STATUS SCHEMA
// ============================================================================

/**
 * Redis connection status schema
 */
export const RedisStatusSchema = Type.Object({
  available: Type.Boolean({ description: 'Whether Redis is available' }),
  connected: Type.Boolean({ description: 'Whether Redis is connected' }),
  healthy: Type.Boolean({ description: 'Whether Redis is healthy' }),
  connectionAttempts: Type.Number({ description: 'Number of connection attempts' }),
  ping: Type.Union([Type.String(), Type.Null()], { description: 'Redis ping response' }),
});

export type RedisStatus = Static<typeof RedisStatusSchema>;

// ============================================================================
// HEALTH RESPONSE SCHEMAS
// ============================================================================

/**
 * Successful health check response
 */
export const HealthResponseSchema = Type.Object({
  status: Type.Literal('healthy'),
  uptime: Type.Number({ description: 'Server uptime in seconds' }),
  timestamp: Type.String({ format: 'date-time' }),
  redis: RedisStatusSchema,
  _metadata: MetadataSchema,
});

export type HealthResponse = Static<typeof HealthResponseSchema>;

/**
 * Unhealthy response schema
 */
export const UnhealthyResponseSchema = Type.Object({
  status: Type.Literal('unhealthy'),
  error: Type.String(),
  requestId: Type.String(),
  timestamp: Type.String({ format: 'date-time' }),
  executionTime: Type.Number(),
});

export type UnhealthyResponse = Static<typeof UnhealthyResponseSchema>;

// ============================================================================
// FASTIFY ROUTE SCHEMAS
// ============================================================================

/**
 * Complete health endpoint schema for Fastify
 */
export const healthRouteSchema = {
  operationId: 'getHealth',
  tags: ['Health'],
  summary: 'Health check',
  description: 'Check if the API is running',
  response: {
    200: HealthResponseSchema,
    500: UnhealthyResponseSchema,
  },
};
