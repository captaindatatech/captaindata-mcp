import { FastifyRequest, FastifyReply } from 'fastify';
import { createErrorResponse, ERROR_CODES } from '../lib/error';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/health',     // Health check (alternative path)
  '/introspect', // Tool introspection
  '/docs',       // API documentation
  '/docs/json',  // OpenAPI spec
  '/openapi.json', // OpenAPI spec
  '/openapi.gpt.json', // GPT-compatible OpenAPI spec
  '/auth',       // Authentication endpoint
];

export async function securityMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  const sessionToken = (req.query as any)?.session_token;
  
  // Get the pathname from the URL (remove query parameters)
  const pathname = req.url.split('?')[0];
  
  // Check if the current route is public (doesn't require authentication)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // For public routes, no authentication required
  if (isPublicRoute) {
    return;
  }
  
  // For non-public routes, require either API key, Authorization header, or session_token query param
  if (!apiKey && !authHeader && !sessionToken) {
    const errorResponse = createErrorResponse(
      ERROR_CODES.MISSING_API_KEY,
      'Provide Captain Data key in x-api-key header, session token in Authorization header, or session_token query parameter',
      req.id,
      {
        suggestion: 'For MCP clients, ensure authentication is properly configured. For GPT clients, use session_token query parameter.',
        mcpNote: 'MCP protocol should automatically inject Authorization header with session token',
        gptNote: 'GPT clients should use session_token query parameter for authentication'
      }
    );
    return reply.status(401).send(errorResponse);
  }
  
  // Make API key available downstream if present
  if (apiKey) {
    req.headers['X-API-Key'] = apiKey as string;
  }
  
  // If session_token is provided via query parameter, convert it to Authorization header for downstream processing
  if (sessionToken && !authHeader) {
    req.headers['authorization'] = `Bearer ${sessionToken}`;
  }
} 