import * as Sentry from "@sentry/node";

// Only initialize Sentry in production if DSN is provided
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    
    // Environment and release tracking
    environment: process.env.NODE_ENV,
    release: process.env.npm_package_version || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: 0.1, // Sample 10% of transactions
    profilesSampleRate: 0.1, // Sample 10% of profiles
    
    // Error sampling
    sampleRate: 1.0, // Capture 100% of errors in production
    
    // PII and security settings
    sendDefaultPii: false, // Disable automatic PII collection for security
    includeLocalVariables: false, // Don't include local variables in stack traces
    
    // Breadcrumbs configuration
    beforeBreadcrumb(breadcrumb) {
      // Filter out sensitive data from breadcrumbs
      if (breadcrumb.category === 'http') {
        delete breadcrumb.data?.headers?.['authorization'];
        delete breadcrumb.data?.headers?.['x-api-key'];
      }
      return breadcrumb;
    },
    
    // Debug mode (only in development)
    debug: false, // Keep debug off in production
  });
  
  console.log('Sentry initialized for production');
} else {
  console.log(`Sentry not initialized - NODE_ENV: ${process.env.NODE_ENV}, SENTRY_DSN: ${process.env.SENTRY_DSN ? 'provided' : 'not provided'}`);
} 