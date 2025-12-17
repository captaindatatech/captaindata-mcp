/**
 * MCP Server Factory
 *
 * Creates MCP server instances with all CaptainData tools registered.
 * Each server instance is associated with an authenticated API key.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TOOL_SCHEMAS, ALIAS_TO_PATH, ToolAlias } from '../types';
import { toQueryParams } from '../lib/translate';
import { config } from '../lib/config';
import { logger } from '../lib/logger';

// Create an MCP-specific logger
const mcpLogger = logger.child({ component: 'mcp' });

// Configuration for API calls
const API_TIMEOUT = config.apiTimeout;
const MAX_RETRIES = config.maxRetries;
const RETRY_DELAY = config.retryDelay;

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Make a request to the Captain Data API with timeout and retry logic
 */
async function makeCaptainDataRequest(url: string, apiKey: string, retries = 0): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
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
      return makeCaptainDataRequest(url, apiKey, retries + 1);
    }

    throw error;
  }
}

/**
 * Execute a tool by calling the Captain Data API
 */
async function executeTool(
  alias: ToolAlias,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  const pathTemplate = ALIAS_TO_PATH[alias];
  if (!pathTemplate) {
    throw new Error(`Unknown tool: ${alias}`);
  }

  // Server-side validation for search_company_employees
  if (alias === 'search_company_employees' && !params.company_uid) {
    throw new Error('Must provide company_uid');
  }

  // Translate to path and query params
  const { path, queryParams } = toQueryParams(alias, params);

  // Build URL with query string
  const queryString = new URLSearchParams(queryParams).toString();
  const apiUrl = `${config.cdApiBase}/v1${path}${queryString ? '?' + queryString : ''}`;

  mcpLogger.info('Executing MCP tool', {
    tool: alias,
    path,
    queryParams,
  });

  const response = await makeCaptainDataRequest(apiUrl, apiKey);

  // Parse response
  const responseData = await response.json();

  if (!response.ok) {
    mcpLogger.error('Captain Data API error', {
      tool: alias,
      status: response.status,
      error: responseData,
    });
    throw new Error(responseData.message || responseData.error || `API error: ${response.status}`);
  }

  mcpLogger.info('MCP tool executed successfully', {
    tool: alias,
    status: response.status,
  });

  return responseData;
}

/**
 * Convert TypeBox schema to MCP-compatible JSON Schema
 */
function toMcpSchema(schema: unknown): Record<string, unknown> {
  // TypeBox schemas are already JSON Schema compatible
  // Just ensure we return a clean object
  if (typeof schema === 'object' && schema !== null) {
    return schema as Record<string, unknown>;
  }
  return { type: 'object', properties: {} };
}

/**
 * Create an MCP server instance with all tools registered
 *
 * @param apiKey - The Captain Data API key for this session
 * @returns Configured MCP server instance
 */
export function createMcpServer(apiKey: string): McpServer {
  const server = new McpServer({
    name: 'captaindata-mcp',
    version: '1.0.0',
  });

  // Register all tools from TOOL_SCHEMAS
  for (const [alias, schema] of Object.entries(TOOL_SCHEMAS)) {
    const toolAlias = alias as ToolAlias;

    server.tool(
      toolAlias,
      schema.description,
      toMcpSchema(schema.parameters),
      async (params: Record<string, unknown>) => {
        try {
          const result = await executeTool(toolAlias, params, apiKey);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          mcpLogger.error('Tool execution failed', {
            tool: toolAlias,
            error: errorMessage,
          });

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({ error: errorMessage }),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  mcpLogger.info('MCP server created with tools', {
    toolCount: Object.keys(TOOL_SCHEMAS).length,
    tools: Object.keys(TOOL_SCHEMAS),
  });

  return server;
}

export type { McpServer };
