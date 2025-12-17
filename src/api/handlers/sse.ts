/**
 * SSE Handler for MCP Transport
 *
 * Handles Server-Sent Events connections for MCP clients.
 * Each connection is authenticated and creates a new MCP server instance.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpServer } from '../../mcp';
import { extractApiKey, createAuthErrorResponse } from '../../lib/auth';
import { logger } from '../../lib/logger';

// Create an SSE-specific logger
const sseLogger = logger.child({ component: 'sse' });

// Store active transports for message routing
// Note: This resets on cold start, but MCP clients handle reconnection
const transports = new Map<string, SSEServerTransport>();

/**
 * Get the transport map for message routing
 */
export function getTransport(sessionId: string): SSEServerTransport | undefined {
  return transports.get(sessionId);
}

/**
 * SSE connection handler
 *
 * Establishes an SSE connection for MCP protocol communication.
 * Authenticates via X-API-Key header or Authorization Bearer token.
 */
export default async function sseHandler(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const requestId = req.id || `sse-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  sseLogger.info('SSE connection attempt', {
    requestId,
    hasApiKey: !!req.headers['x-api-key'],
    hasAuth: !!req.headers['authorization'],
  });

  // Authenticate the request
  let apiKey: string;
  try {
    apiKey = await extractApiKey(req.headers as Record<string, string | string[] | undefined>);
  } catch (authError) {
    sseLogger.error('SSE authentication failed', {
      requestId,
      error: authError instanceof Error ? authError.message : 'Unknown error',
    });

    const errorResponse = createAuthErrorResponse(authError as Error, requestId);
    return reply.status(401).send(errorResponse);
  }

  // Create MCP server with the authenticated API key
  const server = createMcpServer(apiKey);

  // Set SSE headers manually for Fastify raw response
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Create SSE transport with the message endpoint path
  // The sessionId will be appended as a query parameter by the transport
  const transport = new SSEServerTransport('/mcp', reply.raw);
  const sessionId = transport.sessionId;

  // Store transport for message routing
  transports.set(sessionId, transport);

  sseLogger.info('SSE connection established', {
    requestId,
    sessionId,
    activeConnections: transports.size,
  });

  // Clean up on connection close
  reply.raw.on('close', () => {
    transports.delete(sessionId);
    sseLogger.info('SSE connection closed', {
      requestId,
      sessionId,
      activeConnections: transports.size,
    });
  });

  // Handle errors
  reply.raw.on('error', (error) => {
    transports.delete(sessionId);
    sseLogger.error('SSE connection error', {
      requestId,
      sessionId,
      error: error.message,
    });
  });

  // Connect the MCP server to the transport
  try {
    await server.connect(transport);
    sseLogger.info('MCP server connected to transport', {
      requestId,
      sessionId,
    });
  } catch (error) {
    transports.delete(sessionId);
    sseLogger.error('Failed to connect MCP server', {
      requestId,
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // If headers haven't been sent, send error response
    if (!reply.raw.headersSent) {
      return reply.status(500).send({
        error: 'Failed to establish MCP connection',
        requestId,
      });
    }
  }

  // The response is handled by the SSE transport, don't close it
}
