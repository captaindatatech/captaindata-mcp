import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  mode: 'dynamic',
  hideUntagged: false,
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'Captain Data MCP API',
      description: 'MCP API for managing Captain Data actions.',
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
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'Direct Captain Data API key for authentication'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Session token obtained from /auth endpoint'
        }
      }
    },
    security: [
      { bearerAuth: [] },
      { apiKey: [] }
    ]
  }
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      next()
    },
    preHandler: function (request, reply, next) {
      next()
    },
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject) => {
    return swaggerObject
  },
  transformSpecificationClone: true,
};
