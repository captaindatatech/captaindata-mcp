import * as Sentry from "@sentry/node";

// Only initialize Sentry in production if DSN is provided
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  });
  
  console.log('Sentry initialized for production');
} else {
  console.log(`Sentry not initialized - NODE_ENV: ${process.env.NODE_ENV}, SENTRY_DSN: ${process.env.SENTRY_DSN ? 'provided' : 'not provided'}`);
} 