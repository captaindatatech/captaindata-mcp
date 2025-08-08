import dotenv from 'dotenv';
dotenv.config();

import { buildServer } from '../src/server/build';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

(async () => {
  process.env.ENABLE_SWAGGER = 'true';
  const app = await buildServer();
  await app.ready();
  const spec = (app as any).swagger?.();
  if (!spec) throw new Error('Swagger not registered; set ENABLE_SWAGGER=true');
  const out = resolve(process.cwd(), 'openapi.json');
  writeFileSync(out, JSON.stringify(spec, null, 2));
  console.log('Wrote', out);
  process.exit(0);
})(); 