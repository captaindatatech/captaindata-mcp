import { HealthResponseSchema, UnhealthyResponseSchema } from '../../types';

/**
 * Fastify schema for the /health endpoint
 */
export const healthSchema = {
  operationId: 'getHealth',
  tags: ['Health'],
  summary: 'Health check',
  description: 'Check if the API is running',
  response: {
    200: HealthResponseSchema,
    500: UnhealthyResponseSchema
  }
};
