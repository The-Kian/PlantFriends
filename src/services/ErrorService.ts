import { Alert } from "react-native";

import { OFFLINE_MESSAGE, isOfflineError } from "@/helpers/errors/friendlyErrors";

import { recordHandledError } from "./CrashReporting";

export type ErrorSeverity = "error" | "warning" | "info";

interface ErrorConfig {
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage?: string;
  actions?: { title: string; onPress: () => void }[];
}

// User mistakes with a clear message of their own: not sent to Crashlytics.
const EXPECTED_USER_ERRORS = new Set([
  "auth/invalid-credential",
  "auth/wrong-password",
  "auth/user-not-found",
  "auth/invalid-email",
  "auth/email-already-in-use",
  "auth/weak-password",
  "auth/too-many-requests",
  "auth/account-exists-with-different-credential",
]);

// What the alert says, by the context the caller gave. Anything not listed
// gets "Something went wrong".
const ALERT_TITLES: Record<string, string> = {
  Login: "Couldn't log in",
  Registration: "Couldn't sign up",
  "Reset Password": "Couldn't send the reset email",
  "Delete Account": "Couldn't delete your account",
  Logout: "Couldn't log out",
  "Update Profile": "Couldn't save your name",
  "Google Sign-In": "Couldn't sign in with Google",
  "Apple Sign-In": "Couldn't sign in with Apple",
  "Save Plant": "Couldn't save the plant",
  "Update Plant": "Couldn't update the plant",
  "Delete Plant": "Couldn't delete the plant",
  "Remove Plant": "Couldn't remove the plant",
  "Search Plants": "Couldn't search for plants",
  "Fetch Plant By ID": "Couldn't load the plant",
  "Share invite": "Couldn't share the invite",
  "Share Plant": "Couldn't change sharing",
  "Notification Settings": "Couldn't change notifications",
  // Contexts that are already plain words.
  "Join a household": "Join a household",
  "Leave household": "Leave household",
  "Remove housemate": "Remove housemate",
  "Invite housemate": "Invite housemate",
  "Share code": "Share code",
  "Log Watering": "Couldn't log the watering",
};

export const DEFAULT_ALERT_TITLE = "Something went wrong";

export function alertTitleFor(context?: string): string {
  return (context && ALERT_TITLES[context]) || DEFAULT_ALERT_TITLE;
}

class ErrorService {
  private static errorMap: Record<string, ErrorConfig> = {
    // Auth errors
    "auth/user-not-found": {
      severity: "error",
      userMessage: "User not found. Please check your email or create an account.",
    },
    "auth/wrong-password": {
      severity: "error",
      userMessage: "Incorrect password. Please try again.",
    },
    // What Firebase now returns for a wrong password or an unknown email
    // (email enumeration protection), instead of the two codes above.
    "auth/invalid-credential": {
      severity: "error",
      userMessage:
        "That email and password don't match an account. Check them and try again, or reset your password.",
    },
    "auth/too-many-requests": {
      severity: "warning",
      userMessage: "Too many attempts. Please wait a few minutes and try again.",
    },
    "auth/email-already-in-use": {
      severity: "error",
      userMessage: "This email is already registered. Please log in or use a different email.",
    },
    "auth/invalid-email": {
      severity: "error",
      userMessage: "Please enter a valid email address.",
    },
    "auth/weak-password": {
      severity: "error",
      userMessage: "Password must be at least 6 characters.",
    },
    "auth/account-exists-with-different-credential": {
      severity: "error",
      userMessage:
        "An account with this email already exists. Sign in with the method you used before.",
    },
    "auth/network-request-failed": {
      severity: "error",
      userMessage: "Network error. Please check your connection and try again.",
    },

    // Firebase Firestore errors
    "firestore/permission-denied": {
      severity: "error",
      userMessage: "You don't have permission to perform this action.",
    },
    "firestore/not-found": {
      severity: "warning",
      userMessage: "The item you're looking for was not found.",
    },
    "firestore/unavailable": {
      severity: "error",
      userMessage: "The service is temporarily unavailable. Please try again later.",
    },

    // API errors
    "api/network-error": {
      severity: "error",
      userMessage: "Failed to fetch data. Please check your connection and try again.",
    },
    "api/rate-limited": {
      severity: "warning",
      userMessage: "Too many requests. Please wait a moment and try again.",
    },
    "api/invalid-response": {
      severity: "error",
      userMessage: "Received unexpected data from server. Please try again.",
    },
  };

