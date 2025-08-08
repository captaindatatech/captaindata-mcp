import { FastifySchema } from 'fastify';

// Base tool schema with validation
export const toolSchema: FastifySchema = {
  operationId: 'executeGenericTool',
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
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        details: { type: 'object', additionalProperties: true }
      },
      required: ['code', 'message']
    },
    401: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        details: { type: 'object', additionalProperties: true }
      },
      required: ['code', 'message']
    },
    404: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        details: { type: 'object', additionalProperties: true }
      },
      required: ['code', 'message']
    },
    408: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        details: { type: 'object', additionalProperties: true }
      },
      required: ['code', 'message']
    },
    500: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        details: { type: 'object', additionalProperties: true }
      },
      required: ['code', 'message']
    },
    503: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        details: { type: 'object', additionalProperties: true }
      },
      required: ['code', 'message']
    }
  }
}; 