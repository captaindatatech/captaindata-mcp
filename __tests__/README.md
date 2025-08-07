# Test Structure

This directory contains the test suite for the Captain Data MCP API, organized for better maintainability and readability.

## Test Files

### Core Test Files
- **`health.test.ts`** - Tests for the health check endpoint (`GET /`)
- **`introspect.test.ts`** - Tests for the introspect endpoint (`GET /introspect`)
- **`authentication.test.ts`** - Tests for API key validation and authentication
- **`tools.test.ts`** - Tests for tool execution endpoints (`POST /tools/:alias`)
- **`integration.test.ts`** - End-to-end integration tests
- **`docs.test.ts`** - Tests for OpenAPI documentation endpoints

### Helper Files
- **`helpers/testServer.ts`** - Shared test server setup utility
- **`helpers/testUtils.ts`** - Common test utilities (mocking, request helpers)
- **`helpers/setup.ts`** - Global test configuration
- **`jest.config.js`** - Jest configuration

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
npm run test:health        # Health check tests only
npm run test:introspect    # Introspect tests only
npm run test:auth          # Authentication tests only
npm run test:tools         # Tool execution tests only
npm run test:integration   # Integration tests only
npm run test:docs          # OpenAPI documentation tests only
```

### Development
```bash
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

## Test Structure Benefits

1. **Separation of Concerns** - Each test file focuses on a specific endpoint or functionality
2. **Reusability** - Shared utilities reduce code duplication
3. **Maintainability** - Easier to find and update specific tests
4. **Readability** - Smaller, focused test files are easier to understand
5. **Selective Testing** - Can run specific test suites during development

## Adding New Tests

1. Create a new test file following the naming convention: `feature.test.ts`
2. Import the shared test server: `import { createTestServer } from './helpers/testServer'`
3. Use utility functions from `testUtils.ts` for common operations
4. Add a new npm script in `package.json` if needed

## Mocking

The test utilities provide helper functions for mocking external API calls:
- `mockFetchResponse(data, status)` - Mock fetch responses
- `restoreFetch(originalFetch)` - Restore original fetch after tests
- `createTestPayload(tool, payload)` - Create standardized test requests 