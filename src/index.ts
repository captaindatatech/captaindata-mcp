import fastify from 'fastify';
import dotenv from 'dotenv';
import { CaptainDataClient } from './clients/captainData';
import { ToolFactory } from './tools/toolFactory';

// Load environment variables
dotenv.config();

// Create Fastify instance
const server = fastify({
  logger: true
});

// Initialize Captain Data client with default API key
const defaultClient = new CaptainDataClient({
  apiKey: process.env.CAPTAINDATA_API_KEY || ''
});

// Initialize tool factory
const toolFactory = new ToolFactory(defaultClient);

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

// Start the server
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