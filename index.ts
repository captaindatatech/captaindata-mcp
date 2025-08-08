// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import Sentry instrumentation after environment variables are loaded
import "./instrument";

import { buildServer } from './src/server/build';
import { startDevServer } from './src/server/start';
import { config } from './src/lib/config';

// Validate configuration on startup
try {
  console.log('Validating configuration...');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Captain Data API Base: ${config.cdApiBase}`);
  console.log(`Log Level: ${config.logLevel}`);
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

// If running normally (node index.ts), start dev server
if (config.nodeEnv !== 'production' && config.nodeEnv !== 'test') {
  startDevServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// Export for serverless
let _appPromise: Promise<import('fastify').FastifyInstance> | null = null;
async function getApp() {
  if (!_appPromise) _appPromise = buildServer().then(async (app) => { await app.ready(); return app; });
  return _appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  app.server.emit('request', req, res);
} 