  /**
   * Log an error and show user-friendly alert
   */
  static handleError(
    error: unknown,
    context?: string,
    customConfig?: Partial<ErrorConfig>,
  ): void {
    const errorCode = this.extractErrorCode(error);
    const config = this.configFor(error, errorCode);
    const finalConfig = { ...config, ...customConfig };

    // Log technical details for debugging
    this.logError(error, errorCode, context);

    // Show user-friendly alert
    this.showAlert(finalConfig, context);
  }

  /**
   * Handle an error and return a result for caller to handle
   */
  static async handleErrorAsync(
    error: unknown,
    context?: string,
  ): Promise<{ success: false; error: ErrorConfig }> {
    const errorCode = this.extractErrorCode(error);
    const config = this.configFor(error, errorCode);

    this.logError(error, errorCode, context);
    this.showAlert(config, context);

    return { success: false, error: config };
  }

  /**
   * Validate data and handle errors
   */
  static async validateAndExecute<T>(
    asyncFn: () => Promise<T>,
    context: string,
    onError?: (config: ErrorConfig) => void,
  ): Promise<{ success: boolean; data?: T; error?: ErrorConfig }> {
    try {
      const data = await asyncFn();
      return { success: true, data };
    } catch (error) {
      const errorCode = this.extractErrorCode(error);
      const config = this.configFor(error, errorCode);

      this.logError(error, errorCode, context);
      this.showAlert(config, context);

      if (onError) {
        onError(config);
      }

      return { success: false, error: config };
    }
  }

  /**
   * The message for an error. Being offline gets one plain message whichever
   * Firebase product reported it.
   */
  private static configFor(error: unknown, errorCode: string): ErrorConfig {
    if (isOfflineError(error)) {
      return { severity: "warning", userMessage: OFFLINE_MESSAGE };
    }
    return this.errorMap[errorCode] || this.getDefaultConfig();
  }

  /**
   * Log to the console and send to crash reporting. Being offline isn't a
   * fault, so it isn't reported.
   */
  private static logError(
    error: unknown,
    errorCode: string,
    context?: string,
  ): void {
    console.error(`[${context || "Error"}] ${errorCode}:`, error);
    // Being offline, or a user typing the wrong password, isn't a fault in
    // the app, so it isn't reported.
    if (!isOfflineError(error) && !EXPECTED_USER_ERRORS.has(errorCode)) {
      recordHandledError(error, context);
    }
  }

  /**
   * Extract error code from various error types
   */
  private static extractErrorCode(error: unknown): string {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      // Firebase errors
      if ("code" in error) {
        return (error as Record<string, unknown>).code as string;
      }
      return error.message;
    }

    if (typeof error === "object" && error !== null) {
      if ("code" in error) {
        return (error as Record<string, unknown>).code as string;
      }
      if ("message" in error) {
        return (error as Record<string, unknown>).message as string;
      }
    }

    return "unknown-error";
  }

  /**
   * Get default error configuration
   */
  private static getDefaultConfig(): ErrorConfig {
    return {
      severity: "error",
      userMessage:
        "Something went wrong. Please try again or contact support if the problem persists.",
      technicalMessage: "An unexpected error occurred",
    };
  }

  /**
   * Show alert to user
   */
  private static showAlert(config: ErrorConfig, context?: string): void {
    const title = alertTitleFor(context);

    Alert.alert(title, config.userMessage, config.actions || [{ text: "OK", onPress: () => {} }]);
  }
}

export default ErrorService;
