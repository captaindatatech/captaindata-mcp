import { FastifyRequest, FastifyReply } from 'fastify';
import { TOOL_SCHEMAS, IntrospectQuery, IntrospectResponse, ToolDefinition } from '../../types';
import { logError } from '../../middleware';

export default async function handler(
  req: FastifyRequest<{ Querystring: IntrospectQuery }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const wantFull = req.query.v === 'full';
    const aliases = wantFull 
      ? Object.keys(TOOL_SCHEMAS) 
      : Object.keys(TOOL_SCHEMAS).slice(0, 5);
    
    const tools: ToolDefinition[] = aliases.map(alias => {
      const schema = TOOL_SCHEMAS[alias as keyof typeof TOOL_SCHEMAS];
      return {
        type: 'function',
        function: { 
          name: alias, 
          description: schema.description, 
          parameters: schema.parameters 
        }
      };
    });
    
    const response: IntrospectResponse = { tools };
    
    return reply.send(response);
  } catch (error) {
    logError('Failed to generate tool introspection', error, req, {
      endpoint: 'introspect'
    });
    return reply.status(500).send({
      code: 'introspect_error',
      message: 'Failed to generate tool introspection'
    });
  }
}
