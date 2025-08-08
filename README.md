# Captain Data MCP API

A Model Context Protocol (MCP) server for Captain Data tools, designed to work with ChatGPT and other AI assistants.

## Authentication

Every request must set your Captain Data key in the x-api-key header.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your environment variables:
```bash
cp env.example .env
# Edit .env with your Captain Data API key
```

3. Start the development server:
```bash
npm run dev
```

## Production Deployment

### Environment Variables

The following environment variables are available for configuration:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CD_API_BASE` | ✅ | - | Captain Data API base URL |
| `NODE_ENV` | ❌ | `development` | Environment (development/production/test) |
| `PORT` | ❌ | `3000` | Server port |
| `LOG_LEVEL` | ❌ | `info` | Logging level (error, warn, info, debug) |
| `RATE_LIMIT_MAX` | ❌ | `100` | Maximum requests per time window |
| `RATE_LIMIT_TIME_WINDOW` | ❌ | `1 minute` | Rate limit time window |
| `API_TIMEOUT` | ❌ | `30000` | API request timeout in milliseconds |
| `MAX_RETRIES` | ❌ | `2` | Maximum retry attempts for failed requests |
| `RETRY_DELAY` | ❌ | `1000` | Delay between retries in milliseconds |

### Production Checklist

Before deploying to production, ensure:

- [ ] Environment variables are properly configured
- [ ] All tests pass: `npm test`
- [ ] Type checking passes: `npm run type-check`
- [ ] Rate limiting is configured appropriately
- [ ] Logging level is set to `info` or `warn`
- [ ] Health check endpoint is monitored
- [ ] Error tracking is set up (optional)

### Monitoring

The API provides several endpoints for monitoring:

- **Health Check**: `GET /health` - Returns system status and uptime
- **Request Logging**: All requests are logged with request IDs
- **Error Tracking**: Structured error responses with request IDs
- **Performance Metrics**: Response times are logged for all requests

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set up environment variables in Vercel:
   - Go to your project settings in Vercel
   - Add the following environment variables:
     - `CD_API_BASE=https://api.captaindata.com`

## API Endpoints

- `GET /`: Health check endpoint
- `GET /introspect`: List available tools (basic mode)
- `GET /introspect?v=full`: List all available tools (full mode)
- `POST /tools/:alias`: Execute a specific tool
- `GET /docs`: Interactive API documentation
- `GET /docs/json`: OpenAPI specification

## Available Tools

- `enrich_people`: Enrich a single LinkedIn profile
- `enrich_company`: Enrich a single LinkedIn company
- `search_people`: Search for people using Sales Navigator
- `search_companies`: Search for companies using Sales Navigator
- `search_company_employees`: Search for employees of a specific company using Sales Navigator

## Using with ChatGPT

To use this API with ChatGPT:

1. Deploy to Vercel
2. Use the deployed URL in your ChatGPT configuration
3. The API will be available at: `https://your-project.vercel.app`

## Features

- MCP-compliant API for Captain Data integration
- Bring-your-own-key authentication model
- Flat schema design with ≤1 nesting level
- Automatic translation layer for Captain Data API
- Support for both basic (5 tools) and full (future) introspection modes
- Interactive OpenAPI documentation

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Captain Data API key

### Development

Start the development server:

```bash
npm run dev
```

The server will be available at http://localhost:3000.

#### API Documentation

You can access interactive API documentation:

- **Interactive Docs**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/docs/json

The documentation includes:
- All available endpoints with schemas
- Request/response examples
- Authentication requirements
- Tool parameter specifications

### API Endpoints

- `GET /introspect` - Get metadata about available tools (basic mode)
- `GET /introspect?v=full` - Get metadata about all available tools (full mode)
- `POST /tools/:alias` - Execute a specific tool

### Testing

You can use the provided `test.http` file to test the API endpoints.

## Project Structure

```
src/
├── api/             # API route handlers
│   ├── introspect.ts
│   └── tools/
├── lib/             # Core utilities
│   ├── alias.ts     # Tool alias mappings
│   ├── schemas/     # Tool schema definitions
│   │   ├── index.ts
│   │   ├── enrichPeople.ts
│   │   ├── enrichCompany.ts
│   │   ├── searchPeople.ts
│   │   ├── searchCompanies.ts
│   │   └── searchCompanyEmployees.ts
│   ├── translate.ts # Translation layer
│   └── error.ts     # Error utilities
├── middleware.ts    # API key middleware
└── index.ts         # Main server file
```

## License

ISC 