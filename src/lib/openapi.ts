import { FastifySwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { TOOL_SCHEMAS } from './schemas';

export const swaggerOptions = {
  mode: 'dynamic' as const,
  openapi: {
    info: {
      title: 'Captain Data MCP API',
      description: 'Model Context Protocol (MCP) server for Captain Data integration',
      version: '1.0.0',
      contact: {
        name: 'Captain Data',
        url: 'https://captaindata.com'
      }
    },
    servers: [
      {
        url: 'https://mcp.captaindata.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Introspection', description: 'MCP introspection endpoints' },
      { name: 'Tools', description: 'Tool execution endpoints' }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey' as const,
          name: 'x-api-key',
          in: 'header' as const,
          description: 'Captain Data API key'
        }
      }
    }
  }
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      next();
    },
    preHandler: function (request, reply, next) {
      next();
    }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
};

// Generate OpenAPI paths from tool schemas
export function generateToolPaths() {
  const paths: any = {};
  
  Object.entries(TOOL_SCHEMAS).forEach(([alias, schema]) => {
    paths[`/tools/{alias}`] = {
      post: {
        tags: ['Tools'],
        summary: `Execute ${alias} tool`,
        description: schema.description,
        security: [{ apiKey: [] }],
        parameters: [
          {
            name: 'alias',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'Tool alias',
            example: alias
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: schema.parameters
            }
          }
        },
        responses: {
          '200': {
            description: 'Tool executed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Missing or invalid API key',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Tool not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };
  });
  
  return paths;
} 