import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { TOOL_SCHEMAS } from '../../src/lib/schemas';
import { ALIAS_TO_SLUG } from '../../src/lib/alias';
import { toCaptainData } from '../../src/lib/translate';
import { swaggerOptions, swaggerUiOptions } from '../../src/lib/openapi';
import { introspectSchema } from '../../src/api/introspect';

interface IntrospectQuery {
  v?: string;
}

interface ToolParams {
  alias: string;
}

export async function createTestServer() {
  const server = fastify();
  
  // Register CORS
  await server.register(require('@fastify/cors'), {
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-API-Key']
  });

  // Register OpenAPI documentation (only in development)
  if (process.env.NODE_ENV === 'development') {
    await server.register(fastifySwagger, swaggerOptions);
    await server.register(fastifySwaggerUi, swaggerUiOptions);
  }

  // Health check endpoint
  server.get('/', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Check if the API is running',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            message: { type: 'string', example: 'Captain Data MCP API is running' }
          }
        }
      }
    }
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    return { status: 'ok', message: 'Captain Data MCP API is running' };
  });

  // Introspect endpoint
  server.get('/introspect', {
    schema: introspectSchema
  }, async (req: FastifyRequest<{ Querystring: IntrospectQuery }>, reply: FastifyReply) => {
    const wantFull = req.query.v === "full";
    const aliases = wantFull ? Object.keys(TOOL_SCHEMAS) : Object.keys(TOOL_SCHEMAS).slice(0, 5);
    const tools = aliases.map(a => ({
      type: "function",
      function: { 
        name: a, 
        description: TOOL_SCHEMAS[a as keyof typeof TOOL_SCHEMAS].description, 
        parameters: TOOL_SCHEMAS[a as keyof typeof TOOL_SCHEMAS].parameters 
      }
    }));
    return reply.send({ tools });
  });

  // Middleware for API key validation
  server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.headers['x-api-key'];
    
    // Routes that don't require authentication
    const PUBLIC_ROUTES = [
      '/',           // Health check
      '/introspect', // Tool introspection
      '/docs',       // API documentation
      '/docs/json'   // OpenAPI spec
    ];
    
    // Get the pathname from the URL (remove query parameters)
    const pathname = request.url.split('?')[0];
    
    // Check if the current route is public (doesn't require authentication)
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
    
    // Require API key for non-public routes
    if (!key && !isPublicRoute) {
      return reply.status(401).send({
        code: 'missing_api_key',
        message: 'Provide Captain Data key in x-api-key header'
      });
    }
    
    // Make it available downstream
    if (key) {
      request.headers['X-API-Key'] = key as string;
    }
  });

  // Tool execution endpoint
  server.post('/tools/:alias', async (request: FastifyRequest<{ Params: ToolParams }>, reply: FastifyReply) => {
    const alias = request.params.alias;
    const slug = ALIAS_TO_SLUG[alias as keyof typeof ALIAS_TO_SLUG];
    if (!slug) {
      return reply.status(404).send({ code: "unknown_tool", message: `${alias} not supported` });
    }

    const key = request.headers['x-api-key'] as string;
    const body = request.body as any;
    
    // Server-side validation for searchCompanyEmployees
    if (alias === 'search_company_employees') {
      if (!body.sales_navigator_company_url && !body.linkedin_company_id) {
        return reply.status(400).send({ 
          code: "missing_input", 
          message: "Must provide either a company URL or ID" 
        });
      }
    }
    
    const cdBody = toCaptainData(alias as keyof typeof ALIAS_TO_SLUG, body);

    const cdRes = await fetch(`${process.env.CD_API_BASE}/v4/actions/${slug}/run/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify(cdBody)
    });

    const responseData = await cdRes.json();
    return reply.status(cdRes.status).send(responseData);
  });
  
  await server.ready();
  return server;
} 