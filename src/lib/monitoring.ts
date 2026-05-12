import * as Sentry from '@sentry/nextjs';

/**
 * Initializes Sentry monitoring for the application.
 * Should be called in the root layout or entry point.
 */
export function initMonitoring() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      // Add integrations or other config here
    });
    console.log("🚀 Sentry initialized");
  }
}

/**
 * Logs a custom event to Sentry with additional data.
 */
export function logEvent(event: string, data: any) {
  Sentry.captureMessage(event, {
    level: 'info',
    extra: data,
    tags: { feature: 'onboarding' },
  });
}

/**
 * Captures an error and sends it to Sentry.
 */
export function captureError(error: any, context?: string) {
  console.error(`Error in ${context || 'app'}:`, error);
  Sentry.captureException(error, {
    extra: { context },
  });
}
