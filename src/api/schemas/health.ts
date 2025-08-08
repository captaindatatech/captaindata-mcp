// Schema for health check endpoint
export const healthSchema = {
  operationId: 'getHealth',
  tags: ['Health'],
  summary: 'Health check',
  description: 'Check if the API is running',
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: 'Server uptime in seconds' },
        redis: {
          type: 'object',
          properties: {
            available: { type: 'boolean', description: 'Whether Redis is available' },
            connected: { type: 'boolean', description: 'Whether Redis is connected' },
            healthy: { type: 'boolean', description: 'Whether Redis is healthy' },
            connectionAttempts: { type: 'number', description: 'Number of connection attempts' },
            ping: { type: ['string', 'null'], description: 'Redis ping response' }
          }
        },
        _metadata: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            executionTime: { type: 'number' }
          }
        }
      }
    },
    500: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'unhealthy' },
        error: { type: 'string' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        executionTime: { type: 'number' }
      }
    }
  }
}; 