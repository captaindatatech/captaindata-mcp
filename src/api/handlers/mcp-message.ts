/**
 * MCP Message Handler
 *
 * Handles incoming POST messages from MCP clients and routes them
 * to the appropriate SSE transport based on session ID.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { getTransport } from './sse';
import { logger } from '../../lib/logger';

// Create an MCP message-specific logger
const mcpMsgLogger = logger.child({ component: 'mcp-message' });

// Query parameters interface
interface McpMessageQuery {
  sessionId?: string;
}

/**
 * MCP message handler
 *
 * Routes incoming MCP protocol messages to the correct SSE transport.
 * The sessionId is provided as a query parameter.
 */
export default async function mcpMessageHandler(
  req: FastifyRequest<{ Querystring: McpMessageQuery }>,
  reply: FastifyReply
): Promise<FastifyReply | void> {
  const requestId = req.id || `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const sessionId = req.query.sessionId;

  mcpMsgLogger.info('MCP message received', {
    requestId,
    sessionId: sessionId || 'missing',
    hasBody: !!req.body,
  });

  // Validate session ID
  if (!sessionId) {
    mcpMsgLogger.warn('Missing session ID in MCP message', { requestId });
    return reply.status(400).send({
      error: 'Missing sessionId query parameter',
      requestId,
    });
  }

  // Find the transport for this session
  const transport = getTransport(sessionId);

  if (!transport) {
    mcpMsgLogger.warn('Session not found for MCP message', {
      requestId,
      sessionId,
    });
    return reply.status(404).send({
      error: 'Session not found. The SSE connection may have timed out or closed.',
      requestId,
      sessionId,
      suggestion: 'Reconnect to /sse to establish a new session.',
    });
  }

  // Route the message to the transport
  try {
    // The handlePostMessage method expects the raw Node.js request and response
    await transport.handlePostMessage(req.raw, reply.raw);

    mcpMsgLogger.debug('MCP message handled', {
      requestId,
      sessionId,
    });

    // Response is handled by the transport, don't send additional response
  } catch (error) {
    mcpMsgLogger.error('Failed to handle MCP message', {
      requestId,
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Only send error if headers haven't been sent
    if (!reply.raw.headersSent) {
      return reply.status(500).send({
        error: 'Failed to process MCP message',
        requestId,
        sessionId,
      });
    }
  }
}
