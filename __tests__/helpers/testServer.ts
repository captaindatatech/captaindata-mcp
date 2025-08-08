import { buildServer } from '../../src/server/build';

export async function createTestServer() {
  // Use the same server build process as production
  const server = await buildServer();
  await server.ready();
  return server;
} 