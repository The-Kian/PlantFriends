/**
 * Checks shared by the callable functions: App Check, rate limits and
 * input validation.
 */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// Upper bound on instances per function, so a flood of calls can't run up
// the bill. Three testers need nowhere near this.
const MAX_INSTANCES = 10;

/**
 * App Check is enforced only when ENFORCE_APP_CHECK is "true" (set in
 * functions/.env and redeploy). Leave it off until every tester has a build
 * with App Check, or their calls will be rejected.
 */
function appCheckEnforced() {
  return process.env.ENFORCE_APP_CHECK === "true";
}

/** Throws unless the call is signed in and, when enforced, has App Check. */
function requireCaller(context) {
  if (appCheckEnforced() && !(context && context.app)) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "This request didn't come from the Plant Friends app."
    );
  }
  if (!context || !context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in."
    );
  }
  return context.auth.uid;
}

/**
 * Pure rate-limit step: given the stored window (or nothing), returns the
 * window to store and whether this call is allowed. A fixed window of
 * `windowMs` that allows `limit` calls.
 */
function nextWindow(stored, now, limit, windowMs) {
  if (
    !stored ||
    typeof stored.start !== "number" ||
    now - stored.start >= windowMs
  ) {
    return { allowed: true, window: { start: now, count: 1 } };
  }
  if (stored.count >= limit) {
    return { allowed: false, window: stored };
  }
  return {
    allowed: true,
    window: { start: stored.start, count: stored.count + 1 },
  };
}

/**
 * Per-user rate limit kept in Firestore at `RateLimits/{name}_{uid}` (closed
 * to clients by the rules). Throws resource-exhausted when over the limit.
 */
async function rateLimit(uid, name, limit, windowMs, now = Date.now()) {
  const db = admin.firestore();
  const ref = db.collection("RateLimits").doc(`${name}_${uid}`);
  const allowed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const result = nextWindow(
      snap.exists ? snap.data() : null,
      now,
      limit,
      windowMs
    );
    if (result.allowed) {
      tx.set(ref, { ...result.window, expiresAt: new Date(now + windowMs) });
    }
    return result.allowed;
  });
  if (!allowed) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      "Too many requests. Try again in a minute."
    );
  }
}

/** Returns `value` trimmed if it's a non-empty string of at most `max` characters. */
function requireString(value, field, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `${field} must be text of 1 to ${max} characters.`
    );
  }
  return value.trim();
}

/** Removes secrets from text before it's logged. */
function redact(text, secrets) {
  let result = String(text);
  for (const secret of secrets) {
    if (secret) result = result.split(secret).join("[redacted]");
  }
  return result;
}

module.exports = {
  MAX_INSTANCES,
  appCheckEnforced,
  requireCaller,
  nextWindow,
  rateLimit,
  requireString,
  redact,
};
