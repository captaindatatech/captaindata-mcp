export const authSchema = {
  operationId: 'authenticate',
  summary: 'Authenticate with your Captain Data API key',
  tags: ['Authentication'],
  description: 'Exchange your Captain Data API key for a session token that can be used for subsequent requests',
  body: {
    type: 'object',
    properties: {
      api_key: {
        type: 'string',
        description: 'Your Captain Data API key'
      }
    }
  },
  response: {
    200: {
      description: 'Authentication successful',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              session_token: {
                type: 'string',
                description: 'Session token to use in Authorization header for subsequent requests'
              },
              expires_in: {
                type: 'number',
                description: 'Token expiration time in seconds'
              },
              _metadata: {
                type: 'object',
                properties: {
                  requestId: {
                    type: 'string'
                  },
                  executionTime: {
                    type: 'number'
                  }
                }
              }
            }
          }
        }
      }
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              },
              code: {
                type: 'string'
              },
              message: {
                type: 'string'
              },
              requestId: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              },
              code: {
                type: 'string'
              },
              message: {
                type: 'string'
              },
              requestId: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              },
              code: {
                type: 'string'
              },
              message: {
                type: 'string'
              },
              requestId: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  }
}; 