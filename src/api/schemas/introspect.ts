import { IntrospectQuerySchema, IntrospectResponseSchema } from '../../types';

/**
 * Fastify schema for the /introspect endpoint
 */
export const introspectSchema = {
  operationId: 'getIntrospect',
  tags: ['Introspection'],
  summary: 'List available tools',
  description: 'Get metadata about available tools (MCP introspection)',
  querystring: IntrospectQuerySchema,
  response: {
    200: IntrospectResponseSchema
  }
};
