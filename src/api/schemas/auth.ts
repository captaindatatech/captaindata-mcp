import { AuthRequestSchema, AuthResponseSchema, ErrorResponseSchema } from '../../types';

/**
 * Fastify schema for the /auth endpoint
 */
export const authSchema = {
  operationId: 'authenticate',
  summary: 'Authenticate with your Captain Data API key',
  tags: ['Authentication'],
  description:
    'Exchange your Captain Data API key for a session token that can be used for subsequent requests',
  body: AuthRequestSchema,
  response: {
    200: AuthResponseSchema,
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
};
