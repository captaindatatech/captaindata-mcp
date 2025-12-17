import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ALIAS_TO_PATH,
  ToolAlias,
  ToolParams,
  createErrorResponse,
  ERROR_CODES,
} from '../../types';
import { toQueryParams } from '../../lib/translate';
import { config } from '../../lib/config';
import { extractApiKey, createAuthErrorResponse } from '../../lib/auth';
import { logError, logInfo } from '../../middleware';

// Configuration for timeouts and retries
const API_TIMEOUT = config.apiTimeout;
const MAX_RETRIES = config.maxRetries;
const RETRY_DELAY = config.retryDelay;

// Pagination headers to relay from upstream API
const PAGINATION_HEADERS = ['x-pagination-previous', 'x-pagination-next'];

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to make API call with timeout and retry logic
async function makeCaptainDataRequest(
  url: string,
  options: RequestInit,
  retries = 0
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    // Handle network errors with retry logic
    if (
      retries < MAX_RETRIES &&
      (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch')))
    ) {
      await delay(RETRY_DELAY * (retries + 1));
      return makeCaptainDataRequest(url, options, retries + 1);
    }

    throw error;
  }
}

export default async function handler(
  req: FastifyRequest<{ Params: ToolParams }>,
  reply: FastifyReply
): Promise<FastifyReply | void> {
  const startTime = Date.now();
  const requestId = req.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Declare variables outside try block for access in catch
  let alias: ToolAlias | undefined;
  let body: Record<string, unknown> = {};

  try {
    alias = req.params.alias as ToolAlias;

    const pathTemplate = ALIAS_TO_PATH[alias];

    if (!pathTemplate) {
      return reply
        .status(404)
        .send(
          createErrorResponse(ERROR_CODES.UNKNOWN_TOOL, `Tool '${alias}' not supported`, requestId)
        );
    }

    body = (req.body as Record<string, unknown>) || {};

    // Extract API key from either direct header or session token
    let key: string;
    try {
      key = await extractApiKey(req.headers);
    } catch (authError) {
      logError('API key extraction failed', authError, req, {
        endpoint: 'tools',
        tool: alias,
        hasXApiKey: !!req.headers['x-api-key'],
        hasAuthHeader: !!req.headers['authorization'],
      });

      return reply.status(401).send(createAuthErrorResponse(authError as Error, requestId));
    }

    // Server-side validation for search_company_employees
    if (alias === 'search_company_employees') {
      if (!body.company_uid) {
        return reply
          .status(400)
          .send(
            createErrorResponse(ERROR_CODES.MISSING_INPUT, 'Must provide company_uid', requestId)
          );
      }
    }

    // Translate to path and query params
    const { path, queryParams } = toQueryParams(alias, body);

    // Build URL with query string
    const queryString = new URLSearchParams(queryParams).toString();
    const apiUrl = `${config.cdApiBase}/v1${path}${queryString ? '?' + queryString : ''}`;

    // Log the request (without sensitive data)
    logInfo('Executing Captain Data tool', req, {
      endpoint: 'tools',
      tool: alias,
      path,
      hasApiKey: !!key,
      bodyKeys: Object.keys(body),
      queryParams,
      apiUrl,
    });

    const cdRes = await makeCaptainDataRequest(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': key,
      },
    });

    // Parse response safely
    let responseData: unknown;
    try {
      responseData = await cdRes.json();

      logInfo('Parsed response data', req, {
        endpoint: 'tools',
        tool: alias,
        responseDataKeys: Array.isArray(responseData)
          ? ['array']
          : Object.keys(responseData as object),
        responseDataLength: Array.isArray(responseData) ? responseData.length : undefined,
      });
    } catch (parseError) {
      logError('Failed to parse Captain Data response', parseError, req, {
        endpoint: 'tools',
        tool: alias,
      });
      return reply
        .status(500)
        .send(
          createErrorResponse(
            ERROR_CODES.INVALID_RESPONSE,
            'Invalid response from Captain Data API',
            requestId
          )
        );
    }

    // Check if it's an error response from Captain Data
    if (!cdRes.ok) {
      // Return error response as-is without metadata
      reply.header('Content-Type', 'application/json');
      reply.raw.writeHead(cdRes.status, { 'Content-Type': 'application/json' });
      reply.raw.end(JSON.stringify(responseData));
      return;
    }

    // Relay pagination headers from upstream API
    for (const headerName of PAGINATION_HEADERS) {
      const headerValue = cdRes.headers.get(headerName);
      if (headerValue) {
        reply.header(headerName, headerValue);
      }
    }

    // Add request metadata to successful responses only
    const finalResponse = Array.isArray(responseData)
      ? {
          data: responseData,
          _metadata: {
            requestId,
            executionTime: Date.now() - startTime,
            tool: alias,
            count: responseData.length,
          },
        }
      : {
          ...(responseData as object),
          _metadata: {
            requestId,
            executionTime: Date.now() - startTime,
            tool: alias,
          },
        };

    // Log response details for debugging
    logInfo('Tool execution completed', req, {
      endpoint: 'tools',
      tool: alias,
      status: cdRes.status,
      responseDataType: typeof responseData,
      isArray: Array.isArray(responseData),
      finalResponseKeys: Object.keys(finalResponse),
    });

    reply.header('Content-Type', 'application/json');
    reply.raw.writeHead(cdRes.status, { 'Content-Type': 'application/json' });
    reply.raw.end(JSON.stringify(finalResponse));
    return;
  } catch (error) {
    logError('Tool execution failed', error, req, {
      endpoint: 'tools',
      tool: alias || 'unknown',
      requestBody: body || {},
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        return reply
          .status(408)
          .send(
            createErrorResponse(
              ERROR_CODES.TIMEOUT,
              'Request to Captain Data API timed out',
              requestId
            )
          );
      }

      if (error.message.includes('fetch')) {
        return reply
          .status(503)
          .send(
            createErrorResponse(
              ERROR_CODES.SERVICE_UNAVAILABLE,
              'Captain Data API is temporarily unavailable',
              requestId
            )
          );
      }
    }

    return reply
      .status(500)
      .send(
        createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred', requestId)
      );
  }
}
