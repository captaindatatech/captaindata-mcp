export interface ErrorResponse {
  code: string;
  message: string;
  requestId?: string;
  timestamp?: string;
  details?: any;
}

export function createErrorResponse(
  code: string, 
  message: string, 
  requestId?: string, 
  details?: any
): ErrorResponse {
  return {
    code,
    message,
    requestId,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };
}

export function json(msg: string, code: string = "mcp_error", status: number = 500) {
  return new Response(JSON.stringify({code, message: msg}), {
    status, 
    headers: {'Content-Type': 'application/json'}
  });
}

// Common error codes
export const ERROR_CODES = {
  MISSING_API_KEY: 'missing_api_key',
  INVALID_API_KEY: 'invalid_api_key',
  UNKNOWN_TOOL: 'unknown_tool',
  MISSING_INPUT: 'missing_input',
  INVALID_INPUT: 'invalid_input',
  TIMEOUT: 'timeout',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  INVALID_RESPONSE: 'invalid_response',
  INTERNAL_ERROR: 'internal_error',
  RATE_LIMITED: 'rate_limited'
} as const; 