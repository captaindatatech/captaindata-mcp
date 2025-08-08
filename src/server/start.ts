import { buildServer } from './build';
import { config } from '../lib/config';

export async function startDevServer() {
  const app = await buildServer();
  await app.ready();

  // Generate spec AFTER ready, only if swagger registered
  if ((app as any).swagger) {
    app.swagger();
  }

  await app.listen({ port: config.port, host: '0.0.0.0' });
  const addr = app.server.address();
  const port = typeof addr === 'string' ? config.port : addr?.port;
  app.log.info(`🚀 Server listening on ${port}`);
  
  if ((app as any).swagger) {
    app.log.info(`📚 Docs at http://localhost:${port}/docs`);
  }
} 