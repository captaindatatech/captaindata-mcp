import { buildServer } from './build';
import { config } from '../lib/config';

export async function startDevServer() {
  const app = await buildServer();
  await app.ready();

  // Generate spec AFTER ready, only if swagger registered
  if ('swagger' in app && typeof app.swagger === 'function') {
    app.swagger();
  }

  await app.listen({ port: config.port, host: '0.0.0.0' });
  const addr = app.server.address();
  const port = typeof addr === 'string' ? config.port : addr?.port;
  app.log.info(`🚀 Server listening on ${port}`);

  if ('swagger' in app) {
    app.log.info(`📚 Docs at http://localhost:${port}/docs`);
  }
}
