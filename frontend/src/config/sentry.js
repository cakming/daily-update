import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for frontend error tracking
 * Only initialize in production environment or when SENTRY_DSN is provided
 */
export const initSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';

  // Only initialize if DSN is provided
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment,

      // Set sample rates
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Performance Monitoring and Session Replay
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Filter sensitive information
      beforeSend(event, hint) {
        // Remove sensitive localStorage/sessionStorage data
        if (event.extra) {
          delete event.extra.token;
          delete event.extra.password;
          delete event.extra.apiKey;
        }

        // Remove sensitive breadcrumbs data
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
        // Browser extensions
        'top.GLOBALS',
        // Random plugins/extensions
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        // Network errors that are expected
        'NetworkError',
        'Network request failed',
        // Cancelled requests
        'AbortError',
        'Request aborted',
        // ResizeObserver errors (benign)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],

      // Deny URLs to ignore errors from specific sources
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    console.log(`Sentry initialized for ${environment} environment`);
  } else {
    console.log('Sentry DSN not found. Error tracking disabled.');
  }
};

/**
 * Manually capture an exception
 */
export const captureException = (error, context = {}) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  // Always log to console in development
  if (import.meta.env.MODE === 'development') {
    console.error('Error:', error, context);
  }
};

/**
 * Manually capture a message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
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
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

/**
 * Set user context
 */
export const setUser = (user) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user._id || user.id,
      email: user.email,
      username: user.name,
    });
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

export default Sentry;
