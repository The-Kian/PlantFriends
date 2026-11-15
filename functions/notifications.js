/**
 * Shared-care notifications.
 *
 * onPlantWritten — when someone waters a plant, tells its other carers it's
 * done ("Kian watered your Monstera"), so nobody waters it twice. It also
 * plans the plant's next reminder (notify_at), which ./reminders.js sends.
 *
 * See docs/household-sharing-plan.md.
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { sendToUsers } = require("./push");
const { plantName, isWatering, wateredMessages } = require("./plantMessages");
const { planReminder } = require("./notifyAt");

async function householdTimeZone(db, householdId) {
  const snap = await db.doc(`Households/${householdId}`).get();
  return (snap.exists && snap.get("timeZone")) || "UTC";
}

async function basePlantName(db, plant) {
  if (!plant.plantId) return null;
  try {
    const snap = await db.doc(`Plants/${plant.plantId}`).get();
    return snap.exists ? snap.get("name") || null : null;
  } catch {
    return null;
  }
}

/**
 * Sends the "already watered" pushes for one write to a household plant.
 * Returns how many phones were notified.
 */
async function notifyWatering({ db, before, after, householdId, plantId, now, send = sendToUsers }) {
  if (!isWatering(before, after)) return 0;

  const [timeZone, baseName] = await Promise.all([
    householdTimeZone(db, householdId),
    basePlantName(db, after),
  ]);
  const messages = wateredMessages({
    plant: after,
    plantId,
    householdId,
    name: plantName(after, baseName),
    now,
    timeZone,
  });

  let sent = 0;
  for (const { uids, message } of messages) {
    sent += await send(db, uids, message, "housemateActivity");
  }
  return sent;
}

const onPlantWritten = functions.firestore
  .document("Households/{householdId}/Plants/{plantId}")
  .onWrite(async (change, context) => {
    const { householdId, plantId } = context.params;
    const sent = await notifyWatering({
      db: admin.firestore(),
      before: change.before.exists ? change.before.data() : null,
      after: change.after.exists ? change.after.data() : null,
      householdId,
      plantId,
      now: Date.now(),
    });
    if (sent > 0) {
      functions.logger.info("Sent watered notifications", { householdId, plantId, sent });
    }

    // Plan the next reminder when the due date or the reminders switch changed.
    if (!change.after.exists) return;
    const after = change.after.data();
    const plan = planReminder({
      before: change.before.exists ? change.before.data() : null,
      after,
      timeZone: await householdTimeZone(admin.firestore(), householdId),
    });
    if (plan) await change.after.ref.update(plan);
  });

module.exports = { onPlantWritten, notifyWatering, householdTimeZone, basePlantName };
