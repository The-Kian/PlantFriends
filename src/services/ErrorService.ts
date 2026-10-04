import { Alert } from "react-native";

import { recordHandledError } from "./CrashReporting";

export type ErrorSeverity = "error" | "warning" | "info";

interface ErrorConfig {
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage?: string;
  actions?: { title: string; onPress: () => void }[];
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
    const config = this.errorMap[errorCode] || this.getDefaultConfig();
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
    const config = this.errorMap[errorCode] || this.getDefaultConfig();

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
      const config = this.errorMap[errorCode] || this.getDefaultConfig();

      this.logError(error, errorCode, context);
      this.showAlert(config, context);

      if (onError) {
        onError(config);
      }

      return { success: false, error: config };
    }
  }

  /**
   * Log to the console and send to crash reporting
   */
  private static logError(
    error: unknown,
    errorCode: string,
    context?: string,
  ): void {
    console.error(`[${context || "Error"}] ${errorCode}:`, error);
    recordHandledError(error, context);
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
    const title = context ? `${context}` : "Error";

    Alert.alert(title, config.userMessage, config.actions || [{ text: "OK", onPress: () => {} }]);
  }
}

export default ErrorService;
