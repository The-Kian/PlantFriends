/**
 * Turns the errors people can actually hit (no connection, a failed search,
 * too many tries) into plain messages. Kept apart from ErrorService so
 * screens can show them inline instead of in an alert.
 */

export const OFFLINE_MESSAGE =
  "You're offline. Check your connection and try again.";

/**
 * The error's code without its "functions/", "firestore/" or "auth/" prefix.
 * React Native Firebase reports "unavailable" from some versions and
 * "functions/unavailable" from others, so both are accepted everywhere.
 */
export function errorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code).replace(
        /^(functions|firestore|auth)\//,
        ""
      )
    : "";
}

const OFFLINE_CODES = [
  "unavailable",
  "deadline-exceeded",
  "network-request-failed",
];

/** True when a call failed because the phone couldn't reach the server. */
export function isOfflineError(error: unknown): boolean {
  if (OFFLINE_CODES.includes(errorCode(error))) return true;
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  return /network (request failed|error)|offline/i.test(message);
}

/** True when the server refused a call for being one of too many. */
export function isRateLimited(error: unknown): boolean {
  if (errorCode(error) !== "resource-exhausted") return false;
  const message = String((error as { message?: unknown }).message ?? "");
  return /too many|rate limit/i.test(message);
}

/** What to show under the search box when a search failed. */
export function searchErrorMessage(
  error: unknown,
  hasResults: boolean
): string {
  if (isOfflineError(error)) {
    return "You're offline. Searching needs a connection.";
  }
  if (isRateLimited(error)) {
    return "Too many searches. Wait a minute and try again.";
  }
  return hasResults
    ? "Couldn't reach the full plant library. These are plants other people have added."
    : "Search isn't working right now. Try again, or add the plant yourself below.";
}
