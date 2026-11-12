/**
 * Sends push notifications through the Expo push service, to every device a
 * user has registered under `Users/{uid}/Devices`. Respects each user's
 * `notificationPrefs` and removes tokens Expo says are no longer valid.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100; // Expo's limit per request

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

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string[]} uids - who to notify
 * @param {{title: string, body: string, data?: object}} message
 * @param {"reminders" | "housemateActivity"} pref - the switch that controls this push
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<number>} how many devices it was sent to
 */
async function sendToUsers(db, uids, message, pref, fetchImpl = fetch) {
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
      throw new Error(`Expo push failed with status ${res.status}`);
    }
    const { data: tickets = [] } = await res.json();
    await Promise.all(
      tickets.map((ticket, i) =>
        ticket && ticket.details && ticket.details.error === "DeviceNotRegistered"
          ? batch[i].ref.delete()
          : null,
      ),
    );
  }
  return devices.length;
}

module.exports = { sendToUsers, allowedUids, chunk, EXPO_PUSH_URL };
