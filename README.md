# Captain Data MCP API

A middleware API for Captain Data tools, designed to work with ChatGPT and other AI assistants.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your environment variables:
```env
CAPTAINDATA_API_KEY=your_api_key_here
HARDCODED_LINKEDIN_UID=your_linkedin_uid_here
```

3. Start the development server:
```bash
npm run dev
```

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
     - `CAPTAINDATA_API_KEY`
     - `HARDCODED_LINKEDIN_UID`

## API Endpoints

- `GET /`: Health check endpoint
- `GET /introspect`: List all available tools
- `POST /tools/:id/run`: Execute a specific tool

## Using with ChatGPT

To use this API with ChatGPT:

1. Deploy to Vercel
2. Use the deployed URL in your ChatGPT configuration
3. The API will be available at: `https://your-project.vercel.app`

## Available Tools

- `linkedin_extract_company`: Extract data from LinkedIn company pages
- `linkedin_extract_people`: Extract data from LinkedIn profile pages

## Features

- Tool-based architecture for Captain Data API integration
- Dynamic API key support via request headers
- JSON-based tool definitions
- Fastify server with TypeScript

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Development

Start the development server:

```bash
npm run dev
```

The server will be available at http://localhost:3000.

### API Endpoints

- `GET /introspect` - Get metadata about all available tools
- `POST /tools/:id/run` - Execute a specific tool

### Testing

You can use the provided `test.http` file to test the API endpoints.

## Project Structure

```
src/
├── clients/         # API clients
├── tools/           # Tool definitions and factory
└── index.ts         # Main server file
```

## License

ISC 