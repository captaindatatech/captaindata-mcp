import fastify from 'fastify';
import dotenv from 'dotenv';
import { CaptainDataClient } from './src/clients/captainData';
import { ToolFactory } from './src/tools/toolFactory';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';

// Load environment variables
dotenv.config();

// Create Fastify instance
const server = fastify({
  logger: true
});

// Register CORS
server.register(fastifyCors, {
  origin: true, // Allow all origins for ChatGPT
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
});

// Register rate limiting
server.register(fastifyRateLimit, {
  max: 100, // Maximum 100 requests
  timeWindow: '1 minute' // Per minute
});

// Add security headers
server.addHook('onRequest', async (request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

// Initialize Captain Data client with default API key
const defaultClient = new CaptainDataClient({
  apiKey: process.env.CAPTAINDATA_API_KEY || ''
});

// Initialize tool factory
const toolFactory = new ToolFactory(defaultClient);

// OpenAPI specification endpoint
server.get('/openapi.json', async (req, reply) => {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Captain Data MCP API',
      version: '1.0.0',
      description: 'API for extracting data from LinkedIn profiles and companies',
      contact: {
        name: 'Captain Data Support',
        url: 'https://captaindata.com'
      },
      license: {
        name: 'Proprietary',
        identifier: 'Proprietary'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://captaindata-mcp.vercel.app'
          : 'http://localhost:3000',
        description: 'Captain Data MCP Server'
      }
    ],
    paths: {
      '/introspect': {
        get: {
          operationId: 'get_introspect',
          summary: 'List all available tools',
          description: 'Returns a list of all available tools with their parameters',
          responses: {
            '200': {
              description: 'List of available tools',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tools: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['id', 'name', 'description'],
                          properties: {
                            id: { 
                              type: 'string',
                              description: 'Unique identifier of the tool'
                            },
                            name: { 
                              type: 'string',
                              description: 'Display name of the tool'
                            },
                            description: { 
                              type: 'string',
                              description: 'Detailed description of what the tool does'
                            },
                            parameters: { 
                              type: 'object',
                              description: 'Parameters required by the tool'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/tools/linkedin_extract_company/run': {
        post: {
          operationId: 'linkedin_extract_company',
          summary: 'Extract LinkedIn company data',
          description: 'Extracts detailed information from a LinkedIn company page',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CompanyRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Company data successfully extracted',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CompanyResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request parameters',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized - Invalid API key',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/tools/linkedin_extract_people/run': {
        post: {
          operationId: 'linkedin_extract_profile',
          summary: 'Extract LinkedIn profile data',
          description: 'Extracts detailed information from a LinkedIn profile page',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProfileRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profile data successfully extracted',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ProfileResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request parameters',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized - Invalid API key',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      }
    },
    components: {
      schemas: {
        CompanyRequest: {
          type: 'object',
          required: ['linkedin_company_url'],
          properties: {
            linkedin_company_url: {
              type: 'string',
              description: 'URL of the LinkedIn company page',
              format: 'uri',
              pattern: '^https://www\\.linkedin\\.com/company/.*$'
            }
          }
        },
        CompanyResponse: {
          type: 'object',
          required: ['company_name'],
          properties: {
            company_name: {
              type: 'string',
              description: 'Name of the company'
            },
            description: {
              type: 'string',
              description: 'Company description'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Company website URL'
            },
            industry: {
              type: 'string',
              description: 'Company industry'
            },
            company_size: {
              type: 'string',
              description: 'Company size range'
            },
            headquarters: {
              type: 'string',
              description: 'Company headquarters location'
            },
            specialties: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Company specialties'
            }
          }
        },
        ProfileRequest: {
          type: 'object',
          required: ['linkedin_profile_url'],
          properties: {
            linkedin_profile_url: {
              type: 'string',
              description: 'URL of the LinkedIn profile',
              format: 'uri',
              pattern: '^https://www\\.linkedin\\.com/in/.*$'
            }
          }
        },
        ProfileResponse: {
          type: 'object',
          required: ['full_name'],
          properties: {
            full_name: {
              type: 'string',
              description: 'Full name of the person'
            },
            headline: {
              type: 'string',
              description: 'Professional headline'
            },
            location: {
              type: 'string',
              description: 'Location of the person'
            },
            current_position: {
              type: 'string',
              description: 'Current job position'
            },
            profile_image_url: {
              type: 'string',
              format: 'uri',
              description: 'URL of the profile picture'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            message: {
              type: 'string',
              description: 'Detailed error message'
            }
          }
        }
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication'
        }
      }
    }
  };
});

// Health check endpoint
server.get('/', async (req, reply) => {
  return { status: 'ok', message: 'Captain Data MCP API is running' };
});

// Introspect endpoint
server.get('/introspect', async (req, reply) => {
  const tools = toolFactory.getAllTools();
  return {
    tools: tools.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }))
  };
});

// Tool execution endpoint
server.post('/tools/:id/run', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tool = toolFactory.getTool(id);
  
  if (!tool) {
    return reply.status(404).send({ error: `Tool with ID '${id}' not found` });
  }
  
  try {
    const result = await tool.execute(req.body, req);
    return result;
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ 
      error: 'Tool execution failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const start = async () => {
    try {
      await server.listen({ port: 3000, host: '0.0.0.0' });
      const address = server.server.address();
      if (address && typeof address !== 'string') {
        console.log(`Server is running on port ${address.port}`);
      } else {
        console.log('Server is running');
      }
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };
  start();
}

// Export for Vercel serverless function
export default async function handler(req: any, res: any) {
  await server.ready();
  server.server.emit('request', req, res);
} 