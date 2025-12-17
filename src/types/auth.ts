import { Type, Static } from '@sinclair/typebox';
import { MetadataSchema } from './common';

// ============================================================================
// AUTH REQUEST SCHEMAS
// ============================================================================

/**
 * Authentication request body schema
 */
export const AuthRequestSchema = Type.Object({
  api_key: Type.String({
    description: 'Your Captain Data API key',
    minLength: 1,
  }),
});

export type AuthRequest = Static<typeof AuthRequestSchema>;

// ============================================================================
// AUTH RESPONSE SCHEMAS
// ============================================================================

/**
 * Successful authentication response schema
 */
export const AuthResponseSchema = Type.Object({
  session_token: Type.String({
    description: 'Session token to use in Authorization header for subsequent requests',
  }),
  expires_in: Type.Number({
    description: 'Token expiration time in seconds',
    default: 86400,
  }),
  _metadata: MetadataSchema,
});

export type AuthResponse = Static<typeof AuthResponseSchema>;

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

/**
 * Session data stored in Redis or in-memory
 */
export const SessionDataSchema = Type.Object({
  apiKey: Type.String({ description: 'The Captain Data API key associated with this session' }),
  expiresAt: Type.Number({ description: 'Timestamp when the session expires (milliseconds)' }),
});

export type SessionData = Static<typeof SessionDataSchema>;

// ============================================================================
// FASTIFY ROUTE SCHEMAS
// ============================================================================

/**
 * Complete auth endpoint schema for Fastify
 */
export const authRouteSchema = {
  operationId: 'authenticate',
  summary: 'Authenticate with your Captain Data API key',
  tags: ['Authentication'],
  description:
    'Exchange your Captain Data API key for a session token that can be used for subsequent requests',
  body: AuthRequestSchema,
  response: {
    200: AuthResponseSchema,
  },
};
