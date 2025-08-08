// Schema for health check endpoint
export const healthSchema = {
  tags: ['Health'],
  summary: 'Health check',
  description: 'Check if the API is running',
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Captain Data MCP API is running' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: 'Server uptime in seconds' },
        version: { type: 'string' },
        environment: { type: 'string' }
      }
    }
  }
}; 