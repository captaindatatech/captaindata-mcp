import fastify from 'fastify';
import dotenv from 'dotenv';
import { CaptainDataClient } from './src/clients/captainData';
import { ToolFactory } from './src/tools/toolFactory';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';

// Load environment variables
dotenv.config();

// Create Fastify instance
const server = fastify({
  logger: true
});

// Register CORS
server.register(fastifyCors, {
  origin: true, // Allow all origins for ChatGPT
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
});

// Register rate limiting
server.register(fastifyRateLimit, {
  max: 100, // Maximum 100 requests
  timeWindow: '1 minute' // Per minute
});

// Add security headers
server.addHook('onRequest', async (request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

// Initialize Captain Data client with default API key
const defaultClient = new CaptainDataClient({
  apiKey: process.env.CAPTAINDATA_API_KEY || ''
});

// Initialize tool factory
const toolFactory = new ToolFactory(defaultClient);

// Health check endpoint
server.get('/', async (req, reply) => {
  return { status: 'ok', message: 'Captain Data MCP API is running' };
});

// Introspect endpoint
server.get('/introspect', async (req, reply) => {
  const tools = toolFactory.getAllTools();
  return {
    tools: tools.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }))
  };
});

// Tool execution endpoint
server.post('/tools/:id/run', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tool = toolFactory.getTool(id);
  
  if (!tool) {
    return reply.status(404).send({ error: `Tool with ID '${id}' not found` });
  }
  
  try {
    const result = await tool.execute(req.body, req);
    return result;
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ 
      error: 'Tool execution failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Start the server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
  const start = async () => {
    try {
      await server.listen({ port: 3000, host: '0.0.0.0' });
      const address = server.server.address();
      if (address && typeof address !== 'string') {
        console.log(`Server is running on port ${address.port}`);
      } else {
        console.log('Server is running');
      }
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  start();
}

// Export for Vercel
export default server; 