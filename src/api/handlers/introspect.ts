import { FastifyRequest, FastifyReply } from 'fastify';
import { TOOL_SCHEMAS } from "../../lib/schemas";
import { logError } from "../../middleware";

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
    logError('Failed to generate tool introspection', error, req, {
      endpoint: 'introspect'
    });
    return reply.status(500).send({
      code: 'introspect_error',
      message: 'Failed to generate tool introspection'
    });
  }
} 