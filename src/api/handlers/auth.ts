import { FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { createErrorResponse, ERROR_CODES } from '../../lib/error';
import { config } from '../../lib/config';
import { storeSessionToken } from '../../lib/auth';

// Initialize Redis client (only if URL is provided)
const redis = config.redisUrl ? new Redis(config.redisUrl) : null;

interface AuthRequestBody {
  api_key: string;
}

export default async function handler(req: FastifyRequest<{ Body: AuthRequestBody }>, reply: FastifyReply) {
  const startTime = Date.now();
  const requestId = req.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  

  
  try {
    const { api_key } = req.body;
    
    if (!api_key || api_key.trim() === '') {
      return reply.status(400).send(
        createErrorResponse(
          ERROR_CODES.MISSING_INPUT,
          'Missing Captain Data API key',
          requestId
        )
      );
    }

    // Optionally validate the API key by making a test request to Captain Data
    // Skip validation in test environment
    if (config.nodeEnv !== 'test') {
      try {
        const testResponse = await fetch(`${config.cdApiBase}/v4/workspaces`, {
          method: 'GET',
          headers: {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
          }
        });

        if (!testResponse.ok) {
          return reply.status(401).send(
            createErrorResponse(
              ERROR_CODES.INVALID_API_KEY,
              'Invalid Captain Data API key',
              requestId
            )
          );
        }
      } catch (validationError) {
        req.log.warn({
          requestId,
          error: validationError instanceof Error ? validationError.message : 'Unknown error',
          message: 'API key validation failed, but proceeding with token generation'
        });
        // Continue with token generation even if validation fails
        // This allows for offline development and testing
      }
    }

    // Generate a unique session token
    const token = randomUUID();
    
    // Store the API key in Redis with 24-hour expiration, or in-memory store if Redis is not available
    if (redis) {
      try {
        await redis.setex(`session:${token}`, 86400, api_key);
      } catch (redisError) {
        // If Redis fails, fall back to in-memory store
        storeSessionToken(token, api_key, 86400);
      }
    } else {
      // Use in-memory store when Redis is not available
      storeSessionToken(token, api_key, 86400);
    }

    req.log.info({
      requestId,
      tokenGenerated: !!token,
      message: 'Session token generated successfully'
    });

    const response = {
      session_token: token,
      expires_in: 86400, // 24 hours in seconds
      _metadata: {
        requestId,
        executionTime: Date.now() - startTime
      }
    };

    reply.header('Content-Type', 'application/json');
    return reply.status(200).send(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    req.log.error({
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      executionTime,
      message: 'Authentication failed'
    });

    return reply.status(500).send(
      createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'An unexpected error occurred during authentication',
        requestId
      )
    );
  }
} 