# Production Deployment Guide

This guide covers deploying the Captain Data MCP API to production environments.

## Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests pass: `npm test`
- [ ] Type checking passes: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint` (if ESLint is configured)

### ✅ Configuration
- [ ] Environment variables are set correctly
- [ ] Captain Data API key is configured
- [ ] Rate limiting is appropriate for your use case
- [ ] Logging level is set to `info` or `warn` for production

### ✅ Security
- [ ] API keys are stored securely (not in code)
- [ ] CORS is configured appropriately
- [ ] Rate limiting is enabled
- [ ] Security headers are in place

## Deployment Options

### 1. Vercel (Recommended)

#### Prerequisites
- Vercel account
- Vercel CLI installed: `npm i -g vercel`

#### Steps
1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add the following variables:
     ```
     CD_API_BASE=https://api.captaindata.com
     NODE_ENV=production
     LOG_LEVEL=info
     ```

4. **Verify Deployment**
   - Check the health endpoint: `https://your-project.vercel.app/health`
   - Verify logs in Vercel dashboard

### 2. Docker

#### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### Build and Run
```bash
# Build image
docker build -t captaindata-mcp .

# Run container
docker run -p 3000:3000 \
  -e CD_API_BASE=https://api.captaindata.com \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  captaindata-mcp
```

### 3. Traditional Server

#### Prerequisites
- Node.js 18+ installed
- PM2 or similar process manager

#### Steps
1. **Clone and Install**
   ```bash
   git clone <repository>
   cd captaindata-mcp
   npm ci --only=production
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Configure Environment**
   ```bash
   cp env.example .env
   # Edit .env with production values
   ```

4. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "captaindata-mcp"
   pm2 save
   pm2 startup
   ```

## Monitoring and Observability

### Health Checks
- **Endpoint**: `GET /health`
- **Expected Response**: 200 OK with system status
- **Monitoring**: Set up alerts for non-200 responses

### Logging
- **Format**: Structured JSON logs
- **Level**: `info` for production
- **Key Fields**: requestId, method, url, statusCode, responseTime

### Error Tracking
- **Request IDs**: All errors include request IDs for tracing
- **Structured Errors**: Consistent error format across all endpoints
- **Status Codes**: Proper HTTP status codes for different error types

### Performance Metrics
- **Response Times**: Logged for all requests
- **Rate Limiting**: Monitor rate limit hits
- **API Timeouts**: Track Captain Data API response times

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
RATE_LIMIT_MAX=1000
```

### Staging
```env
NODE_ENV=staging
LOG_LEVEL=info
RATE_LIMIT_MAX=500
```

### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMIT_MAX=100
```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Set
**Symptoms**: Configuration validation fails on startup
**Solution**: Ensure all required environment variables are set

#### 2. Captain Data API Timeouts
**Symptoms**: 408 timeout errors
**Solution**: 
- Check network connectivity
- Verify CD_API_BASE URL
- Consider increasing API_TIMEOUT

#### 3. Rate Limiting Issues
**Symptoms**: 429 rate limit errors
**Solution**:
- Adjust RATE_LIMIT_MAX and RATE_LIMIT_TIME_WINDOW
- Monitor usage patterns

#### 4. Memory Issues
**Symptoms**: Application crashes or slow performance
**Solution**:
- Monitor memory usage
- Consider increasing Node.js heap size
- Review logging levels

### Debug Commands
```bash
# Check application status
curl https://your-api.com/health

# View logs (Vercel)
vercel logs

# View logs (PM2)
pm2 logs captaindata-mcp

# Check environment variables
node -e "console.log(process.env)"
```

## Security Considerations

### API Key Management
- Store API keys in environment variables
- Never commit API keys to version control
- Rotate API keys regularly
- Use different keys for different environments

### Network Security
- Use HTTPS in production
- Configure appropriate CORS settings
- Consider using a reverse proxy (nginx) for additional security

### Rate Limiting
- Configure rate limits appropriate for your use case
- Monitor rate limit violations
- Consider implementing user-specific rate limits

## Scaling Considerations

### Horizontal Scaling
- Stateless application design supports horizontal scaling
- Use load balancer for multiple instances
- Consider using Redis for shared rate limiting

### Performance Optimization
- Monitor response times
- Consider caching for introspection responses
- Optimize logging levels for high traffic

### Resource Management
- Monitor CPU and memory usage
- Set appropriate Node.js heap size
- Consider using PM2 cluster mode for multi-core utilization 