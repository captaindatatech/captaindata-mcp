import { FastifySchema } from 'fastify';

// Base tool schema with validation
export const toolSchema: FastifySchema = {
  tags: ['Tools'],
  summary: 'Execute tool',
  description: 'Execute a Captain Data tool by alias',
  params: {
    type: 'object',
    properties: {
      alias: { 
        type: 'string', 
        description: 'Tool alias',
        minLength: 1
      }
    },
    required: ['alias']
  },
  body: {
    type: 'object',
    description: 'Tool parameters',
    additionalProperties: true
  },
  response: {
    200: {
      type: 'object',
      description: 'Tool execution result',
      additionalProperties: true
    },
    400: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' }
      }
    },
    404: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' }
      }
    },
    408: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' }
      }
    },
    503: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' }
      }
    }
  }
}; 