import {
  getCrashlytics,
  log,
  recordError,
  setUserId,
} from "@react-native-firebase/crashlytics";

/**
 * CrashReporting — thin wrapper over Firebase Crashlytics so the rest of the
 * app never has to worry about it throwing. Native crashes are captured
 * automatically; this records handled JS errors with some context.
 */

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "object" && error !== null) {
    const { code, message } = error as { code?: string; message?: string };
    return new Error([code, message].filter(Boolean).join(": ") || "Unknown error");
  }
  return new Error(String(error));
}

export function recordHandledError(error: unknown, context?: string): void {
  try {
    const crashlytics = getCrashlytics();
    if (context) {
      log(crashlytics, context);
    }
    recordError(crashlytics, toError(error), context);
  } catch {
    // Crash reporting must never break the app.
  }
}

export function setCrashReportingUser(uid: string | null): void {
  try {
    setUserId(getCrashlytics(), uid ?? "").catch(() => {});
  } catch {
    // Crash reporting must never break the app.
  }
}
