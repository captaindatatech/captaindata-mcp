import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import introspectHandler from './handlers/introspect';
import toolHandler from './handlers/tools';
import authHandler from './handlers/auth';
import healthHandler from './handlers/health';
import { introspectSchema, authSchema, healthSchema } from './schemas';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TOOL_SCHEMAS, RESPONSE_SCHEMAS, ERROR_RESPONSES, ToolAlias } from '../types';
import { logError } from '../middleware';
import { logger } from '../lib/logger';

// Create a routes-specific logger
const routesLogger = logger.child({ component: 'routes' });

// Cache the OpenAPI spec at module load time for better serverless performance
let cachedOpenApiSpec: unknown = null;
let openApiSpecError: string | null = null;

// Cache the GPT-compatible OpenAPI spec at module load time
let cachedGptOpenApiSpec: unknown = null;
let gptOpenApiSpecError: string | null = null;

try {
  const openapiPath = join(process.cwd(), 'openapi.json');
  const openapiContent = readFileSync(openapiPath, 'utf8');
  cachedOpenApiSpec = JSON.parse(openapiContent);
} catch (error) {
  openApiSpecError = error instanceof Error ? error.message : 'Unknown error';
  routesLogger.error('Failed to load OpenAPI specification at startup', error);
}

try {
  const gptOpenapiPath = join(process.cwd(), 'openapi.gpt.json');
  const gptOpenapiContent = readFileSync(gptOpenapiPath, 'utf8');
  cachedGptOpenApiSpec = JSON.parse(gptOpenapiContent);
} catch (error) {
  gptOpenApiSpecError = error instanceof Error ? error.message : 'Unknown error';
  routesLogger.error('Failed to load GPT-compatible OpenAPI specification at startup', error);
}

async function routes(app: FastifyInstance) {
  // Health check endpoint
  app.get(
    '/health',
    {
      schema: healthSchema,
    },
    healthHandler
  );

  // OpenAPI specification endpoint
  app.get('/openapi.json', async (request, reply) => {
    if (openApiSpecError) {
      logError('OpenAPI specification not available', new Error(openApiSpecError), request, {
        endpoint: 'openapi',
      });
      return reply.status(500).send({
        error: 'OpenAPI specification not available',
        message: 'Internal server error',
      });
    }

    reply.header('Content-Type', 'application/json');
    return cachedOpenApiSpec;
  });

  // GPT-compatible OpenAPI specification endpoint
  app.get('/openapi.gpt.json', async (request, reply) => {
    if (gptOpenApiSpecError) {
      logError(
        'GPT-compatible OpenAPI specification not available',
        new Error(gptOpenApiSpecError),
        request,
        {
          endpoint: 'openapi.gpt',
        }
      );
      return reply.status(500).send({
        error: 'GPT-compatible OpenAPI specification not available',
        message: 'Internal server error',
      });
    }

    reply.header('Content-Type', 'application/json');
    return cachedGptOpenApiSpec;
  });

  // Authentication endpoint
  app.post(
    '/auth',
    {
      schema: authSchema,
    },
    authHandler
  );

  // Introspect endpoint
  app.get(
    '/introspect',
    {
      schema: introspectSchema,
    },
    introspectHandler
  );

  // Dynamic tool endpoints for ChatGPT Actions
  Object.keys(TOOL_SCHEMAS).forEach((toolAlias) => {
    const alias = toolAlias as ToolAlias;
    const schema = TOOL_SCHEMAS[alias];

    // Register specific endpoint for each tool with dynamic schema
    app.post(
      `/tools/${alias}`,
      {
        schema: {
          operationId: alias.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
          summary: `Execute ${alias} tool`,
          tags: ['Tools'],
          description: schema.description,
          body: schema.parameters,
          response: {
            200: RESPONSE_SCHEMAS[alias],
            400: ERROR_RESPONSES[400],
            401: ERROR_RESPONSES[401],
            404: ERROR_RESPONSES[404],
            500: ERROR_RESPONSES[500],
          },
        },
      },
      async (request, reply) => {
        // Create a properly typed request object for the tool handler
        const typedRequest = {
          ...request,
          params: { alias },
          headers: request.headers,
        } as Parameters<typeof toolHandler>[0];
        return toolHandler(typedRequest, reply);
      }
    );
  });
}

export const registerRoutes = fp(routes);
