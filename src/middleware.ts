import { FastifyRequest, FastifyReply } from 'fastify';
import { createErrorResponse, ERROR_CODES } from './lib/error';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/health',     // Health check (alternative path)
  '/introspect', // Tool introspection
  '/docs',       // API documentation
  '/docs/json',  // OpenAPI spec
  '/test',       // Test endpoint
  '/test-post'   // Test POST endpoint
];

export default async function mw(req: FastifyRequest, reply: FastifyReply) {
  const key = req.headers['x-api-key'];
  
  // Get the pathname from the URL (remove query parameters)
  const pathname = req.url.split('?')[0];
  
  // Check if the current route is public (doesn't require authentication)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Require API key for non-public routes
  if (!key && !isPublicRoute) {
    return reply.status(401).send(
      createErrorResponse(
        ERROR_CODES.MISSING_API_KEY,
        'Provide Captain Data key in x-api-key header',
        req.id
      )
    );
  }
  
  // Make it available downstream
  if (key) {
    req.headers['X-API-Key'] = key as string;
  }
  
  // Continue to the next handler (no explicit return needed)
} 