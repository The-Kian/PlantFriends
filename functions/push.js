/**
 * Sends push notifications through the Expo push service, to every device a
 * user has registered under `Users/{uid}/Devices`. Respects each user's
 * `notificationPrefs` and removes tokens Expo says are no longer valid.
 *
 * Expo answers a push twice: a ticket straight away (it accepted the push),
 * and a receipt about 15 minutes later (the phone's push service took it).
 * Both are checked here, so a push that fails silently shows up in the logs.
 */
const { logFor } = require("./log");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const BATCH_SIZE = 100; // Expo's limit per request
// Expo has a receipt ready about 15 minutes after a push, and keeps it a day.
const RECEIPT_DELAY_MS = 15 * 60 * 1000;
const RECEIPT_GIVE_UP_MS = 24 * 60 * 60 * 1000;
const RECEIPT_LIMIT = 300;

const log = logFor("push");

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Users whose `notificationPrefs[pref]` isn't switched off. Missing means on. */
function allowedUids(userSnaps, pref) {
  return userSnaps
    .filter((snap) => {
      if (!snap.exists) return false;
      const prefs = snap.get("notificationPrefs") || {};
      return prefs[pref] !== false;
    })
    .map((snap) => snap.id);
}

/** Counts errors by Expo's error code, e.g. { DeviceNotRegistered: 2 }. */
function countErrors(results) {
  const errors = {};
  for (const result of results) {
    if (!result || result.status !== "error") continue;
    const code = (result.details && result.details.error) || "Unknown";
    errors[code] = (errors[code] || 0) + 1;
  }
  return errors;
}

// A phone that uninstalled the app is routine; anything else needs a look.
const onlyUnregistered = (errors) =>
  Object.keys(errors).every((code) => code === "DeviceNotRegistered");

/** Logs (once, with a count) the rejected results of a Promise.allSettled. */
function logRejected(message, results) {
  const rejected = results.filter((r) => r.status === "rejected");
  if (rejected.length === 0) return;
  const reason = rejected[0].reason;
  log.warn(message, {
    failed: rejected.length,
    message: reason && reason.message,
  });
}

/**
 * Remembers each accepted push in `PushTickets/{ticketId}` (closed to the
 * app), so checkPushReceipts can ask Expo later whether it was delivered.
 * Never stops a push: a failure here is only logged.
 */
async function saveTickets(db, batch, tickets, now) {
  const results = await Promise.allSettled(
    tickets.map((ticket, i) =>
      ticket && ticket.status === "ok" && ticket.id && batch[i]
        ? db
            .doc(`PushTickets/${ticket.id}`)
            .set({ device: batch[i].ref.path, createdAt: now })
        : null,
    ),
  );
  logRejected("Couldn't save push tickets", results);
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string[]} uids - who to notify
 * @param {{title: string, body: string, data?: object}} message
 * @param {"reminders" | "housemateActivity"} pref - the switch that controls this push
 * @param {typeof fetch} [fetchImpl]
 * @param {number} [now]
 * @returns {Promise<number>} how many devices it was sent to
 */
async function sendToUsers(
  db,
  uids,
  message,
  pref,
  fetchImpl = fetch,
  now = Date.now(),
) {
  const unique = [...new Set(uids || [])];
  if (unique.length === 0) return 0;

  const users = await db.getAll(...unique.map((uid) => db.doc(`Users/${uid}`)));
  const recipients = allowedUids(users, pref);

  const deviceSnaps = await Promise.all(
    recipients.map((uid) => db.collection(`Users/${uid}/Devices`).get()),
  );
  const devices = deviceSnaps
    .flatMap((snap) => snap.docs)
    .filter((d) => d.get("expoPushToken"));

  for (const batch of chunk(devices, BATCH_SIZE)) {
    const res = await fetchImpl(EXPO_PUSH_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(
        batch.map((d) => ({
          to: d.get("expoPushToken"),
          sound: "default",
          ...message,
        })),
      ),
    });
    if (!res.ok) {
      log.error("Expo push request failed", {
        pref,
        status: res.status,
        devices: batch.length,
      });
      throw new Error(`Expo push failed with status ${res.status}`);
    }
    const { data: tickets = [] } = await res.json();
    const errors = countErrors(tickets);
    if (Object.keys(errors).length > 0) {
      log[onlyUnregistered(errors) ? "info" : "warn"]("Expo refused pushes", {
        pref,
        devices: batch.length,
        errors,
      });
    }
    // One failed delete must not stop the tickets below being saved.
    logRejected(
      "Couldn't remove a dead device",
      await Promise.allSettled(
        tickets.map((ticket, i) =>
          ticket &&
          ticket.details &&
          ticket.details.error === "DeviceNotRegistered"
            ? batch[i].ref.delete()
            : null,
        ),
      ),
    );
    await saveTickets(db, batch, tickets, now);
  }
  return devices.length;
}

/**
 * Asks Expo what happened to pushes sent more than 15 minutes ago. A push
 * Expo accepted can still fail on the way to the phone (bad credentials, an
 * uninstalled app), and the receipt is the only place that shows. Failures
 * are logged, dead devices are removed, and checked tickets are deleted.
 *
 * @returns counts for the log line.
 */
async function checkPushReceipts(db, now, fetchImpl = fetch) {
  const snap = await db
    .collection("PushTickets")
    .where("createdAt", "<=", now - RECEIPT_DELAY_MS)
    .limit(RECEIPT_LIMIT)
    .get();
  const summary = { checked: snap.docs.length, ok: 0, failed: 0, missing: 0 };
  if (snap.docs.length === 0) return summary;

  const res = await fetchImpl(EXPO_RECEIPTS_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ids: snap.docs.map((d) => d.id) }),
  });
  if (!res.ok) {
    throw new Error(`Expo receipts failed with status ${res.status}`);
  }
  const { data: receipts = {} } = await res.json();

  const failures = [];
  const settled = await Promise.allSettled(
    snap.docs.map(async (ticket) => {
      const receipt = receipts[ticket.id];
      if (!receipt) {
        // Not ready yet. Try again next run, until Expo would have dropped it.
        if (now - ticket.get("createdAt") < RECEIPT_GIVE_UP_MS) return;
        summary.missing++;
      } else if (receipt.status === "error") {
        summary.failed++;
        failures.push(receipt);
        const device = ticket.get("device");
        if (
          device &&
          receipt.details &&
          receipt.details.error === "DeviceNotRegistered"
        ) {
          await db.doc(device).delete();
        }
      } else {
        summary.ok++;
      }
      await ticket.ref.delete();
    }),
  );
  logRejected("Couldn't finish checking a push receipt", settled);

  if (summary.failed > 0) {
    summary.errors = countErrors(failures);
    log[onlyUnregistered(summary.errors) ? "info" : "error"](
      "Push receipts had failures",
      summary,
    );
  }
  return summary;
}

module.exports = {
  sendToUsers,
  checkPushReceipts,
  allowedUids,
  chunk,
  countErrors,
  EXPO_PUSH_URL,
  EXPO_RECEIPTS_URL,
};
