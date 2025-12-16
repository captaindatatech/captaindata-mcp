import { Type, Static } from '@sinclair/typebox';

// ============================================================================
// METADATA SCHEMAS
// ============================================================================

/**
 * Standard metadata included in all API responses
 */
export const MetadataSchema = Type.Object({
  requestId: Type.String({ description: 'Unique request identifier for tracking' }),
  executionTime: Type.Number({ description: 'Request execution time in milliseconds' })
});

export type Metadata = Static<typeof MetadataSchema>;

/**
 * Extended metadata for tool responses
 */
export const ToolMetadataSchema = Type.Object({
  requestId: Type.String({ description: 'Unique request identifier for tracking' }),
  executionTime: Type.Number({ description: 'Request execution time in milliseconds' }),
  tool: Type.String({ description: 'Tool alias that was executed' }),
  count: Type.Optional(Type.Number({ description: 'Number of items returned (for array responses)' }))
});

export type ToolMetadata = Static<typeof ToolMetadataSchema>;

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

/**
 * Error scopes for categorizing errors
 */
export const ErrorScopeSchema = Type.Union([
  Type.Literal('input'),
  Type.Literal('integ'),
  Type.Literal('param'),
  Type.Literal('config'),
  Type.Null()
]);

export type ErrorScope = Static<typeof ErrorScopeSchema>;

/**
 * Unified error response schema for all API endpoints
 */
export const ErrorResponseSchema = Type.Object({
  code: Type.String({ description: 'Error code for programmatic handling' }),
  message: Type.String({ description: 'Human-readable error message' }),
  requestId: Type.Optional(Type.String({ description: 'Request ID for tracking' })),
  timestamp: Type.Optional(Type.String({ format: 'date-time', description: 'Error timestamp' })),
  details: Type.Optional(Type.Any({ description: 'Additional error details' })),
  // Captain Data specific error fields
  error_label: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  error_scope: Type.Optional(ErrorScopeSchema),
  error_ref: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  status_code: Type.Optional(Type.Union([Type.Integer(), Type.Null()])),
  params: Type.Optional(Type.Union([
    Type.Record(Type.String(), Type.String()),
    Type.Null()
  ]))
});

export type ErrorResponse = Static<typeof ErrorResponseSchema>;

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

/**
 * Pagination input parameters
 */
export const PaginationInputSchema = Type.Object({
  page: Type.Optional(Type.Integer({ 
    minimum: 1, 
    default: 1,
    description: 'Page number for paginated results' 
  })),
  page_size: Type.Optional(Type.Integer({ 
    minimum: 1, 
    maximum: 100, 
    default: 25,
    description: 'Number of results per page' 
  }))
});

export type PaginationInput = Static<typeof PaginationInputSchema>;

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Common error codes used across the API
 */
export const ERROR_CODES = {
  MISSING_API_KEY: 'missing_api_key',
  INVALID_API_KEY: 'invalid_api_key',
  MCP_AUTH_ERROR: 'mcp_auth_error',
  SESSION_TOKEN_EXPIRED: 'session_token_expired',
  UNKNOWN_TOOL: 'unknown_tool',
  MISSING_INPUT: 'missing_input',
  INVALID_INPUT: 'invalid_input',
  TIMEOUT: 'timeout',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  INVALID_RESPONSE: 'invalid_response',
  INTERNAL_ERROR: 'internal_error',
  RATE_LIMITED: 'rate_limited'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a standardized error response object
 */
export function createErrorResponse(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): ErrorResponse {
  const response: ErrorResponse = {
    code,
    message,
    requestId,
    timestamp: new Date().toISOString()
  };
  
  if (details !== undefined) {
    response.details = details;
  }
  
  return response;
}

/**
 * Creates a Response object for error responses (legacy support)
 */
export function jsonErrorResponse(msg: string, code: string = "mcp_error", status: number = 500) {
  return new Response(JSON.stringify({ code, message: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

