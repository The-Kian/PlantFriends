/**
 * Shared-care notifications.
 *
 * onPlantWritten — when someone waters a plant, tells its other carers it's
 * done ("Kian watered your Monstera"), so nobody waters it twice. It also
 * plans the plant's next watering reminder (./reminders.js).
 *
 * See docs/household-sharing-plan.md.
 */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const { MAX_INSTANCES } = require("./guards");
const { basePlantName, householdTimeZone } = require("./lookups");
const { sendToUsers } = require("./push");
const { planReminder } = require("./reminders");
const { plantName, isWatering, wateredMessages } = require("./plantMessages");

/**
 * Sends the "already watered" pushes for one write to a household plant.
 * Returns how many phones were notified.
 */
async function notifyWatering({
  db,
  before,
  after,
  householdId,
  plantId,
  now,
  send = sendToUsers,
}) {
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

const onPlantWritten = functions
  .runWith({ maxInstances: MAX_INSTANCES })
  .firestore.document("Households/{householdId}/Plants/{plantId}")
  .onWrite(async (change, context) => {
    const { householdId, plantId } = context.params;
    const db = admin.firestore();
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    const now = Date.now();

    const [sent, plan] = await Promise.all([
      notifyWatering({ db, before, after, householdId, plantId, now }),
      planReminder({
        db,
        ref: change.after.ref,
        householdId,
        before,
        after,
        now,
      }),
    ]);
    if (sent > 0) {
      functions.logger.info("Sent watered notifications", {
        householdId,
        plantId,
        sent,
      });
    }
    if (plan) {
      functions.logger.info("Planned reminder", {
        householdId,
        plantId,
        ...plan,
      });
    }
  });

module.exports = { onPlantWritten, notifyWatering };
