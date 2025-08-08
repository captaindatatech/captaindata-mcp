import { FastifyRequest, FastifyReply } from 'fastify';
import { ALIAS_TO_SLUG, ToolAlias } from "../../lib/alias";
import { toCaptainData } from "../../lib/translate";
import { createErrorResponse, ERROR_CODES } from "../../lib/error";
import { config } from "../../lib/config";
import { extractApiKey, createAuthErrorResponse } from "../../lib/auth";

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
  
  try {
    const alias = req.params.alias as ToolAlias;
    
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
    
    const body = req.body as any;
    
    // Extract API key from either direct header or session token
    let key: string;
    try {
      key = await extractApiKey(req.headers);
    } catch (authError) {
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
    
    const cdBody = toCaptainData(alias, body);
    const apiUrl = `${config.cdApiBase}/v4/actions/${slug}/run/live`;

    // Log the request (without sensitive data)
    req.log.info({
      requestId,
      alias,
      slug,
      hasApiKey: !!key,
      bodyKeys: Object.keys(body),
      cdBody: JSON.stringify(cdBody),
      apiUrl,
      message: 'Executing Captain Data tool'
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
      
      req.log.info({
        requestId,
        responseDataKeys: Object.keys(responseData),
        responseData: JSON.stringify(responseData),
        message: 'Parsed response data'
      });
    } catch (parseError) {
      req.log.error({
        requestId,
        error: parseError,
        message: 'Failed to parse Captain Data response'
      });
      return reply.status(500).send(
        createErrorResponse(
          ERROR_CODES.INVALID_RESPONSE,
          "Invalid response from Captain Data API",
          requestId
        )
      );
    }

    // Add request metadata to response
    const responseWithMetadata = {
      ...responseData,
      _metadata: {
        requestId,
        executionTime: Date.now() - startTime,
        tool: alias
      }
    };
    
    // Ensure we're not accidentally modifying the response
    req.log.info({
      requestId,
      responseDataType: typeof responseData,
      responseDataIsObject: typeof responseData === 'object',
      responseWithMetadataType: typeof responseWithMetadata,
      message: 'Response object types'
    });

    req.log.info({
      requestId,
      alias,
      status: cdRes.status,
      executionTime: Date.now() - startTime,
      finalResponse: JSON.stringify(responseWithMetadata),
      message: 'Tool execution completed'
    });

    // Set proper content type
    reply.header('Content-Type', 'application/json');
    
    req.log.info({
      requestId,
      finalResponseLength: JSON.stringify(responseWithMetadata).length,
      finalResponseKeys: Object.keys(responseWithMetadata),
      message: 'About to send response'
    });
    
    // Send response using raw to avoid Fastify serialization issues
    req.log.info({
      requestId,
      message: 'Sending response via raw'
    });
    
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
    const executionTime = Date.now() - startTime;
    
    req.log.error({
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      executionTime,
      message: 'Tool execution failed'
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