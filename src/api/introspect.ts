import { FastifyRequest, FastifyReply } from 'fastify';
import { TOOL_SCHEMAS } from "../lib/schemas";

interface IntrospectQuery {
  v?: string;
}

export default async function handler(req: FastifyRequest<{ Querystring: IntrospectQuery }>, reply: FastifyReply) {
  try {
    const wantFull = req.query.v === "full";
    const aliases = wantFull ? Object.keys(TOOL_SCHEMAS) : Object.keys(TOOL_SCHEMAS).slice(0, 5);
    
    const tools = aliases.map(a => {
      const schema = TOOL_SCHEMAS[a as keyof typeof TOOL_SCHEMAS];
      return {
        type: "function",
        function: { 
          name: a, 
          description: schema.description, 
          parameters: schema.parameters 
        }
      };
    });
    
    return reply.send({ tools });
  } catch (error) {
    console.error('Error in introspect handler:', error);
    return reply.status(500).send({
      code: 'introspect_error',
      message: 'Failed to generate tool introspection'
    });
  }
}

// Schema for OpenAPI documentation
export const introspectSchema = {
  tags: ['Introspection'],
  summary: 'List available tools',
  description: 'Get metadata about available tools (MCP introspection)',
  querystring: {
    type: 'object',
    properties: {
      v: {
        type: 'string',
        description: 'Version parameter. Use "full" to get all tools',
        enum: ['full']
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'function' },
              function: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  parameters: { 
                    type: 'object',
                    additionalProperties: true
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}; 