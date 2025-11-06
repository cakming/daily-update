import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only initialize in production environment
 */
export const initSentry = (app) => {
  // Only initialize Sentry if DSN is provided and not in test environment
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',

      // Set sample rates
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Performance Monitoring
      integrations: [
        // Enable HTTP calls tracing
        Sentry.httpIntegration(),
        // Enable Express.js tracing
        Sentry.expressIntegration({ app }),
        // Enable Profiling
        nodeProfilingIntegration(),
      ],

      // Filter out sensitive information
      beforeSend(event, hint) {
        // Remove authorization headers
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }

        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              delete breadcrumb.data.authorization;
              delete breadcrumb.data.password;
              delete breadcrumb.data.token;
            }
            return breadcrumb;
          });
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Browser errors
        'Non-Error promise rejection captured',
        // Network errors that are expected
        'Network request failed',
        'NetworkError',
        // Rate limiting (expected behavior)
        'Too many requests',
      ],
    });

    console.log(`Sentry initialized for ${process.env.NODE_ENV} environment`);
  } else if (process.env.NODE_ENV !== 'test') {
    console.log('Sentry DSN not found. Error tracking disabled.');
  }
};

/**
 * Sentry request handler middleware
 * Must be added before all routes
 */
export const sentryRequestHandler = () => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    return Sentry.Handlers.requestHandler();
  }
  return (req, res, next) => next();
};

/**
 * Sentry tracing handler middleware
 * Must be added before all routes
 */
export const sentryTracingHandler = () => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    return Sentry.Handlers.tracingHandler();
  }
  return (req, res, next) => next();
};

/**
 * Sentry error handler middleware
 * Must be added after all routes but before other error handlers
 */
export const sentryErrorHandler = () => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    return Sentry.Handlers.errorHandler();
  }
  return (err, req, res, next) => next(err);
};

/**
 * Manually capture an exception
 */
export const captureException = (error, context = {}) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  // Always log to console
  console.error('Error:', error, context);
};

/**
 * Manually capture a message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (breadcrumb) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

/**
 * Set user context
 */
export const setUser = (user) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.setUser({
      id: user.id || user._id,
      email: user.email,
      username: user.name,
    });
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.setUser(null);
  }
};

export default Sentry;
