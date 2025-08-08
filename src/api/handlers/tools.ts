import { FastifyRequest, FastifyReply } from 'fastify';
import { ALIAS_TO_SLUG, ToolAlias } from "../../lib/alias";
import { toCaptainData } from "../../lib/translate";
import { createErrorResponse, ERROR_CODES } from "../../lib/error";
import { config } from "../../lib/config";
import { extractApiKey, createAuthErrorResponse } from "../../lib/auth";
import { logError, logInfo } from "../../middleware";

interface ToolParams {
  alias: string;
}

// Configuration for timeouts and retries
const API_TIMEOUT = config.apiTimeout;
const MAX_RETRIES = config.maxRetries;
const RETRY_DELAY = config.retryDelay;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make API call with timeout and retry logic
async function makeCaptainDataRequest(url: string, options: RequestInit, retries = 0): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
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
    if (retries < MAX_RETRIES && (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch')))) {
      await delay(RETRY_DELAY * (retries + 1));
      return makeCaptainDataRequest(url, options, retries + 1);
    }
    
    throw error;
  }
}

export default async function handler(req: FastifyRequest<{ Params: ToolParams }>, reply: FastifyReply) {
  const startTime = Date.now();
  const requestId = req.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Declare variables outside try block for access in catch
  let alias: ToolAlias | undefined;
  let body: any = {};
  let cdBody: any = {};
  
  try {
    alias = req.params.alias as ToolAlias;
    
    const slug = ALIAS_TO_SLUG[alias];
    
    if (!slug) {
      return reply.status(404).send(
        createErrorResponse(
          ERROR_CODES.UNKNOWN_TOOL,
          `Tool '${alias}' not supported`,
          requestId
        )
      );
    }
    
    body = req.body as any;
    
    // Extract API key from either direct header or session token
    let key: string;
    try {
      // Debug logging for authentication
      const authHeaders = Object.keys(req.headers).filter(key => 
        key.toLowerCase().includes('auth') || 
        key.toLowerCase().includes('api') || 
        key.toLowerCase().includes('key')
      );
      
      console.log(`[TOOLS DEBUG] Extracting API key for ${alias}:`, {
        hasXApiKey: !!req.headers['x-api-key'],
        hasAuthHeader: !!req.headers['authorization'],
        authHeaderLength: req.headers['authorization'] ? (req.headers['authorization'] as string).length : 0,
        authHeaderPreview: req.headers['authorization'] ? 
          ((req.headers['authorization'] as string).length > 50 ? 
            (req.headers['authorization'] as string).substring(0, 50) + '...' : 
            req.headers['authorization']) : null,
        allAuthHeaders: authHeaders,
        requestId
      });
      
      key = await extractApiKey(req.headers);
      
      console.log(`[TOOLS DEBUG] API key extraction successful for ${alias}:`, {
        keyLength: key.length,
        keyPreview: key.substring(0, 8) + '...',
        requestId
      });
    } catch (authError) {
      console.error(`[TOOLS DEBUG] API key extraction failed for ${alias}:`, {
        error: authError instanceof Error ? authError.message : 'Unknown error',
        requestId,
        headers: Object.keys(req.headers).filter(key => 
          key.toLowerCase().includes('auth') || 
          key.toLowerCase().includes('api') || 
          key.toLowerCase().includes('key')
        )
      });
      
      return reply.status(401).send(
        createAuthErrorResponse(authError as Error, requestId)
      );
    }
    
    // Server-side validation for searchCompanyEmployees
    if (alias === 'search_company_employees') {
      if (!body.sales_navigator_company_url && !body.linkedin_company_id) {
        return reply.status(400).send(
          createErrorResponse(
            ERROR_CODES.MISSING_INPUT,
            "Must provide either a company URL or ID",
            requestId
          )
        );
      }
    }
    
    cdBody = toCaptainData(alias, body);
    const apiUrl = `${config.cdApiBase}/v4/actions/${slug}/run/live`;

    // Log the request (without sensitive data)
    logInfo('Executing Captain Data tool', req, {
      endpoint: 'tools',
      tool: alias,
      slug,
      hasApiKey: !!key,
      bodyKeys: Object.keys(body),
      cdBody: JSON.stringify(cdBody),
      apiUrl
    });

    const cdRes = await makeCaptainDataRequest(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "X-API-Key": key 
      },
      body: JSON.stringify(cdBody)
    });

    // Parse response safely
    let responseData;
    try {
      responseData = await cdRes.json();
      
      logInfo('Parsed response data', req, {
        endpoint: 'tools',
        tool: alias,
        responseDataKeys: Object.keys(responseData),
        responseData: JSON.stringify(responseData)
      });
    } catch (parseError) {
      logError('Failed to parse Captain Data response', parseError, req, {
        endpoint: 'tools',
        tool: alias
      });
      return reply.status(500).send(
        createErrorResponse(
          ERROR_CODES.INVALID_RESPONSE,
          "Invalid response from Captain Data API",
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

    // Add request metadata to successful responses only
    const responseWithMetadata = {
      ...responseData,
      _metadata: {
        requestId,
        executionTime: Date.now() - startTime,
        tool: alias
      }
    };
    
    // Log response details for debugging
    logInfo('Tool execution completed', req, {
      endpoint: 'tools',
      tool: alias,
      status: cdRes.status,
      responseDataType: typeof responseData,
      responseDataIsObject: typeof responseData === 'object',
      finalResponseLength: JSON.stringify(responseWithMetadata).length,
      finalResponseKeys: Object.keys(responseWithMetadata)
    });

    // Set proper content type
    reply.header('Content-Type', 'application/json');
    
    const finalResponse = {
      ...responseData,
      _metadata: {
        requestId,
        executionTime: Date.now() - startTime,
        tool: alias
      }
    };
    
    reply.header('Content-Type', 'application/json');
    reply.raw.writeHead(cdRes.status, { 'Content-Type': 'application/json' });
    reply.raw.end(JSON.stringify(finalResponse));
    return;

  } catch (error) {
    logError('Tool execution failed', error, req, {
      endpoint: 'tools',
      tool: alias || 'unknown',
      requestBody: body || {},
      cdBody: cdBody || {}
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        return reply.status(408).send(
          createErrorResponse(
            ERROR_CODES.TIMEOUT,
            "Request to Captain Data API timed out",
            requestId
          )
        );
      }
      
      if (error.message.includes('fetch')) {
        return reply.status(503).send(
          createErrorResponse(
            ERROR_CODES.SERVICE_UNAVAILABLE,
            "Captain Data API is temporarily unavailable",
            requestId
          )
        );
      }
    }

    return reply.status(500).send(
      createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        "An unexpected error occurred",
        requestId
      )
    );
  }
} 