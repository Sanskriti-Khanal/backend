import express, { Express } from 'express';
import env from '@config/env';

// Try to import Sentry, but make it optional
let Sentry: any;
let Tracing: any;
let sentryAvailable = false;

try {
  Sentry = require('@sentry/node');
  Tracing = require('@sentry/tracing');
  sentryAvailable = true;
} catch (error) {
  // Sentry packages not installed - that's okay, we'll skip initialization
  sentryAvailable = false;
  console.log('ℹ️  Sentry packages not installed - error tracking will be disabled');
}

/**
 * Initialize Sentry for error tracking
 * Only initializes if SENTRY_DSN is provided and packages are installed
 */
export const initSentry = (app: Express): void => {
  if (!sentryAvailable) {
    console.log('ℹ️  Sentry not available (packages not installed)');
    return;
  }

  if (env.NODE_ENV === 'production' && env.SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Tracing.Integrations.Express({ app }),
        ],
        // Filter out health check endpoints from tracking
        ignoreErrors: [
          'ECONNREFUSED',
          'ENOTFOUND',
        ],
        beforeSend(event: any) {
          // Don't send events in development
          if (env.NODE_ENV !== 'production') {
            return null;
          }
          return event;
        },
      });

      console.log('✅ Sentry initialized for error tracking');
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  } else {
    console.log('ℹ️  Sentry not initialized (SENTRY_DSN not set or not in production)');
  }
};

/**
 * Add Sentry request handler (must be first middleware)
 */
export const sentryRequestHandler = (app: Express): void => {
  if (!sentryAvailable) {
    return;
  }

  if (env.NODE_ENV === 'production' && env.SENTRY_DSN) {
    try {
      app.use(Sentry.Handlers.requestHandler());
      app.use(Sentry.Handlers.tracingHandler());
    } catch (error) {
      console.error('❌ Failed to add Sentry request handler:', error);
    }
  }
};

/**
 * Add Sentry error handler (must be before other error handlers)
 */
export const sentryErrorHandler = (app: Express): void => {
  if (!sentryAvailable) {
    return;
  }

  if (env.NODE_ENV === 'production' && env.SENTRY_DSN) {
    try {
      app.use(Sentry.Handlers.errorHandler());
    } catch (error) {
      console.error('❌ Failed to add Sentry error handler:', error);
    }
  }
};

