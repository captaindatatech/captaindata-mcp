// Schema for OpenAPI documentation
export const introspectSchema = {
  tags: ['Introspection'],
  summary: 'List available tools',
  description: 'Get metadata about available tools (MCP introspection)',
  querystring: {
    type: 'object',
    properties: {
      v: {
        type: 'string',
        description: 'Version parameter. Use "full" to get all tools',
        enum: ['full']
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'function' },
              function: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  parameters: { 
                    type: 'object',
                    additionalProperties: true
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}; 