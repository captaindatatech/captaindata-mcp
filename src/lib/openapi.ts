import { FastifySwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { TOOL_SCHEMAS } from './schemas';

export const swaggerOptions = {
  mode: 'dynamic',
  hideUntagged: false,
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'Captain Data MCP API',
      description: 'API for managing Captain Data actions and flows',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://mcp.captaindata.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey' as const,
          name: 'X-API-Key',
          in: 'header' as const,
          description: 'Direct Captain Data API key for authentication'
        },
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer' as const,
          bearerFormat: 'JWT',
          description: 'Session token obtained from /auth endpoint'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  }
} as any;

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full' as const,
    deepLinking: false,
  },
  uiHooks: {
    onRequest: function (request: any, reply: any, next: any) {
      next()
    },
    preHandler: function (request: any, reply: any, next: any) {
      next()
    },
  },
  staticCSP: true,
  transformStaticCSP: (header: any) => header,
  transformSpecification: (swaggerObject: any, request: any, reply: any) => {
    return swaggerObject
  },
  transformSpecificationClone: true,
};

 