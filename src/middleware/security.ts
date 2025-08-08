import { FastifyRequest, FastifyReply } from 'fastify';
import { createErrorResponse, ERROR_CODES } from '../lib/error';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/health',     // Health check (alternative path)
  '/introspect', // Tool introspection
  '/docs',       // API documentation
  '/docs/json',  // OpenAPI spec
  '/openapi.json', // OpenAPI spec
  '/auth',       // Authentication endpoint
];

export async function securityMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  
  // Get the pathname from the URL (remove query parameters)
  const pathname = req.url.split('?')[0];
  
  // Check if the current route is public (doesn't require authentication)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // For public routes, no authentication required
  if (isPublicRoute) {
    return;
  }
  
  // For non-public routes, require either API key or Authorization header
  if (!apiKey && !authHeader) {
    const errorResponse = createErrorResponse(
      ERROR_CODES.MISSING_API_KEY,
      'Provide Captain Data key in x-api-key header or session token in Authorization header',
      req.id,
      {
        suggestion: 'For MCP clients, ensure authentication is properly configured',
        mcpNote: 'MCP protocol should automatically inject Authorization header with session token'
      }
    );
    return reply.status(401).send(errorResponse);
  }
  
  // Make API key available downstream if present
  if (apiKey) {
    req.headers['X-API-Key'] = apiKey as string;
  }
} 