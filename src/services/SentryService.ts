import * as Sentry from "@sentry/react-native";

/**
 * Initializes Sentry crash/error reporting.
 *
 * The DSN is read from `EXPO_PUBLIC_SENTRY_DSN` (Expo public env var) so it can
 * be set at build time without bundling secrets beyond the public DSN.
 *
 * If no DSN is configured, Sentry is still initialized in a no-op manner so
 * `captureException` / `captureMessage` calls elsewhere remain safe.
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  Sentry.init({
    dsn: dsn || undefined,
    enabled: Boolean(dsn),
    tracesSampleRate: 0.2,
  });
}

export function captureException(error: unknown, context?: string): void {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) {
    return;
  }
  Sentry.withScope((scope) => {
    if (context) {
      scope.setTag("context", context);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, context?: string): void {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) {
    return;
  }
  Sentry.withScope((scope) => {
    if (context) {
      scope.setTag("context", context);
    }
    Sentry.captureMessage(message);
  });
}
