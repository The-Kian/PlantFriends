/**
 * Structured logs. Every line carries `fn` (the function's name), so Cloud
 * Logging can filter and alert by function: `jsonPayload.fn="joinHousehold"`.
 *
 * Log IDs and counts only: uid, householdId, plantId, how many. Never an
 * email, a display name, a plant's name, an invite code or a push token.
 * See docs/OPERATIONS.md.
 */
const functions = require("firebase-functions/v1");

function logFor(fn) {
  const write =
    (level) =>
    (message, fields = {}) =>
      functions.logger[level](message, { fn, ...fields });
  return { info: write("info"), warn: write("warn"), error: write("error") };
}

module.exports = { logFor };
