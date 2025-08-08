import Redis from 'ioredis';
import { createErrorResponse, ERROR_CODES } from './error';
import { config } from './config';

// Initialize Redis client (only if URL is provided)
const redis = config.redisUrl ? new Redis(config.redisUrl) : null;

// In-memory storage for testing when Redis is not available
const inMemoryStore = new Map<string, { apiKey: string; expiresAt: number }>();

/**
 * Store a session token in memory (for testing when Redis is not available)
 */
export function storeSessionToken(token: string, apiKey: string, expiresIn: number = 86400): void {
  const expiresAt = Date.now() + (expiresIn * 1000);
  inMemoryStore.set(token, { apiKey, expiresAt });
}

/**
 * Get a session token from memory (for testing when Redis is not available)
 */
export function getSessionToken(token: string): string | null {
  const session = inMemoryStore.get(token);
  if (!session) {
    return null;
  }
  
  // Check if token has expired
  if (Date.now() > session.expiresAt) {
    inMemoryStore.delete(token);
    return null;
  }
  
  return session.apiKey;
}

/**
 * Extract the Captain Data API key from the request
 * Supports both direct API key (X-API-Key header) and session tokens (Authorization header)
 */
export async function extractApiKey(headers: Record<string, string | string[] | undefined>): Promise<string> {
  // First, try to get the API key directly from X-API-Key header
  const directApiKey = headers['x-api-key'];
  if (directApiKey && typeof directApiKey === 'string') {
    return directApiKey;
  }

  // If no direct API key, try to get it from the session token
  const authHeader = headers['authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    throw new Error('Missing authentication: either X-API-Key header or Authorization header required');
  }

  // Extract token from Authorization header (Bearer token)
  if (!authHeader.match(/^Bearer\s+/i)) {
    throw new Error('Invalid Authorization header format: expected "Bearer <token>"');
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    throw new Error('Invalid Authorization header format: expected "Bearer <token>"');
  }

  // Look up the API key in Redis storage or in-memory store
  if (redis) {
    try {
      const apiKey = await redis.get(`session:${token}`);
      if (!apiKey) {
        throw new Error('Invalid or expired session token');
      }
      return apiKey;
    } catch (redisError) {
      // If Redis fails, fall back to in-memory store
      const apiKey = getSessionToken(token);
      if (!apiKey) {
        throw new Error('Invalid or expired session token');
      }
      return apiKey;
    }
  } else {
    // Use in-memory store when Redis is not available
    const apiKey = getSessionToken(token);
    if (!apiKey) {
      throw new Error('Invalid or expired session token');
    }
    return apiKey;
  }
}

/**
 * Create an error response for authentication failures
 */
export function createAuthErrorResponse(error: Error, requestId: string) {
  if (error.message.includes('Missing authentication')) {
    return createErrorResponse(
      ERROR_CODES.MISSING_API_KEY,
      'Provide Captain Data key in x-api-key header or session token in Authorization header',
      requestId
    );
  }

  if (error.message.includes('Invalid Authorization header')) {
    return createErrorResponse(
      ERROR_CODES.INVALID_API_KEY,
      'Invalid Authorization header format: expected "Bearer <token>"',
      requestId
    );
  }

  if (error.message.includes('Invalid or expired session token')) {
    return createErrorResponse(
      ERROR_CODES.INVALID_API_KEY,
      'Invalid or expired session token. Please re-authenticate using /auth endpoint',
      requestId
    );
  }

  if (error.message.includes('Redis not configured')) {
    return createErrorResponse(
      ERROR_CODES.INVALID_API_KEY,
      'Session tokens not available. Please use X-API-Key header for authentication',
      requestId
    );
  }

  return createErrorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    'Authentication error',
    requestId
  );
} 