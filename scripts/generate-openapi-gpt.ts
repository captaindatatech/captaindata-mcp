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
  
  // Remove /openapi.json from the spec to avoid meta-circular reference
  if (spec.paths && spec.paths['/openapi.json']) {
    delete spec.paths['/openapi.json'];
  }

  // Remove /openapi.gpt.json from the spec to avoid meta-circular reference
  if (spec.paths && spec.paths['/openapi.gpt.json']) {
    delete spec.paths['/openapi.gpt.json'];
  }
  
  // Create GPT-compatible version
  const gptSpec = JSON.parse(JSON.stringify(spec));
  
  // Remove security schemes that use headers
  if (gptSpec.components && gptSpec.components.securitySchemes) {
    delete gptSpec.components.securitySchemes.apiKey;
    delete gptSpec.components.securitySchemes.bearerAuth;
  }
  
  // Remove global security requirements
  if (gptSpec.security) {
    delete gptSpec.security;
  }
  
  // Add session_token query parameter to all endpoints that require authentication
  const authRequiredPaths = [
    '/tools',
    '/tools/{toolName}',
    '/tools/{toolName}/execute'
  ];
  
  // Define the session_token parameter
  const sessionTokenParam = {
    name: "session_token",
    in: "query",
    required: true,
    schema: { type: "string" },
    description: "Token from /auth endpoint"
  };
  
  // Add session_token to all paths that need authentication
  Object.keys(gptSpec.paths).forEach(path => {
    const pathObj = gptSpec.paths[path];
    
    // Skip auth endpoint and public endpoints
    if (path === '/auth' || path === '/introspect' || path === '/docs' || path === '/docs/json' || path === '/health' || path === '/openapi.gpt.json') {
      return;
    }
    
    // Add session_token parameter to all HTTP methods in this path
    Object.keys(pathObj).forEach(method => {
      if (method === 'parameters') return; // Skip if already has parameters
      
      const operation = pathObj[method];
      if (operation && typeof operation === 'object') {
        // Initialize parameters array if it doesn't exist
        if (!operation.parameters) {
          operation.parameters = [];
        }
        
        // Add session_token parameter if not already present
        const hasSessionToken = operation.parameters.some((param: any) => param.name === 'session_token');
        if (!hasSessionToken) {
          operation.parameters.push(sessionTokenParam);
        }
        
        // Remove any security requirements
        if (operation.security) {
          delete operation.security;
        }
      }
    });
  });
  
  const out = resolve(process.cwd(), 'openapi.gpt.json');
  writeFileSync(out, JSON.stringify(gptSpec, null, 2));
  console.log('Wrote GPT-compatible OpenAPI spec to', out);
  process.exit(0);
})(); 