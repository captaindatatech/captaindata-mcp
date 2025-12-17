import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { createErrorResponse, ERROR_CODES, AuthRequest, AuthResponse } from '../../types';
import { config } from '../../lib/config';
import { storeSessionToken } from '../../lib/auth';
import { logError, logInfo } from '../../middleware';
import { logger } from '../../lib/logger';

// Create an auth handler-specific logger
const authLogger = logger.child({ component: 'auth-handler' });

export default async function handler(
  req: FastifyRequest<{ Body: AuthRequest }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const startTime = Date.now();
  const requestId = req.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { api_key } = req.body;

    if (!api_key || api_key.trim() === '') {
      return reply
        .status(400)
        .send(
          createErrorResponse(ERROR_CODES.MISSING_INPUT, 'Missing Captain Data API key', requestId)
        );
    }

    // Optionally validate the API key by making a test request to Captain Data
    // Skip validation in test environment
    if (config.nodeEnv !== 'test') {
      try {
        const testResponse = await fetch(`${config.cdApiBase}/v1/quotas`, {
          method: 'GET',
          headers: {
            'X-API-Key': api_key,
            'Content-Type': 'application/json',
          },
        });

        if (!testResponse.ok) {
          return reply
            .status(401)
            .send(
              createErrorResponse(
                ERROR_CODES.INVALID_API_KEY,
                'Invalid Captain Data API key',
                requestId
              )
            );
        }
      } catch (validationError) {
        // Log warning but continue with token generation
        // This allows for offline development and testing
        authLogger.warn('API key validation failed, proceeding with token generation', {
          requestId,
          error: validationError instanceof Error ? validationError.message : 'Unknown error',
        });
      }
    }

    // Generate a unique session token
    const token = randomUUID();

    // Store the API key in Redis with 24-hour expiration, or in-memory store if Redis is not available
    await storeSessionToken(token, api_key, 86400);

    logInfo('Session token generated successfully', req, {
      endpoint: 'auth',
      tokenGenerated: !!token,
    });

    const response: AuthResponse = {
      session_token: token,
      expires_in: 86400, // 24 hours in seconds
      _metadata: {
        requestId,
        executionTime: Date.now() - startTime,
      },
    };

    reply.header('Content-Type', 'application/json');
    return reply.status(200).send(response);
  } catch (error) {
    logError('Authentication failed', error, req, {
      endpoint: 'auth',
    });

    return reply
      .status(500)
      .send(
        createErrorResponse(
          ERROR_CODES.INTERNAL_ERROR,
          'An unexpected error occurred during authentication',
          requestId
        )
      );
  }
}
