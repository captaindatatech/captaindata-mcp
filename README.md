# Captain Data MCP API

A Model Context Protocol (MCP) server for Captain Data tools, designed to work with ChatGPT and other AI assistants. This API provides a clean interface for LinkedIn data extraction and search capabilities through Captain Data's powerful scraping engine.

## Features

- **MCP-compliant API** for seamless integration with AI assistants
- **Dual authentication system** - API key headers or session tokens
- **Comprehensive tool suite** for LinkedIn data extraction and search
- **Production-ready** with proper error handling, logging, and monitoring
- **TypeScript-first** with strict type checking and validation
- **Fastify-powered** for high performance and extensibility
- **Redis integration** for session management with in-memory fallback
- **Interactive API documentation** with OpenAPI/Swagger
- **Comprehensive testing** with Jest and integration tests

## Authentication

The API supports two authentication methods:

1. **Direct API Key**: Set your Captain Data API key in the `X-API-Key` header
2. **Session Tokens**: Use the `/auth` endpoint to get a session token, then include it in the `Authorization: Bearer <token>` header

## Local Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Captain Data API key
- Redis (optional, falls back to in-memory storage)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create environment configuration:**
```bash
cp env.example .env
# Edit .env with your Captain Data API key and other settings
```

3. **Start the development server:**
```bash
npm run dev
```

The server will be available at http://localhost:3000.

### Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Build for production
npm run build

# Generate OpenAPI documentation
npm run generate:openapi
npm run generate:openapi:gpt
```

## Production Deployment

### Environment Variables

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
| `REDIS_URL` | ❌ | - | Redis connection URL for session storage |
| `SENTRY_DSN` | ❌ | - | Sentry DSN for error tracking |

### Production Checklist

Before deploying to production, ensure:

- [ ] Environment variables are properly configured
- [ ] All tests pass: `npm test`
- [ ] Type checking passes: `npm run type-check`
- [ ] Rate limiting is configured appropriately
- [ ] Logging level is set to `info` or `warn`
- [ ] Health check endpoint is monitored
- [ ] Error tracking is set up (Sentry recommended)
- [ ] Redis is configured for session management (optional)

### Monitoring & Observability

The API provides comprehensive monitoring capabilities:

- **Health Check**: `GET /health` - Returns system status and uptime
- **Request Logging**: All requests are logged with unique request IDs
- **Error Tracking**: Structured error responses with detailed context
- **Performance Metrics**: Response times and execution metrics
- **Sentry Integration**: Automatic error reporting and performance monitoring

## API Endpoints

### Core Endpoints

- `GET /health` - Health check and system status
- `GET /introspect` - List available tools (basic mode)
- `GET /introspect?v=full` - List all available tools (full mode)
- `POST /auth` - Generate session token from API key
- `POST /tools/:alias` - Execute a specific tool

### Documentation

- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /docs/json` - OpenAPI specification
- `GET /openapi.json` - Raw OpenAPI specification
- `GET /openapi.gpt.json` - GPT-compatible OpenAPI specification

## Available Tools

### LinkedIn Profile Tools

- **`enrich_people`** - Extract detailed profile information from LinkedIn URLs
  - Perfect for lead research and candidate evaluation
  - Returns comprehensive profile data including experience, skills, and contact info

- **`enrich_company`** - Get comprehensive company data from LinkedIn company pages
  - Ideal for market research and competitive analysis
  - Provides company details, employee count, industry, and more

### Sales Navigator Search Tools

- **`search_people`** - Find prospects using Sales Navigator with advanced filtering
  - Search by location, industry, company size, and other criteria
  - Returns filtered lists of potential leads

- **`search_companies`** - Discover target companies based on various criteria
  - Filter by industry, size, location, and other parameters
  - Perfect for B2B prospecting and market analysis

- **`search_company_employees`** - Identify key contacts within specific organizations
  - Find employees by company URL or LinkedIn company ID
  - Great for account-based marketing and sales outreach

## Using with AI Assistants

### ChatGPT Integration

1. **Deploy to Vercel:**
```bash
npm i -g vercel
vercel login
vercel
```

2. **Configure in ChatGPT:**
   - Use the deployed URL: `https://your-project.vercel.app`
   - The API will be available for ChatGPT Actions

### Custom GPT Authentication Workaround

**Important**: Custom GPTs have limitations with authorization headers. To work around this, the API supports authentication via query parameters:

```
POST /tools/enrich_people?session_token=your_session_token
```

**Note**: Query parameter authentication is provided as a workaround for Custom GPTs. For production applications, prefer header-based authentication for better security.

### MCP Protocol Support

The API is fully compatible with the Model Context Protocol (MCP), providing:
- Standardized tool introspection
- Consistent error handling
- Session-based authentication
- Structured request/response formats

## Project Architecture

```
src/
├── api/                    # API layer
│   ├── handlers/          # Request handlers
│   │   ├── auth.ts        # Authentication endpoint
│   │   ├── health.ts      # Health check
│   │   ├── introspect.ts  # Tool introspection
│   │   └── tools.ts       # Tool execution
│   ├── routes.ts          # Route registration
│   └── schemas/           # Request/response schemas
├── lib/                   # Core business logic
│   ├── alias.ts           # Tool alias mappings
│   ├── auth.ts            # Authentication logic
│   ├── config.ts          # Configuration management
│   ├── error.ts           # Error handling utilities
│   ├── redis.ts           # Redis service
│   ├── schemas/           # Tool parameter schemas
│   ├── translate.ts       # API translation layer
│   └── responseSchemas.ts # Response schemas
├── middleware/            # Request middleware
│   ├── logging.ts         # Request logging
│   └── security.ts        # Security middleware
├── server/                # Server configuration
│   ├── build.ts           # Server builder
│   └── start.ts           # Development server
└── scripts/               # Build scripts
    ├── generate-openapi.ts
    └── generate-openapi-gpt.ts
```

## Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:health
npm run test:auth
npm run test:tools
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Individual function and module testing
- **Integration Tests**: Full API workflow testing
- **Authentication Tests**: Session token and API key validation
- **Error Handling Tests**: Comprehensive error scenario coverage

## Error Handling

The API provides structured error responses with:

- **Unique request IDs** for tracking
- **Standardized error codes** for programmatic handling
- **Detailed error messages** with context
- **HTTP status codes** following REST conventions
- **Sentry integration** for error tracking in production

## Performance & Scalability

- **Fastify framework** for high-performance request handling
- **Redis integration** for scalable session management
- **Rate limiting** to prevent abuse
- **Request timeouts** and retry logic
- **Connection pooling** for external API calls
- **Graceful degradation** with in-memory fallbacks

## Security Features

- **Input validation** with JSON schemas
- **Rate limiting** to prevent abuse
- **Security headers** (CORS, XSS protection, etc.)
- **Authentication validation** for all protected endpoints
- **Request logging** with sensitive data redaction
- **Error message sanitization** to prevent information leakage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details. 