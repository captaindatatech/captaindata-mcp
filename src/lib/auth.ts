import { createErrorResponse, ERROR_CODES, SessionData } from '../types';
import { redisService } from './redis';
import { logger } from './logger';

// Create an auth-specific logger
const authLogger = logger.child({ component: 'auth' });

// In-memory storage for testing when Redis is not available
const inMemoryStore = new Map<string, SessionData>();

// Cleanup expired tokens every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_STORE_SIZE = 1000; // Prevent unlimited growth

// Start cleanup interval - unref() so it doesn't prevent process exit
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [token, session] of inMemoryStore.entries()) {
    if (now > session.expiresAt) {
      inMemoryStore.delete(token);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    authLogger.info('Cleaned up expired session tokens from memory', { cleanedCount });
  }
  
  // If store is getting too large, remove oldest entries
  if (inMemoryStore.size > MAX_STORE_SIZE) {
    const entries = Array.from(inMemoryStore.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    const toRemove = entries.slice(0, Math.floor(MAX_STORE_SIZE * 0.2)); // Remove 20% of oldest
    toRemove.forEach(([token]) => inMemoryStore.delete(token));
    
    authLogger.info('Removed old session tokens to prevent memory overflow', { removedCount: toRemove.length });
  }
}, CLEANUP_INTERVAL);

// Allow process to exit even if timer is active
cleanupTimer.unref();

/**
 * Safely execute a Redis operation with fallback to in-memory storage
 */
async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (!redisService.isAvailable()) {
    return fallback();
  }

  try {
    return await operation();
  } catch (error) {
    authLogger.warn('Redis operation failed, falling back to in-memory storage', {
      error: error instanceof Error ? error.message : 'Unknown error',
      storeSize: inMemoryStore.size,
    });
    return fallback();
  }
}

/**
 * Store a session token in Redis or memory
 */
export async function storeSessionToken(token: string, apiKey: string, expiresIn: number = 86400): Promise<void> {
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  await safeRedisOperation(
    async () => {
      await redisService.set(`session:${token}`, apiKey, expiresIn);
    },
    () => {
      // Check if we're approaching the limit
      if (inMemoryStore.size >= MAX_STORE_SIZE) {
        authLogger.warn('In-memory session store is full, removing oldest entries', { storeSize: inMemoryStore.size });
        const entries = Array.from(inMemoryStore.entries());
        entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
        const toRemove = entries.slice(0, Math.floor(MAX_STORE_SIZE * 0.1)); // Remove 10%
        toRemove.forEach(([token]) => inMemoryStore.delete(token));
      }
      
      inMemoryStore.set(token, { apiKey, expiresAt });
    }
  );
}

/**
 * Get a session token from Redis or memory
 */
export async function getSessionToken(token: string): Promise<string | null> {
  return await safeRedisOperation(
    async () => {
      return await redisService.get(`session:${token}`);
    },
    () => {
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
  );
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
    // Enhanced error message for debugging MCP issues
    const availableHeaders = Object.keys(headers).filter(key => 
      key.toLowerCase().includes('auth') || 
      key.toLowerCase().includes('api') || 
      key.toLowerCase().includes('key')
    );
    
    throw new Error(`Missing authentication: either X-API-Key header or Authorization header required. Available auth-related headers: ${availableHeaders.join(', ') || 'none'}`);
  }

  // Extract token from Authorization header (Bearer token)
  if (!authHeader.match(/^Bearer\s+/i)) {
    // Enhanced error message for debugging MCP protocol issues
    const headerValue = authHeader.length > 50 ? authHeader.substring(0, 50) + '...' : authHeader;
    throw new Error(`Invalid Authorization header format: expected "Bearer <token>" but got "${headerValue}"`);
  }
  
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    throw new Error('Invalid Authorization header format: expected "Bearer <token>" but token is empty');
  }

  // Look up the API key in Redis storage or in-memory store
  if (redisService.isAvailable()) {
    try {
      const apiKey = await redisService.get(`session:${token}`);
      if (!apiKey) {
        throw new Error(`Invalid or expired session token: ${token.substring(0, 8)}...`);
      }
      return apiKey;
    } catch (redisError) {
      // If Redis fails, fall back to in-memory store
      const apiKey = await getSessionToken(token);
      if (!apiKey) {
        throw new Error(`Invalid or expired session token: ${token.substring(0, 8)}...`);
      }
      return apiKey;
    }
  } else {
    // Use in-memory store when Redis is not available
    const apiKey = await getSessionToken(token);
    if (!apiKey) {
      throw new Error(`Invalid or expired session token: ${token.substring(0, 8)}...`);
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
      ERROR_CODES.MCP_AUTH_ERROR,
      error.message,
      requestId,
      {
        suggestion: 'For MCP clients, ensure the session token is properly stored and the Authorization header is being sent',
        availableMethods: ['X-API-Key header', 'Authorization: Bearer <session_token>'],
        mcpNote: 'MCP protocol should automatically inject Authorization header with session token'
      }
    );
  }

  if (error.message.includes('Invalid Authorization header')) {
    return createErrorResponse(
      ERROR_CODES.MCP_AUTH_ERROR,
      error.message,
      requestId,
      {
        suggestion: 'Check that the MCP client is properly formatting the Authorization header',
        expectedFormat: 'Authorization: Bearer <session_token>',
        mcpNote: 'This may indicate an MCP protocol implementation issue'
      }
    );
  }

  if (error.message.includes('Invalid or expired session token')) {
    return createErrorResponse(
      ERROR_CODES.SESSION_TOKEN_EXPIRED,
      error.message,
      requestId,
      {
        suggestion: 'Re-authenticate to get a fresh session token',
        tokenInfo: error.message.includes('...') ? 'Token preview shown in error' : 'No token preview available'
      }
    );
  }

  if (error.message.includes('Redis not configured')) {
    return createErrorResponse(
      ERROR_CODES.INVALID_API_KEY,
      'Session tokens not available. Please use X-API-Key header for authentication',
      requestId,
      {
        suggestion: 'Use X-API-Key header instead of session tokens',
        reason: 'Redis is not configured for session storage'
      }
    );
  }

  return createErrorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    'Authentication error',
    requestId,
    {
      originalError: error.message,
      suggestion: 'Check authentication configuration and try again'
    }
  );
}
